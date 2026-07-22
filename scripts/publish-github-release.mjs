import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { request as httpsRequest } from "node:https";
import { execFileSync } from "node:child_process";

function parseArgs(argv) {
  const options = {
    draft: false,
    prerelease: false,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--draft") {
      options.draft = true;
      continue;
    }

    if (arg === "--prerelease") {
      options.prerelease = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--tag=")) {
      options.tag = arg.slice("--tag=".length);
      continue;
    }

    if (arg === "--tag") {
      options.tag = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--name=")) {
      options.name = arg.slice("--name=".length);
      continue;
    }

    if (arg === "--name") {
      options.name = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--file=")) {
      options.file = arg.slice("--file=".length);
      continue;
    }

    if (arg === "--file") {
      options.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--notes=")) {
      options.notes = arg.slice("--notes=".length);
      continue;
    }

    if (arg === "--notes") {
      options.notes = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function repoFromPackageJson(pkg) {
  const repoValue =
    typeof pkg.repository === "string"
      ? pkg.repository
      : pkg.repository && typeof pkg.repository.url === "string"
        ? pkg.repository.url
        : "";

  const normalized = repoValue
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .trim();

  const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/(.+)$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = normalized.match(/^https:\/\/github\.com\/([^/]+)\/(.+)$/i);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  throw new Error("Could not determine owner/repo from package.json repository URL.");
}

async function findNewestVsix(cwd) {
  const entries = await readdir(cwd, { withFileTypes: true });
  const vsixCandidates = [];

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".vsix") {
      continue;
    }

    const fullPath = resolve(cwd, entry.name);
    const metadata = await stat(fullPath);
    vsixCandidates.push({
      fullPath,
      modifiedAt: metadata.mtimeMs
    });
  }

  if (vsixCandidates.length === 0) {
    throw new Error("No .vsix files found in the repository root. Run `npm run package` first.");
  }

  vsixCandidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return vsixCandidates[0].fullPath;
}

function gitHeadSha() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  }).trim();
}

function apiRequest({ hostname, path, method, headers, body }) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = httpsRequest(
      {
        hostname,
        path,
        method,
        headers
      },
      response => {
        const chunks = [];

        response.on("data", chunk => chunks.push(chunk));
        response.on("end", () => {
          const responseBody = Buffer.concat(chunks);
          const contentType = response.headers["content-type"] || "";
          const isJson = contentType.includes("application/json");
          const parsedBody = isJson && responseBody.length > 0
            ? JSON.parse(responseBody.toString("utf8"))
            : responseBody;

          if ((response.statusCode || 500) >= 400) {
            const message = isJson && parsedBody && parsedBody.message
              ? parsedBody.message
              : responseBody.toString("utf8");
            rejectPromise(new Error(`${method} ${hostname}${path} failed: ${response.statusCode} ${message}`));
            return;
          }

          resolvePromise({
            statusCode: response.statusCode || 200,
            body: parsedBody
          });
        });
      }
    );

    request.on("error", rejectPromise);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function githubApiJson({ token, method, path, body }) {
  const serializedBody = body ? JSON.stringify(body) : undefined;
  return apiRequest({
    hostname: "api.github.com",
    path,
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": serializedBody ? Buffer.byteLength(serializedBody) : 0,
      "User-Agent": "vsct-cyberpunk-release-script",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: serializedBody
  });
}

async function githubApiUpload({ token, uploadUrlPath, fileName, assetBuffer }) {
  return apiRequest({
    hostname: "uploads.github.com",
    path: `${uploadUrlPath}?name=${encodeURIComponent(fileName)}`,
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Length": assetBuffer.length,
      "Content-Type": "application/octet-stream",
      "User-Agent": "vsct-cyberpunk-release-script",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: assetBuffer
  });
}

function toUploadPath(uploadUrl) {
  const cleaned = uploadUrl.replace(/\{.*$/, "");
  const url = new URL(cleaned);
  return `${url.pathname}${url.search}`;
}

async function getReleaseByTag({ token, owner, repo, tag }) {
  try {
    const response = await githubApiJson({
      token,
      method: "GET",
      path: `/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`
    });
    return response.body;
  } catch (error) {
    if (String(error.message).includes("404")) {
      return null;
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const packageJson = JSON.parse(await readFile(resolve(cwd, "package.json"), "utf8"));
  const { owner, repo } = repoFromPackageJson(packageJson);
  const filePath = options.file ? resolve(cwd, options.file) : await findNewestVsix(cwd);
  const fileName = basename(filePath);
  const tag = options.tag || `v${packageJson.version}`;
  const releaseName = options.name || `${packageJson.displayName || packageJson.name} ${tag}`;
  const targetCommitish = gitHeadSha();

  if (options.dryRun) {
    console.log("Dry run only.");
    console.log(`Repository: ${owner}/${repo}`);
    console.log(`Target commit: ${targetCommitish}`);
    console.log(`Release tag: ${tag}`);
    console.log(`Release name: ${releaseName}`);
    console.log(`Asset: ${filePath}`);
    console.log(`Draft: ${options.draft}`);
    console.log(`Prerelease: ${options.prerelease}`);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set. Export a GitHub token with repo contents write access first.");
  }

  let release = await getReleaseByTag({ token, owner, repo, tag });

  if (!release) {
    const createResponse = await githubApiJson({
      token,
      method: "POST",
      path: `/repos/${owner}/${repo}/releases`,
      body: {
        tag_name: tag,
        target_commitish: targetCommitish,
        name: releaseName,
        draft: options.draft,
        prerelease: options.prerelease,
        body: options.notes,
        generate_release_notes: !options.notes
      }
    });
    release = createResponse.body;
    console.log(`Created release ${release.tag_name}.`);
  } else {
    const patchResponse = await githubApiJson({
      token,
      method: "PATCH",
      path: `/repos/${owner}/${repo}/releases/${release.id}`,
      body: {
        name: releaseName,
        draft: options.draft,
        prerelease: options.prerelease
      }
    });
    release = patchResponse.body;
    console.log(`Using existing release ${release.tag_name}.`);
  }

  const existingAsset = Array.isArray(release.assets)
    ? release.assets.find(asset => asset.name === fileName)
    : undefined;

  if (existingAsset) {
    await githubApiJson({
      token,
      method: "DELETE",
      path: `/repos/${owner}/${repo}/releases/assets/${existingAsset.id}`
    });
    console.log(`Deleted existing asset ${fileName}.`);
  }

  const assetBuffer = await readFile(filePath);
  const uploadResponse = await githubApiUpload({
    token,
    uploadUrlPath: toUploadPath(release.upload_url),
    fileName,
    assetBuffer
  });

  console.log(`Uploaded ${fileName}.`);
  console.log(`Release URL: ${release.html_url}`);
  console.log(`Asset URL: ${uploadResponse.body.browser_download_url}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

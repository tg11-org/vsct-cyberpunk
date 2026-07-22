# TG11 Cyberpunk Pack

TG11 Cyberpunk Pack is a dark VS Code theme with a matching comment-highlighting injection grammar. It keeps the editor deep and muted while making keywords, TODO-style tags, and inline comment symbols pop across a broad set of supported grammars.

## Included

- Dark editor background
- Bright keyword and storage highlighting
- Stronger visibility for TODO / NOTE / FIXME / WARNING style comment tokens
- Extra styling for comment symbols such as `!`, `@`, `#`, `?`, box-drawing glyphs, and other callouts
- Theme label: `tg11-cyberpunk`
- Broad grammar injection coverage for common languages such as Python, Tcl, C, C++, C#, Java, JavaScript, TypeScript, Ruby, Lua, PHP, Rust, Go, Shell, SQL, HTML, XML, YAML, and more

## Local packaging

```powershell
npm install
npm run package
```

That produces a `.vsix` file you can install locally or upload through the Visual Studio Marketplace publisher portal.

If `npm install` falls back to compiling `keytar`, install the helper Python bits from [requirements.txt](/U:/Projects/vsce-cp/requirements.txt:1) and prefer Python 3.10 for this repo's current Node 18 / npm 8 toolchain.

## GitHub release upload

You can also push the newest generated `.vsix` to a GitHub Release from this repo:

```powershell
$Env:GITHUB_TOKEN="YOUR_TOKEN_HERE"
npm run release:package:github
```

Or use the local wrapper that auto-loads `github_pat` from `.env`:

```powershell
.\release.bat
```

From WSL / bash:

```bash
./release.sh
```

That flow:

- builds the `.vsix`
- finds the newest `.vsix` in the repo root
- creates or updates the release for `v<package.json version>`
- replaces the asset if a file with the same name is already attached

This is a GitHub Release upload flow, not Visual Studio Marketplace publishing. Marketplace publishing is still a separate `vsce publish` step.

Useful variants:

```powershell
npm run release:github -- --dry-run
npm run release:github -- --tag v0.0.2-beta.1 --prerelease
npm run release:github -- --file .\tg11-cyberpunk-pack-0.0.3.vsix
```

## Publishing notes

The extension manifest is set to publisher `TrentonGage11`. If your Visual Studio Marketplace publisher ID differs from that, update the `publisher` field in `package.json` before running `vsce publish` or uploading a package built from that manifest.

# VSCT Cyberpunk

VSCT Cyberpunk is a minimal dark VS Code theme built around the supplied JSON theme file. It keeps the overall editor background deep and muted while making keywords, TODO markers, and special comment punctuation pop.

## Included

- Dark editor background
- Bright keyword and storage highlighting
- Stronger visibility for TODO / NOTE style comment tokens
- Extra styling for special comment punctuation

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

That flow:

- builds the `.vsix`
- finds the newest `.vsix` in the repo root
- creates or updates the release for `v<package.json version>`
- replaces the asset if a file with the same name is already attached

Useful variants:

```powershell
npm run release:github -- --dry-run
npm run release:github -- --tag v0.0.2-beta.1 --prerelease
npm run release:github -- --file .\vsct-cyberpunk-0.0.1.vsix
```

## Publishing notes

If your Visual Studio Marketplace publisher ID is not `tg11-org`, update the `publisher` field in `package.json` before running `vsce publish` or uploading a package built from that manifest.

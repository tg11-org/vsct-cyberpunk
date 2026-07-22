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

## Publishing notes

If your Visual Studio Marketplace publisher ID is not `tg11-org`, update the `publisher` field in `package.json` before running `vsce publish` or uploading a package built from that manifest.

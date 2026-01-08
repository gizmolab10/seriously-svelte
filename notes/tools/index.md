# Tools

Project-specific configuration and build artifacts for shared tools.

## Contents

- [config.sh](./config.sh) - Project-specific overrides for shared tools
- `dist/` - Compiled TypeScript tools (generated)

## Usage

The actual tool scripts live in `~/GitHub/shared/tools/`. This directory contains:

1. **config.sh** - Project-specific settings (paths, IDs, etc.)
2. **dist/** - Compiled JS output from shared TypeScript tools

## Running Tools

From the project root:

```bash
# Update docs workflow
bash ~/GitHub/shared/tools/update-docs.sh

# Or with explicit project root
bash ~/GitHub/shared/tools/update-docs.sh ~/GitHub/ws

# Individual tools
bash ~/GitHub/shared/tools/analyze-counts.sh
bash ~/GitHub/shared/tools/sync-index-files.sh
bash ~/GitHub/shared/tools/reset-docs.sh
```

## Configuration

Edit `config.sh` to customize paths and settings for this project. Available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `NOTES_DIR` | Notes directory relative to project root | `notes` |
| `DOCS_SOURCE_DIR` | Source for docs DB generation | `notes/designs` |
| `DOCS_OUTPUT` | Output path for Docs.ts | `src/lib/ts/files/Docs.ts` |
| `TOOLS_DIST` | Where to compile TS tools | `notes/tools/dist` |
| `NETLIFY_SITE_ID` | Netlify site ID for deploy cleanup | - |

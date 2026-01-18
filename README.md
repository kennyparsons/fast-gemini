# fast-gemini

[![CI](https://github.com/kennyparsons/fast-gemini/actions/workflows/ci.yml/badge.svg)](https://github.com/kennyparsons/fast-gemini/actions/workflows/ci.yml)

Ultra-fast Gemini API proxy with optimized system prompts and minimal overhead. This project bundles the Google Gemini CLI into a single, optimized JavaScript file for faster startup and reduced memory footprint.

## Features

- 🚀 **Fast Startup** - Single bundled file with minimal dependencies
- 📦 **Optimized Build** - Uses esbuild for efficient bundling
- 🎯 **Non-Interactive Mode** - Perfect for scripting and automation
- 🔧 **Customizable** - Override system prompts and configurations
- 💡 **Lean System Prompts** - Optimized for speed and efficiency

## Versioning

This project mirrors the version of `@google/gemini-cli` it's built from:
- **Major.Minor** versions match `@google/gemini-cli` (e.g., `0.23.x`)
- **Patch** versions are independent fixes and improvements to fast-gemini
- When `@google/gemini-cli` updates to `0.24.0`, fast-gemini will update to `0.24.0`

## Installation

### Quick Start (Recommended)

Download the pre-built single-file executable:

```bash
curl -L -o gemini-fast.js https://github.com/kennyparsons/fast-gemini/releases/latest/download/gemini-fast.js
node gemini-fast.js "Your prompt here"
```

**Requirements:** Node.js >= 20.0.0

### From Source

```bash
git clone https://github.com/kennyparsons/fast-gemini.git
cd fast-gemini
npm install
npm run build
```

**Development Requirements:**
- Node.js >= 20.0.0
- npm or yarn

## Usage

After building, run the bundled version:

```bash
node build/gemini-fast.js "Your prompt here"
```

Or use the npm script:

```bash
npm start -- "Your prompt here"
```

## Development

### Build

```bash
npm run build
```

This will:
1. Bundle `fast-entry.js` using esbuild
2. Output to `build/gemini-fast-v3.mjs`
3. Include all necessary dependencies

### Test

```bash
npm test
```

Runs the test script to verify the build works correctly.

### Project Structure

- `fast-entry.js` - Main entry point with optimized imports
- `build.mjs` - esbuild configuration and build script
- `mock-gemini.js` - Mock implementation for testing
- `build/` - Output directory for bundled files

## Configuration

The build process uses esbuild with the following optimizations:

- **Platform**: Node.js
- **Target**: Node 20+
- **Format**: ESM (ES Modules)
- **External**: `fsevents`, `ink` (not bundled)
- **Bundled**: All other dependencies

## How It Works

This project creates a streamlined version of the Google Gemini CLI by:

1. **Bundling Dependencies** - All required modules are bundled into a single file
2. **Optimizing Imports** - Direct imports from Homebrew installation paths
3. **Removing UI** - Strips out interactive UI components for faster execution
4. **Custom System Prompts** - Uses lean, optimized system prompts

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required for testing)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Projects

- [Google Gemini CLI](https://www.npmjs.com/package/@google/gemini-cli) - Official Gemini CLI tool

## Acknowledgments

Built on top of the excellent Google Gemini CLI project.


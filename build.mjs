import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockGeminiPlugin = {
  name: 'mock-gemini',
  setup(build) {
    build.onResolve({ filter: /gemini\.js$/ }, args => {
        // Redirect imports of gemini.js to mock-gemini.js
        console.log(`Redirecting ${args.path} to mock-gemini.js`);
        return { path: path.resolve(__dirname, 'mock-gemini.js') };
    });
  },
};

await esbuild.build({
  entryPoints: ['fast-entry.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'build/gemini-fast.js',
  format: 'esm',
  external: ['fsevents', 'ink'],
  alias: {
    'punycode': path.resolve(__dirname, 'node_modules/punycode/punycode.js'),
  },
  plugins: [mockGeminiPlugin],
  loader: {
    '.wasm': 'binary',
  },
  banner: {
    js: `import { createRequire as _createRequire } from 'module';
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname as _dirname } from 'path';
var require = _createRequire(import.meta.url);
var __filename = _fileURLToPath(import.meta.url);
var __dirname = _dirname(__filename);`
  },
  logLevel: 'info',
});

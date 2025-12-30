# Gemini CLI Startup Optimization Task

## **Objective**
Reduce the startup time of the `gemini` CLI for one-shot prompts (e.g., `gemini "What is the capital of France?"`). 

*   **Current Baseline:** ~2.1 seconds for `--version`, ~7 seconds for a prompt.
*   **Target:** < 500ms startup overhead.

## **Root Cause Analysis**
1.  **File System Overhead:** The CLI is currently **unbundled**. It reads and parses **1,963 separate files** from `/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src` on every execution.
2.  **Transitive UI Dependencies:** The main entry point eagerly imports React and Ink. Even the non-interactive logic (`nonInteractiveCli.js`) has a "poisoned" import link to React via a helper function in `useSessionBrowser.js`.
3.  **Profiling:** A `startup.cpuprofile` is available in the root of this directory. It confirms that the majority of time is spent in `module.js` (file resolution and loading).

## **Key Files for Investigation**
These files contain the logic that needs to be extracted and cleaned:
*   **Original Entry:** `/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/gemini.js`
*   **Non-Interactive Logic:** `/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/nonInteractiveCli.js`
*   **React Dependency Source:** `/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/hooks/useSessionBrowser.js` (Specifically the `convertSessionToHistoryFormats` function).

## **Instructions for the Next Agent**

### 1. **Setup the Fast Path**
Create a new file `fast-entry.js` in the current directory. This file must:
*   Inline the `convertSessionToHistoryFormats` function from `useSessionBrowser.js` to avoid importing React.
*   Inline the `runNonInteractive` function from `nonInteractiveCli.js` to modify its internal imports.
*   Replicate the `main()` function from `gemini.js` but **remove** the `if (config.isInteractive())` block entirely to prevent any UI-related code from being triggered.

### 2. **Absolute Path Resolution**
Since this `fast-entry.js` lives outside the Homebrew node_modules, you must use absolute paths for imports pointing into the installed package, for example:
```javascript
import { loadCliConfig } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/config.js';
```

### 3. **Bundling (Crucial for Speed)**
Once `fast-entry.js` runs successfully with `node fast-entry.js "hello"`, bundle it to collapse the 2,000 files into one.
*   Use `esbuild`: `npx esbuild fast-entry.js --bundle --platform=node --target=node20 --outfile=gemini-fast.mjs --format=esm`.
*   **Externalize heavy cores:** If the bundle fails due to WASM or complex dependencies, mark them external: `--external:@google/gemini-cli-core --external:fsevents --external:ink`.
*   *Note:* The more you bundle, the faster it will be. Aim to bundle everything except truly native modules.

### 4. **Verification**
Compare performance:
```bash
time gemini --version
time node gemini-fast.mjs --version
```
The goal is to see the `real` time drop from ~2s to ~0.3s.

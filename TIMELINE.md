# Gemini CLI Speed Optimization - Project Timeline

## **Goal**
Create a blazing-fast version of the Gemini CLI for one-shot prompts (e.g., `gemini "hello"`), aiming for <500ms startup overhead (down from ~2.1s base / ~7s+ interactive).

## **Timeline of Events**

### **Phase 1: Investigation & Baseline**
*   **Discovery:** Confirmed `gemini` is a Node.js app installed via Homebrew. It is **unbundled**, causing it to read ~2,000 files on every launch.
*   **Baseline:** `gemini --version` took ~2.1s. `gemini "hello"` took ~7s (interactive mode overhead).
*   **Profiling:** Generated `startup.cpuprofile` which confirmed file I/O and module loading were the bottlenecks.
*   **Findings:** The main entry point (`gemini.js`) eagerly imports heavy UI libraries (`React`, `Ink`) even for non-interactive commands.

### **Phase 2: The "Fast Entry" Experiment**
*   **Strategy:** Create a custom entry point (`fast-entry.js`) that:
    1.  Strips out all Interactive UI code (`startInteractiveUI`).
    2.  Inlines critical helper logic (`runNonInteractive`) to break the transitive dependency on React.
    3.  Uses absolute paths to link back to the installed `gemini-cli-core`.
*   **Execution:**
    *   Copied and modified source files (`gemini.js`, `nonInteractiveCli.js`, `useSessionBrowser.js`).
    *   Created `generate_fast_entry.py` to automate the assembly of `fast-entry.js` (overcoming several regex/syntax hurdles).
    *   **Result:** `node fast-entry.js --version` worked but was *slower* (3.4s) due to lack of bundling.

### **Phase 3: Bundling with `esbuild`**
*   **Goal:** Collapse the 2,000 file reads into one file.
*   **Challenges:**
    *   External dependencies (`ink`, `fsevents`, `react`) caused build errors.
    *   `@google/gemini-cli-core` had WASM and dynamic import issues.
    *   `yargs` (CJS) conflicted with ESM output (`__dirname` issues).
*   **Solution:**
    *   Created `build.mjs` script using `esbuild`.
    *   Used a **banner** to shim `require`, `__filename`, and `__dirname` for ESM.
    *   Marked UI libs (`ink`, `react`) as **external** (so they aren't bundled).
    *   Marked WASM and tree-sitter as external.
    *   Successfully bundled `gemini-cli-core` logic.
*   **Result:** `gemini-fast-v3.mjs` (18.6MB).
    *   **Startup Speed:** `node build/gemini-fast-v3.mjs --version` -> **~0.5s** (Success!).

### **Phase 4: The "Snooping" Problem**
*   **Issue:** While startup was fast, `gemini "hello"` took **~20s**.
*   **Cause:** The model tried to **read files** (`glob`, `read_file`) immediately upon launch to "understand the project context". Because we were in non-interactive mode (without auto-approval), these tool calls failed, causing a slow retry loop.
*   **Root Cause:** The default **System Prompt** (15KB) explicitly instructs the agent to act as a "Software Engineer" and explore the codebase on startup.

### **Phase 5: Prompt Engineering Fix**
*   **Discovery:** The CLI supports overriding the system prompt via `GEMINI_SYSTEM_MD` env var or `~/.gemini/system.md`.
*   **Fix:** Created a **Lean System Prompt** (`lean_system.md`):
    ```markdown
    You are a helpful assistant.
    - Do not explore the file system or read files unless the user explicitly asks.
    - Provide direct and concise answers.
    - Do not use tools on startup.
    ```
*   **Verification:**
    *   `GEMINI_SYSTEM_MD=... node gemini-fast.mjs "hello"` -> **~6s total**.
    *   `... "Explain coffee roasting"` -> **~4.6s total** (using `flash-lite`).
    *   **Image Support:** `... "Describe @image.jpg"` -> **~6.6s total** (Works!).

## **Current Status**

*   **Artifacts:**
    *   `build/gemini-fast-v3.mjs`: The optimized, bundled binary.
    *   `~/.gemini/prompts/lean_system.md`: The override prompt.
    *   `fast-entry.js`: The source code for the fast entry point.
    *   `build.mjs`: The build script.

*   **Key Learnings:**
    1.  **Bundling is critical:** Reducing file I/O dropped startup from ~2s to ~0.5s.
    2.  **Prompting controls behavior:** The "slowness" of the interaction was due to the default system prompt forcing file exploration. Overriding it fixes the latency without needing to cripple the toolset code.
    3.  **File Access:** The agent *can* read files/images (via `@filename` or tools) but **only if it is running in a path that has access to them** (cwd or subpath).

*   **Recommended Usage:**
    Use an alias to combine the fast binary, the lean prompt, and the fast model:
    ```bash
    alias gfast='GEMINI_SYSTEM_MD=~/.gemini/prompts/lean_system.md node /Users/kenny.parsons/dmz/kennyparsons/gemini-speed/build/gemini-fast-v3.mjs --model gemini-2.5-flash-lite --extensions "[]" --allowed-mcp-server-names "[]"'
    ```

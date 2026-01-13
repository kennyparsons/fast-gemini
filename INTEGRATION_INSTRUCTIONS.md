# Integration Instructions: Gemini Fast Build

This document provides instructions for integrating the optimized Gemini CLI build into the `openai-gemini-cli` proxy project.

## **Overview**
We have created a bundled, optimized version of the Gemini CLI that bypasses the slow Node.js module resolution overhead and silences the default "Software Engineering Assistant" snooping behavior.

*   **Optimized Binary:** `/Users/kenny.parsons/dmz/kennyparsons/gemini-speed/build/gemini-fast-v3.mjs`
*   **Lean System Prompt:** `~/.gemini/prompts/lean_system.md`
*   **Startup Speed:** ~0.5s (down from ~2.1s).

## **Integration Steps for `main.go`**

### **1. Update the Executable Path**
In `main.go`, change the `geminiCLI` constant to `node` and prepare to pass the script path as the first argument.

```go
const (
    defaultPort = "8080"
    // Use node to execute our bundled script
    nodeExec    = "node" 
    geminiScript = "/Users/kenny.parsons/dmz/kennyparsons/gemini-speed/build/gemini-fast-v3.mjs"
)
```

### **2. Update `exec.Command` logic**
When building the command, prepend the script path to the arguments.

```go
// Current logic:
// cmd := exec.Command(geminiCLI, args...)

// New logic:
fullArgs := append([]string{geminiScript}, args...)
cmd := exec.Command(nodeExec, fullArgs...)
```

### **3. Force the Lean System Prompt**
Ensure the environment variable points to the lean prompt to prevent the model from scanning the file system on every API request.

```go
// In handleChatCompletions:
leanPromptPath := "/Users/kenny.parsons/.gemini/prompts/lean_system.md"
cmd.Env = append(os.Environ(), "GEMINI_SYSTEM_MD=" + leanPromptPath)
```

### **4. Recommended Default Flags**
For the fastest "one-shot" experience, the proxy should ensure these flags are passed to the CLI:
*   `--model gemini-2.5-flash-lite` (Fastest model)
*   `--extensions ""` (Avoids loading extension logic)
*   `--allowed-mcp-server-names ""` (Avoids MCP overhead)

## **Why this works**
1.  **Bundling:** The `.mjs` file is a single 18MB bundle. Node.js reads 1 file instead of 2,000.
2.  **Lean Prompt:** By overriding `GEMINI_SYSTEM_MD`, we replace the 15KB default prompt with a 3-line instruction. This stops the model from entering a "tool-calling loop" to explore the directory, saving ~15 seconds of latency per request.
3.  **Pathing:** The proxy's current `cmd.Dir = requestTempDir` logic works perfectly with our build, allowing the `@image.jpg` syntax to resolve files correctly within the request context.

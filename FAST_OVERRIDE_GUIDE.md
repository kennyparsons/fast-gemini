# Gemini CLI Speed & Prompt Override Guide

This guide explains how to use the "Lean" system prompt to achieve the fastest possible one-shot responses by preventing the model from snooping through your file system on startup.

## **1. The Problem: "The 15KB Snooper"**
By default, the Gemini CLI injects a large (15KB) system prompt that instructs the agent to be a "Software Engineering Assistant." This prompt tells the model to immediately explore your codebase using `glob` and `read_file` to "understand context." This adds significant latency (up to 20 seconds) and causes permission errors in non-interactive mode.

## **2. The Solution: Lean System Prompt**
We have created a minimal system prompt at `~/.gemini/prompts/lean_system.md`:
```markdown
You are a helpful assistant.
- Do not explore the file system or read files unless the user explicitly asks for a specific file.
- Provide direct and concise answers.
- Do not use tools on startup.
```

## **3. How to Run with the Lean Prompt**

### **A. One-off override (Recommended for Tests)**
Use the `GEMINI_SYSTEM_MD` environment variable to point to the lean prompt:
```bash
GEMINI_SYSTEM_MD=~/.gemini/prompts/lean_system.md node build/gemini-fast-v3.mjs "What is the capital of France?"
```

### **B. Permanent Override (Project or Global)**
To make the lean behavior the default for everything, place the file at `~/.gemini/system.md`:
```bash
cp ~/.gemini/prompts/lean_system.md ~/.gemini/system.md
```
*Note: If a `system.md` exists in your current project directory, it will take precedence over the global one in `~/.gemini/`.*

### **C. Using an Alias**
Add this to your `.zshrc` or `.bashrc` to make it your default `gemini-fast` command:
```bash
alias gemini-fast='GEMINI_SYSTEM_MD=~/.gemini/prompts/lean_system.md node /Users/kenny.parsons/dmz/kennyparsons/gemini-speed/build/gemini-fast-v3.mjs'
```

## **4. Verification**
Compare the speed difference:
1.  **Default:** `node build/gemini-fast-v3.mjs "hello"` (~20s due to snooping)
2.  **Lean:** `GEMINI_SYSTEM_MD=~/.gemini/prompts/lean_system.md node build/gemini-fast-v3.mjs "hello"` (~6s total latency)

## **5. Managing the Built-in Prompt**
If you ever want to see what the CLI is currently using as its "firmware" prompt, you can dump it:
```bash
GEMINI_WRITE_SYSTEM_MD=current_dump.md gemini "hello"
```

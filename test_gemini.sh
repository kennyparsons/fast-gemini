#!/bin/bash

GEMINI_CMD="node build/gemini-fast-v3.mjs"

echo "----------------------------------------------------------------"
echo "Test 1: Simple Hello (Clean Environment)"
echo "Command: $GEMINI_CMD \"hello\" --extensions '[]' --allowed-mcp-server-names '[]' --allowed-tools='[]'"
echo "----------------------------------------------------------------"
time $GEMINI_CMD "hello" --extensions '[]' --allowed-mcp-server-names '[]' --allowed-tools='[]'

echo ""
echo "----------------------------------------------------------------"
echo "Test 2: Web Search (Tool Usage)"
echo "Command: $GEMINI_CMD \"What is the top rated AI tool according to https://www.airankings.co/rankings\" --allowed-tools=google_web_search --extensions '[]' --allowed-mcp-server-names '[]'"
echo "----------------------------------------------------------------"
time $GEMINI_CMD "What is the top rated AI tool according to https://www.airankings.co/rankings" --allowed-tools=google_web_search --extensions '[]' --allowed-mcp-server-names '[]'

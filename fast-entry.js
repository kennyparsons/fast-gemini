#!/usr/bin/env node

// Inline types from ui/types.js
const MessageType = {
    INFO: "info",
    ERROR: "error",
    WARNING: "warning",
    USER: "user",
    ABOUT: "about",
    HELP: "help",
    STATS: "stats",
    MODEL_STATS: "model_stats",
    TOOL_STATS: "tool_stats",
    QUIT: "quit",
    GEMINI: "gemini",
    COMPRESSION: "compression",
    EXTENSIONS_LIST: "extensions_list",
    TOOLS_LIST: "tools_list",
    MCP_STATUS: "mcp_status",
    CHAT_LIST: "chat_list",
    HOOKS_LIST: "hooks_list"
};

const ToolCallStatus = {
    Pending: "Pending",
    Canceled: "Canceled",
    Confirming: "Confirming",
    Executing: "Executing",
    Success: "Success",
    Error: "Error"
};

// Imports from main gemini.js (converted to absolute paths)
import { loadCliConfig, parseArguments } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/config.js';
import * as cliConfig from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/config.js';
import { readStdin } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/readStdin.js';
import { basename } from 'node:path';
import v8 from 'node:v8';
import os from 'node:os';
import dns from 'node:dns';
import { start_sandbox } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/sandbox.js';
import { loadSettings, migrateDeprecatedSettings, SettingScope, } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/settings.js';
import { themeManager } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/themes/theme-manager.js';
import { getStartupWarnings } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/startupWarnings.js';
import { getUserStartupWarnings } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/userStartupWarnings.js';
import { ConsolePatcher } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/utils/ConsolePatcher.js';
// import { runNonInteractive } from './nonInteractiveCli.js'; // INLINED
import { cleanupCheckpoints, registerCleanup, registerSyncCleanup, runExitCleanup, registerTelemetryConfig, } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/cleanup.js';
import { sessionId, logUserPrompt, AuthType, getOauthClient, UserPromptEvent, debugLogger, recordSlowRender, coreEvents, CoreEvent, createWorkingStdio, patchStdio, writeToStdout, writeToStderr, disableMouseEvents, enableMouseEvents, enterAlternateScreen, disableLineWrapping, shouldEnterAlternateScreen, startupProfiler, ExitCodes, SessionStartSource, SessionEndReason, fireSessionStartHook, fireSessionEndHook, getVersion, partListUnionToString, executeToolCall, GeminiEventType, FatalInputError, promptIdContext, OutputFormat, JsonFormatter, StreamJsonFormatter, JsonStreamEventType, uiTelemetryService } from '@google/gemini-cli-core';
import { initializeApp, } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/core/initializer.js';
import { validateAuthMethod } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/auth.js';
// import { setMaxSizedBoxDebugging } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/components/shared/MaxSizedBox.js';
import { runZedIntegration } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/zed-integration/zedIntegration.js';
import { cleanupExpiredSessions } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/sessionCleanup.js';
import { validateNonInteractiveAuth } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/validateNonInterActiveAuth.js';
import { detectAndEnableKittyProtocol } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/utils/kittyProtocolDetector.js';
import { checkForUpdates } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/utils/updateCheck.js';
import { handleAutoUpdate } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/handleAutoUpdate.js';
import { appEvents, AppEvent } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/events.js';
import { SessionSelector } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/sessionUtils.js';
import { computeWindowTitle } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/windowTitle.js';
import { relaunchAppInChildProcess, relaunchOnExitCode, } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/relaunch.js';
import { loadSandboxConfig } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/sandboxConfig.js';
import { deleteSession, listSessions } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/sessions.js';
import { ExtensionManager } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/extension-manager.js';
import { createPolicyUpdater } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/policy.js';
import { requestConsentNonInteractive } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/config/extensions/consent.js';
// Imports for inlined runNonInteractive
import { isSlashCommand } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/utils/commandUtils.js';
import readline from 'node:readline';
import { handleSlashCommand } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/nonInteractiveCliCommands.js';
import { handleAtCommand } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/hooks/atCommandProcessor.js';
import { handleError, handleToolError, handleCancellationError, handleMaxTurnsExceededError, } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/utils/errors.js';
import { TextOutput } from '/opt/homebrew/lib/node_modules/@google/gemini-cli/dist/src/ui/utils/textOutput.js';


// INLINED convertSessionToHistoryFormats
function convertSessionToHistoryFormats(messages) {
    const uiHistory = [];
    for (const msg of messages) {
        // Add the message only if it has content
        const contentString = partListUnionToString(msg.content);
        if (msg.content && contentString.trim()) {
            let messageType;
            switch (msg.type) {
                case 'user':
                    messageType = MessageType.USER;
                    break;
                case 'info':
                    messageType = MessageType.INFO;
                    break;
                case 'error':
                    messageType = MessageType.ERROR;
                    break;
                case 'warning':
                    messageType = MessageType.WARNING;
                    break;
                default:
                    messageType = MessageType.GEMINI;
                    break;
            }
            uiHistory.push({
                type: messageType,
                text: contentString,
            });
        }
        // Add tool calls if present
        if (msg.type !== 'user' &&
            'toolCalls' in msg &&
            msg.toolCalls &&
            msg.toolCalls.length > 0) {
            uiHistory.push({
                type: 'tool_group',
                tools: msg.toolCalls.map((tool) => ({
                    callId: tool.id,
                    name: tool.displayName || tool.name,
                    description: tool.description || '',
                    renderOutputAsMarkdown: tool.renderOutputAsMarkdown ?? true,
                    status: tool.status === 'success'
                        ? ToolCallStatus.Success
                        : ToolCallStatus.Error,
                    resultDisplay: tool.resultDisplay,
                    confirmationDetails: undefined,
                })),
            });
        }
    }
    // Convert to Gemini client history format
    const clientHistory = [];
    for (const msg of messages) {
        // Skip system/error messages and user slash commands
        if (msg.type === 'info' || msg.type === 'error' || msg.type === 'warning') {
            continue;
        }
        if (msg.type === 'user') {
            // Skip user slash commands
            const contentString = partListUnionToString(msg.content);
            if (contentString.trim().startsWith('/') ||
                contentString.trim().startsWith('?')) {
                continue;
            }
            // Add regular user message
            clientHistory.push({
                role: 'user',
                parts: [{ text: contentString }],
            });
        }
        else if (msg.type === 'gemini') {
            // Handle Gemini messages with potential tool calls
            const hasToolCalls = msg.toolCalls && msg.toolCalls.length > 0;
            if (hasToolCalls) {
                // Create model message with function calls
                const modelParts = [];
                // Add text content if present
                const contentString = partListUnionToString(msg.content);
                if (msg.content && contentString.trim()) {
                    modelParts.push({ text: contentString });
                }
                // Add function calls
                for (const toolCall of msg.toolCalls) {
                    modelParts.push({
                        functionCall: {
                            name: toolCall.name,
                            args: toolCall.args,
                            ...(toolCall.id && { id: toolCall.id }),
                        },
                    });
                }
                clientHistory.push({
                    role: 'model',
                    parts: modelParts,
                });
                // Create single function response message with all tool call responses
                const functionResponseParts = [];
                for (const toolCall of msg.toolCalls) {
                    if (toolCall.result) {
                        // Convert PartListUnion result to function response format
                        let responseData;
                        if (typeof toolCall.result === 'string') {
                            responseData = {
                                functionResponse: {
                                    id: toolCall.id,
                                    name: toolCall.name,
                                    response: {
                                        output: toolCall.result,
                                    },
                                },
                            };
                        }
                        else if (Array.isArray(toolCall.result)) {
                            // toolCall.result is an array containing properly formatted
                            // function responses
                            functionResponseParts.push(...toolCall.result);
                            continue;
                        }
                        else {
                            // Fallback for non-array results
                            responseData = toolCall.result;
                        }
                        functionResponseParts.push(responseData);
                    }
                }
                // Only add user message if we have function responses
                if (functionResponseParts.length > 0) {
                    clientHistory.push({
                        role: 'user',
                        parts: functionResponseParts,
                    });
                }
            }
            else {
                // Regular Gemini message without tool calls
                const contentString = partListUnionToString(msg.content);
                if (msg.content && contentString.trim()) {
                    clientHistory.push({
                        role: 'model',
                        parts: [{ text: contentString }],
                    });
                }
            }
        }
    }
    return {
        uiHistory,
        clientHistory,
    };
}


// INLINED runNonInteractive
async function runNonInteractive({ config, settings, input, prompt_id, hasDeprecatedPromptArg, resumedSessionData, }) {
    return promptIdContext.run(prompt_id, async () => {
        const consolePatcher = new ConsolePatcher({
            stderr: true,
            debugMode: config.getDebugMode(),
            onNewMessage: (msg) => {
                coreEvents.emitConsoleLog(msg.type, msg.content);
            },
        });
        const { stdout: workingStdout } = createWorkingStdio();
        const textOutput = new TextOutput(workingStdout);
        const handleUserFeedback = (payload) => {
            const prefix = payload.severity.toUpperCase();
            process.stderr.write(`[${prefix}] ${payload.message}\n`);
            if (payload.error && config.getDebugMode()) {
                const errorToLog = payload.error instanceof Error
                    ? payload.error.stack || payload.error.message
                    : String(payload.error);
                process.stderr.write(`${errorToLog}\n`);
            }
        };
        const startTime = Date.now();
        const streamFormatter = config.getOutputFormat() === OutputFormat.STREAM_JSON
            ? new StreamJsonFormatter()
            : null;
        const abortController = new AbortController();
        // Track cancellation state
        let isAborting = false;
        let cancelMessageTimer = null;
        // Setup stdin listener for Ctrl+C detection
        let stdinWasRaw = false;
        let rl = null;
        const setupStdinCancellation = () => {
            // Only setup if stdin is a TTY (user can interact)
            if (!process.stdin.isTTY) {
                return;
            }
            // Save original raw mode state
            stdinWasRaw = process.stdin.isRaw || false;
            // Enable raw mode to capture individual keypresses
            process.stdin.setRawMode(true);
            process.stdin.resume();
            // Setup readline to emit keypress events
            rl = readline.createInterface({
                input: process.stdin,
                escapeCodeTimeout: 0,
            });
            readline.emitKeypressEvents(process.stdin, rl);
            // Listen for Ctrl+C
            const keypressHandler = (str, key) => {
                // Detect Ctrl+C: either ctrl+c key combo or raw character code 3
                if ((key && key.ctrl && key.name === 'c') || str === '\u0003') {
                    // Only handle once
                    if (isAborting) {
                        return;
                    }
                    isAborting = true;
                    // Only show message if cancellation takes longer than 200ms
                    // This reduces verbosity for fast cancellations
                    cancelMessageTimer = setTimeout(() => {
                        process.stderr.write('\nCancelling...\n');
                    }, 200);
                    abortController.abort();
                    // Note: Don't exit here - let the abort flow through the system
                    // and trigger handleCancellationError() which will exit with proper code
                }
            };
            process.stdin.on('keypress', keypressHandler);
        };
        const cleanupStdinCancellation = () => {
            // Clear any pending cancel message timer
            if (cancelMessageTimer) {
                clearTimeout(cancelMessageTimer);
                cancelMessageTimer = null;
            }
            // Cleanup readline and stdin listeners
            if (rl) {
                rl.close();
                rl = null;
            }
            // Remove keypress listener
            process.stdin.removeAllListeners('keypress');
            // Restore stdin to original state
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(stdinWasRaw);
                process.stdin.pause();
            }
        };
        let errorToHandle;
        try {
            consolePatcher.patch();
            // Setup stdin cancellation listener
            setupStdinCancellation();
            coreEvents.on(CoreEvent.UserFeedback, handleUserFeedback);
            coreEvents.drainBacklogs();
            // Handle EPIPE errors when the output is piped to a command that closes early.
            process.stdout.on('error', (err) => {
                if (err.code === 'EPIPE') {
                    // Exit gracefully if the pipe is closed.
                    process.exit(0);
                }
            });
            const geminiClient = config.getGeminiClient();
            // Initialize chat.  Resume if resume data is passed.
            if (resumedSessionData) {
                await geminiClient.resumeChat(convertSessionToHistoryFormats(resumedSessionData.conversation.messages).clientHistory, resumedSessionData);
            }
            // Emit init event for streaming JSON
            if (streamFormatter) {
                streamFormatter.emitEvent({
                    type: JsonStreamEventType.INIT,
                    timestamp: new Date().toISOString(),
                    session_id: config.getSessionId(),
                    model: config.getModel(),
                });
            }
            let query;
            if (isSlashCommand(input)) {
                const slashCommandResult = await handleSlashCommand(input, abortController, config, settings);
                // If a slash command is found and returns a prompt, use it.
                // Otherwise, slashCommandResult falls through to the default prompt
                // handling.
                if (slashCommandResult) {
                    query = slashCommandResult;
                }
            }
            if (!query) {
                const { processedQuery, error } = await handleAtCommand({
                    query: input,
                    config,
                    addItem: (_item, _timestamp) => 0,
                    onDebugMessage: () => { },
                    messageId: Date.now(),
                    signal: abortController.signal,
                });
                if (error || !processedQuery) {
                    // An error occurred during @include processing (e.g., file not found).
                    // The error message is already logged by handleAtCommand.
                    throw new FatalInputError(error || 'Exiting due to an error processing the @ command.');
                }
                query = processedQuery;
            }
            // Emit user message event for streaming JSON
            if (streamFormatter) {
                streamFormatter.emitEvent({
                    type: JsonStreamEventType.MESSAGE,
                    timestamp: new Date().toISOString(),
                    role: 'user',
                    content: input,
                });
            }
            let currentMessages = [{ role: 'user', parts: query }];
            let turnCount = 0;
            const deprecateText = 'The --prompt (-p) flag has been deprecated and will be removed in a future version. Please use a positional argument for your prompt. See gemini --help for more information.\n';
            if (hasDeprecatedPromptArg) {
                if (streamFormatter) {
                    streamFormatter.emitEvent({
                        type: JsonStreamEventType.MESSAGE,
                        timestamp: new Date().toISOString(),
                        role: 'assistant',
                        content: deprecateText,
                        delta: true,
                    });
                }
                else {
                    process.stderr.write(deprecateText);
                }
            }
            while (true) {
                turnCount++;
                if (config.getMaxSessionTurns() >= 0 &&
                    turnCount > config.getMaxSessionTurns()) {
                    handleMaxTurnsExceededError(config);
                }
                const toolCallRequests = [];
                const responseStream = geminiClient.sendMessageStream(currentMessages[0]?.parts || [], abortController.signal, prompt_id);
                let responseText = '';
                for await (const event of responseStream) {
                    if (abortController.signal.aborted) {
                        handleCancellationError(config);
                    }
                    if (event.type === GeminiEventType.Content) {
                        if (streamFormatter) {
                            streamFormatter.emitEvent({
                                type: JsonStreamEventType.MESSAGE,
                                timestamp: new Date().toISOString(),
                                role: 'assistant',
                                content: event.value,
                                delta: true,
                            });
                        }
                        else if (config.getOutputFormat() === OutputFormat.JSON) {
                            responseText += event.value;
                        }
                        else {
                            if (event.value) {
                                textOutput.write(event.value);
                            }
                        }
                    }
                    else if (event.type === GeminiEventType.ToolCallRequest) {
                        if (streamFormatter) {
                            streamFormatter.emitEvent({
                                type: JsonStreamEventType.TOOL_USE,
                                timestamp: new Date().toISOString(),
                                tool_name: event.value.name,
                                tool_id: event.value.callId,
                                parameters: event.value.args,
                            });
                        }
                        toolCallRequests.push(event.value);
                    }
                    else if (event.type === GeminiEventType.LoopDetected) {
                        if (streamFormatter) {
                            streamFormatter.emitEvent({
                                type: JsonStreamEventType.ERROR,
                                timestamp: new Date().toISOString(),
                                severity: 'warning',
                                message: 'Loop detected, stopping execution',
                            });
                        }
                    }
                    else if (event.type === GeminiEventType.MaxSessionTurns) {
                        if (streamFormatter) {
                            streamFormatter.emitEvent({
                                type: JsonStreamEventType.ERROR,
                                timestamp: new Date().toISOString(),
                                severity: 'error',
                                message: 'Maximum session turns exceeded',
                            });
                        }
                    }
                    else if (event.type === GeminiEventType.Error) {
                        throw event.value.error;
                    }
                }
                if (toolCallRequests.length > 0) {
                    textOutput.ensureTrailingNewline();
                    const toolResponseParts = [];
                    const completedToolCalls = [];
                    for (const requestInfo of toolCallRequests) {
                        const completedToolCall = await executeToolCall(config, requestInfo, abortController.signal);
                        const toolResponse = completedToolCall.response;
                        completedToolCalls.push(completedToolCall);
                        if (streamFormatter) {
                            streamFormatter.emitEvent({
                                type: JsonStreamEventType.TOOL_RESULT,
                                timestamp: new Date().toISOString(),
                                tool_id: requestInfo.callId,
                                status: toolResponse.error ? 'error' : 'success',
                                output: typeof toolResponse.resultDisplay === 'string'
                                    ? toolResponse.resultDisplay
                                    : undefined,
                                error: toolResponse.error
                                    ? {
                                        type: toolResponse.errorType || 'TOOL_EXECUTION_ERROR',
                                        message: toolResponse.error.message,
                                    }
                                    : undefined,
                            });
                        }
                        if (toolResponse.error) {
                            handleToolError(requestInfo.name, toolResponse.error, config, toolResponse.errorType || 'TOOL_EXECUTION_ERROR', typeof toolResponse.resultDisplay === 'string'
                                ? toolResponse.resultDisplay
                                : undefined);
                        }
                        if (toolResponse.responseParts) {
                            toolResponseParts.push(...toolResponse.responseParts);
                        }
                    }
                    // Record tool calls with full metadata before sending responses to Gemini
                    try {
                        const currentModel = geminiClient.getCurrentSequenceModel() ?? config.getModel();
                        geminiClient
                            .getChat()
                            .recordCompletedToolCalls(currentModel, completedToolCalls);
                    }
                    catch (error) {
                        debugLogger.error(`Error recording completed tool call information: ${error}`);
                    }
                    currentMessages = [{ role: 'user', parts: toolResponseParts }];
                }
                else {
                    // Emit final result event for streaming JSON
                    if (streamFormatter) {
                        const metrics = uiTelemetryService.getMetrics();
                        const durationMs = Date.now() - startTime;
                        streamFormatter.emitEvent({
                            type: JsonStreamEventType.RESULT,
                            timestamp: new Date().toISOString(),
                            status: 'success',
                            stats: streamFormatter.convertToStreamStats(metrics, durationMs),
                        });
                    }
                    else if (config.getOutputFormat() === OutputFormat.JSON) {
                        const formatter = new JsonFormatter();
                        const stats = uiTelemetryService.getMetrics();
                        textOutput.write(formatter.format(config.getSessionId(), responseText, stats));
                    }
                    else {
                        textOutput.ensureTrailingNewline(); // Ensure a final newline
                    }
                    return;
                }
            }
        }
        catch (error) {
            errorToHandle = error;
        }
        finally {
            // Cleanup stdin cancellation before other cleanup
            cleanupStdinCancellation();
            consolePatcher.cleanup();
            coreEvents.off(CoreEvent.UserFeedback, handleUserFeedback);
        }
        if (errorToHandle) {
            handleError(errorToHandle, config);
        }
    });
}

// Helper functions for main
function validateDnsResolutionOrder(order) {
    const defaultValue = 'ipv4first';
    if (order === undefined) {
        return defaultValue;
    }
    if (order === 'ipv4first' || order === 'verbatim') {
        return order;
    }
    // We don't want to throw here, just warn and use the default.
    debugLogger.warn(`Invalid value for dnsResolutionOrder in settings: "${order}". Using default "${defaultValue}".`);
    return defaultValue;
}

function getNodeMemoryArgs(isDebugMode) {
    const totalMemoryMB = os.totalmem() / (1024 * 1024);
    const heapStats = v8.getHeapStatistics();
    const currentMaxOldSpaceSizeMb = Math.floor(heapStats.heap_size_limit / 1024 / 1024);
    // Set target to 50% of total memory
    const targetMaxOldSpaceSizeInMB = Math.floor(totalMemoryMB * 0.5);
    if (isDebugMode) {
        debugLogger.debug(`Current heap size ${currentMaxOldSpaceSizeMb.toFixed(2)} MB`);
    }
    if (process.env['GEMINI_CLI_NO_RELAUNCH']) {
        return [];
    }
    if (targetMaxOldSpaceSizeInMB > currentMaxOldSpaceSizeMb) {
        if (isDebugMode) {
            debugLogger.debug(`Need to relaunch with more memory: ${targetMaxOldSpaceSizeInMB.toFixed(2)} MB`);
        }
        return [`--max-old-space-size=${targetMaxOldSpaceSizeInMB}`];
    }
    return [];
}

function setupUnhandledRejectionHandler() {
    let unhandledRejectionOccurred = false;
    process.on('unhandledRejection', (reason, _promise) => {
        const errorMessage = `=========================================
This is an unexpected error. Please file a bug report using the /bug tool.
CRITICAL: Unhandled Promise Rejection!
=========================================
Reason: ${reason}${reason instanceof Error && reason.stack
            ? `
Stack trace:
${reason.stack}`
            : ''}`;
        debugLogger.error(errorMessage);
        if (!unhandledRejectionOccurred) {
            unhandledRejectionOccurred = true;
            appEvents.emit(AppEvent.OpenDebugConsole);
        }
    });
}

function setWindowTitle(title, settings) {
    if (!settings.merged.ui?.hideWindowTitle) {
        const windowTitle = computeWindowTitle(title);
        writeToStdout(`\x1b]2;${windowTitle}\x07`);
        process.on('exit', () => {
            writeToStdout(`\x1b]2;\x07`);
        });
    }
}

function initializeOutputListenersAndFlush() {
    // If there are no listeners for output, make sure we flush so output is not
    // lost.
    if (coreEvents.listenerCount(CoreEvent.Output) === 0) {
        // In non-interactive mode, ensure we drain any buffered output or logs to stderr
        coreEvents.on(CoreEvent.Output, (payload) => {
            if (payload.isStderr) {
                writeToStderr(payload.chunk, payload.encoding);
            }
            else {
                writeToStdout(payload.chunk, payload.encoding);
            }
        });
        coreEvents.on(CoreEvent.ConsoleLog, (payload) => {
            if (payload.type === 'error' || payload.type === 'warn') {
                writeToStderr(payload.content);
            }
            else {
                writeToStdout(payload.content);
            }
        });
    }
    coreEvents.drainBacklogs();
}

async function main() {
    const cliStartupHandle = startupProfiler.start('cli_startup');
    const cleanupStdio = patchStdio();
    registerSyncCleanup(() => {
        // This is needed to ensure we don't lose any buffered output.
        initializeOutputListenersAndFlush();
        cleanupStdio();
    });
    setupUnhandledRejectionHandler();
    const loadSettingsHandle = startupProfiler.start('load_settings');
    const settings = loadSettings();
    loadSettingsHandle?.end();
    const migrateHandle = startupProfiler.start('migrate_settings');
    migrateDeprecatedSettings(settings, 
    // Temporary extension manager only used during this non-interactive UI phase.
    new ExtensionManager({
        workspaceDir: process.cwd(),
        settings: settings.merged,
        enabledExtensionOverrides: [],
        requestConsent: requestConsentNonInteractive,
        requestSetting: null,
    }));
    migrateHandle?.end();
    await cleanupCheckpoints();
    const parseArgsHandle = startupProfiler.start('parse_arguments');
    const argv = await parseArguments(settings.merged);
    parseArgsHandle?.end();
    // Check for invalid input combinations early to prevent crashes
    if (argv.promptInteractive && !process.stdin.isTTY) {
        writeToStderr('Error: The --prompt-interactive flag cannot be used when input is piped from stdin.\n');
        await runExitCleanup();
        process.exit(ExitCodes.FATAL_INPUT_ERROR);
    }
    const isDebugMode = cliConfig.isDebugMode(argv);
    const consolePatcher = new ConsolePatcher({
        stderr: true,
        debugMode: isDebugMode,
        onNewMessage: (msg) => {
            coreEvents.emitConsoleLog(msg.type, msg.content);
        },
    });
    consolePatcher.patch();
    registerCleanup(consolePatcher.cleanup);
    dns.setDefaultResultOrder(validateDnsResolutionOrder(settings.merged.advanced?.dnsResolutionOrder));
    // Set a default auth type if one isn't set or is set to a legacy type
    if (!settings.merged.security?.auth?.selectedType ||
        settings.merged.security?.auth?.selectedType === AuthType.LEGACY_CLOUD_SHELL) {
        if (process.env['CLOUD_SHELL'] === 'true' ||
            process.env['GEMINI_CLI_USE_COMPUTE_ADC'] === 'true') {
            settings.setValue(SettingScope.User, 'selectedAuthType', AuthType.COMPUTE_ADC);
        }
    }
    // Load custom themes from settings
    themeManager.loadCustomThemes(settings.merged.ui?.customThemes);
    if (settings.merged.ui?.theme) {
        if (!themeManager.setActiveTheme(settings.merged.ui?.theme)) {
            // If the theme is not found during initial load, log a warning and continue.
            // The useThemeCommand hook in AppContainer.tsx will handle opening the dialog.
            debugLogger.warn(`Warning: Theme "${settings.merged.ui?.theme}" not found.`);
        }
    }
    // hop into sandbox if we are outside and sandboxing is enabled
    if (!process.env['SANDBOX']) {
        const memoryArgs = settings.merged.advanced?.autoConfigureMemory
            ? getNodeMemoryArgs(isDebugMode)
            : [];
        const sandboxConfig = await loadSandboxConfig(settings.merged, argv);
        // We intentionally omit the list of extensions here because extensions
        // should not impact auth or setting up the sandbox.
        // TODO(jacobr): refactor loadCliConfig so there is a minimal version
        // that only initializes enough config to enable refreshAuth or find
        // another way to decouple refreshAuth from requiring a config.
        if (sandboxConfig) {
            const partialConfig = await loadCliConfig(settings.merged, sessionId, argv);
            if (settings.merged.security?.auth?.selectedType &&
                !settings.merged.security?.auth?.useExternal) {
                // Validate authentication here because the sandbox will interfere with the Oauth2 web redirect.
                try {
                    const err = validateAuthMethod(settings.merged.security.auth.selectedType);
                    if (err) {
                        throw new Error(err);
                    }
                    await partialConfig.refreshAuth(settings.merged.security.auth.selectedType);
                }
                catch (err) {
                    debugLogger.error('Error authenticating:', err);
                    await runExitCleanup();
                    process.exit(ExitCodes.FATAL_AUTHENTICATION_ERROR);
                }
            }
            let stdinData = '';
            if (!process.stdin.isTTY) {
                stdinData = await readStdin();
            }
            // This function is a copy of the one from sandbox.ts
            // It is moved here to decouple sandbox.ts from the CLI's argument structure.
            const injectStdinIntoArgs = (args, stdinData) => {
                const finalArgs = [...args];
                if (stdinData) {
                    const promptIndex = finalArgs.findIndex((arg) => arg === '--prompt' || arg === '-p');
                    if (promptIndex > -1 && finalArgs.length > promptIndex + 1) {
                        // If there's a prompt argument, prepend stdin to it
                        finalArgs[promptIndex + 1] =
                            `${stdinData}\n\n${finalArgs[promptIndex + 1]}`;
                    }
                    else {
                        // If there's no prompt argument, add stdin as the prompt
                        finalArgs.push('--prompt', stdinData);
                    }
                }
                return finalArgs;
            };
            const sandboxArgs = injectStdinIntoArgs(process.argv, stdinData);
            await relaunchOnExitCode(() => start_sandbox(sandboxConfig, memoryArgs, partialConfig, sandboxArgs));
            await runExitCleanup();
            process.exit(ExitCodes.SUCCESS);
        }
        else {
            // Relaunch app so we always have a child process that can be internally
            // restarted if needed.
            await relaunchAppInChildProcess(memoryArgs, []);
        }
    }
    // We are now past the logic handling potentially launching a child process
    // to run Gemini CLI. It is now safe to perform expensive initialization that
    // may have side effects.
    {
        const loadConfigHandle = startupProfiler.start('load_cli_config');
        const config = await loadCliConfig(settings.merged, sessionId, argv);
        loadConfigHandle?.end();
        // Register config for telemetry shutdown
        // This ensures telemetry (including SessionEnd hooks) is properly flushed on exit
        registerTelemetryConfig(config);
        const policyEngine = config.getPolicyEngine();
        const messageBus = config.getMessageBus();
        createPolicyUpdater(policyEngine, messageBus);
        // Register SessionEnd hook to fire on graceful exit
        // This runs before telemetry shutdown in runExitCleanup()
        if (config.getEnableHooks() && messageBus) {
            registerCleanup(async () => {
                await fireSessionEndHook(messageBus, SessionEndReason.Exit);
            });
        }
        // Cleanup sessions after config initialization
        try {
            await cleanupExpiredSessions(config, settings.merged);
        }
        catch (e) {
            debugLogger.error('Failed to cleanup expired sessions:', e);
        }
        if (config.getListExtensions()) {
            debugLogger.log('Installed extensions:');
            for (const extension of config.getExtensions()) {
                debugLogger.log(`- ${extension.name}`);
            }
            await runExitCleanup();
            process.exit(ExitCodes.SUCCESS);
        }
        // Handle --list-sessions flag
        if (config.getListSessions()) {
            // Attempt auth for summary generation (gracefully skips if not configured)
            const authType = settings.merged.security?.auth?.selectedType;
            if (authType) {
                try {
                    await config.refreshAuth(authType);
                }
                catch (e) {
                    // Auth failed - continue without summary generation capability
                    debugLogger.debug('Auth failed for --list-sessions, summaries may not be generated:', e);
                }
            }
            await listSessions(config);
            await runExitCleanup();
            process.exit(ExitCodes.SUCCESS);
        }
        // Handle --delete-session flag
        const sessionToDelete = config.getDeleteSession();
        if (sessionToDelete) {
            await deleteSession(config, sessionToDelete);
            await runExitCleanup();
            process.exit(ExitCodes.SUCCESS);
        }
        const wasRaw = process.stdin.isRaw;
        // REMOVED INTERACTIVE UI BLOCK
        // if (config.isInteractive() && !wasRaw && process.stdin.isTTY) {
        //     ... 
        // }

        // setMaxSizedBoxDebugging(isDebugMode);
        const initAppHandle = startupProfiler.start('initialize_app');
        const initializationResult = await initializeApp(config, settings);
        initAppHandle?.end();
        if (settings.merged.security?.auth?.selectedType ===
            AuthType.LOGIN_WITH_GOOGLE &&
            config.isBrowserLaunchSuppressed()) {
            // Do oauth before app renders to make copying the link possible.
            await getOauthClient(settings.merged.security.auth.selectedType, config);
        }
        if (config.getExperimentalZedIntegration()) {
            return runZedIntegration(config, settings, argv);
        }
        let input = config.getQuestion();
        const startupWarnings = [
            ...(await getStartupWarnings()),
            ...(await getUserStartupWarnings()),
        ];
        // Handle --resume flag
        let resumedSessionData = undefined;
        if (argv.resume) {
            const sessionSelector = new SessionSelector(config);
            try {
                const result = await sessionSelector.resolveSession(argv.resume);
                resumedSessionData = {
                    conversation: result.sessionData,
                    filePath: result.sessionPath,
                };
                // Use the existing session ID to continue recording to the same session
                config.setSessionId(resumedSessionData.conversation.sessionId);
            }
            catch (error) {
                console.error(`Error resuming session: ${error instanceof Error ? error.message : 'Unknown error'}`);
                await runExitCleanup();
                process.exit(ExitCodes.FATAL_INPUT_ERROR);
            }
        }
        cliStartupHandle?.end();
        // Render UI, passing necessary config values. Check that there is no command line question.
        if (config.isInteractive()) {
            // START OF MODIFICATION
            // Instead of starting UI, we print a warning or fallback to non-interactive if input provided, or exit.
            // But since this is "fast-entry", we assume it's for non-interactive use cases mostly?
            // The instructions said "remove the if (config.isInteractive()) block entirely to prevent any UI-related code from being triggered."
            // However, we must ensure that if it IS interactive but no input is provided, we don't just crash or hang.
            // If isInteractive is true, it usually means no input was piped and no args provided.
            // In that case, normally the TUI starts.
            // If we remove TUI support, we should probably tell the user.
            
            // However, the task is to optimize "one-shot prompts".
            // If I remove the block:
            // await startInteractiveUI(...)
            // return;
            // 
            // It will fall through to:
            // await config.initialize();
            
            // So if I simply remove the block as instructed, it will proceed to non-interactive flow.
            // If there is no input, the later check `if (!input)` will catch it and error out.
            // That seems acceptable for a "fast path" that is intended for one-shot prompts.
            
            // So I will just NOT include the block.
            // END OF MODIFICATION
        }
        await config.initialize();
        startupProfiler.flush(config);
        // Fire SessionStart hook through MessageBus (only if hooks are enabled)
        // Must be called AFTER config.initialize() to ensure HookRegistry is loaded
        const hooksEnabled = config.getEnableHooks();
        const hookMessageBus = config.getMessageBus();
        if (hooksEnabled && hookMessageBus) {
            const sessionStartSource = resumedSessionData
                ? SessionStartSource.Resume
                : SessionStartSource.Startup;
            await fireSessionStartHook(hookMessageBus, sessionStartSource);
            // Register SessionEnd hook for graceful exit
            registerCleanup(async () => {
                await fireSessionEndHook(hookMessageBus, SessionEndReason.Exit);
            });
        }
        // If not a TTY, read from stdin
        // This is for cases where the user pipes input directly into the command
        if (!process.stdin.isTTY) {
            const stdinData = await readStdin();
            if (stdinData) {
                input = `${stdinData}\n\n${input}`;
            }
        }
        if (!input) {
            debugLogger.error(`No input provided via stdin. Input can be provided by piping data into gemini or using the --prompt option.`);
            await runExitCleanup();
            process.exit(ExitCodes.FATAL_INPUT_ERROR);
        }
        const prompt_id = Math.random().toString(16).slice(2);
        logUserPrompt(config, new UserPromptEvent(input.length, prompt_id, config.getContentGeneratorConfig()?.authType, input));
        const nonInteractiveConfig = await validateNonInteractiveAuth(settings.merged.security?.auth?.selectedType, settings.merged.security?.auth?.useExternal, config, settings);
        if (config.getDebugMode()) {
            debugLogger.log('Session ID: %s', sessionId);
        }
        const hasDeprecatedPromptArg = process.argv.some((arg) => arg.startsWith('--prompt'));
        initializeOutputListenersAndFlush();
        await runNonInteractive({
            config: nonInteractiveConfig,
            settings,
            input,
            prompt_id,
            hasDeprecatedPromptArg,
            resumedSessionData,
        });
        // Call cleanup before process.exit, which causes cleanup to not run
        await runExitCleanup();
        process.exit(ExitCodes.SUCCESS);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});

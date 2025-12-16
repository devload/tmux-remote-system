package com.tmuxremote.agent.service;

import com.tmuxremote.agent.dto.AgentConfig;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Slf4j
public class CommandExecutionService {

    private final AgentConfig.ExecConfig config;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public CommandExecutionService(AgentConfig.ExecConfig config) {
        this.config = config != null ? config : new AgentConfig.ExecConfig();
    }

    public Map<String, Object> executeCommand(String command, String cwd, Integer timeout, String sessionId) {
        long startTime = System.currentTimeMillis();

        if (!config.isEnabled()) {
            return Map.of(
                    "exitCode", -1,
                    "stdout", "",
                    "stderr", "Command execution is disabled on this agent",
                    "duration", 0
            );
        }

        // Check allowed commands if configured
        if (config.getAllowedCommands() != null && !config.getAllowedCommands().isEmpty()) {
            boolean allowed = config.getAllowedCommands().stream()
                    .anyMatch(cmd -> command.startsWith(cmd) || command.matches(cmd));
            if (!allowed) {
                return Map.of(
                        "exitCode", -1,
                        "stdout", "",
                        "stderr", "Command not in allowed list",
                        "duration", 0
                );
            }
        }

        int timeoutMs = timeout != null ? timeout : config.getDefaultTimeout();
        String workingDir = cwd != null ? cwd : config.getWorkingDir();
        String shell = config.getShell() != null ? config.getShell() : "/bin/bash";

        try {
            ProcessBuilder pb;

            // If sessionId is provided, run in tmux session
            if (sessionId != null && !sessionId.isEmpty()) {
                // Execute in tmux session context
                pb = new ProcessBuilder(
                        "tmux", "send-keys", "-t", sessionId, command, "Enter"
                );
            } else {
                // Direct shell execution
                pb = new ProcessBuilder(shell, "-c", command);
            }

            if (workingDir != null) {
                pb.directory(new File(workingDir));
            }
            pb.redirectErrorStream(false);

            Process process = pb.start();

            // Capture stdout and stderr in parallel
            Future<String> stdoutFuture = executor.submit(() -> readStream(process.getInputStream()));
            Future<String> stderrFuture = executor.submit(() -> readStream(process.getErrorStream()));

            boolean completed = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);

            String stdout;
            String stderr;
            int exitCode;

            if (completed) {
                stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
                stderr = stderrFuture.get(1, TimeUnit.SECONDS);
                exitCode = process.exitValue();
            } else {
                process.destroyForcibly();
                stdout = "";
                stderr = "Command timed out after " + timeoutMs + "ms";
                exitCode = -1;
            }

            long duration = System.currentTimeMillis() - startTime;

            log.info("Command executed: exitCode={}, duration={}ms", exitCode, duration);

            return Map.of(
                    "exitCode", exitCode,
                    "stdout", stdout,
                    "stderr", stderr,
                    "duration", (int) duration
            );

        } catch (Exception e) {
            log.error("Failed to execute command", e);
            long duration = System.currentTimeMillis() - startTime;
            return Map.of(
                    "exitCode", -1,
                    "stdout", "",
                    "stderr", "Execution error: " + e.getMessage(),
                    "duration", (int) duration
            );
        }
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
        }
        return sb.toString();
    }

    public void shutdown() {
        executor.shutdown();
    }
}

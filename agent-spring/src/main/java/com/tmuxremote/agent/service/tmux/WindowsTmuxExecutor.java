package com.tmuxremote.agent.service.tmux;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Windows implementation of TmuxExecutor using itmux (Cygwin + tmux bundle).
 *
 * itmux provides a portable tmux environment for Windows without requiring
 * a full Cygwin installation.
 *
 * @see <a href="https://github.com/itefixnet/itmux">itmux on GitHub</a>
 */
@Slf4j
public class WindowsTmuxExecutor implements TmuxExecutor {

    private final String itmuxPath;
    private final String bashPath;

    /**
     * Create a new WindowsTmuxExecutor.
     * @param itmuxPath Path to itmux installation directory (e.g., "C:\\itmux")
     */
    public WindowsTmuxExecutor(String itmuxPath) {
        this.itmuxPath = itmuxPath;
        this.bashPath = itmuxPath + "\\bin\\bash.exe";

        if (!new File(bashPath).exists()) {
            throw new IllegalArgumentException("itmux bash not found at: " + bashPath);
        }

        log.info("WindowsTmuxExecutor initialized with itmux at: {}", itmuxPath);
    }

    @Override
    public List<String> listSessions() {
        List<String> sessions = new ArrayList<>();
        try {
            String output = executeCommand("tmux ls -F '#{session_name}' 2>/dev/null || true");
            if (output != null && !output.isEmpty()) {
                for (String line : output.split("\n")) {
                    String sessionName = line.trim();
                    if (!sessionName.isEmpty() && !sessionName.startsWith("no server")
                            && !sessionName.contains("error")) {
                        sessions.add(sessionName);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to list tmux sessions", e);
        }
        return sessions;
    }

    @Override
    public String capturePane(String session) {
        try {
            String output = executeCommand(
                String.format("tmux capture-pane -t '%s' -p -e -N", escapeSession(session))
            );
            if (output != null) {
                return output.replace("\n", "\r\n");
            }
        } catch (Exception e) {
            log.error("Failed to capture pane for session: {}", session, e);
        }
        return null;
    }

    @Override
    public void sendKeys(String session, String text) {
        try {
            // Escape single quotes in text
            String escapedText = text.replace("'", "'\\''");
            executeCommand(
                String.format("tmux send-keys -t '%s' -l '%s'", escapeSession(session), escapedText)
            );
            log.debug("Sent keys to session: {}", session);
        } catch (Exception e) {
            log.error("Failed to send keys to session: {}", session, e);
        }
    }

    @Override
    public void sendSpecialKey(String session, String key) {
        try {
            executeCommand(
                String.format("tmux send-keys -t '%s' %s", escapeSession(session), key)
            );
            log.debug("Sent special key {} to session: {}", key, session);
        } catch (Exception e) {
            log.error("Failed to send special key to session: {}", session, e);
        }
    }

    @Override
    public void resizeWindow(String session, int cols, int rows) {
        try {
            executeCommand(
                String.format("tmux resize-window -t '%s' -x %d -y %d", escapeSession(session), cols, rows)
            );
            log.info("Resized session {} to {}x{}", session, cols, rows);
        } catch (Exception e) {
            log.error("Failed to resize session: {}", session, e);
        }
    }

    @Override
    public void killSession(String session) {
        try {
            executeCommand(
                String.format("tmux kill-session -t '%s'", escapeSession(session))
            );
            log.info("Killed session: {}", session);
        } catch (Exception e) {
            log.error("Failed to kill session: {}", session, e);
        }
    }

    @Override
    public void createSession(String session, String workingDir) {
        try {
            String cmd;
            if (workingDir != null && !workingDir.isEmpty()) {
                // Convert Windows path to Cygwin path
                String cygwinPath = windowsToCygwinPath(workingDir);
                cmd = String.format("tmux new-session -d -s '%s' -c '%s'",
                    escapeSession(session), cygwinPath);
            } else {
                cmd = String.format("tmux new-session -d -s '%s'", escapeSession(session));
            }
            executeCommand(cmd);
            log.info("Created session: {} in {}", session, workingDir);
        } catch (Exception e) {
            log.error("Failed to create session: {}", session, e);
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            String version = getVersion();
            return version != null && version.contains("tmux");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getVersion() {
        try {
            return executeCommand("tmux -V");
        } catch (Exception e) {
            log.error("Failed to get tmux version", e);
            return null;
        }
    }

    /**
     * Execute a command through itmux's bash shell.
     */
    private String executeCommand(String command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(bashPath, "-l", "-c", command);

        // Set up Cygwin environment
        Map<String, String> env = pb.environment();
        env.put("CYGWIN", "nodosfilewarning");
        env.put("HOME", "/home/" + System.getProperty("user.name"));
        env.put("TERM", "xterm-256color");

        // Set working directory to itmux root
        pb.directory(new File(itmuxPath));
        pb.redirectErrorStream(false);

        Process process = pb.start();

        // Read stdout
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int bytesRead;
        InputStream is = process.getInputStream();
        while ((bytesRead = is.read(buffer)) != -1) {
            baos.write(buffer, 0, bytesRead);
        }

        // Consume stderr
        try (BufferedReader errReader = new BufferedReader(
                new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = errReader.readLine()) != null) {
                if (!line.isEmpty()) {
                    log.debug("itmux stderr: {}", line);
                }
            }
        }

        process.waitFor(10, TimeUnit.SECONDS);

        return baos.toString(StandardCharsets.UTF_8).trim();
    }

    /**
     * Escape session name for shell command.
     */
    private String escapeSession(String session) {
        return session.replace("'", "'\\''");
    }

    /**
     * Convert Windows path to Cygwin path.
     * e.g., "C:\Users\john" -> "/cygdrive/c/Users/john"
     */
    private String windowsToCygwinPath(String windowsPath) {
        if (windowsPath == null || windowsPath.isEmpty()) {
            return windowsPath;
        }

        // Handle UNC paths (\\server\share)
        if (windowsPath.startsWith("\\\\")) {
            return windowsPath; // Keep as-is, Cygwin handles UNC paths
        }

        // Handle drive letters (C:\...)
        if (windowsPath.length() >= 2 && windowsPath.charAt(1) == ':') {
            char drive = Character.toLowerCase(windowsPath.charAt(0));
            String rest = windowsPath.substring(2).replace("\\", "/");
            return "/cygdrive/" + drive + rest;
        }

        // Just convert backslashes
        return windowsPath.replace("\\", "/");
    }

    /**
     * Find itmux installation path.
     * Checks common locations and environment variable.
     *
     * @return Path to itmux installation or null if not found
     */
    public static String findItmuxPath() {
        // 1. Check environment variable
        String envPath = System.getenv("ITMUX_HOME");
        if (envPath != null && new File(envPath + "\\bin\\bash.exe").exists()) {
            return envPath;
        }

        // 2. Check common locations
        String[] locations = {
            System.getProperty("user.home") + "\\itmux",
            "C:\\itmux",
            "D:\\itmux",
            System.getProperty("user.dir") + "\\itmux",
            System.getenv("ProgramFiles") + "\\itmux",
            System.getenv("LOCALAPPDATA") + "\\itmux"
        };

        for (String loc : locations) {
            if (loc != null && new File(loc + "\\bin\\bash.exe").exists()) {
                return loc;
            }
        }

        return null;
    }
}

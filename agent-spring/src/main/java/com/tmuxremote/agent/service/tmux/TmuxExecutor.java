package com.tmuxremote.agent.service.tmux;

import java.util.List;

/**
 * Interface for executing tmux commands.
 * Implementations handle platform-specific differences (Unix vs Windows/itmux).
 */
public interface TmuxExecutor {

    /**
     * List all tmux sessions.
     * @return List of session names
     */
    List<String> listSessions();

    /**
     * Capture the content of a tmux pane.
     * @param session Session name
     * @return Captured pane content with ANSI escape sequences
     */
    String capturePane(String session);

    /**
     * Send literal text to a tmux session.
     * @param session Session name
     * @param text Text to send
     */
    void sendKeys(String session, String text);

    /**
     * Send a special key (Enter, C-c, C-d, etc.) to a tmux session.
     * @param session Session name
     * @param key Key name (e.g., "Enter", "C-c", "C-d")
     */
    void sendSpecialKey(String session, String key);

    /**
     * Resize a tmux window.
     * @param session Session name
     * @param cols Number of columns
     * @param rows Number of rows
     */
    void resizeWindow(String session, int cols, int rows);

    /**
     * Kill a tmux session.
     * @param session Session name
     */
    void killSession(String session);

    /**
     * Create a new tmux session.
     * @param session Session name
     * @param workingDir Working directory for the session
     */
    void createSession(String session, String workingDir);

    /**
     * Check if tmux is available on this system.
     * @return true if tmux is available
     */
    boolean isAvailable();

    /**
     * Get the tmux version.
     * @return Version string or null if not available
     */
    String getVersion();
}

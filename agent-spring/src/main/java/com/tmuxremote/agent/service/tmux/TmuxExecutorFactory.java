package com.tmuxremote.agent.service.tmux;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Factory for creating platform-appropriate TmuxExecutor instances.
 */
@Slf4j
@Component
public class TmuxExecutorFactory {

    @Value("${platform.windows.itmuxPath:}")
    private String configuredItmuxPath;

    private TmuxExecutor executor;

    /**
     * Get or create the TmuxExecutor for the current platform.
     * @return TmuxExecutor instance
     */
    public synchronized TmuxExecutor getExecutor() {
        if (executor != null) {
            return executor;
        }

        executor = createExecutor();
        return executor;
    }

    /**
     * Create a new TmuxExecutor based on the current platform.
     * @return TmuxExecutor instance
     */
    public TmuxExecutor createExecutor() {
        if (isWindows()) {
            return createWindowsExecutor();
        } else {
            return createUnixExecutor();
        }
    }

    private TmuxExecutor createUnixExecutor() {
        log.info("Creating Unix TmuxExecutor");
        UnixTmuxExecutor executor = new UnixTmuxExecutor();

        if (!executor.isAvailable()) {
            throw new RuntimeException("tmux is not installed. Please install tmux.");
        }

        String version = executor.getVersion();
        log.info("tmux version: {}", version);

        return executor;
    }

    private TmuxExecutor createWindowsExecutor() {
        log.info("Creating Windows TmuxExecutor (itmux)");

        // Try configured path first
        String itmuxPath = configuredItmuxPath;
        if (itmuxPath == null || itmuxPath.isEmpty()) {
            itmuxPath = WindowsTmuxExecutor.findItmuxPath();
        }

        if (itmuxPath == null) {
            throw new RuntimeException(
                "itmux not found. Please install itmux from https://github.com/itefixnet/itmux\n" +
                "Set ITMUX_HOME environment variable or configure platform.windows.itmuxPath"
            );
        }

        WindowsTmuxExecutor executor = new WindowsTmuxExecutor(itmuxPath);

        if (!executor.isAvailable()) {
            throw new RuntimeException("itmux is installed but tmux is not working properly at: " + itmuxPath);
        }

        String version = executor.getVersion();
        log.info("itmux tmux version: {}", version);

        return executor;
    }

    /**
     * Check if the current platform is Windows.
     * @return true if running on Windows
     */
    public static boolean isWindows() {
        String os = System.getProperty("os.name");
        return os != null && os.toLowerCase().contains("win");
    }

    /**
     * Get platform name for logging.
     * @return Platform name
     */
    public static String getPlatformName() {
        if (isWindows()) {
            return "Windows";
        }
        String os = System.getProperty("os.name");
        if (os != null && os.toLowerCase().contains("mac")) {
            return "macOS";
        }
        return "Linux/Unix";
    }
}

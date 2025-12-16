package com.tmuxremote.agent.dto;

import lombok.Data;
import java.util.List;

@Data
public class AgentConfig {
    private String machineId;
    private String relay;
    private String token;  // Agent token for owner identification
    private List<SessionConfig> sessions;

    // API Configuration
    private ApiConfig api;

    @Data
    public static class SessionConfig {
        private String id;
        private String tmuxSession;
        private String label;
    }

    @Data
    public static class ApiConfig {
        private boolean enabled = false;
        private String agentId;  // Platform agent UUID for API routing
        private LlmConfig llm;
        private ExecConfig exec;
    }

    @Data
    public static class LlmConfig {
        private boolean enabled = false;
        private String provider = "ollama";  // ollama, openai, etc.
        private String baseUrl = "http://localhost:11434";  // Ollama default
        private String model = "llama2";
        private String apiKey;  // For OpenAI or other providers
    }

    @Data
    public static class ExecConfig {
        private boolean enabled = false;
        private String shell = "/bin/bash";
        private String workingDir;
        private List<String> allowedCommands;  // null = all allowed
        private int defaultTimeout = 30000;  // 30 seconds
    }
}

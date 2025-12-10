package com.tmuxremote.agent.dto;

import lombok.Data;
import java.util.List;

@Data
public class AgentConfig {
    private String machineId;
    private String relay;
    private String token;  // Agent token for owner identification
    private List<SessionConfig> sessions;

    @Data
    public static class SessionConfig {
        private String id;
        private String tmuxSession;
        private String label;
    }
}

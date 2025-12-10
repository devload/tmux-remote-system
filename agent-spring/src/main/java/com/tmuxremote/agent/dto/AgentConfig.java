package com.tmuxremote.agent.dto;

import lombok.Data;
import java.util.List;

@Data
public class AgentConfig {
    private String machineId;
    private String relay;
    private List<SessionConfig> sessions;

    @Data
    public static class SessionConfig {
        private String id;
        private String tmuxSession;
        private String label;
    }
}

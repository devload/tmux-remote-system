package com.tmuxremote.relay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfo {
    private String id;
    private String label;
    private String machineId;
    private String status;
    private WebSocketSession hostSession;
    private Set<WebSocketSession> viewers;

    public static SessionInfo create(String id, String label, String machineId, WebSocketSession hostSession) {
        return SessionInfo.builder()
                .id(id)
                .label(label)
                .machineId(machineId)
                .status("online")
                .hostSession(hostSession)
                .viewers(ConcurrentHashMap.newKeySet())
                .build();
    }
}

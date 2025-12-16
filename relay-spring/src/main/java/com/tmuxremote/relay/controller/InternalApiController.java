package com.tmuxremote.relay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.relay.dto.Message;
import com.tmuxremote.relay.service.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Internal API for Platform to forward requests to Agents
 */
@Slf4j
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalApiController {

    private final SessionManager sessionManager;
    private final ObjectMapper objectMapper;

    // Pending requests waiting for agent response
    private final Map<String, CompletableFuture<Map<String, Object>>> pendingRequests = new ConcurrentHashMap<>();

    /**
     * Forward a request to an agent and wait for response
     */
    @PostMapping("/forward")
    public ResponseEntity<Map<String, Object>> forwardToAgent(@RequestBody ForwardRequest request) {
        log.info("Forwarding request to agent: agentId={}, type={}", request.agentId(), request.type());

        // Generate request ID for correlation
        String requestId = UUID.randomUUID().toString();

        // Create a future to wait for the response
        CompletableFuture<Map<String, Object>> responseFuture = new CompletableFuture<>();
        pendingRequests.put(requestId, responseFuture);

        try {
            // Find the agent's WebSocket session and send the request
            boolean sent = sessionManager.sendToAgent(
                    request.agentId(),
                    Message.builder()
                            .type(request.type())
                            .meta(Map.of(
                                    "requestId", requestId,
                                    "payload", objectMapper.writeValueAsString(request.payload())
                            ))
                            .build()
            );

            if (!sent) {
                pendingRequests.remove(requestId);
                return ResponseEntity.status(503).body(Map.of(
                        "error", "agent_offline",
                        "message", "Agent is not connected"
                ));
            }

            // Wait for response with timeout (default 5 minutes for LLM calls)
            Map<String, Object> response = responseFuture.get(5, TimeUnit.MINUTES);
            return ResponseEntity.ok(response);

        } catch (TimeoutException e) {
            log.warn("Request to agent {} timed out", request.agentId());
            return ResponseEntity.status(504).body(Map.of(
                    "error", "timeout",
                    "message", "Agent did not respond in time"
            ));
        } catch (Exception e) {
            log.error("Failed to forward request to agent", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "internal_error",
                    "message", e.getMessage()
            ));
        } finally {
            pendingRequests.remove(requestId);
        }
    }

    /**
     * Called by SessionManager when agent sends a response
     */
    public void handleAgentResponse(String requestId, Map<String, Object> response) {
        CompletableFuture<Map<String, Object>> future = pendingRequests.get(requestId);
        if (future != null) {
            future.complete(response);
        } else {
            log.warn("Received response for unknown request: {}", requestId);
        }
    }

    /**
     * Check if an agent is connected
     */
    @GetMapping("/agents/{agentId}/status")
    public ResponseEntity<Map<String, Object>> getAgentStatus(@PathVariable String agentId) {
        boolean isConnected = sessionManager.isAgentConnected(agentId);
        return ResponseEntity.ok(Map.of(
                "agentId", agentId,
                "connected", isConnected
        ));
    }

    public record ForwardRequest(
            String agentId,
            String type,
            Map<String, Object> payload
    ) {}
}

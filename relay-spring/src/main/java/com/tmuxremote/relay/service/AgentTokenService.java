package com.tmuxremote.relay.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class AgentTokenService {

    private final RestTemplate restTemplate;
    private final String platformApiUrl;

    // Cache: agentToken -> AgentInfo (with TTL)
    private final Map<String, CachedAgentInfo> tokenCache = new ConcurrentHashMap<>();

    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    public AgentTokenService(
            @Value("${platform.api.url:http://localhost:8080}") String platformApiUrl
    ) {
        this.restTemplate = new RestTemplate();
        this.platformApiUrl = platformApiUrl;
    }

    /**
     * Agent info returned from token validation
     */
    public record AgentInfo(String email, String agentId) {}

    /**
     * Get agent info (email and agentId) by validating token against Platform API
     */
    public Optional<AgentInfo> getAgentInfoByToken(String token) {
        if (token == null || token.isEmpty()) {
            return Optional.empty();
        }

        // Check cache first
        CachedAgentInfo cached = tokenCache.get(token);
        if (cached != null && !cached.isExpired()) {
            return Optional.ofNullable(cached.agentInfo);
        }

        // Call Platform API to validate token
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    platformApiUrl + "/internal/validate-agent/" + token,
                    HttpMethod.GET,
                    HttpEntity.EMPTY,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String email = (String) body.get("userEmail");
                String agentId = body.get("agentId") != null ? body.get("agentId").toString() : null;

                if (email != null) {
                    AgentInfo agentInfo = new AgentInfo(email, agentId);
                    tokenCache.put(token, new CachedAgentInfo(agentInfo, System.currentTimeMillis()));
                    log.debug("Token validated: {} -> email={}, agentId={}",
                            token.substring(0, Math.min(12, token.length())) + "...", email, agentId);
                    return Optional.of(agentInfo);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to validate token with Platform: {}", e.getMessage());
        }

        // Cache negative result too
        tokenCache.put(token, new CachedAgentInfo(null, System.currentTimeMillis()));
        return Optional.empty();
    }

    /**
     * Get owner email by validating token against Platform API
     * @deprecated Use getAgentInfoByToken() instead
     */
    public Optional<String> getOwnerByToken(String token) {
        return getAgentInfoByToken(token).map(AgentInfo::email);
    }

    public boolean validateToken(String token) {
        return getAgentInfoByToken(token).isPresent();
    }

    /**
     * Clear cache for testing
     */
    public void clearCache() {
        tokenCache.clear();
    }

    private record CachedAgentInfo(AgentInfo agentInfo, long cachedAt) {
        boolean isExpired() {
            return System.currentTimeMillis() - cachedAt > CACHE_TTL_MS;
        }
    }
}

package com.tmuxremote.relay.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RelayAliasService {

    private final RestTemplate restTemplate;
    private final String platformApiUrl;

    // Cache alias -> AliasInfo for performance
    private final Map<String, AliasInfo> aliasCache = new ConcurrentHashMap<>();

    public RelayAliasService(
            @Value("${platform.api.url:http://localhost:8080}") String platformApiUrl
    ) {
        this.restTemplate = new RestTemplate();
        this.platformApiUrl = platformApiUrl;
    }

    /**
     * Extract relay alias from Host header
     * e.g., "a3x9k2m.relay.sessioncast.io" -> "a3x9k2m"
     */
    public String extractAliasFromHost(String host) {
        if (host == null || host.isEmpty()) {
            return null;
        }

        // Remove port if present
        String hostWithoutPort = host.split(":")[0];

        // Check if it's a subdomain of relay.sessioncast.io
        if (hostWithoutPort.endsWith(".relay.sessioncast.io")) {
            String subdomain = hostWithoutPort.replace(".relay.sessioncast.io", "");
            // Validate format: 6-12 alphanumeric characters
            if (subdomain.matches("^[a-z0-9]{6,12}$")) {
                return subdomain;
            }
        }

        return null;
    }

    /**
     * Validate alias and get user info from Platform API
     */
    public AliasInfo validateAlias(String alias) {
        if (alias == null || alias.isEmpty()) {
            return null;
        }

        // Check cache first
        AliasInfo cached = aliasCache.get(alias);
        if (cached != null && !cached.isExpired()) {
            return cached.valid ? cached : null;
        }

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    platformApiUrl + "/internal/relay-alias/" + alias,
                    HttpMethod.GET,
                    HttpEntity.EMPTY,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean valid = (Boolean) body.getOrDefault("valid", false);

                AliasInfo info;
                if (valid) {
                    info = new AliasInfo(
                            true,
                            body.get("userId") != null ? UUID.fromString((String) body.get("userId")) : null,
                            (String) body.get("email"),
                            (String) body.get("plan"),
                            body.get("maxSessions") != null ? ((Number) body.get("maxSessions")).intValue() : -1,
                            body.get("maxAgents") != null ? ((Number) body.get("maxAgents")).intValue() : -1,
                            System.currentTimeMillis()
                    );
                } else {
                    info = new AliasInfo(false, null, null, null, -1, -1, System.currentTimeMillis());
                }

                aliasCache.put(alias, info);
                return info.valid ? info : null;
            }
        } catch (Exception e) {
            log.warn("Failed to validate alias {}: {}", alias, e.getMessage());
        }

        return null;
    }

    /**
     * Get cached alias info or validate if not cached
     */
    public AliasInfo getAliasInfo(String alias) {
        return validateAlias(alias);
    }

    /**
     * Clear cache for a specific alias
     */
    public void invalidateCache(String alias) {
        aliasCache.remove(alias);
    }

    public record AliasInfo(
            boolean valid,
            UUID userId,
            String email,
            String plan,
            int maxSessions,
            int maxAgents,
            long cachedAt
    ) {
        private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

        public boolean isExpired() {
            return System.currentTimeMillis() - cachedAt > CACHE_TTL_MS;
        }

        public boolean isUnlimited() {
            return maxSessions == -1;
        }

        public boolean isPlusPlan() {
            return "plus".equals(plan) || "team".equals(plan);
        }
    }
}

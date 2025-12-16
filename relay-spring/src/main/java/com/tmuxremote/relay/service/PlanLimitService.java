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

@Slf4j
@Service
public class PlanLimitService {

    private final RestTemplate restTemplate;
    private final String platformApiUrl;

    public PlanLimitService(
            @Value("${platform.api.url:http://localhost:8080}") String platformApiUrl
    ) {
        this.restTemplate = new RestTemplate();
        this.platformApiUrl = platformApiUrl;
    }

    /**
     * Check if user can create/join more sessions
     * @return PlanCheckResult with allowed status and message
     */
    public PlanCheckResult checkSessionLimit(String userToken) {
        if (userToken == null || userToken.isEmpty()) {
            return PlanCheckResult.allow(); // Allow anonymous for backward compatibility
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(userToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    platformApiUrl + "/api/usage/check-limit/sessions",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean allowed = (Boolean) body.getOrDefault("allowed", true);
                int remaining = body.get("remaining") != null ? ((Number) body.get("remaining")).intValue() : -1;

                if (!allowed) {
                    return PlanCheckResult.deny(
                            "세션 제한에 도달했습니다. 더 많은 세션을 사용하려면 Pro 플랜으로 업그레이드하세요.",
                            "Session limit reached. Upgrade to Pro plan for more sessions.",
                            remaining
                    );
                }
                return PlanCheckResult.allow(remaining);
            }
        } catch (Exception e) {
            log.warn("Failed to check plan limit, allowing by default: {}", e.getMessage());
        }

        return PlanCheckResult.allow(); // Allow on error for better UX
    }

    /**
     * Check if user can register more agents
     */
    public PlanCheckResult checkAgentLimit(String userToken) {
        if (userToken == null || userToken.isEmpty()) {
            return PlanCheckResult.allow();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(userToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    platformApiUrl + "/api/usage/check-limit/agents",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean allowed = (Boolean) body.getOrDefault("allowed", true);
                int remaining = body.get("remaining") != null ? ((Number) body.get("remaining")).intValue() : -1;

                if (!allowed) {
                    return PlanCheckResult.deny(
                            "에이전트 제한에 도달했습니다. 더 많은 에이전트를 사용하려면 Pro 플랜으로 업그레이드하세요.",
                            "Agent limit reached. Upgrade to Pro plan for more agents.",
                            remaining
                    );
                }
                return PlanCheckResult.allow(remaining);
            }
        } catch (Exception e) {
            log.warn("Failed to check agent limit, allowing by default: {}", e.getMessage());
        }

        return PlanCheckResult.allow();
    }

    /**
     * Get max sessions limit for a user by email
     * Returns -1 for unlimited, default to 1 (free tier) on error
     */
    public int getMaxSessionsForUser(String userEmail) {
        if (userEmail == null || userEmail.isEmpty()) {
            return 1; // Default to free tier
        }

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    platformApiUrl + "/internal/plan-limit?email=" + userEmail,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object maxSessions = body.get("maxSessions");
                if (maxSessions != null) {
                    return ((Number) maxSessions).intValue();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get plan limit for user {}, using default: {}", userEmail, e.getMessage());
        }

        return 1; // Default to free tier limit
    }

    public record PlanCheckResult(
            boolean allowed,
            String messageKo,
            String messageEn,
            int remaining
    ) {
        public static PlanCheckResult allow() {
            return new PlanCheckResult(true, null, null, -1);
        }

        public static PlanCheckResult allow(int remaining) {
            return new PlanCheckResult(true, null, null, remaining);
        }

        public static PlanCheckResult deny(String messageKo, String messageEn, int remaining) {
            return new PlanCheckResult(false, messageKo, messageEn, remaining);
        }

        public boolean isAllowed() {
            return allowed;
        }

        public String getMessage(String lang) {
            if ("ko".equals(lang)) {
                return messageKo != null ? messageKo : messageEn;
            }
            return messageEn != null ? messageEn : messageKo;
        }
    }
}

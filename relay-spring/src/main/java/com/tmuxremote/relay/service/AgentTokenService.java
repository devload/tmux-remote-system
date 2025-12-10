package com.tmuxremote.relay.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AgentTokenService {

    // agentToken -> ownerEmail
    private final Map<String, String> tokenToOwner = new ConcurrentHashMap<>();

    // ownerEmail -> Set<agentToken>
    private final Map<String, Set<String>> ownerToTokens = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateToken(String ownerEmail) {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        String token = "agt_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenToOwner.put(token, ownerEmail);
        ownerToTokens.computeIfAbsent(ownerEmail, k -> ConcurrentHashMap.newKeySet()).add(token);

        log.info("Agent token generated for owner: {}", ownerEmail);
        return token;
    }

    public boolean validateToken(String token) {
        return tokenToOwner.containsKey(token);
    }

    public Optional<String> getOwnerByToken(String token) {
        return Optional.ofNullable(tokenToOwner.get(token));
    }

    public Set<String> getTokensByOwner(String ownerEmail) {
        return ownerToTokens.getOrDefault(ownerEmail, Set.of());
    }

    public boolean revokeToken(String token, String ownerEmail) {
        String actualOwner = tokenToOwner.get(token);
        if (actualOwner != null && actualOwner.equals(ownerEmail)) {
            tokenToOwner.remove(token);
            Set<String> tokens = ownerToTokens.get(ownerEmail);
            if (tokens != null) {
                tokens.remove(token);
            }
            log.info("Agent token revoked: {} by {}", token.substring(0, 12) + "...", ownerEmail);
            return true;
        }
        return false;
    }

    public Set<String> getOwnerTokenPrefixes(String ownerEmail) {
        return getTokensByOwner(ownerEmail).stream()
                .map(t -> t.substring(0, Math.min(t.length(), 16)) + "...")
                .collect(Collectors.toSet());
    }
}

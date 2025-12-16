package com.tmuxremote.relay.config;

import com.tmuxremote.relay.handler.RelayWebSocketHandler;
import com.tmuxremote.relay.service.RelayAliasService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import java.util.Map;

@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final RelayWebSocketHandler relayWebSocketHandler;
    private final RelayAliasService relayAliasService;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(relayWebSocketHandler, "/ws")
                .addInterceptors(relayAliasInterceptor())
                .setAllowedOrigins("*");
    }

    @Bean
    public HandshakeInterceptor relayAliasInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                          WebSocketHandler wsHandler, Map<String, Object> attributes) {
                // Extract Host header
                String host = request.getHeaders().getFirst("Host");
                String alias = relayAliasService.extractAliasFromHost(host);

                if (alias != null) {
                    // Validate alias and get user info
                    RelayAliasService.AliasInfo aliasInfo = relayAliasService.validateAlias(alias);
                    if (aliasInfo != null) {
                        attributes.put("relayAlias", alias);
                        attributes.put("aliasOwnerEmail", aliasInfo.email());
                        attributes.put("aliasOwnerId", aliasInfo.userId());
                        attributes.put("aliasOwnerPlan", aliasInfo.plan());
                        attributes.put("maxSessions", aliasInfo.maxSessions());
                        attributes.put("maxAgents", aliasInfo.maxAgents());
                        log.debug("WebSocket connection for alias={}, owner={}, plan={}",
                                alias, aliasInfo.email(), aliasInfo.plan());
                    } else {
                        log.warn("Invalid relay alias: {}", alias);
                        // Still allow connection - will be validated later
                        attributes.put("invalidAlias", alias);
                    }
                }

                return true; // Allow connection to proceed
            }

            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                      WebSocketHandler wsHandler, Exception exception) {
                // No action needed after handshake
            }
        };
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        // Reduced buffer sizes for lower memory usage (screen data is typically ~50KB compressed)
        container.setMaxTextMessageBufferSize(256 * 1024);   // 256KB (was 1MB)
        container.setMaxBinaryMessageBufferSize(256 * 1024); // 256KB (was 1MB)
        // Set idle timeout - close inactive connections after 5 minutes
        container.setMaxSessionIdleTimeout(300000L);         // 5 minutes
        // Set async send timeout
        container.setAsyncSendTimeout(30000L);               // 30 seconds
        return container;
    }
}

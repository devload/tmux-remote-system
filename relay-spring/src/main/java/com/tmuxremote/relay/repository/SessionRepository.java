package com.tmuxremote.relay.repository;

import com.tmuxremote.relay.dto.SessionRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class SessionRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${dynamodb.table.sessions:sessioncast-sessions}")
    private String tableName;

    private DynamoDbTable<SessionRecord> sessionTable;
    private DynamoDbIndex<SessionRecord> ownerEmailIndex;

    public SessionRepository(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    @PostConstruct
    public void init() {
        this.sessionTable = enhancedClient.table(tableName, TableSchema.fromBean(SessionRecord.class));
        this.ownerEmailIndex = sessionTable.index("ownerEmail-index");
        log.info("SessionRepository initialized with table: {}", tableName);
    }

    /**
     * Save or update a session record
     */
    public void save(SessionRecord record) {
        try {
            record.setLastUpdated(Instant.now());
            sessionTable.putItem(record);
            log.debug("Saved session: {}", record.getSessionId());
        } catch (Exception e) {
            log.error("Failed to save session: {}", record.getSessionId(), e);
        }
    }

    /**
     * Find a session by ID
     */
    public Optional<SessionRecord> findById(String sessionId) {
        try {
            Key key = Key.builder().partitionValue(sessionId).build();
            SessionRecord record = sessionTable.getItem(key);
            return Optional.ofNullable(record);
        } catch (Exception e) {
            log.error("Failed to find session: {}", sessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Find all sessions for a specific owner
     */
    public List<SessionRecord> findByOwnerEmail(String ownerEmail) {
        try {
            QueryConditional queryConditional = QueryConditional
                    .keyEqualTo(Key.builder().partitionValue(ownerEmail).build());

            return ownerEmailIndex.query(queryConditional)
                    .stream()
                    .flatMap(page -> page.items().stream())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to find sessions for owner: {}", ownerEmail, e);
            return List.of();
        }
    }

    /**
     * Delete a session record
     */
    public void delete(String sessionId) {
        try {
            Key key = Key.builder().partitionValue(sessionId).build();
            sessionTable.deleteItem(key);
            log.debug("Deleted session: {}", sessionId);
        } catch (Exception e) {
            log.error("Failed to delete session: {}", sessionId, e);
        }
    }

    /**
     * Update session status
     */
    public void updateStatus(String sessionId, String status) {
        findById(sessionId).ifPresent(record -> {
            record.setStatus(status);
            save(record);
        });
    }

    /**
     * Update session label
     */
    public void updateLabel(String sessionId, String label) {
        findById(sessionId).ifPresent(record -> {
            record.setLabel(label);
            save(record);
        });
    }

    /**
     * Count online sessions for a specific owner
     */
    public int countOnlineSessionsByOwner(String ownerEmail) {
        return (int) findByOwnerEmail(ownerEmail).stream()
                .filter(record -> "online".equals(record.getStatus()))
                .count();
    }
}

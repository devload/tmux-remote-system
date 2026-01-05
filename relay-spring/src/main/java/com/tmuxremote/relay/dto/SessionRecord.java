package com.tmuxremote.relay.dto;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;

import java.time.Instant;

/**
 * DynamoDB entity for session persistence.
 * Stores session metadata that survives container restarts.
 */
@DynamoDbBean
public class SessionRecord {

    private String sessionId;
    private String label;
    private String machineId;
    private String ownerEmail;
    private String status;
    private Instant lastUpdated;
    private Instant createdAt;

    public SessionRecord() {}

    public static SessionRecord from(SessionInfo sessionInfo) {
        SessionRecord record = new SessionRecord();
        record.setSessionId(sessionInfo.getId());
        record.setLabel(sessionInfo.getLabel());
        record.setMachineId(sessionInfo.getMachineId());
        record.setOwnerEmail(sessionInfo.getOwnerEmail());
        record.setStatus(sessionInfo.getStatus());
        record.setLastUpdated(Instant.now());
        if (record.getCreatedAt() == null) {
            record.setCreatedAt(Instant.now());
        }
        return record;
    }

    @DynamoDbPartitionKey
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getMachineId() {
        return machineId;
    }

    public void setMachineId(String machineId) {
        this.machineId = machineId;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "ownerEmail-index")
    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

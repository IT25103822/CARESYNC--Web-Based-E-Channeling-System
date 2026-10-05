package com.sliit.echanneling.audit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * System Audit Log Entity for tracking all activities across the platform.
 */
@Entity
@Table(name = "SystemLogs")
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LogId")
    private Integer logId;

    @Column(name = "UserId")
    private Integer userId;

    @Column(name = "PerformerName", nullable = false, length = 150)
    private String performerName;

    @Column(name = "PerformerRole", nullable = false, length = 60)
    private String performerRole;

    @Column(name = "ActionType", nullable = false, length = 80)
    private String actionType;

    @Column(name = "EntityName", nullable = false, length = 60)
    private String entityName;

    @Column(name = "EntityId")
    private Integer entityId;

    @Column(name = "Description", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String description;

    @Column(name = "Severity", nullable = false, length = 20)
    private String severity; // INFO, SUCCESS, WARNING, CRITICAL

    @Column(name = "IpAddress", length = 50)
    private String ipAddress;

    @Column(name = "Timestamp", nullable = false)
    private LocalDateTime timestamp;

    public SystemLog() {
        this.timestamp = LocalDateTime.now();
        this.severity = "INFO";
        this.ipAddress = "127.0.0.1";
    }

    public SystemLog(Integer userId, String performerName, String performerRole, String actionType,
                     String entityName, Integer entityId, String description, String severity, String ipAddress) {
        this.userId = userId;
        this.performerName = performerName != null ? performerName : "System";
        this.performerRole = performerRole != null ? performerRole : "SYSTEM";
        this.actionType = actionType;
        this.entityName = entityName != null ? entityName : "General";
        this.entityId = entityId;
        this.description = description;
        this.severity = severity != null ? severity : "INFO";
        this.ipAddress = ipAddress != null ? ipAddress : "127.0.0.1";
        this.timestamp = LocalDateTime.now();
    }

    public Integer getLogId() {
        return logId;
    }

    public void setLogId(Integer logId) {
        this.logId = logId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getPerformerName() {
        return performerName;
    }

    public void setPerformerName(String performerName) {
        this.performerName = performerName;
    }

    public String getPerformerRole() {
        return performerRole;
    }

    public void setPerformerRole(String performerRole) {
        this.performerRole = performerRole;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

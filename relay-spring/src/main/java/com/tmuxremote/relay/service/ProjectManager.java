package com.tmuxremote.relay.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.relay.dto.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectManager {

    private final ObjectMapper objectMapper;

    // projectId -> ProjectInfo
    private final Map<String, ProjectInfo> projects = new ConcurrentHashMap<>();

    // projectId -> WebSocketSession (project owner/CLI)
    private final Map<String, WebSocketSession> projectSessions = new ConcurrentHashMap<>();

    // wsSessionId -> projectId (reverse lookup)
    private final Map<String, String> sessionToProject = new ConcurrentHashMap<>();

    // ownerEmail -> Set<projectId>
    private final Map<String, Set<String>> ownerProjects = new ConcurrentHashMap<>();

    public record ProjectInfo(
            String projectId,
            String name,
            String path,
            String ownerEmail,
            String status,
            String mission,
            List<SourceInfo> sources,
            List<AgentInfo> agents,
            String createdAt
    ) {}

    public record SourceInfo(
            String folder,
            int fileCount
    ) {}

    public record AgentInfo(
            String id,
            String name,
            String status
    ) {}

    /**
     * Register a project from CLI
     */
    public void registerProject(WebSocketSession session, String projectId, String name,
                                String path, String ownerEmail, Map<String, String> meta) {
        String status = meta != null ? meta.getOrDefault("status", "pending") : "pending";
        String mission = meta != null ? meta.get("mission") : null;
        String createdAt = meta != null ? meta.getOrDefault("createdAt", new Date().toString()) : new Date().toString();

        // Parse sources from meta
        List<SourceInfo> sources = new ArrayList<>();
        if (meta != null && meta.containsKey("sources")) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sourcesList = objectMapper.readValue(
                        meta.get("sources"), List.class);
                for (Map<String, Object> src : sourcesList) {
                    sources.add(new SourceInfo(
                            (String) src.get("folder"),
                            ((Number) src.getOrDefault("fileCount", 0)).intValue()
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to parse sources: {}", e.getMessage());
            }
        }

        // Parse agents from meta
        List<AgentInfo> agents = new ArrayList<>();
        if (meta != null && meta.containsKey("agents")) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> agentsList = objectMapper.readValue(
                        meta.get("agents"), List.class);
                for (Map<String, Object> agent : agentsList) {
                    agents.add(new AgentInfo(
                            (String) agent.get("id"),
                            (String) agent.get("name"),
                            (String) agent.getOrDefault("status", "pending")
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to parse agents: {}", e.getMessage());
            }
        }

        // Default PM agent if no agents specified
        if (agents.isEmpty()) {
            agents.add(new AgentInfo("pm", "PM", "pending"));
        }

        ProjectInfo projectInfo = new ProjectInfo(
                projectId, name, path, ownerEmail, status, mission, sources, agents, createdAt
        );

        projects.put(projectId, projectInfo);
        projectSessions.put(projectId, session);
        sessionToProject.put(session.getId(), projectId);

        ownerProjects.computeIfAbsent(ownerEmail, k -> ConcurrentHashMap.newKeySet()).add(projectId);

        log.info("Project registered: id={}, name={}, owner={}, sources={}, agents={}",
                projectId, name, ownerEmail, sources.size(), agents.size());
    }

    /**
     * Update project status
     */
    public void updateProjectStatus(String projectId, String status, Map<String, String> meta) {
        ProjectInfo existing = projects.get(projectId);
        if (existing == null) {
            log.warn("Project not found for status update: {}", projectId);
            return;
        }

        String newMission = meta != null ? meta.getOrDefault("mission", existing.mission()) : existing.mission();

        // Parse updated sources
        List<SourceInfo> newSources = existing.sources();
        if (meta != null && meta.containsKey("sources")) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sourcesList = objectMapper.readValue(
                        meta.get("sources"), List.class);
                newSources = new ArrayList<>();
                for (Map<String, Object> src : sourcesList) {
                    newSources.add(new SourceInfo(
                            (String) src.get("folder"),
                            ((Number) src.getOrDefault("fileCount", 0)).intValue()
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to parse sources in status update: {}", e.getMessage());
            }
        }

        // Parse updated agents
        List<AgentInfo> newAgents = existing.agents();
        if (meta != null && meta.containsKey("agents")) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> agentsList = objectMapper.readValue(
                        meta.get("agents"), List.class);
                newAgents = new ArrayList<>();
                for (Map<String, Object> agent : agentsList) {
                    newAgents.add(new AgentInfo(
                            (String) agent.get("id"),
                            (String) agent.get("name"),
                            (String) agent.getOrDefault("status", "pending")
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to parse agents in status update: {}", e.getMessage());
            }
        }

        ProjectInfo updated = new ProjectInfo(
                existing.projectId(),
                existing.name(),
                existing.path(),
                existing.ownerEmail(),
                status,
                newMission,
                newSources,
                newAgents,
                existing.createdAt()
        );

        projects.put(projectId, updated);
        log.debug("Project status updated: id={}, status={}", projectId, status);
    }

    /**
     * Get projects for a specific owner
     */
    public List<ProjectInfo> getProjectsByOwner(String ownerEmail) {
        Set<String> projectIds = ownerProjects.get(ownerEmail);
        if (projectIds == null || projectIds.isEmpty()) {
            return List.of();
        }

        return projectIds.stream()
                .map(projects::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Send project list to a viewer session
     */
    public void sendProjectList(WebSocketSession session, String ownerEmail) {
        List<ProjectInfo> projectList = getProjectsByOwner(ownerEmail);

        List<Map<String, Object>> projectsData = projectList.stream()
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("projectId", p.projectId());
                    data.put("name", p.name());
                    data.put("path", p.path());
                    data.put("status", p.status());
                    data.put("mission", p.mission());
                    data.put("sources", p.sources().stream()
                            .map(s -> Map.of("folder", s.folder(), "fileCount", s.fileCount()))
                            .collect(Collectors.toList()));
                    data.put("agents", p.agents().stream()
                            .map(a -> Map.of("id", a.id(), "name", a.name(), "status", a.status()))
                            .collect(Collectors.toList()));
                    data.put("createdAt", p.createdAt());
                    return data;
                })
                .collect(Collectors.toList());

        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "projectList",
                    "payload", objectMapper.writeValueAsString(projectsData)
            ));

            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }
            log.debug("Sent project list to session {}: {} projects", session.getId(), projectsData.size());
        } catch (IOException e) {
            log.error("Failed to send project list", e);
        }
    }

    /**
     * Forward addSource request to project CLI
     */
    public void forwardAddSource(String projectId, String ownerEmail, Map<String, String> meta,
                                  WebSocketSession viewerSession) {
        ProjectInfo project = projects.get(projectId);
        if (project == null) {
            sendError(viewerSession, "PROJECT_NOT_FOUND", "Project not found: " + projectId);
            return;
        }

        if (!project.ownerEmail().equals(ownerEmail)) {
            sendError(viewerSession, "PERMISSION_DENIED", "Not authorized to modify this project");
            return;
        }

        WebSocketSession cliSession = projectSessions.get(projectId);
        if (cliSession == null || !cliSession.isOpen()) {
            sendError(viewerSession, "PROJECT_OFFLINE", "Project CLI is not connected");
            return;
        }

        try {
            Message forwardMessage = Message.builder()
                    .type("addSource")
                    .meta(meta)
                    .build();

            String json = objectMapper.writeValueAsString(forwardMessage);
            synchronized (cliSession) {
                if (cliSession.isOpen()) {
                    cliSession.sendMessage(new TextMessage(json));
                }
            }
            log.info("Forwarded addSource to project {}: {}", projectId, meta.get("sourceType"));
        } catch (IOException e) {
            log.error("Failed to forward addSource", e);
            sendError(viewerSession, "FORWARD_FAILED", "Failed to forward request to CLI");
        }
    }

    /**
     * Forward analyzeMission request to project CLI
     */
    public void forwardAnalyzeMission(String projectId, String ownerEmail, Map<String, String> meta,
                                       WebSocketSession viewerSession) {
        ProjectInfo project = projects.get(projectId);
        if (project == null) {
            sendError(viewerSession, "PROJECT_NOT_FOUND", "Project not found: " + projectId);
            return;
        }

        if (!project.ownerEmail().equals(ownerEmail)) {
            sendError(viewerSession, "PERMISSION_DENIED", "Not authorized to access this project");
            return;
        }

        WebSocketSession cliSession = projectSessions.get(projectId);
        if (cliSession == null || !cliSession.isOpen()) {
            sendError(viewerSession, "PROJECT_OFFLINE", "Project CLI is not connected");
            return;
        }

        try {
            // Include viewer session ID so CLI can send response back
            Map<String, String> forwardMeta = new HashMap<>(meta);
            forwardMeta.put("viewerSessionId", viewerSession.getId());

            Message forwardMessage = Message.builder()
                    .type("analyzeMission")
                    .meta(forwardMeta)
                    .build();

            String json = objectMapper.writeValueAsString(forwardMessage);
            synchronized (cliSession) {
                if (cliSession.isOpen()) {
                    cliSession.sendMessage(new TextMessage(json));
                }
            }
            log.info("Forwarded analyzeMission to project {}", projectId);
        } catch (IOException e) {
            log.error("Failed to forward analyzeMission", e);
            sendError(viewerSession, "FORWARD_FAILED", "Failed to forward request to CLI");
        }
    }

    /**
     * Forward startWorkflow request to project CLI
     */
    public void forwardStartWorkflow(String projectId, String ownerEmail, Map<String, String> meta,
                                      WebSocketSession viewerSession) {
        ProjectInfo project = projects.get(projectId);
        if (project == null) {
            sendError(viewerSession, "PROJECT_NOT_FOUND", "Project not found: " + projectId);
            return;
        }

        if (!project.ownerEmail().equals(ownerEmail)) {
            sendError(viewerSession, "PERMISSION_DENIED", "Not authorized to control this project");
            return;
        }

        WebSocketSession cliSession = projectSessions.get(projectId);
        if (cliSession == null || !cliSession.isOpen()) {
            sendError(viewerSession, "PROJECT_OFFLINE", "Project CLI is not connected");
            return;
        }

        try {
            Message forwardMessage = Message.builder()
                    .type("startWorkflow")
                    .meta(meta)
                    .build();

            String json = objectMapper.writeValueAsString(forwardMessage);
            synchronized (cliSession) {
                if (cliSession.isOpen()) {
                    cliSession.sendMessage(new TextMessage(json));
                }
            }
            log.info("Forwarded startWorkflow to project {}", projectId);
        } catch (IOException e) {
            log.error("Failed to forward startWorkflow", e);
            sendError(viewerSession, "FORWARD_FAILED", "Failed to forward request to CLI");
        }
    }

    /**
     * Handle project disconnect
     */
    public void handleDisconnect(WebSocketSession session) {
        String projectId = sessionToProject.remove(session.getId());
        if (projectId != null) {
            projectSessions.remove(projectId);

            // Update status to offline
            ProjectInfo existing = projects.get(projectId);
            if (existing != null) {
                ProjectInfo updated = new ProjectInfo(
                        existing.projectId(),
                        existing.name(),
                        existing.path(),
                        existing.ownerEmail(),
                        "offline",
                        existing.mission(),
                        existing.sources(),
                        existing.agents(),
                        existing.createdAt()
                );
                projects.put(projectId, updated);
            }

            log.info("Project disconnected: {}", projectId);
        }
    }

    /**
     * Get project CLI session for forwarding responses
     */
    public WebSocketSession getProjectSession(String projectId) {
        return projectSessions.get(projectId);
    }

    private void sendError(WebSocketSession session, String code, String message) {
        try {
            Message errorMessage = Message.builder()
                    .type("error")
                    .meta(Map.of("code", code, "message", message))
                    .build();

            String json = objectMapper.writeValueAsString(errorMessage);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }
        } catch (IOException e) {
            log.error("Failed to send error message", e);
        }
    }
}

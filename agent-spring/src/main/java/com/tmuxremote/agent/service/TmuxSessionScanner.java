package com.tmuxremote.agent.service;

import com.tmuxremote.agent.service.tmux.TmuxExecutor;
import com.tmuxremote.agent.service.tmux.TmuxExecutorFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
public class TmuxSessionScanner {

    private final TmuxExecutorFactory executorFactory;

    public TmuxSessionScanner(TmuxExecutorFactory executorFactory) {
        this.executorFactory = executorFactory;
    }

    public Set<String> scanSessions() {
        try {
            TmuxExecutor executor = executorFactory.getExecutor();
            return new HashSet<>(executor.listSessions());
        } catch (Exception e) {
            log.error("Failed to scan tmux sessions", e);
            return new HashSet<>();
        }
    }
}

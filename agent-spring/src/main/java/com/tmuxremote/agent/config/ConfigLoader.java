package com.tmuxremote.agent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.tmuxremote.agent.dto.AgentConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component
public class ConfigLoader {

    private static final String DEFAULT_CONFIG_PATH = ".tmux-remote.yml";
    private final ObjectMapper yamlMapper;

    public ConfigLoader() {
        this.yamlMapper = new ObjectMapper(new YAMLFactory());
    }

    public AgentConfig loadConfig() throws IOException {
        Path configPath = resolveConfigPath();
        log.info("Loading configuration from: {}", configPath);

        File configFile = configPath.toFile();
        if (!configFile.exists()) {
            throw new IOException("Configuration file not found: " + configPath);
        }

        return yamlMapper.readValue(configFile, AgentConfig.class);
    }

    private Path resolveConfigPath() {
        String customPath = System.getenv("TMUX_REMOTE_CONFIG");
        if (customPath != null && !customPath.isEmpty()) {
            return Paths.get(customPath);
        }

        String userHome = System.getProperty("user.home");
        return Paths.get(userHome, DEFAULT_CONFIG_PATH);
    }
}

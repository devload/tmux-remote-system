export interface SessionInfo {
  id: string;
  label: string;
  machineId: string;
  status: 'online' | 'offline';
}

export interface Message {
  type: string;
  role?: string;
  session?: string;
  payload?: string;
  meta?: Record<string, string>;
  sessions?: SessionInfo[];
  status?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface PlanLimitError {
  code: 'PLAN_LIMIT_EXCEEDED';
  messageKo: string;
  messageEn: string;
  upgradeUrl: string;
}

// Project Status Types
export type ProjectStatus = 'initializing' | 'ready' | 'running' | 'completed' | 'failed' | 'offline';
export type AgentExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';
export type WorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

// Source Info
export interface SourceInfo {
  folder: string;
  fileCount: number;
}

// Agent Info with execution details
export interface AgentInfo {
  id: string;
  name: string;
  workDir: string;
  tasks: string[];
  dependsOn: string[];
  status: AgentExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  currentTask?: string;
  progress?: string;
  output?: string;
  error?: string;
  retryCount?: number;
}

// Workflow Info
export interface WorkflowInfo {
  name: string;
  mission: string;
  status: WorkflowExecutionStatus;
  startedAt?: string;
  completedAt?: string;
}

// Project Info (extended)
export interface ProjectInfo {
  projectId: string;
  name: string;
  path: string;
  status: ProjectStatus;
  mission?: string;
  sources?: SourceInfo[];
  agents?: AgentInfo[];
  workflow?: WorkflowInfo;
  createdAt: string;
}

// Project Status Update (WebSocket)
export interface ProjectStatusUpdate {
  projectId: string;
  status: ProjectStatus;
  mission?: string;
  sources?: SourceInfo[];
  agents?: AgentInfo[];
  workflow?: WorkflowInfo;
}

// Agent Status Update (WebSocket)
export interface AgentStatusUpdate {
  projectId: string;
  agentId: string;
  status: AgentExecutionStatus;
  currentTask?: string;
  progress?: string;
  output?: string;
  error?: string;
}

// Agent Output (WebSocket)
export interface AgentOutputData {
  projectId: string;
  agentId: string;
  output: string;
}

// Project Init Result (WebSocket)
export interface ProjectInitResult {
  projectId: string;
  success: boolean;
  error?: string;
}

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

export interface ProjectInfo {
  projectId: string;
  name: string;
  path: string;
  status: string;
  mission?: string;
  sources?: Array<{ folder: string; fileCount: number }>;
  agents?: Array<{ id: string; name: string; status: string }>;
  createdAt: string;
}

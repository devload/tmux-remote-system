import { useMemo } from 'react';
import { AgentInfo, AgentExecutionStatus } from '../types';
import { useLanguage } from '../i18n';
import './WorkflowGraph.css';

interface WorkflowGraphProps {
  agents: AgentInfo[];
  selectedAgentId?: string;
  onAgentSelect?: (agent: AgentInfo) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

// Calculate node positions using a layered layout based on dependencies
function calculateLayout(agents: AgentInfo[]): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  // Build dependency graph
  const agentMap = new Map(agents.map(a => [a.id, a]));
  const layers: string[][] = [];
  const assigned = new Set<string>();

  // Assign agents to layers based on dependencies
  while (assigned.size < agents.length) {
    const layer: string[] = [];

    for (const agent of agents) {
      if (assigned.has(agent.id)) continue;

      // Check if all dependencies are already assigned
      const deps = agent.dependsOn || [];
      const allDepsAssigned = deps.every(dep => assigned.has(dep) || !agentMap.has(dep));

      if (allDepsAssigned) {
        layer.push(agent.id);
      }
    }

    if (layer.length === 0) {
      // Handle circular dependencies by adding remaining agents
      for (const agent of agents) {
        if (!assigned.has(agent.id)) {
          layer.push(agent.id);
          break;
        }
      }
    }

    layer.forEach(id => assigned.add(id));
    layers.push(layer);
  }

  // Calculate positions
  const nodeWidth = 160;
  const nodeHeight = 70;
  const horizontalGap = 60;
  const verticalGap = 100;

  // Find max width
  let maxLayerWidth = 0;
  for (const layer of layers) {
    const width = layer.length * (nodeWidth + horizontalGap);
    if (width > maxLayerWidth) maxLayerWidth = width;
  }

  // Position nodes
  layers.forEach((layer, layerIndex) => {
    const totalWidth = layer.length * nodeWidth + (layer.length - 1) * horizontalGap;
    const startX = (maxLayerWidth - totalWidth) / 2;

    layer.forEach((agentId, nodeIndex) => {
      positions.set(agentId, {
        x: startX + nodeIndex * (nodeWidth + horizontalGap) + nodeWidth / 2,
        y: layerIndex * (nodeHeight + verticalGap) + nodeHeight / 2 + 40,
      });
    });
  });

  return positions;
}

const STATUS_COLORS: Record<AgentExecutionStatus, { stroke: string; fill: string }> = {
  pending: { stroke: '#484f58', fill: 'rgba(72, 79, 88, 0.2)' },
  running: { stroke: '#3a7bd5', fill: 'rgba(58, 123, 213, 0.2)' },
  completed: { stroke: '#238636', fill: 'rgba(35, 134, 54, 0.2)' },
  failed: { stroke: '#f85149', fill: 'rgba(248, 81, 73, 0.2)' },
};

export function WorkflowGraph({ agents, selectedAgentId, onAgentSelect }: WorkflowGraphProps) {
  const { lang } = useLanguage();

  const { positions, dimensions, edges } = useMemo(() => {
    const positions = calculateLayout(agents);

    // Calculate SVG dimensions
    let maxX = 300;
    let maxY = 200;
    positions.forEach(pos => {
      if (pos.x + 100 > maxX) maxX = pos.x + 100;
      if (pos.y + 50 > maxY) maxY = pos.y + 50;
    });

    // Generate edges
    const edges: Array<{ from: string; to: string }> = [];
    for (const agent of agents) {
      for (const dep of agent.dependsOn || []) {
        if (positions.has(dep)) {
          edges.push({ from: dep, to: agent.id });
        }
      }
    }

    return {
      positions,
      dimensions: { width: Math.max(maxX + 40, 400), height: maxY + 40 },
      edges,
    };
  }, [agents]);

  if (agents.length === 0) {
    return (
      <div className="workflow-graph-empty">
        <span>{lang === 'ko' ? '워크플로우가 정의되지 않았습니다' : 'No workflow defined'}</span>
      </div>
    );
  }

  const getAgentColors = (status: AgentExecutionStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  return (
    <div className="workflow-graph">
      <div className="graph-header">
        <span className="graph-icon">🔄</span>
        <span className="graph-title">{lang === 'ko' ? '워크플로우' : 'Workflow'}</span>
        <span className="graph-count">{agents.length} {lang === 'ko' ? '에이전트' : 'agents'}</span>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot pending"></span>
          <span>{lang === 'ko' ? '대기' : 'Pending'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot running"></span>
          <span>{lang === 'ko' ? '실행 중' : 'Running'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot completed"></span>
          <span>{lang === 'ko' ? '완료' : 'Completed'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot failed"></span>
          <span>{lang === 'ko' ? '실패' : 'Failed'}</span>
        </div>
      </div>

      <div className="graph-container">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="graph-svg"
        >
          <defs>
            <marker
              id="workflow-arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6e7681"
              />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(({ from, to }, index) => {
            const fromPos = positions.get(from);
            const toPos = positions.get(to);
            if (!fromPos || !toPos) return null;

            const isSelected = selectedAgentId === from || selectedAgentId === to;

            return (
              <line
                key={`edge-${index}`}
                x1={fromPos.x}
                y1={fromPos.y + 30}
                x2={toPos.x}
                y2={toPos.y - 30}
                className={`graph-edge ${isSelected ? 'highlighted' : ''}`}
                markerEnd="url(#workflow-arrowhead)"
              />
            );
          })}

          {/* Nodes */}
          {agents.map(agent => {
            const pos = positions.get(agent.id);
            if (!pos) return null;

            const isSelected = selectedAgentId === agent.id;
            const colors = getAgentColors(agent.status);
            const completedTasks = agent.tasks.filter((_, i) => {
              // Estimate completion based on currentTask
              if (!agent.currentTask) return agent.status === 'completed';
              const currentIndex = agent.tasks.indexOf(agent.currentTask);
              return i < currentIndex;
            }).length;
            const progress = agent.tasks.length > 0
              ? Math.round((completedTasks / agent.tasks.length) * 100)
              : 0;

            return (
              <g
                key={agent.id}
                className={`graph-node ${isSelected ? 'selected' : ''} ${agent.status === 'running' ? 'running' : ''}`}
                transform={`translate(${pos.x - 75}, ${pos.y - 30})`}
                onClick={() => onAgentSelect?.(agent)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width="150"
                  height="60"
                  rx="8"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x="75"
                  y="22"
                  textAnchor="middle"
                  className="node-name"
                  fill={colors.stroke}
                >
                  {agent.name.length > 18 ? agent.name.slice(0, 18) + '...' : agent.name}
                </text>
                <text
                  x="75"
                  y="40"
                  textAnchor="middle"
                  className="node-status"
                >
                  {agent.currentTask
                    ? (agent.currentTask.length > 20 ? agent.currentTask.slice(0, 20) + '...' : agent.currentTask)
                    : `${agent.tasks.length} tasks`
                  }
                </text>
                {agent.status === 'running' && (
                  <rect
                    x="10"
                    y="50"
                    width={130 * (progress / 100)}
                    height="4"
                    rx="2"
                    fill={colors.stroke}
                    opacity="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedAgentId && (
        <div className="agent-details">
          {(() => {
            const agent = agents.find(a => a.id === selectedAgentId);
            if (!agent) return null;
            return (
              <>
                <div className="detail-header">
                  <span className="detail-name">{agent.name}</span>
                  <span className={`detail-status ${agent.status}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="detail-tasks">
                  <span className="tasks-label">{lang === 'ko' ? '태스크' : 'Tasks'}:</span>
                  <ul className="tasks-list">
                    {agent.tasks.map((task, i) => (
                      <li key={i} className={agent.currentTask === task ? 'current' : ''}>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
                {agent.dependsOn && agent.dependsOn.length > 0 && (
                  <div className="detail-deps">
                    <span className="deps-label">{lang === 'ko' ? '의존' : 'Depends on'}:</span>
                    {agent.dependsOn.map(dep => (
                      <span key={dep} className="dep-chip">{dep}</span>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

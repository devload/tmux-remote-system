import { useMemo, useState } from 'react';
import './DependencyGraph.css';

interface Task {
  id: string;
  title: string;
  phase: number;
  sequence: number;
  dependencies: string[];
  parallel: boolean;
  status: 'pending' | 'in_progress' | 'completed';
}

interface DependencyGraphProps {
  tasksMd: string;
}

// Parse tasks.md content to extract task information
function parseTasksMd(tasksMd: string): Task[] {
  const tasks: Task[] = [];
  const lines = tasksMd.split('\n');

  let currentTask: Partial<Task> | null = null;

  for (const line of lines) {
    // Phase header: ## Phase 1: ... (used for visual grouping only)
    const phaseMatch = line.match(/^## Phase (\d+):/);
    if (phaseMatch) {
      continue;
    }

    // Task header: ### T-1.1: Task Title [P]
    const taskMatch = line.match(/^### (T-(\d+)\.(\d+)):\s*(.+?)(\s*\[P\])?\s*$/);
    if (taskMatch) {
      if (currentTask?.id) {
        tasks.push(currentTask as Task);
      }
      currentTask = {
        id: taskMatch[1],
        phase: parseInt(taskMatch[2], 10),
        sequence: parseInt(taskMatch[3], 10),
        title: taskMatch[4].trim(),
        parallel: !!taskMatch[5],
        dependencies: [],
        status: 'pending',
      };
      continue;
    }

    // Dependencies: - **Dependencies**: T-1.1, T-1.2
    const depsMatch = line.match(/^\s*-\s*\*\*Dependencies\*\*:\s*(.+)/i);
    if (depsMatch && currentTask) {
      const deps = depsMatch[1].split(',').map(d => d.trim()).filter(d => d && d !== 'None');
      currentTask.dependencies = deps;
      continue;
    }

    // Checklist status: - [x] T-1.1: ...
    const checkMatch = line.match(/^- \[([ x])\] (T-\d+\.\d+):/);
    if (checkMatch) {
      const taskId = checkMatch[2];
      const isCompleted = checkMatch[1] === 'x';
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = isCompleted ? 'completed' : 'pending';
      }
    }
  }

  if (currentTask?.id) {
    tasks.push(currentTask as Task);
  }

  return tasks;
}

// Calculate node positions using a simple layered layout
function calculateLayout(tasks: Task[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group by phase
  const phases = new Map<number, Task[]>();
  for (const task of tasks) {
    const phaseTasks = phases.get(task.phase) || [];
    phaseTasks.push(task);
    phases.set(task.phase, phaseTasks);
  }

  const nodeWidth = 140;
  const nodeHeight = 60;
  const horizontalGap = 40;
  const verticalGap = 80;

  let maxWidth = 0;
  const phaseNumbers = Array.from(phases.keys()).sort((a, b) => a - b);

  for (const phaseNum of phaseNumbers) {
    const phaseTasks = phases.get(phaseNum) || [];
    const width = phaseTasks.length * (nodeWidth + horizontalGap);
    if (width > maxWidth) maxWidth = width;
  }

  for (const phaseNum of phaseNumbers) {
    const phaseTasks = phases.get(phaseNum) || [];
    const totalWidth = phaseTasks.length * nodeWidth + (phaseTasks.length - 1) * horizontalGap;
    const startX = (maxWidth - totalWidth) / 2;

    phaseTasks.forEach((task, index) => {
      positions.set(task.id, {
        x: startX + index * (nodeWidth + horizontalGap) + nodeWidth / 2,
        y: (phaseNum - 1) * (nodeHeight + verticalGap) + nodeHeight / 2 + 40,
      });
    });
  }

  return positions;
}

export function DependencyGraph({ tasksMd }: DependencyGraphProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const { tasks, positions, dimensions } = useMemo(() => {
    const tasks = parseTasksMd(tasksMd);
    const positions = calculateLayout(tasks);

    // Calculate SVG dimensions
    let maxX = 200;
    let maxY = 200;
    positions.forEach(pos => {
      if (pos.x + 70 > maxX) maxX = pos.x + 70;
      if (pos.y + 40 > maxY) maxY = pos.y + 40;
    });

    return {
      tasks,
      positions,
      dimensions: { width: maxX + 40, height: maxY + 40 },
    };
  }, [tasksMd]);

  if (tasks.length === 0) {
    return (
      <div className="dependency-graph-empty">
        <span>No tasks found in the Speckit</span>
      </div>
    );
  }

  // Generate edges
  const edges: Array<{ from: string; to: string }> = [];
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      if (positions.has(dep)) {
        edges.push({ from: dep, to: task.id });
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#238636';
      case 'in_progress': return '#3a7bd5';
      default: return '#484f58';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'rgba(35, 134, 54, 0.2)';
      case 'in_progress': return 'rgba(58, 123, 213, 0.2)';
      default: return 'rgba(72, 79, 88, 0.2)';
    }
  };

  return (
    <div className="dependency-graph">
      <div className="graph-header">
        <span className="graph-icon">🔗</span>
        <span className="graph-title">Task Dependencies</span>
        <span className="graph-count">{tasks.length} tasks</span>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot pending"></span>
          <span>Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot in-progress"></span>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot completed"></span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-parallel">[P]</span>
          <span>Parallel</span>
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
              id="arrowhead"
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

            const isSelected = selectedTask === from || selectedTask === to;

            return (
              <line
                key={`edge-${index}`}
                x1={fromPos.x}
                y1={fromPos.y + 25}
                x2={toPos.x}
                y2={toPos.y - 25}
                className={`graph-edge ${isSelected ? 'highlighted' : ''}`}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Nodes */}
          {tasks.map(task => {
            const pos = positions.get(task.id);
            if (!pos) return null;

            const isSelected = selectedTask === task.id;

            return (
              <g
                key={task.id}
                className={`graph-node ${isSelected ? 'selected' : ''}`}
                transform={`translate(${pos.x - 65}, ${pos.y - 25})`}
                onClick={() => setSelectedTask(isSelected ? null : task.id)}
              >
                <rect
                  width="130"
                  height="50"
                  rx="8"
                  fill={getStatusBgColor(task.status)}
                  stroke={getStatusColor(task.status)}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x="65"
                  y="18"
                  textAnchor="middle"
                  className="node-id"
                  fill={getStatusColor(task.status)}
                >
                  {task.id}{task.parallel ? ' [P]' : ''}
                </text>
                <text
                  x="65"
                  y="36"
                  textAnchor="middle"
                  className="node-title"
                >
                  {task.title.length > 15 ? task.title.slice(0, 15) + '...' : task.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedTask && (
        <div className="task-details">
          {(() => {
            const task = tasks.find(t => t.id === selectedTask);
            if (!task) return null;
            return (
              <>
                <div className="detail-header">
                  <span className="detail-id">{task.id}</span>
                  <span className={`detail-status ${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.parallel && <span className="detail-parallel">[P]</span>}
                </div>
                <div className="detail-title">{task.title}</div>
                {task.dependencies.length > 0 && (
                  <div className="detail-deps">
                    <span className="deps-label">Depends on:</span>
                    {task.dependencies.map(dep => (
                      <span
                        key={dep}
                        className="dep-chip"
                        onClick={() => setSelectedTask(dep)}
                      >
                        {dep}
                      </span>
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

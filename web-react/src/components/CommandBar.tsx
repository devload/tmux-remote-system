import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import './CommandBar.css';

interface CommandBarProps {
  onSend: (command: string) => void;
  disabled: boolean;
}

// Check if it's a small mobile screen
const isSmallMobile = () => window.innerWidth <= 430;

// Command shortcuts
const COMMAND_SHORTCUTS = [
  { label: 'ls -la', cmd: 'ls -la\n' },
  { label: 'git status', cmd: 'git status\n' },
  { label: 'pwd', cmd: 'pwd\n' },
  { label: 'clear', cmd: 'clear\n' },
];

// Control keys
const CONTROL_KEYS = [
  { label: 'Ctrl+C', cmd: '\x03' },
  { label: 'Ctrl+D', cmd: '\x04' },
  { label: 'Ctrl+Z', cmd: '\x1a' },
];

// Special keys (for mobile - keys that can't be typed easily)
const SPECIAL_KEYS = [
  { label: 'ESC', cmd: '\x1b', icon: '⎋' },
  { label: '↑', cmd: '\x1b[A', icon: '↑' },
  { label: '↓', cmd: '\x1b[B', icon: '↓' },
  { label: '←', cmd: '\x1b[D', icon: '←' },
  { label: '→', cmd: '\x1b[C', icon: '→' },
  { label: 'Tab', cmd: '\t', icon: '⇥' },
];

export function CommandBar({ onSend, disabled }: CommandBarProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showQuickButtons, setShowQuickButtons] = useState(() => {
    // Default to hidden on small mobile, check localStorage for saved preference
    const saved = localStorage.getItem('showQuickButtons');
    if (saved !== null) return saved === 'true';
    return !isSmallMobile(); // Default: hide on small mobile
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('showQuickButtons', String(showQuickButtons));
  }, [showQuickButtons]);

  const handleSubmit = () => {
    if (!command.trim() || disabled) return;

    onSend(command + '\n');
    setHistory(prev => [command, ...prev.slice(0, 99)]);
    setCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleQuickCommand = (cmd: string) => {
    if (disabled) return;
    onSend(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className={`command-bar ${!showQuickButtons ? 'compact' : ''}`}>
      {showQuickButtons && (
        <div className="quick-commands">
          {/* Special keys for mobile */}
          <div className="key-group special-keys">
            {SPECIAL_KEYS.map((key) => (
              <button
                key={key.label}
                className="quick-cmd-btn special-key-btn"
                onClick={() => handleQuickCommand(key.cmd)}
                disabled={disabled}
                title={key.label}
              >
                {key.icon}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="key-divider" />

          {/* Control keys */}
          <div className="key-group control-keys">
            {CONTROL_KEYS.map((key) => (
              <button
                key={key.label}
                className="quick-cmd-btn control-key-btn"
                onClick={() => handleQuickCommand(key.cmd)}
                disabled={disabled}
              >
                {key.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="key-divider" />

          {/* Command shortcuts */}
          <div className="key-group command-shortcuts">
            {COMMAND_SHORTCUTS.map((cmd) => (
              <button
                key={cmd.label}
                className="quick-cmd-btn"
                onClick={() => handleQuickCommand(cmd.cmd)}
                disabled={disabled}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="command-input-container">
        <button
          className="toggle-quick-btn"
          onClick={() => setShowQuickButtons(!showQuickButtons)}
          title={showQuickButtons ? 'Hide shortcuts' : 'Show shortcuts'}
        >
          {showQuickButtons ? '▼' : '▲'}
        </button>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          placeholder="$"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={disabled || !command.trim()}
        >
          ↵
        </button>
      </div>
    </div>
  );
}

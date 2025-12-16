// Hitori Game - Mark cells black to remove duplicates

// API Configuration
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8090/api'
    : 'http://sudoku-battle-api.eba-ikqjwcki.ap-northeast-2.elasticbeanstalk.com/api';

// i18n
const i18n = {
    ko: {
        howToPlay: 'Hitori 게임 방법',
        ruleTitle1: '📌 규칙 1: 중복 숫자 제거',
        ruleTitle2: '📌 규칙 2: 검은 셀 인접 금지',
        ruleTitle3: '📌 규칙 3: 흰 셀 연결 유지',
        scoringTitle: '💰 점수 계산',
        hitoriRule1: '각 행과 열에 같은 숫자가 없어야 합니다. 셀을 탭하여 검게 칠하고 중복을 제거하세요.',
        hitoriRule2: '검은 셀은 상하좌우로 인접할 수 없습니다 (대각선은 OK).',
        hitoriRule3: '모든 흰 셀은 하나의 그룹으로 연결되어야 합니다. 고립된 흰 셀이 있으면 안됩니다.',
        scoringInfo: '기본: 1000점 | -2점/초 | -50점/힌트 | -30점/실수',
        beforeLabel: '❌ 이전 (3이 중복)',
        afterLabel: '✅ 이후 (3 제거됨)',
        badAdjacent: '❌ 검은 셀이 붙어있음!',
        goodAdjacent: '✅ 대각선은 OK',
        isolatedWhite: '❌ 좌상단 흰 셀 고립!',
        connectedWhite: '✅ 모든 흰 셀 연결됨',
        startGame: '게임 시작',
        checkAnswer: '정답 확인',
        hint: '힌트',
        backToGames: '돌아가기',
        congratulations: '축하합니다!',
        totalScore: '총 점수',
        time: '시간',
        todayRank: '오늘의 순위',
        hints: '힌트 사용',
        mistakes: '실수',
        comeBackTomorrow: '내일 새로운 퍼즐로 돌아오세요!',
        alreadyPlayed: '오늘 이미 플레이했습니다!',
        yourScore: '당신의 점수',
        duplicateInRow: '행에 중복 숫자!',
        duplicateInCol: '열에 중복 숫자!',
        adjacentBlack: '검은 셀 인접!',
        notConnected: '흰 셀이 분리됨!',
        correct: '정답입니다!'
    },
    en: {
        howToPlay: 'How to Play Hitori',
        ruleTitle1: '📌 Rule 1: Remove Duplicates',
        ruleTitle2: '📌 Rule 2: No Adjacent Black Cells',
        ruleTitle3: '📌 Rule 3: White Cells Must Connect',
        scoringTitle: '💰 Scoring',
        hitoriRule1: 'Each row and column should have no duplicate numbers. Tap cells to mark them black and remove duplicates.',
        hitoriRule2: 'Black cells cannot touch each other horizontally or vertically (diagonal is OK).',
        hitoriRule3: 'All white cells must form one connected group. No white cell can be isolated.',
        scoringInfo: 'Base: 1000pts | -2pts/sec | -50pts/hint | -30pts/mistake',
        beforeLabel: '❌ Before (duplicate 3s)',
        afterLabel: '✅ After (3 removed)',
        badAdjacent: '❌ Black cells touching!',
        goodAdjacent: '✅ Diagonal is OK',
        isolatedWhite: '❌ Top-left isolated!',
        connectedWhite: '✅ All whites connected',
        startGame: 'Start Game',
        checkAnswer: 'Check Answer',
        hint: 'Hint',
        backToGames: 'Back',
        congratulations: 'Congratulations!',
        totalScore: 'Total Score',
        time: 'Time',
        todayRank: 'Rank',
        hints: 'Hints',
        mistakes: 'Mistakes',
        comeBackTomorrow: 'Come back tomorrow for a new puzzle!',
        alreadyPlayed: 'Already Played Today!',
        yourScore: 'Your Score',
        duplicateInRow: 'Duplicate in row!',
        duplicateInCol: 'Duplicate in column!',
        adjacentBlack: 'Adjacent black cells!',
        notConnected: 'White cells not connected!',
        correct: 'Correct!'
    }
};

let currentLang = localStorage.getItem('game_language') || 'ko';

function t(key) {
    return i18n[currentLang][key] || i18n['en'][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ko' ? 'EN' : '한';
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('game_language', currentLang);
    applyTranslations();
}

const DEFAULT_AVATARS = [
    { id: 'avatar_cat', emoji: '🐱' },
    { id: 'avatar_dog', emoji: '🐶' },
    { id: 'avatar_fox', emoji: '🦊' },
    { id: 'avatar_bear', emoji: '🐻' },
    { id: 'avatar_panda', emoji: '🐼' },
    { id: 'avatar_rabbit', emoji: '🐰' },
    { id: 'avatar_koala', emoji: '🐨' },
    { id: 'avatar_lion', emoji: '🦁' },
    { id: 'avatar_tiger', emoji: '🐯' },
    { id: 'avatar_monkey', emoji: '🐵' },
    { id: 'avatar_penguin', emoji: '🐧' },
    { id: 'avatar_owl', emoji: '🦉' }
];

class HitoriGame {
    constructor(profile) {
        this.profile = profile;
        this.gridSize = 5;
        this.board = [];
        this.blackCells = new Set();
        this.sessionId = null;
        this.puzzleId = null;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.hintsUsed = 0;
        this.mistakes = 0;

        this.init();
    }

    init() {
        // Update player info
        document.getElementById('player-name').textContent = this.profile.nickname;
        const avatarEl = document.getElementById('player-avatar');
        avatarEl.textContent = this.profile.avatarEmoji;
        avatarEl.style.backgroundColor = this.profile.avatarColor;

        // Setup event listeners
        document.getElementById('check-btn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());

        this.checkDailyStatusAndStart();
    }

    async checkDailyStatusAndStart() {
        try {
            const response = await fetch(`${API_BASE}/hitori/daily-status/${this.profile.id}`);
            if (response.ok) {
                const status = await response.json();
                if (status.playedToday) {
                    this.showAlreadyPlayedModal(status);
                    return;
                }
            }
        } catch (e) {
            console.log('Could not check daily status');
        }

        this.showTutorialModal();
    }

    showTutorialModal() {
        const modal = document.getElementById('tutorial-modal');
        modal.classList.add('show');

        document.getElementById('start-game-btn').onclick = () => {
            modal.classList.remove('show');
            this.startGame();
        };
    }

    async startGame() {
        try {
            const response = await fetch(`${API_BASE}/hitori/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.profile.id })
            });

            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.sessionId;
                this.puzzleId = data.puzzleId;
                this.gridSize = data.gridSize;
                this.board = data.board;
            } else {
                const error = await response.json();
                if (error.error === 'DAILY_LIMIT_REACHED') {
                    const statusResponse = await fetch(`${API_BASE}/hitori/daily-status/${this.profile.id}`);
                    if (statusResponse.ok) {
                        this.showAlreadyPlayedModal(await statusResponse.json());
                    }
                    return;
                }
                throw new Error('API error');
            }
        } catch (e) {
            console.log('API unavailable, using local mode');
            this.sessionId = null;
            this.generateLocalPuzzle();
        }

        this.blackCells = new Set();
        this.hintsUsed = 0;
        this.mistakes = 0;
        this.renderGrid();
        this.startTimer();
    }

    generateLocalPuzzle() {
        this.gridSize = 5;
        this.board = [];

        // Generate Latin square
        for (let i = 0; i < this.gridSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.board[i][j] = (i + j) % this.gridSize + 1;
            }
        }

        // Shuffle rows
        for (let i = this.gridSize - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.board[i], this.board[j]] = [this.board[j], this.board[i]];
        }

        // Add some duplicates
        for (let d = 0; d < this.gridSize; d++) {
            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);
            this.board[row][col] = Math.floor(Math.random() * this.gridSize) + 1;
        }
    }

    renderGrid() {
        const grid = document.getElementById('hitori-grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'hitori-cell white';
                cell.textContent = this.board[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;

                cell.addEventListener('click', () => this.toggleCell(i, j));

                grid.appendChild(cell);
            }
        }

        this.updateCellStyles();
    }

    toggleCell(row, col) {
        const key = `${row},${col}`;

        if (this.blackCells.has(key)) {
            this.blackCells.delete(key);
        } else {
            this.blackCells.add(key);
        }

        this.updateCellStyles();
    }

    updateCellStyles() {
        const cells = document.querySelectorAll('.hitori-cell');

        // Find duplicates in rows and columns (among white cells)
        const duplicates = this.findDuplicates();

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const key = `${row},${col}`;

            cell.classList.remove('black', 'white', 'duplicate', 'error', 'hint');

            if (this.blackCells.has(key)) {
                cell.classList.add('black');
            } else {
                cell.classList.add('white');

                // Mark duplicates
                if (duplicates.has(key)) {
                    cell.classList.add('duplicate');
                }
            }
        });
    }

    findDuplicates() {
        const duplicates = new Set();

        // Check rows
        for (let i = 0; i < this.gridSize; i++) {
            const seen = new Map();
            for (let j = 0; j < this.gridSize; j++) {
                const key = `${i},${j}`;
                if (this.blackCells.has(key)) continue;

                const val = this.board[i][j];
                if (seen.has(val)) {
                    duplicates.add(key);
                    duplicates.add(seen.get(val));
                } else {
                    seen.set(val, key);
                }
            }
        }

        // Check columns
        for (let j = 0; j < this.gridSize; j++) {
            const seen = new Map();
            for (let i = 0; i < this.gridSize; i++) {
                const key = `${i},${j}`;
                if (this.blackCells.has(key)) continue;

                const val = this.board[i][j];
                if (seen.has(val)) {
                    duplicates.add(key);
                    duplicates.add(seen.get(val));
                } else {
                    seen.set(val, key);
                }
            }
        }

        return duplicates;
    }

    startTimer() {
        this.startTime = Date.now();
        this.elapsedSeconds = 0;

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(this.elapsedSeconds / 60);
            const secs = this.elapsedSeconds % 60;
            document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async checkAnswer() {
        const errors = this.validateSolution();

        if (errors.length > 0) {
            this.mistakes++;
            this.showErrors(errors);
            return;
        }

        // Correct!
        this.stopTimer();
        await this.completeGame();
    }

    validateSolution() {
        const errors = [];

        // Check for duplicates in rows
        for (let i = 0; i < this.gridSize; i++) {
            const seen = new Set();
            for (let j = 0; j < this.gridSize; j++) {
                const key = `${i},${j}`;
                if (this.blackCells.has(key)) continue;

                const val = this.board[i][j];
                if (seen.has(val)) {
                    errors.push({ type: 'duplicate_row', row: i });
                    break;
                }
                seen.add(val);
            }
        }

        // Check for duplicates in columns
        for (let j = 0; j < this.gridSize; j++) {
            const seen = new Set();
            for (let i = 0; i < this.gridSize; i++) {
                const key = `${i},${j}`;
                if (this.blackCells.has(key)) continue;

                const val = this.board[i][j];
                if (seen.has(val)) {
                    errors.push({ type: 'duplicate_col', col: j });
                    break;
                }
                seen.add(val);
            }
        }

        // Check adjacent black cells
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const key of this.blackCells) {
            const [row, col] = key.split(',').map(Number);
            for (const [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
                    if (this.blackCells.has(`${nr},${nc}`)) {
                        errors.push({ type: 'adjacent', row, col });
                    }
                }
            }
        }

        // Check white cells connectivity
        if (!this.checkWhiteConnectivity()) {
            errors.push({ type: 'not_connected' });
        }

        return errors;
    }

    checkWhiteConnectivity() {
        const whiteCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.blackCells.has(`${i},${j}`)) {
                    whiteCells.push(`${i},${j}`);
                }
            }
        }

        if (whiteCells.length === 0) return false;

        // BFS from first white cell
        const visited = new Set();
        const queue = [whiteCells[0]];
        visited.add(whiteCells[0]);

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const current = queue.shift();
            const [row, col] = current.split(',').map(Number);

            for (const [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                const key = `${nr},${nc}`;

                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize &&
                    !this.blackCells.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push(key);
                }
            }
        }

        return visited.size === whiteCells.length;
    }

    showErrors(errors) {
        const cells = document.querySelectorAll('.hitori-cell');

        errors.forEach(error => {
            if (error.type === 'adjacent') {
                const cell = document.querySelector(`.hitori-cell[data-row="${error.row}"][data-col="${error.col}"]`);
                if (cell) cell.classList.add('error');
            }
        });

        // Show error message
        const firstError = errors[0];
        let message = '';
        switch (firstError.type) {
            case 'duplicate_row':
                message = t('duplicateInRow');
                break;
            case 'duplicate_col':
                message = t('duplicateInCol');
                break;
            case 'adjacent':
                message = t('adjacentBlack');
                break;
            case 'not_connected':
                message = t('notConnected');
                break;
        }

        // Brief flash message (could add a toast)
        console.log(message);

        setTimeout(() => {
            cells.forEach(cell => cell.classList.remove('error'));
        }, 500);
    }

    async completeGame() {
        const solutionArray = Array.from(this.blackCells);
        const solutionJson = JSON.stringify(solutionArray);

        let result;

        if (this.sessionId) {
            try {
                const response = await fetch(`${API_BASE}/hitori/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        solution: solutionJson,
                        timeSeconds: this.elapsedSeconds
                    })
                });

                if (response.ok) {
                    result = await response.json();
                }
            } catch (e) {
                console.log('Failed to complete game via API');
            }
        }

        if (!result) {
            // Calculate local score
            const baseScore = 1000;
            const timeDeduction = Math.min(this.elapsedSeconds * 2, 500);
            const hintDeduction = this.hintsUsed * 50;
            const mistakeDeduction = this.mistakes * 30;
            const finalScore = Math.max(baseScore - timeDeduction - hintDeduction - mistakeDeduction, 100);

            result = {
                finalScore,
                timeSeconds: this.elapsedSeconds,
                hintsUsed: this.hintsUsed,
                mistakes: this.mistakes,
                rank: 1
            };
        }

        this.showResultModal(result);
    }

    showResultModal(result) {
        document.getElementById('final-score').textContent = result.finalScore;

        const mins = Math.floor(result.timeSeconds / 60);
        const secs = result.timeSeconds % 60;
        document.getElementById('final-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        document.getElementById('final-rank').textContent = `#${result.rank}`;
        document.getElementById('final-hints').textContent = result.hintsUsed;
        document.getElementById('final-mistakes').textContent = result.mistakes;

        this.loadTodayRanking('result-leaderboard');
        document.getElementById('result-modal').classList.add('show');
    }

    async showAlreadyPlayedModal(status) {
        document.getElementById('today-score').textContent = status.todayScore || 0;
        document.getElementById('today-rank').textContent = `#${status.todayRank || '?'}`;

        const timeSeconds = status.timeSeconds || 0;
        const mins = Math.floor(timeSeconds / 60);
        const secs = timeSeconds % 60;
        document.getElementById('today-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        await this.loadTodayRanking('today-leaderboard');
        document.getElementById('already-played-modal').classList.add('show');
    }

    async loadTodayRanking(elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = '<p style="color: #888;">Loading...</p>';

        try {
            const response = await fetch(`${API_BASE}/hitori/today-ranking?limit=50`);
            if (response.ok) {
                const rankings = await response.json();
                container.innerHTML = '';

                if (rankings.length === 0) {
                    container.innerHTML = '<p style="color: #888;">No rankings yet today</p>';
                    return;
                }

                // Show top 5
                const top5 = rankings.slice(0, 5);
                let myRankInTop5 = false;

                top5.forEach(entry => {
                    const avatar = DEFAULT_AVATARS.find(a => a.id === entry.avatarId);
                    const isMe = entry.playerId == this.profile.id;
                    if (isMe) myRankInTop5 = true;

                    const mins = Math.floor(entry.timeSeconds / 60);
                    const secs = entry.timeSeconds % 60;

                    const div = document.createElement('div');
                    div.className = `leaderboard-item ${isMe ? 'me' : ''}`;
                    div.innerHTML = `
                        <div class="leaderboard-rank">#${entry.rank}</div>
                        <div class="leaderboard-avatar" style="background-color: ${entry.avatarColor}">${avatar?.emoji || '👤'}</div>
                        <div class="leaderboard-name">${entry.nickname}</div>
                        <div class="leaderboard-score">${entry.score} pts</div>
                        <div class="leaderboard-time">${mins}:${secs.toString().padStart(2, '0')}</div>
                    `;
                    container.appendChild(div);
                });

                // If my rank is not in top 5, show my rank separately
                if (!myRankInTop5) {
                    const myEntry = rankings.find(entry => entry.playerId == this.profile.id);
                    if (myEntry) {
                        const separator = document.createElement('div');
                        separator.style.cssText = 'text-align: center; color: #666; padding: 5px 0; font-size: 0.8rem;';
                        separator.textContent = '···';
                        container.appendChild(separator);

                        const avatar = DEFAULT_AVATARS.find(a => a.id === myEntry.avatarId);
                        const mins = Math.floor(myEntry.timeSeconds / 60);
                        const secs = myEntry.timeSeconds % 60;

                        const div = document.createElement('div');
                        div.className = 'leaderboard-item me';
                        div.innerHTML = `
                            <div class="leaderboard-rank">#${myEntry.rank}</div>
                            <div class="leaderboard-avatar" style="background-color: ${myEntry.avatarColor}">${avatar?.emoji || '👤'}</div>
                            <div class="leaderboard-name">${myEntry.nickname}</div>
                            <div class="leaderboard-score">${myEntry.score} pts</div>
                            <div class="leaderboard-time">${mins}:${secs.toString().padStart(2, '0')}</div>
                        `;
                        container.appendChild(div);
                    }
                }
            }
        } catch (e) {
            container.innerHTML = '<p style="color: #888;">Failed to load ranking</p>';
        }
    }

    async useHint() {
        if (this.sessionId) {
            try {
                const response = await fetch(`${API_BASE}/hitori/hint`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: this.sessionId })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.hintsUsed = data.hintsUsed;

                    if (data.hint) {
                        this.blackCells.add(data.hint);
                        this.updateCellStyles();

                        // Highlight hint cell
                        const [row, col] = data.hint.split(',');
                        const cell = document.querySelector(`.hitori-cell[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('hint');
                            setTimeout(() => cell.classList.remove('hint'), 2000);
                        }
                    }
                }
            } catch (e) {
                console.log('Failed to get hint');
            }
        } else {
            // Local mode hint
            this.hintsUsed++;
            // Just mark a random duplicate as black
            const duplicates = this.findDuplicates();
            if (duplicates.size > 0) {
                const hint = Array.from(duplicates)[0];
                this.blackCells.add(hint);
                this.updateCellStyles();

                const [row, col] = hint.split(',');
                const cell = document.querySelector(`.hitori-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('hint');
                    setTimeout(() => cell.classList.remove('hint'), 2000);
                }
            }
        }
    }
}

// Initialize
window.initHitoriGame = function(profile) {
    new HitoriGame(profile);
};

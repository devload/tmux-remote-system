// Nurikabe Game - Fill in the sea, leaving islands

// API Configuration
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8090/api'
    : 'http://sudoku-battle-api.eba-ikqjwcki.ap-northeast-2.elasticbeanstalk.com/api';

// i18n
const i18n = {
    ko: {
        howToPlay: 'Nurikabe 게임 방법',
        ruleTitle1: '🏝️ 규칙 1: 섬과 바다',
        ruleTitle2: '🌊 규칙 2: 2×2 바다 금지',
        ruleTitle3: '🔗 규칙 3: 바다는 연결되어야 함',
        ruleTitle4: '🚫 규칙 4: 섬끼리 인접 금지',
        scoringTitle: '💰 점수 계산',
        nurikabeRule1: '숫자는 섬을 나타냅니다. 각 섬은 정확히 그 숫자만큼의 칸을 가집니다. 빈 칸을 탭하여 바다(어두운 색)로 표시하세요.',
        nurikabeRule2: '바다 셀은 2×2 정사각형을 이룰 수 없습니다. 이것은 "웅덩이"로 허용되지 않습니다.',
        nurikabeRule3: '모든 바다 셀은 상하좌우로 연결되어야 합니다. 섬끼리는 서로 닿을 수 없습니다.',
        nurikabeRule4: '다른 섬들은 상하좌우로 인접할 수 없습니다 (대각선은 OK).',
        scoringInfo: '기본: 1000점 | -2점/초 | -50점/힌트 | -30점/실수',
        beforeIsland: '숫자 3 = 섬 크기 3',
        islandExample: '✅ 3칸짜리 섬 완성!',
        poolBad: '❌ 2×2 바다 웅덩이!',
        poolGood: '✅ 웅덩이 없음!',
        seaDisconnected: '❌ 바다가 분리됨!',
        seaConnected: '✅ 바다가 모두 연결됨!',
        islandsTouchBad: '❌ 섬끼리 붙어있음!',
        islandsSeparate: '✅ 바다로 분리됨!',
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
        hasPool: '2×2 바다 웅덩이 발견!',
        seaNotConnected: '바다가 연결되지 않음!',
        islandWrongSize: '섬 크기가 틀림!',
        islandsTouching: '섬끼리 인접함!',
        correct: '정답입니다!'
    },
    en: {
        howToPlay: 'How to Play Nurikabe',
        ruleTitle1: '🏝️ Rule 1: Islands and Sea',
        ruleTitle2: '🌊 Rule 2: No 2×2 Sea Pools',
        ruleTitle3: '🔗 Rule 3: Sea Must Connect',
        ruleTitle4: '🚫 Rule 4: Islands Don\'t Touch',
        scoringTitle: '💰 Scoring',
        nurikabeRule1: 'Numbers represent islands. Each island has exactly that many cells. Tap empty cells to mark them as sea (dark).',
        nurikabeRule2: 'Sea cells cannot form a 2×2 square. This would be a "pool" which is not allowed.',
        nurikabeRule3: 'All sea cells must be connected horizontally or vertically. Islands cannot touch each other.',
        nurikabeRule4: 'Different islands cannot touch horizontally or vertically (diagonal is OK).',
        scoringInfo: 'Base: 1000pts | -2pts/sec | -50pts/hint | -30pts/mistake',
        beforeIsland: 'Number 3 = Island size 3',
        islandExample: '✅ Island of 3 cells done!',
        poolBad: '❌ 2×2 sea pool!',
        poolGood: '✅ No pool!',
        seaDisconnected: '❌ Sea is separated!',
        seaConnected: '✅ All sea connected!',
        islandsTouchBad: '❌ Islands touching!',
        islandsSeparate: '✅ Separated by sea!',
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
        hasPool: '2×2 sea pool found!',
        seaNotConnected: 'Sea is not connected!',
        islandWrongSize: 'Island size is wrong!',
        islandsTouching: 'Islands are touching!',
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

class NurikabeGame {
    constructor(profile) {
        this.profile = profile;
        this.gridSize = 7;
        this.board = [];        // Original board with island numbers
        this.seaCells = new Set();  // Player's marked sea cells
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
            const response = await fetch(`${API_BASE}/nurikabe/daily-status/${this.profile.id}`);
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
            const response = await fetch(`${API_BASE}/nurikabe/start`, {
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
                    const statusResponse = await fetch(`${API_BASE}/nurikabe/daily-status/${this.profile.id}`);
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

        this.seaCells = new Set();
        this.hintsUsed = 0;
        this.mistakes = 0;
        this.renderGrid();
        this.startTimer();
    }

    generateLocalPuzzle() {
        this.gridSize = 7;
        this.board = [];

        // Initialize empty board
        for (let i = 0; i < this.gridSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.board[i][j] = 0;
            }
        }

        // Place some islands
        const islands = [
            { row: 0, col: 0, size: 3 },
            { row: 0, col: 4, size: 2 },
            { row: 2, col: 2, size: 4 },
            { row: 4, col: 0, size: 2 },
            { row: 4, col: 5, size: 3 },
            { row: 6, col: 2, size: 2 }
        ];

        for (const island of islands) {
            this.board[island.row][island.col] = island.size;
        }
    }

    renderGrid() {
        const grid = document.getElementById('nurikabe-grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'nurikabe-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                const value = this.board[i][j];
                if (value > 0) {
                    cell.classList.add('island');
                    cell.textContent = value;
                } else {
                    cell.classList.add('empty');
                    cell.addEventListener('click', () => this.toggleCell(i, j));
                }

                grid.appendChild(cell);
            }
        }

        this.updateCellStyles();
    }

    toggleCell(row, col) {
        // Can't toggle island cells
        if (this.board[row][col] > 0) return;

        const key = `${row},${col}`;

        if (this.seaCells.has(key)) {
            this.seaCells.delete(key);
        } else {
            this.seaCells.add(key);
        }

        this.updateCellStyles();
    }

    updateCellStyles() {
        const cells = document.querySelectorAll('.nurikabe-cell');

        // Check for 2x2 pools
        const poolCells = this.findPoolCells();

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const key = `${row},${col}`;

            // Reset classes
            cell.classList.remove('sea', 'empty', 'pool-error', 'error', 'hint');

            if (this.board[row][col] > 0) {
                // Keep island class
                return;
            }

            if (this.seaCells.has(key)) {
                cell.classList.add('sea');
                if (poolCells.has(key)) {
                    cell.classList.add('pool-error');
                }
            } else {
                cell.classList.add('empty');
            }
        });
    }

    findPoolCells() {
        const poolCells = new Set();

        for (let i = 0; i < this.gridSize - 1; i++) {
            for (let j = 0; j < this.gridSize - 1; j++) {
                const c1 = `${i},${j}`;
                const c2 = `${i},${j+1}`;
                const c3 = `${i+1},${j}`;
                const c4 = `${i+1},${j+1}`;

                if (this.seaCells.has(c1) && this.seaCells.has(c2) &&
                    this.seaCells.has(c3) && this.seaCells.has(c4)) {
                    poolCells.add(c1);
                    poolCells.add(c2);
                    poolCells.add(c3);
                    poolCells.add(c4);
                }
            }
        }

        return poolCells;
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

        // 1. Check for 2x2 pools
        const poolCells = this.findPoolCells();
        if (poolCells.size > 0) {
            errors.push({ type: 'pool' });
        }

        // 2. Check sea connectivity
        if (!this.checkSeaConnectivity()) {
            errors.push({ type: 'sea_not_connected' });
        }

        // 3. Check island sizes and that islands don't touch
        const islandErrors = this.checkIslands();
        errors.push(...islandErrors);

        return errors;
    }

    checkSeaConnectivity() {
        if (this.seaCells.size === 0) return true;

        const visited = new Set();
        const seaArray = Array.from(this.seaCells);
        const queue = [seaArray[0]];
        visited.add(seaArray[0]);

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const current = queue.shift();
            const [row, col] = current.split(',').map(Number);

            for (const [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                const key = `${nr},${nc}`;

                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize &&
                    this.seaCells.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push(key);
                }
            }
        }

        return visited.size === this.seaCells.size;
    }

    checkIslands() {
        const errors = [];
        const visited = new Set();
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // Find all island cells (non-sea cells)
        const islandCells = new Set();
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const key = `${i},${j}`;
                if (!this.seaCells.has(key)) {
                    islandCells.add(key);
                }
            }
        }

        // For each numbered cell, BFS to find connected island
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.board[i][j];
                if (value === 0) continue; // Not a numbered cell

                const startKey = `${i},${j}`;
                if (visited.has(startKey)) continue;

                // BFS from this numbered cell
                const islandVisited = new Set();
                const queue = [startKey];
                islandVisited.add(startKey);
                let numberedCellsInIsland = 1;

                while (queue.length > 0) {
                    const current = queue.shift();
                    const [row, col] = current.split(',').map(Number);

                    for (const [dr, dc] of dirs) {
                        const nr = row + dr;
                        const nc = col + dc;
                        const key = `${nr},${nc}`;

                        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize &&
                            !this.seaCells.has(key) && !islandVisited.has(key)) {
                            islandVisited.add(key);
                            queue.push(key);
                            if (this.board[nr][nc] > 0) {
                                numberedCellsInIsland++;
                            }
                        }
                    }
                }

                // Check if island has correct size
                if (islandVisited.size !== value) {
                    errors.push({ type: 'island_size', row: i, col: j, expected: value, actual: islandVisited.size });
                }

                // Check if multiple numbered cells in same island
                if (numberedCellsInIsland > 1) {
                    errors.push({ type: 'islands_touching', row: i, col: j });
                }

                // Mark all cells in this island as visited
                for (const cell of islandVisited) {
                    visited.add(cell);
                }
            }
        }

        return errors;
    }

    showErrors(errors) {
        const firstError = errors[0];
        let message = '';
        switch (firstError.type) {
            case 'pool':
                message = t('hasPool');
                break;
            case 'sea_not_connected':
                message = t('seaNotConnected');
                break;
            case 'island_size':
                message = t('islandWrongSize');
                break;
            case 'islands_touching':
                message = t('islandsTouching');
                break;
        }

        console.log(message);

        // Flash error cells
        const cells = document.querySelectorAll('.nurikabe-cell');
        cells.forEach(cell => {
            if (cell.classList.contains('pool-error')) {
                cell.classList.add('error');
            }
        });

        setTimeout(() => {
            cells.forEach(cell => cell.classList.remove('error'));
        }, 500);
    }

    async completeGame() {
        const solutionArray = Array.from(this.seaCells);
        const solutionJson = JSON.stringify(solutionArray);

        let result;

        if (this.sessionId) {
            try {
                const response = await fetch(`${API_BASE}/nurikabe/complete`, {
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
            const response = await fetch(`${API_BASE}/nurikabe/today-ranking?limit=50`);
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
                const response = await fetch(`${API_BASE}/nurikabe/hint`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: this.sessionId })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.hintsUsed = data.hintsUsed;

                    if (data.hint) {
                        this.seaCells.add(data.hint);
                        this.updateCellStyles();

                        // Highlight hint cell
                        const [row, col] = data.hint.split(',');
                        const cell = document.querySelector(`.nurikabe-cell[data-row="${row}"][data-col="${col}"]`);
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
            // Local mode hint - find an empty cell that should be sea
            this.hintsUsed++;

            // Simple heuristic: mark cells that are surrounded by sea/islands
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    const key = `${i},${j}`;
                    if (this.board[i][j] === 0 && !this.seaCells.has(key)) {
                        this.seaCells.add(key);
                        this.updateCellStyles();

                        const cell = document.querySelector(`.nurikabe-cell[data-row="${i}"][data-col="${j}"]`);
                        if (cell) {
                            cell.classList.add('hint');
                            setTimeout(() => cell.classList.remove('hint'), 2000);
                        }
                        return;
                    }
                }
            }
        }
    }
}

// Initialize
window.initNurikabeGame = function(profile) {
    new NurikabeGame(profile);
};

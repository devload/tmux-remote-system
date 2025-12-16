// Streams Metro - Place numbers 1-20 on metro stations connected by lines

// API Configuration - Auto-detect environment
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8090/api'
    : 'http://sudoku-battle-api.eba-ikqjwcki.ap-northeast-2.elasticbeanstalk.com/api';

// i18n - Internationalization for Streams
const i18n = {
    ko: {
        remaining: '남은 숫자',
        backToGames: '게임 목록으로',
        gameComplete: '게임 완료!',
        totalScore: '총 점수',
        longestStream: '최장 스트림',
        todayRank: '오늘의 순위',
        comeBackTomorrow: '내일 새로운 퍼즐로 돌아오세요!',
        alreadyPlayed: '오늘 이미 플레이했습니다!',
        yourScore: '당신의 점수',
        howToPlay: '게임 방법',
        tutorialDesc1: '1-20 숫자를 지하철 역에 배치하세요.',
        tutorialDesc2: '인접한 역에 연속된 숫자를 배치하면 스트림이 됩니다.',
        tutorialDesc3: '스트림이 길수록 점수가 높아요!',
        streamLength: '스트림 길이',
        points: '점수',
        tutorialTip: '💡 팁: 긴 스트림 하나가 짧은 여러 개보다 높은 점수!',
        startGame: '게임 시작'
    },
    en: {
        remaining: 'Remaining',
        backToGames: 'Back to Games',
        gameComplete: 'Game Complete!',
        totalScore: 'Total Score',
        longestStream: 'Longest Stream',
        todayRank: "Today's Rank",
        comeBackTomorrow: 'Come back tomorrow for a new puzzle!',
        alreadyPlayed: 'Already Played Today!',
        yourScore: 'Your Score',
        howToPlay: 'How to Play',
        tutorialDesc1: 'Place numbers 1-20 on metro stations.',
        tutorialDesc2: 'Connect consecutive numbers on adjacent stations to form streams.',
        tutorialDesc3: 'Longer streams = Higher scores!',
        streamLength: 'Stream Length',
        points: 'Points',
        tutorialTip: '💡 Tip: One long stream beats many short ones!',
        startGame: 'Start Game'
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
    { id: 'avatar_cat', name: 'Cat', emoji: '🐱' },
    { id: 'avatar_dog', name: 'Dog', emoji: '🐶' },
    { id: 'avatar_fox', name: 'Fox', emoji: '🦊' },
    { id: 'avatar_bear', name: 'Bear', emoji: '🐻' },
    { id: 'avatar_panda', name: 'Panda', emoji: '🐼' },
    { id: 'avatar_rabbit', name: 'Rabbit', emoji: '🐰' },
    { id: 'avatar_koala', name: 'Koala', emoji: '🐨' },
    { id: 'avatar_lion', name: 'Lion', emoji: '🦁' },
    { id: 'avatar_tiger', name: 'Tiger', emoji: '🐯' },
    { id: 'avatar_monkey', name: 'Monkey', emoji: '🐵' },
    { id: 'avatar_penguin', name: 'Penguin', emoji: '🐧' },
    { id: 'avatar_owl', name: 'Owl', emoji: '🦉' }
];

const DEFAULT_COLORS = [
    '#5e81f4', '#7c3aed', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
];

class StreamsMetroGame {
    constructor(profile) {
        this.profile = profile;
        this.totalNumbers = 20;

        // Calculate sizes based on screen
        this.calculateSizes();

        // Colors - Metro style
        this.colors = {
            background: 0x1a1a2e,
            line: 0x3a3a5e,
            lineStream: 0x4ade80,
            nodeEmpty: 0x2a2a4e,
            nodeEmptyBorder: 0x5e81f4,
            nodeHover: 0x3a4a6e,
            nodeFilled: 0x16213e,
            nodeFilledBorder: 0x7c3aed,
            textNumber: 0xffffff,
            textStream: 0x4ade80,
            currentNumber: 0xffd700
        };

        // Metro map definition - nodes and connections
        // Each node has: id, x, y (relative positions 0-1)
        // Connections define which nodes are linked
        this.defineMetroMap();

        // Game state
        this.nodeValues = {};  // nodeId -> number placed
        this.placements = [];
        this.currentNumberIndex = 0;
        this.currentNumber = null;
        this.nodes = {};  // nodeId -> display objects
        this.particles = [];
        this.liveScore = 0;

        // API state
        this.gameSessionId = null;
        this.puzzleId = null;
        this.ghostData = null;
        this.ghostPlacements = {};  // playerId -> parsed placements array
        this.gameStartTime = null;

        this.init();
    }

    defineMetroMap() {
        // Metro map with 3 lines - Clean Y-shape design:
        // Red Line (horizontal top): 8 stations
        // Blue Line (diagonal left): 7 stations
        // Green Line (diagonal right): 7 stations
        // 2 interchange stations → Total: 8+7+7-2 = 20 stations

        this.mapNodes = [
            // Red Line - Horizontal at top (8 stations: id 0-7)
            { id: 0, x: 0.06, y: 0.25, line: 'red' },
            { id: 1, x: 0.18, y: 0.25, line: 'red' },
            { id: 2, x: 0.30, y: 0.25, line: 'red' },
            { id: 3, x: 0.42, y: 0.25, line: 'red-blue', interchange: true },  // 환승역 1 (Red-Blue)
            { id: 4, x: 0.58, y: 0.25, line: 'red-green', interchange: true }, // 환승역 2 (Red-Green)
            { id: 5, x: 0.70, y: 0.25, line: 'red' },
            { id: 6, x: 0.82, y: 0.25, line: 'red' },
            { id: 7, x: 0.94, y: 0.25, line: 'red' },

            // Blue Line - Diagonal going down-left from id 3 (6 unique stations)
            { id: 8, x: 0.35, y: 0.38, line: 'blue' },
            { id: 9, x: 0.28, y: 0.51, line: 'blue' },
            { id: 10, x: 0.21, y: 0.64, line: 'blue' },
            { id: 11, x: 0.14, y: 0.77, line: 'blue' },
            { id: 12, x: 0.07, y: 0.90, line: 'blue' },
            { id: 13, x: 0.20, y: 0.90, line: 'blue' },

            // Green Line - Diagonal going down-right from id 4 (6 unique stations)
            { id: 14, x: 0.65, y: 0.38, line: 'green' },
            { id: 15, x: 0.72, y: 0.51, line: 'green' },
            { id: 16, x: 0.79, y: 0.64, line: 'green' },
            { id: 17, x: 0.86, y: 0.77, line: 'green' },
            { id: 18, x: 0.93, y: 0.90, line: 'green' },
            { id: 19, x: 0.80, y: 0.90, line: 'green' }
        ];

        // Connections - all 3 lines are continuous!
        this.mapConnections = [
            // Red Line: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],

            // Blue Line: 3(환승) → 8 → 9 → 10 → 11 → 12 → 13
            [3, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],

            // Green Line: 4(환승) → 14 → 15 → 16 → 17 → 18 → 19
            [4, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19]
        ];

        // Line colors
        this.lineColors = {
            red: 0xe74c3c,
            blue: 0x3498db,
            green: 0x2ecc71
        };

        // Build adjacency list
        this.adjacencyList = {};
        for (let i = 0; i < this.totalNumbers; i++) {
            this.adjacencyList[i] = [];
        }
        this.mapConnections.forEach(([a, b]) => {
            this.adjacencyList[a].push(b);
            this.adjacencyList[b].push(a);
        });

        // Define which connections belong to which line
        this.connectionLines = {
            // Red Line connections
            '0-1': 'red', '1-2': 'red', '2-3': 'red', '3-4': 'red',
            '4-5': 'red', '5-6': 'red', '6-7': 'red',
            // Blue Line connections
            '3-8': 'blue', '8-9': 'blue', '9-10': 'blue',
            '10-11': 'blue', '11-12': 'blue', '12-13': 'blue',
            // Green Line connections
            '4-14': 'green', '14-15': 'green', '15-16': 'green',
            '16-17': 'green', '17-18': 'green', '18-19': 'green'
        };
    }

    getConnectionLineColor(aId, bId, nodeA, nodeB) {
        // Create key in sorted order
        const key1 = `${Math.min(aId, bId)}-${Math.max(aId, bId)}`;
        const lineName = this.connectionLines[key1];

        if (lineName && this.lineColors[lineName]) {
            return this.lineColors[lineName];
        }

        // Fallback: determine by node properties
        if (nodeA.line.includes('red') && nodeB.line.includes('red')) {
            return this.lineColors.red;
        }
        if (nodeA.line.includes('blue') || nodeB.line.includes('blue')) {
            return this.lineColors.blue;
        }
        if (nodeA.line.includes('green') || nodeB.line.includes('green')) {
            return this.lineColors.green;
        }

        return this.lineColors.red;
    }

    calculateSizes() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth > 480 && screenWidth <= 768;

        if (isMobile) {
            this.mapWidth = screenWidth - 40;
            this.mapHeight = Math.min(screenHeight * 0.5, 350);
            this.nodeRadius = 16;
            this.padding = 20;
            this.headerHeight = 10;
            this.numberDisplayHeight = 60;
            this.footerHeight = 10;
        } else if (isTablet) {
            this.mapWidth = screenWidth - 80;
            this.mapHeight = Math.min(screenHeight * 0.5, 400);
            this.nodeRadius = 18;
            this.padding = 40;
            this.headerHeight = 25;
            this.numberDisplayHeight = 70;
            this.footerHeight = 15;
        } else {
            this.mapWidth = Math.min(550, screenWidth - 160);
            this.mapHeight = Math.min(screenHeight * 0.5, 420);
            this.nodeRadius = 20;
            this.padding = 50;
            this.headerHeight = 35;
            this.numberDisplayHeight = 80;
            this.footerHeight = 20;
        }

        this.fontSize = Math.floor(this.nodeRadius * 0.75);
        this.currentNumberFontSize = isMobile ? 32 : 42;
    }

    init() {
        // Update player info
        document.getElementById('player-name').textContent = this.profile.nickname;
        const avatarEl = document.getElementById('player-avatar');
        avatarEl.textContent = this.profile.avatarEmoji;
        avatarEl.style.backgroundColor = this.profile.avatarColor;

        // Calculate canvas size
        this.canvasWidth = this.mapWidth + this.padding * 2;
        this.canvasHeight = this.mapHeight + this.headerHeight + this.numberDisplayHeight + this.footerHeight + this.padding;

        // Create PixiJS application
        this.app = new PIXI.Application({
            width: this.canvasWidth,
            height: this.canvasHeight,
            backgroundColor: this.colors.background,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        document.getElementById('game-container').insertBefore(
            this.app.view,
            document.querySelector('.controls')
        );

        // Create containers (order matters for layering)
        this.lineContainer = new PIXI.Container();
        this.lineContainer.x = this.padding;
        this.lineContainer.y = this.headerHeight + this.numberDisplayHeight;
        this.app.stage.addChild(this.lineContainer);

        this.nodeContainer = new PIXI.Container();
        this.nodeContainer.x = this.padding;
        this.nodeContainer.y = this.headerHeight + this.numberDisplayHeight;
        this.app.stage.addChild(this.nodeContainer);

        this.numberDisplayContainer = new PIXI.Container();
        this.numberDisplayContainer.x = this.canvasWidth / 2;
        this.numberDisplayContainer.y = this.headerHeight + this.numberDisplayHeight / 2;
        this.app.stage.addChild(this.numberDisplayContainer);

        this.particleContainer = new PIXI.Container();
        this.app.stage.addChild(this.particleContainer);

        this.checkDailyStatusAndStart();
        this.app.ticker.add(() => this.update());
    }

    async checkDailyStatusAndStart() {
        try {
            const response = await fetch(`${API_BASE}/streams/daily-status/${this.profile.id}`);
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

        // Show tutorial modal first
        this.showTutorialModal();
    }

    showTutorialModal() {
        const modal = document.getElementById('tutorial-modal');
        modal.classList.add('show');

        const startBtn = document.getElementById('start-game-btn');
        startBtn.onclick = () => {
            modal.classList.remove('show');
            this.newGame();
        };
    }

    async showAlreadyPlayedModal(status) {
        document.getElementById('today-score').textContent = status.todayScore || 0;
        document.getElementById('today-rank').textContent = `#${status.todayRank || '?'}`;
        document.getElementById('today-longest').textContent = status.longestStream || 0;

        await this.loadTodayRanking('today-leaderboard');
        document.getElementById('already-played-modal').classList.add('show');
    }

    async loadTodayRanking(elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = '<p style="color: #888;">Loading...</p>';

        try {
            const response = await fetch(`${API_BASE}/streams/today-ranking?limit=50`);
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

                    const div = document.createElement('div');
                    div.className = `leaderboard-item ${isMe ? 'me' : ''}`;
                    div.innerHTML = `
                        <div class="leaderboard-rank">#${entry.rank}</div>
                        <div class="ghost-avatar" style="background-color: ${entry.avatarColor}; width: 25px; height: 25px; font-size: 0.9rem;">${avatar?.emoji || '👤'}</div>
                        <div class="leaderboard-name">${entry.nickname}</div>
                        <div class="leaderboard-score">${entry.score} pts</div>
                        <div class="leaderboard-stream">🔗${entry.longestStream}</div>
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
                        const div = document.createElement('div');
                        div.className = 'leaderboard-item me';
                        div.innerHTML = `
                            <div class="leaderboard-rank">#${myEntry.rank}</div>
                            <div class="ghost-avatar" style="background-color: ${myEntry.avatarColor}; width: 25px; height: 25px; font-size: 0.9rem;">${avatar?.emoji || '👤'}</div>
                            <div class="leaderboard-name">${myEntry.nickname}</div>
                            <div class="leaderboard-score">${myEntry.score} pts</div>
                            <div class="leaderboard-stream">🔗${myEntry.longestStream}</div>
                        `;
                        container.appendChild(div);
                    }
                }
            }
        } catch (e) {
            container.innerHTML = '<p style="color: #888;">Failed to load ranking</p>';
        }
    }

    async newGame() {
        // Reset state
        this.nodeValues = {};
        this.placements = [];
        this.currentNumberIndex = 0;
        this.currentNumber = null;
        this.gameStartTime = Date.now();
        this.liveScore = 0;
        this.ghostPlacements = {};

        document.getElementById('numbers-remaining').textContent = `${this.totalNumbers}/${this.totalNumbers}`;
        document.getElementById('live-score').textContent = '0 pts';

        // Start game via API
        try {
            const response = await fetch(`${API_BASE}/streams/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.profile.id })
            });

            if (response.ok) {
                const session = await response.json();
                this.gameSessionId = session.sessionId;
                this.puzzleId = session.puzzleId;

                await this.fetchNextNumber();
                await this.loadGhostData();
            } else {
                const error = await response.json();
                if (error.error === 'DAILY_LIMIT_REACHED') {
                    const statusResponse = await fetch(`${API_BASE}/streams/daily-status/${this.profile.id}`);
                    if (statusResponse.ok) {
                        const status = await statusResponse.json();
                        this.showAlreadyPlayedModal(status);
                    }
                    return;
                }
                throw new Error('API error');
            }
        } catch (e) {
            console.log('API unavailable, using local mode');
            this.gameSessionId = null;
            this.puzzleId = null;
            this.generateLocalSequence();
            this.currentNumber = this.localSequence[0];
        }

        this.renderMetroMap();
        this.renderCurrentNumber();
        this.animateMapEntrance();
    }

    generateLocalSequence() {
        this.localSequence = [];
        for (let i = 1; i <= this.totalNumbers; i++) {
            this.localSequence.push(i);
        }
        for (let i = this.localSequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.localSequence[i], this.localSequence[j]] = [this.localSequence[j], this.localSequence[i]];
        }
    }

    async fetchNextNumber() {
        if (!this.gameSessionId) {
            if (this.currentNumberIndex < this.localSequence.length) {
                this.currentNumber = this.localSequence[this.currentNumberIndex];
            } else {
                this.currentNumber = null;
            }
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/streams/next-number/${this.gameSessionId}?currentIndex=${this.currentNumberIndex}`
            );
            if (response.ok) {
                const data = await response.json();
                this.currentNumber = data.number;
            }
        } catch (e) {
            console.log('Failed to fetch next number');
        }
    }

    async loadGhostData() {
        if (!this.puzzleId) return;

        try {
            const response = await fetch(`${API_BASE}/streams/ghost/${this.puzzleId}`);
            if (response.ok) {
                this.ghostData = await response.json();

                // Parse placements for each ghost player
                if (this.ghostData.ghostPlayers) {
                    this.ghostData.ghostPlayers.forEach(player => {
                        if (player.placements) {
                            try {
                                const placements = JSON.parse(player.placements);
                                // Convert grid placements to nodeId based (if needed)
                                this.ghostPlacements[player.playerId] = placements.map(p => ({
                                    number: p.number,
                                    nodeId: p.nodeId !== undefined ? p.nodeId : (p.row * 5 + p.col)
                                }));
                            } catch (e) {
                                console.log('Failed to parse ghost placements');
                            }
                        }
                    });
                }

                this.renderGhostIndicator();
            }
        } catch (e) {
            console.log('Failed to load ghost data');
        }
    }

    renderGhostIndicator() {
        const indicator = document.getElementById('ghost-indicator');
        indicator.innerHTML = '';

        if (!this.ghostData || this.ghostData.totalPlayers === 0) return;

        this.ghostData.ghostPlayers.slice(0, 3).forEach(player => {
            const avatar = DEFAULT_AVATARS.find(a => a.id === player.avatarId);
            const div = document.createElement('div');
            div.className = 'ghost-player';
            div.innerHTML = `
                <div class="ghost-avatar" style="background-color: ${player.avatarColor}">${avatar?.emoji || '👤'}</div>
                <span>${player.nickname}</span>
                <span style="color: #4ade80">${player.score} pts</span>
            `;
            indicator.appendChild(div);
        });
    }

    renderMetroMap() {
        this.lineContainer.removeChildren();
        this.nodeContainer.removeChildren();
        this.nodes = {};

        // Draw connections (lines) first
        this.lineGraphics = new PIXI.Graphics();
        this.drawAllLines();
        this.lineContainer.addChild(this.lineGraphics);

        // Draw nodes
        this.mapNodes.forEach(nodeData => {
            const node = this.createNode(nodeData);
            this.nodes[nodeData.id] = node;
            this.nodeContainer.addChild(node.container);
        });
    }

    drawAllLines() {
        this.lineGraphics.clear();

        this.mapConnections.forEach(([aId, bId]) => {
            const nodeA = this.mapNodes.find(n => n.id === aId);
            const nodeB = this.mapNodes.find(n => n.id === bId);

            const x1 = nodeA.x * this.mapWidth;
            const y1 = nodeA.y * this.mapHeight;
            const x2 = nodeB.x * this.mapWidth;
            const y2 = nodeB.y * this.mapHeight;

            // Check if this connection forms a stream
            const valA = this.nodeValues[aId];
            const valB = this.nodeValues[bId];
            const isStream = valA && valB && Math.abs(valA - valB) === 1;

            // Determine line color based on which line it belongs to
            let lineColor;
            if (isStream) {
                lineColor = this.colors.lineStream;
                this.lineGraphics.lineStyle(5, lineColor, 1);
            } else {
                // Determine which line this connection belongs to
                lineColor = this.getConnectionLineColor(aId, bId, nodeA, nodeB);
                this.lineGraphics.lineStyle(4, lineColor, 0.7);
            }

            this.lineGraphics.moveTo(x1, y1);
            this.lineGraphics.lineTo(x2, y2);
        });
    }

    createNode(nodeData) {
        const container = new PIXI.Container();
        const x = nodeData.x * this.mapWidth;
        const y = nodeData.y * this.mapHeight;
        container.x = x;
        container.y = y;

        const isOccupied = this.nodeValues[nodeData.id] !== undefined;
        const isInterchange = nodeData.interchange;

        // Outer ring - interchange stations are bigger with double ring
        const ring = new PIXI.Graphics();
        const radius = isInterchange ? this.nodeRadius * 1.2 : this.nodeRadius;

        // Get line color for border
        let lineColor = this.lineColors.red;
        if (nodeData.line.includes('green')) {
            lineColor = this.lineColors.green;
        } else if (nodeData.line.includes('blue')) {
            lineColor = this.lineColors.blue;
        } else if (nodeData.line.includes('red')) {
            lineColor = this.lineColors.red;
        }

        if (isInterchange) {
            // Double ring for interchange
            ring.lineStyle(4, 0xffffff, 1);
            ring.beginFill(isOccupied ? this.colors.nodeFilled : 0x2a2a4e, 1);
            ring.drawCircle(0, 0, radius);
            ring.endFill();
            ring.lineStyle(3, isOccupied ? this.colors.nodeFilledBorder : 0xf1c40f, 1);
            ring.drawCircle(0, 0, radius - 5);
        } else {
            ring.lineStyle(3, isOccupied ? this.colors.nodeFilledBorder : lineColor, 1);
            ring.beginFill(isOccupied ? this.colors.nodeFilled : this.colors.nodeEmpty, 1);
            ring.drawCircle(0, 0, radius);
            ring.endFill();
        }
        container.addChild(ring);

        // Number text
        const value = this.nodeValues[nodeData.id];
        const text = new PIXI.Text(value ? value.toString() : '', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: this.fontSize,
            fontWeight: 'bold',
            fill: this.colors.textNumber
        });
        text.anchor.set(0.5);
        container.addChild(text);

        // Interaction
        container.eventMode = 'static';
        container.cursor = isOccupied ? 'default' : 'pointer';
        container.hitArea = new PIXI.Circle(0, 0, radius + 5);

        const self = this;

        container.on('pointerover', () => {
            if (!isOccupied && self.currentNumber !== null) {
                ring.clear();
                if (isInterchange) {
                    ring.lineStyle(4, self.colors.currentNumber, 1);
                    ring.beginFill(self.colors.nodeHover, 1);
                    ring.drawCircle(0, 0, radius);
                    ring.endFill();
                    ring.lineStyle(3, self.colors.currentNumber, 0.5);
                    ring.drawCircle(0, 0, radius - 5);
                } else {
                    ring.lineStyle(4, self.colors.currentNumber, 1);
                    ring.beginFill(self.colors.nodeHover, 1);
                    ring.drawCircle(0, 0, radius);
                    ring.endFill();
                }
                container.scale.set(1.1);
            }
        });

        container.on('pointerout', () => {
            if (!isOccupied) {
                ring.clear();
                if (isInterchange) {
                    ring.lineStyle(4, 0xffffff, 1);
                    ring.beginFill(0x2a2a4e, 1);
                    ring.drawCircle(0, 0, radius);
                    ring.endFill();
                    ring.lineStyle(3, 0xf1c40f, 1);
                    ring.drawCircle(0, 0, radius - 5);
                } else {
                    ring.lineStyle(3, lineColor, 1);
                    ring.beginFill(self.colors.nodeEmpty, 1);
                    ring.drawCircle(0, 0, radius);
                    ring.endFill();
                }
                container.scale.set(1);
            }
        });

        container.on('pointertap', () => {
            if (!isOccupied && self.currentNumber !== null) {
                self.placeNumber(nodeData.id);
            }
        });

        return { container, ring, text, id: nodeData.id };
    }

    renderCurrentNumber() {
        this.numberDisplayContainer.removeChildren();

        if (this.currentNumber === null) return;

        // Background circle
        const bg = new PIXI.Graphics();
        bg.beginFill(this.colors.currentNumber, 0.2);
        bg.drawCircle(0, 0, 40);
        bg.endFill();
        this.numberDisplayContainer.addChild(bg);

        // Number text
        const text = new PIXI.Text(this.currentNumber.toString(), {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: this.currentNumberFontSize,
            fontWeight: 'bold',
            fill: this.colors.currentNumber
        });
        text.anchor.set(0.5);
        this.numberDisplayContainer.addChild(text);

        // Animate pulse
        this.animatePulse(bg);
    }

    animatePulse(obj) {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const scale = 1 + Math.sin(elapsed * 3) * 0.08;
            obj.scale.set(scale);
            if (this.currentNumber !== null) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    async placeNumber(nodeId) {
        const timestampMs = Date.now() - this.gameStartTime;
        const placedNumber = this.currentNumber;

        // Place number
        this.nodeValues[nodeId] = this.currentNumber;
        this.placements.push({
            number: this.currentNumber,
            nodeId: nodeId,
            timestampMs: timestampMs
        });

        // Update node visually
        const node = this.nodes[nodeId];
        node.text.text = this.currentNumber.toString();
        node.ring.clear();
        node.ring.lineStyle(3, this.colors.nodeFilledBorder, 1);
        node.ring.beginFill(this.colors.nodeFilled, 1);
        node.ring.drawCircle(0, 0, this.nodeRadius);
        node.ring.endFill();
        node.container.cursor = 'default';
        node.container.eventMode = 'none';

        // Animate placement
        this.animateNodePlacement(nodeId);
        this.createPlacementParticles(nodeId);

        // Check stream connection before updating
        const oldScore = this.liveScore;
        const streamResult = this.checkStreamConnection(nodeId, placedNumber);

        // Update lines and highlight streams
        this.drawAllLines();
        this.highlightStreams();

        // Update live score
        this.updateLiveScore();

        // Animate based on stream result
        if (streamResult.connected) {
            // Stream connected! Show success animation
            this.animateStreamSuccess(streamResult.connectedNodes, this.liveScore - oldScore);
        } else if (streamResult.isolated) {
            // Number is isolated - show fail animation
            this.animateStreamFail(nodeId);
        }

        // Show ghost placements for the same number
        this.showGhostPlacements(placedNumber);

        // Move to next number
        this.currentNumberIndex++;
        const remaining = this.totalNumbers - this.currentNumberIndex;
        document.getElementById('numbers-remaining').textContent = `${remaining}/${this.totalNumbers}`;

        if (this.currentNumberIndex >= this.totalNumbers) {
            await this.completeGame();
        } else {
            await this.fetchNextNumber();
            this.renderCurrentNumber();
        }
    }

    updateLiveScore() {
        const result = this.calculateLocalScore();
        const oldScore = this.liveScore;
        this.liveScore = result.finalScore;

        const scoreEl = document.getElementById('live-score');
        scoreEl.textContent = `${this.liveScore} pts`;

        // Animate if score changed
        if (this.liveScore > oldScore) {
            scoreEl.classList.remove('updated');
            void scoreEl.offsetWidth; // Force reflow
            scoreEl.classList.add('updated');
        }
    }

    checkStreamConnection(nodeId, number) {
        const neighbors = this.adjacencyList[nodeId] || [];
        const connectedNodes = [nodeId];
        let connected = false;

        // Check if adjacent to number-1 or number+1
        for (const neighborId of neighbors) {
            const neighborValue = this.nodeValues[neighborId];
            if (neighborValue === number - 1 || neighborValue === number + 1) {
                connected = true;
                connectedNodes.push(neighborId);
            }
        }

        // Check if isolated (no adjacent numbers at all that could connect)
        // A number is "isolated" if it can't form a stream with any placed adjacent number
        const isolated = !connected && this.placements.length > 1;

        return { connected, isolated, connectedNodes };
    }

    animateStreamSuccess(connectedNodes, scoreGained) {
        // Glow effect on connected line
        connectedNodes.forEach(nodeId => {
            const node = this.nodes[nodeId];
            if (!node) return;

            // Create glow ring
            const glow = new PIXI.Graphics();
            glow.lineStyle(6, 0x4ade80, 0.8);
            glow.drawCircle(0, 0, this.nodeRadius + 5);
            node.container.addChild(glow);

            // Animate glow
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 500;

                if (progress < 1) {
                    glow.alpha = 1 - progress;
                    glow.scale.set(1 + progress * 0.3);
                    requestAnimationFrame(animate);
                } else {
                    node.container.removeChild(glow);
                }
            };
            animate();
        });

        // Show score popup if score gained
        if (scoreGained > 0) {
            const lastNodeId = connectedNodes[0];
            const nodeData = this.mapNodes.find(n => n.id === lastNodeId);
            if (nodeData) {
                this.showScorePopup(nodeData, scoreGained);
            }
        }

        // Create success particles along the connection
        this.createStreamParticles(connectedNodes, 0x4ade80);
    }

    animateStreamFail(nodeId) {
        const node = this.nodes[nodeId];
        if (!node) return;

        // Shake animation
        const originalX = node.container.x;
        const startTime = Date.now();
        const duration = 400;
        const shakeAmount = 4;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                // Shake effect
                const shake = Math.sin(progress * Math.PI * 6) * shakeAmount * (1 - progress);
                node.container.x = originalX + shake;
                requestAnimationFrame(animate);
            } else {
                node.container.x = originalX;
            }
        };
        animate();

        // Red flash on the node
        const flash = new PIXI.Graphics();
        flash.beginFill(0xff4444, 0.5);
        flash.drawCircle(0, 0, this.nodeRadius + 3);
        flash.endFill();
        node.container.addChildAt(flash, 0);

        // Fade out flash
        const flashStart = Date.now();
        const flashAnimate = () => {
            const elapsed = Date.now() - flashStart;
            const progress = elapsed / 300;

            if (progress < 1) {
                flash.alpha = 0.5 * (1 - progress);
                requestAnimationFrame(flashAnimate);
            } else {
                node.container.removeChild(flash);
            }
        };
        flashAnimate();

        // Gray dust particles
        this.createFailParticles(nodeId);
    }

    showScorePopup(nodeData, score) {
        const x = nodeData.x * this.mapWidth;
        const y = nodeData.y * this.mapHeight;

        // Create score text
        const scoreText = new PIXI.Text(`+${score}`, {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0x4ade80,
            stroke: 0x000000,
            strokeThickness: 3
        });
        scoreText.anchor.set(0.5);
        scoreText.x = x;
        scoreText.y = y - this.nodeRadius - 10;

        this.nodeContainer.addChild(scoreText);

        // Animate floating up and fading
        const startTime = Date.now();
        const duration = 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                scoreText.y = y - this.nodeRadius - 10 - (progress * 40);
                scoreText.alpha = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
                scoreText.scale.set(1 + progress * 0.2);
                requestAnimationFrame(animate);
            } else {
                this.nodeContainer.removeChild(scoreText);
            }
        };
        animate();
    }

    createStreamParticles(connectedNodes, color) {
        if (connectedNodes.length < 2) return;

        // Create particles between connected nodes
        for (let i = 0; i < connectedNodes.length - 1; i++) {
            const nodeA = this.mapNodes.find(n => n.id === connectedNodes[i]);
            const nodeB = this.mapNodes.find(n => n.id === connectedNodes[i + 1]);
            if (!nodeA || !nodeB) continue;

            const x1 = this.padding + nodeA.x * this.mapWidth;
            const y1 = this.headerHeight + this.numberDisplayHeight + nodeA.y * this.mapHeight;
            const x2 = this.padding + nodeB.x * this.mapWidth;
            const y2 = this.headerHeight + this.numberDisplayHeight + nodeB.y * this.mapHeight;

            // Create particles along the line
            for (let j = 0; j < 5; j++) {
                const t = j / 4;
                const particle = new PIXI.Graphics();
                particle.beginFill(color);
                particle.drawCircle(0, 0, 3 + Math.random() * 2);
                particle.endFill();
                particle.x = x1 + (x2 - x1) * t;
                particle.y = y1 + (y2 - y1) * t;

                this.particleContainer.addChild(particle);

                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;

                this.particles.push({
                    sprite: particle,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    life: 1,
                    decay: 0.03
                });
            }
        }
    }

    createFailParticles(nodeId) {
        const nodeData = this.mapNodes.find(n => n.id === nodeId);
        if (!nodeData) return;

        const x = this.padding + nodeData.x * this.mapWidth;
        const y = this.headerHeight + this.numberDisplayHeight + nodeData.y * this.mapHeight;

        // Gray dust particles
        for (let i = 0; i < 6; i++) {
            const particle = new PIXI.Graphics();
            const gray = 0x888888;
            particle.beginFill(gray, 0.7);
            particle.drawCircle(0, 0, 2 + Math.random() * 2);
            particle.endFill();
            particle.x = x;
            particle.y = y;

            this.particleContainer.addChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 1.5;

            this.particles.push({
                sprite: particle,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.04
            });
        }
    }

    showGhostPlacements(number) {
        if (!this.ghostData || !this.ghostData.ghostPlayers) return;

        this.ghostData.ghostPlayers.forEach(player => {
            const placements = this.ghostPlacements[player.playerId];
            if (!placements) return;

            // Find where this player placed the same number
            const placement = placements.find(p => p.number === number);
            if (!placement) return;

            // Get node position
            const nodeData = this.mapNodes.find(n => n.id === placement.nodeId);
            if (!nodeData) return;

            // Create ghost avatar at that position
            this.showGhostAvatar(nodeData, player);
        });
    }

    showGhostAvatar(nodeData, player) {
        const avatar = DEFAULT_AVATARS.find(a => a.id === player.avatarId);
        const emoji = avatar?.emoji || '👤';

        // Create ghost container
        const ghostContainer = new PIXI.Container();
        const x = nodeData.x * this.mapWidth;
        const y = nodeData.y * this.mapHeight;
        ghostContainer.x = x;
        ghostContainer.y = y - this.nodeRadius - 20;

        // Background circle
        const bg = new PIXI.Graphics();
        const color = parseInt(player.avatarColor?.replace('#', '0x') || '0x5e81f4');
        bg.beginFill(color, 0.9);
        bg.drawCircle(0, 0, 14);
        bg.endFill();
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.drawCircle(0, 0, 14);
        ghostContainer.addChild(bg);

        // Emoji text
        const text = new PIXI.Text(emoji, {
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fill: 0xffffff
        });
        text.anchor.set(0.5);
        ghostContainer.addChild(text);

        // Add to node container
        this.nodeContainer.addChild(ghostContainer);

        // Animate: float up and fade out
        ghostContainer.alpha = 0;
        const startTime = Date.now();
        const duration = 1500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 0.2) {
                // Fade in
                ghostContainer.alpha = progress / 0.2;
            } else if (progress < 0.7) {
                // Stay visible
                ghostContainer.alpha = 1;
            } else if (progress < 1) {
                // Fade out
                ghostContainer.alpha = 1 - ((progress - 0.7) / 0.3);
            } else {
                // Remove
                this.nodeContainer.removeChild(ghostContainer);
                return;
            }

            // Float up
            ghostContainer.y = y - this.nodeRadius - 20 - (progress * 15);

            requestAnimationFrame(animate);
        };
        animate();
    }

    highlightStreams() {
        // Reset all node text colors
        Object.values(this.nodes).forEach(node => {
            if (this.nodeValues[node.id] !== undefined) {
                node.text.style.fill = this.colors.textNumber;
            }
        });

        // Find and highlight streams
        for (let num = 1; num <= this.totalNumbers; num++) {
            const startNodeId = this.findNodeWithNumber(num);
            if (startNodeId === null) continue;

            let streamLength = 1;
            let currentNodeId = startNodeId;
            let currentNum = num;
            const streamNodes = [currentNodeId];

            while (currentNum < this.totalNumbers) {
                const nextNum = currentNum + 1;
                const nextNodeId = this.findAdjacentNodeWithNumber(currentNodeId, nextNum);
                if (nextNodeId !== null) {
                    streamLength++;
                    streamNodes.push(nextNodeId);
                    currentNodeId = nextNodeId;
                    currentNum = nextNum;
                } else {
                    break;
                }
            }

            // Highlight if stream length >= 2
            if (streamLength >= 2) {
                streamNodes.forEach(nodeId => {
                    this.nodes[nodeId].text.style.fill = this.colors.textStream;
                });
            }
        }
    }

    findNodeWithNumber(num) {
        for (const [nodeId, value] of Object.entries(this.nodeValues)) {
            if (value === num) return parseInt(nodeId);
        }
        return null;
    }

    findAdjacentNodeWithNumber(nodeId, num) {
        const neighbors = this.adjacencyList[nodeId] || [];
        for (const neighborId of neighbors) {
            if (this.nodeValues[neighborId] === num) {
                return neighborId;
            }
        }
        return null;
    }

    async completeGame() {
        this.currentNumber = null;
        this.renderCurrentNumber();

        let result;

        if (this.gameSessionId) {
            try {
                // Convert placements to grid format for backend compatibility
                const gridPlacements = this.placements.map(p => ({
                    number: p.number,
                    row: Math.floor(p.nodeId / 5),
                    col: p.nodeId % 5,
                    timestampMs: p.timestampMs
                }));

                const response = await fetch(`${API_BASE}/streams/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.gameSessionId,
                        placements: JSON.stringify(gridPlacements)
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
            result = this.calculateLocalScore();
        }

        this.showResultsModal(result);
        this.createVictoryParticles();
    }

    calculateLocalScore() {
        let totalScore = 0;
        let longestStream = 0;
        const streamDetails = [];

        for (let num = 1; num <= this.totalNumbers; num++) {
            const startNodeId = this.findNodeWithNumber(num);
            if (startNodeId === null) continue;

            let streamLength = 1;
            let currentNodeId = startNodeId;
            let currentNum = num;

            while (currentNum < this.totalNumbers) {
                const nextNum = currentNum + 1;
                const nextNodeId = this.findAdjacentNodeWithNumber(currentNodeId, nextNum);
                if (nextNodeId !== null) {
                    streamLength++;
                    currentNodeId = nextNodeId;
                    currentNum = nextNum;
                } else {
                    break;
                }
            }

            if (streamLength >= 2) {
                const n = streamLength - 1;
                const score = n * (n + 1) / 2;
                totalScore += score;
                longestStream = Math.max(longestStream, streamLength);
                streamDetails.push({
                    start: num,
                    end: num + streamLength - 1,
                    length: streamLength,
                    score: score
                });
            }
        }

        return {
            finalScore: totalScore,
            longestStream: longestStream,
            streamDetails: streamDetails,
            rank: 1
        };
    }

    showResultsModal(result) {
        document.getElementById('final-score').textContent = result.finalScore;
        document.getElementById('longest-stream').textContent = result.longestStream;
        document.getElementById('final-rank').textContent = `#${result.rank}`;

        const detailsContainer = document.getElementById('stream-details');
        detailsContainer.innerHTML = '';

        if (result.streamDetails && result.streamDetails.length > 0) {
            result.streamDetails.forEach(stream => {
                const div = document.createElement('div');
                div.className = 'stream-detail';
                div.innerHTML = `
                    <span>${stream.start} → ${stream.end}</span>
                    <span>Length: ${stream.length}</span>
                    <span class="stream-score">+${stream.score}</span>
                `;
                detailsContainer.appendChild(div);
            });
        } else {
            detailsContainer.innerHTML = '<p style="color: #888;">No streams formed</p>';
        }

        this.loadTodayRanking('result-leaderboard');
        document.getElementById('result-modal').classList.add('show');
    }

    // Animations
    animateMapEntrance() {
        Object.values(this.nodes).forEach((node, index) => {
            node.container.alpha = 0;
            node.container.scale.set(0);

            setTimeout(() => {
                this.animateScale(node.container, 0, 1, 400);
                this.animateAlpha(node.container, 0, 1, 300);
            }, index * 40);
        });

        // Fade in lines
        this.lineGraphics.alpha = 0;
        setTimeout(() => {
            this.animateAlpha(this.lineGraphics, 0, 1, 500);
        }, 200);
    }

    animateNodePlacement(nodeId) {
        const node = this.nodes[nodeId];
        this.animateScale(node.container, 1, 1.3, 100, () => {
            this.animateScale(node.container, 1.3, 1, 200);
        });
    }

    animateScale(obj, from, to, duration, onComplete) {
        obj.scale.set(from);
        const startTime = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutBack(progress);
            const scale = from + (to - from) * eased;
            obj.scale.set(scale);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else if (onComplete) {
                onComplete();
            }
        };
        tick();
    }

    animateAlpha(obj, from, to, duration) {
        obj.alpha = from;
        const startTime = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            obj.alpha = from + (to - from) * progress;
            if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    createPlacementParticles(nodeId) {
        const nodeData = this.mapNodes.find(n => n.id === nodeId);
        const x = this.padding + nodeData.x * this.mapWidth;
        const y = this.headerHeight + this.numberDisplayHeight + nodeData.y * this.mapHeight;

        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(this.colors.currentNumber);
            particle.drawCircle(0, 0, 3);
            particle.endFill();
            particle.x = x;
            particle.y = y;

            const angle = (Math.PI * 2 / 8) * i;
            const speed = 3 + Math.random() * 2;

            this.particleContainer.addChild(particle);
            this.particles.push({
                sprite: particle,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1
            });
        }
    }

    createVictoryParticles() {
        const colors = [0x5e81f4, 0x7c3aed, 0x4ade80, 0xffd700];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = new PIXI.Graphics();
                const size = 3 + Math.random() * 5;
                particle.beginFill(colors[Math.floor(Math.random() * colors.length)]);
                particle.drawCircle(0, 0, size);
                particle.endFill();
                particle.x = Math.random() * this.canvasWidth;
                particle.y = this.canvasHeight + 20;

                this.particleContainer.addChild(particle);
                this.particles.push({
                    sprite: particle,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -6 - Math.random() * 5,
                    life: 1,
                    gravity: 0.12
                });
            }, i * 25);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.sprite.x += p.vx;
            p.sprite.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life -= p.decay || 0.02;
            p.sprite.alpha = p.life;

            if (p.life <= 0) {
                this.particleContainer.removeChild(p.sprite);
                this.particles.splice(i, 1);
            }
        }
    }
}

// Initialize when profile is ready
window.initStreamsGame = function(profile) {
    new StreamsMetroGame(profile);
};

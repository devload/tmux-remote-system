// API Configuration - Auto-detect environment
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8090/api'
    : 'http://sudoku-battle-api.eba-ikqjwcki.ap-northeast-2.elasticbeanstalk.com/api';

// i18n - Internationalization
const i18n = {
    ko: {
        // Profile screen
        profileTitle: 'SUDOKU BATTLE',
        profileSubtitle: '프로필을 만들어 게임을 시작하세요',
        nickname: '닉네임',
        nicknamePlaceholder: '닉네임을 입력하세요',
        chooseAvatar: '아바타 선택',
        chooseColor: '색상 선택',
        continue: '계속하기',

        // Game selection
        miniGames: 'MINI GAMES',
        chooseGame: '플레이할 게임을 선택하세요',
        sudokuBattle: 'Sudoku Battle',
        sudokuDesc: '6x6 데일리 챌린지',
        streams: 'Streams',
        streamsDesc: '1-20 숫자 연결하기',
        hitori: 'Hitori',
        hitoriDesc: '중복 제거하기',
        nurikabe: 'Nurikabe',
        nurikabeDesc: '바다 채우고 섬 남기기',
        comingSoon: 'Coming Soon',
        newGame: '새로운 게임',
        daily: '데일리',
        soon: '준비중',

        // Sudoku intro
        howToPlay: '게임 방법',
        sudokuRule1: '6x6 그리드에 1-6 숫자를 채우세요',
        sudokuRule2: '각 행에 1-6이 한 번씩만 (중복 없이)',
        sudokuRule3: '각 열에 1-6이 한 번씩만 (중복 없이)',
        sudokuRule4: '각 2x3 박스에 1-6이 한 번씩만 (중복 없이)',
        features: '특징',
        sudokuFeature1: '하루에 한 퍼즐 - 모두에게 동일!',
        sudokuFeature2: '다른 플레이어의 고스트 리플레이 관전',
        sudokuFeature3: '데일리 리더보드에서 경쟁',
        sudokuFeature4: '3번 틀리면 게임 오버!',
        startGame: '게임 시작',
        backToGames: '← 게임 목록으로',

        // Streams intro
        streamsRule1: '1-20 숫자가 랜덤으로 하나씩 나타납니다',
        streamsRule2: '4x5 그리드에 숫자를 배치하세요',
        streamsRule3: '"스트림" 만들기 - 연속 숫자(1-2-3...)를 인접하게',
        streamsRule4: '인접 = 상하좌우 (대각선 제외)',
        scoring: '점수 계산',
        streamsScore1: '스트림 2개: 1점 | 3개: 3점 | 4개: 6점 | 5개: 10점...',
        streamsScore2: '긴 스트림 = 기하급수적으로 높은 점수!',
        streamsScore3: '모두에게 동일한 퍼즐 - 공정한 경쟁!',
        streamsScore4: '하루 한 번 기회 - 신중하게!',

        // Game UI
        mistakes: '실수',
        hint: '힌트',

        // Modals
        congratulations: '축하합니다!',
        solvedToday: '오늘의 퍼즐을 풀었습니다!',
        time: '시간',
        comeBackTomorrow: '내일 새로운 퍼즐로 돌아오세요!',
        viewRanking: '오늘의 랭킹 보기',
        gameOver: '게임 오버',
        tooManyMistakes: '실수가 너무 많습니다!',
        alreadyPlayed: '오늘 이미 플레이했습니다!',
        yourTime: '당신의 시간',
        todayRanking: '오늘의 랭킹',
        close: '닫기'
    },
    en: {
        // Profile screen
        profileTitle: 'SUDOKU BATTLE',
        profileSubtitle: 'Create your profile to start playing',
        nickname: 'Nickname',
        nicknamePlaceholder: 'Enter your nickname',
        chooseAvatar: 'Choose Avatar',
        chooseColor: 'Choose Color',
        continue: 'Continue',

        // Game selection
        miniGames: 'MINI GAMES',
        chooseGame: 'Choose a game to play',
        sudokuBattle: 'Sudoku Battle',
        sudokuDesc: '6x6 Daily Challenge',
        streams: 'Streams',
        streamsDesc: 'Connect numbers 1-20',
        hitori: 'Hitori',
        hitoriDesc: 'Mark cells to remove duplicates',
        nurikabe: 'Nurikabe',
        nurikabeDesc: 'Fill the sea, leave islands',
        comingSoon: 'Coming Soon',
        newGame: 'New game',
        daily: 'Daily',
        soon: 'Soon',

        // Sudoku intro
        howToPlay: 'How to Play',
        sudokuRule1: 'Fill the 6x6 grid with numbers 1-6',
        sudokuRule2: 'Each row must have 1-6 (no repeats)',
        sudokuRule3: 'Each column must have 1-6 (no repeats)',
        sudokuRule4: 'Each 2x3 box must have 1-6 (no repeats)',
        features: 'Features',
        sudokuFeature1: 'One puzzle per day - same for everyone!',
        sudokuFeature2: 'Watch ghost replays of other players',
        sudokuFeature3: 'Compete on the daily leaderboard',
        sudokuFeature4: '3 mistakes and you\'re out!',
        startGame: 'Start Game',
        backToGames: '← Back to Games',

        // Streams intro
        streamsRule1: 'Numbers 1-20 appear one at a time randomly',
        streamsRule2: 'Place each number on the 4x5 grid',
        streamsRule3: 'Create "streams" - consecutive numbers (1-2-3...) next to each other',
        streamsRule4: 'Adjacent means up/down/left/right (not diagonal)',
        scoring: 'Scoring',
        streamsScore1: 'Stream of 2: 1 pt | 3: 3 pts | 4: 6 pts | 5: 10 pts...',
        streamsScore2: 'Longer streams = exponentially more points!',
        streamsScore3: 'Same puzzle for everyone - compete fairly!',
        streamsScore4: 'One chance per day - make it count!',

        // Game UI
        mistakes: 'Mistakes',
        hint: 'Hint',

        // Modals
        congratulations: 'Congratulations!',
        solvedToday: 'You solved today\'s puzzle!',
        time: 'Time',
        comeBackTomorrow: 'Come back tomorrow for a new puzzle!',
        viewRanking: 'View Today\'s Ranking',
        gameOver: 'Game Over',
        tooManyMistakes: 'Too many mistakes!',
        alreadyPlayed: 'Already Played Today!',
        yourTime: 'Your time',
        todayRanking: 'Today\'s Ranking',
        close: 'Close'
    }
};

// Current language
let currentLang = localStorage.getItem('game_language') || 'ko';

// Get translation
function t(key) {
    return i18n[currentLang][key] || i18n['en'][key] || key;
}

// Apply translations to page
function applyTranslations() {
    // Profile screen
    const profileTitle = document.querySelector('.profile-screen .profile-title');
    const profileSubtitle = document.querySelector('.profile-screen .profile-subtitle');
    if (profileTitle) profileTitle.textContent = t('profileTitle');
    if (profileSubtitle) profileSubtitle.textContent = t('profileSubtitle');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT') {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });

    // Update language toggle button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ko' ? 'EN' : '한';
    }
}

// Toggle language
function toggleLanguage() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('game_language', currentLang);
    applyTranslations();
}

// Avatar data (fallback if API fails)
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

// Profile Manager
class ProfileManager {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.avatars = DEFAULT_AVATARS;
        this.colors = DEFAULT_COLORS;
        this.selectedAvatar = null;
        this.selectedColor = null;
        this.nickname = '';

        this.init();
    }

    async init() {
        // Try to load avatars from API
        try {
            const response = await fetch(`${API_BASE}/players/avatars`);
            if (response.ok) {
                const data = await response.json();
                this.avatars = data.avatars;
                this.colors = data.colors;
            }
        } catch (e) {
            console.log('Using default avatars');
        }

        this.renderAvatars();
        this.renderColors();
        this.bindEvents();

        // Check for saved profile and auto-start
        const savedProfile = localStorage.getItem('sudoku_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            // Auto start game with saved profile
            this.autoStartWithProfile(profile);
        }
    }

    renderAvatars() {
        const grid = document.getElementById('avatar-grid');
        grid.innerHTML = '';

        this.avatars.forEach(avatar => {
            const div = document.createElement('div');
            div.className = 'avatar-option';
            div.dataset.avatarId = avatar.id;
            div.textContent = avatar.emoji;
            div.addEventListener('click', () => this.selectAvatar(avatar.id, div));
            grid.appendChild(div);
        });
    }

    renderColors() {
        const grid = document.getElementById('color-grid');
        grid.innerHTML = '';

        this.colors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'color-option';
            div.dataset.color = color;
            div.style.backgroundColor = color;
            div.addEventListener('click', () => this.selectColor(color, div));
            grid.appendChild(div);
        });
    }

    selectAvatar(avatarId, element) {
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedAvatar = avatarId;
        this.validateForm();
    }

    selectColor(color, element) {
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedColor = color;
        this.validateForm();
    }

    bindEvents() {
        const nicknameInput = document.getElementById('nickname-input');
        const startBtn = document.getElementById('start-game-btn');

        nicknameInput.addEventListener('input', (e) => {
            this.nickname = e.target.value.trim();
            this.validateForm();
        });

        startBtn.addEventListener('click', () => this.startGame());
    }

    validateForm() {
        const startBtn = document.getElementById('start-game-btn');
        const isValid = this.nickname.length >= 2 && this.selectedAvatar && this.selectedColor;
        startBtn.disabled = !isValid;
    }

    autoStartWithProfile(profile) {
        document.getElementById('profile-screen').classList.add('hidden');
        // Go to game selection instead of directly to game
        this.showGameSelection(profile);
    }

    async startGame() {
        const avatar = this.avatars.find(a => a.id === this.selectedAvatar);
        let playerId = localStorage.getItem('sudoku_player_id');

        // Try to create/get player from API
        try {
            if (!playerId) {
                const response = await fetch(`${API_BASE}/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nickname: this.nickname,
                        avatarId: this.selectedAvatar,
                        avatarColor: this.selectedColor
                    })
                });

                if (response.ok) {
                    const player = await response.json();
                    playerId = player.id;
                    localStorage.setItem('sudoku_player_id', playerId);
                }
            }
        } catch (e) {
            console.log('API unavailable, using local mode');
            playerId = 'local_' + Date.now();
        }

        const profile = {
            id: playerId,
            nickname: this.nickname,
            avatarId: this.selectedAvatar,
            avatarColor: this.selectedColor,
            avatarEmoji: avatar?.emoji || '🎮'
        };

        localStorage.setItem('sudoku_profile', JSON.stringify(profile));

        document.getElementById('profile-screen').classList.add('hidden');
        // Go to game selection instead of directly to game
        this.showGameSelection(profile);
    }

    showGameSelection(profile) {
        this.currentProfile = profile;
        document.getElementById('game-select-screen').classList.remove('hidden');

        // Bind events only once
        if (!this.gameSelectionBound) {
            this.bindGameSelectionEvents();
            this.gameSelectionBound = true;
        }
    }

    bindGameSelectionEvents() {
        const gameCards = document.querySelectorAll('.game-card:not(.coming-soon)');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const gameType = card.dataset.game;
                if (gameType === 'sudoku') {
                    this.showGameIntro('sudoku');
                } else if (gameType === 'streams') {
                    this.showGameIntro('streams');
                } else if (gameType === 'hitori') {
                    // Hitori goes directly to its own page
                    window.location.href = 'hitori.html';
                } else if (gameType === 'nurikabe') {
                    // Nurikabe goes directly to its own page
                    window.location.href = 'nurikabe.html';
                } else if (gameType === 'connect4') {
                    // Card Connect 4 goes directly to its own page
                    window.location.href = 'connect4.html';
                }
            });
        });

        // Bind intro events once here too
        document.getElementById('start-sudoku-btn').addEventListener('click', () => {
            document.getElementById('game-intro-screen').classList.add('hidden');
            document.getElementById('game-container').style.display = 'block';
            this.onComplete(this.currentProfile);
        });

        document.getElementById('start-streams-btn').addEventListener('click', () => {
            // Navigate to streams.html
            window.location.href = 'streams.html';
        });

        document.getElementById('back-to-games-btn').addEventListener('click', () => {
            document.getElementById('game-intro-screen').classList.add('hidden');
            document.getElementById('streams-intro-screen').classList.add('hidden');
            document.getElementById('game-select-screen').classList.remove('hidden');
        });

        document.getElementById('back-to-games-btn-streams').addEventListener('click', () => {
            document.getElementById('streams-intro-screen').classList.add('hidden');
            document.getElementById('game-select-screen').classList.remove('hidden');
        });
    }

    showGameIntro(gameType) {
        document.getElementById('game-select-screen').classList.add('hidden');
        if (gameType === 'sudoku') {
            document.getElementById('game-intro-screen').classList.remove('hidden');
        } else if (gameType === 'streams') {
            document.getElementById('streams-intro-screen').classList.remove('hidden');
        }
    }
}

// PixiJS Sudoku Game (v7 compatible)
class SudokuGame {
    constructor(profile) {
        this.profile = profile;

        // Game configuration
        this.gridSize = 6;
        this.boxRows = 2;
        this.boxCols = 3;

        // Responsive sizing based on screen width
        this.calculateSizes();

        // Font sizes (responsive)
        this.fontSize = Math.floor(this.cellSize * 0.45);
        this.numberBtnFontSize = Math.floor(this.numberBtnSize * 0.45);

        // Colors
        this.colors = {
            background: 0x1a1a2e,
            cellBg: 0x16213e,
            cellBgHover: 0x1f3a5f,
            cellBgSelected: 0x2d4a6f,
            cellBgHighlight: 0x1a2f4a,
            cellBgFixed: 0x0f1a2e,
            border: 0x5e81f4,
            borderThick: 0x7c3aed,
            textFixed: 0xffffff,
            textUser: 0x5e81f4,
            textError: 0xff6b6b,
            textSuccess: 0x4ade80,
            numberBtnBg: 0x5e81f4,
            numberBtnHover: 0x7c3aed,
            ghost: 0xffffff
        };

        // Game state
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.selectedCell = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.cells = [];
        this.numberButtons = [];
        this.numberPadVisible = false;
        this.particles = [];

        // API state
        this.gameSessionId = null;
        this.puzzleId = null;
        this.ghostData = null;
        this.ghostSprites = [];
        this.moveCount = 0;
        this.gameStartTime = null;

        this.init();
    }

    calculateSizes() {
        // Get available screen size
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth > 480 && screenWidth <= 768;

        // Calculate optimal cell size based on screen
        let maxBoardWidth, maxBoardHeight;

        if (isMobile) {
            maxBoardWidth = screenWidth - 40;  // 20px padding each side
            maxBoardHeight = screenHeight * 0.55;  // Leave room for UI
            this.padding = 20;
            this.headerHeight = 10;
            this.numberPadHeight = 60;
            this.footerHeight = 10;
        } else if (isTablet) {
            maxBoardWidth = screenWidth - 80;
            maxBoardHeight = screenHeight * 0.6;
            this.padding = 40;
            this.headerHeight = 30;
            this.numberPadHeight = 65;
            this.footerHeight = 15;
        } else {
            maxBoardWidth = Math.min(500, screenWidth - 160);
            maxBoardHeight = screenHeight * 0.6;
            this.padding = 80;
            this.headerHeight = 60;
            this.numberPadHeight = 70;
            this.footerHeight = 20;
        }

        // Cell size based on available space
        const cellByWidth = Math.floor(maxBoardWidth / this.gridSize);
        const cellByHeight = Math.floor(maxBoardHeight / this.gridSize);
        this.cellSize = Math.min(cellByWidth, cellByHeight, isMobile ? 55 : 70);

        // Number button size
        this.numberBtnSize = isMobile ? 42 : (isTablet ? 48 : 55);
        this.numberBtnGap = isMobile ? 6 : (isTablet ? 8 : 10);
    }

    init() {
        // Update player info in UI
        document.getElementById('player-name').textContent = this.profile.nickname;
        const avatarEl = document.getElementById('player-avatar');
        avatarEl.textContent = this.profile.avatarEmoji;
        avatarEl.style.backgroundColor = this.profile.avatarColor;

        // Calculate canvas size
        const boardWidth = this.cellSize * this.gridSize;
        const boardHeight = this.cellSize * this.gridSize;
        this.canvasWidth = boardWidth + this.padding * 2;
        this.canvasHeight = boardHeight + this.headerHeight + this.numberPadHeight + this.footerHeight + this.padding;

        // Create PixiJS application (v7 style)
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

        // Create containers
        this.boardContainer = new PIXI.Container();
        this.boardContainer.x = this.padding;
        this.boardContainer.y = this.headerHeight;
        this.app.stage.addChild(this.boardContainer);

        this.ghostContainer = new PIXI.Container();
        this.ghostContainer.x = this.padding;
        this.ghostContainer.y = this.headerHeight;
        this.app.stage.addChild(this.ghostContainer);

        this.numberPadContainer = new PIXI.Container();
        this.app.stage.addChild(this.numberPadContainer);

        this.particleContainer = new PIXI.Container();
        this.app.stage.addChild(this.particleContainer);

        // Create fixed number pad at bottom
        this.createFixedNumberPad();

        this.bindEvents();
        this.checkDailyStatusAndStart();
        this.app.ticker.add(() => this.update());
    }

    async checkDailyStatusAndStart() {
        // Check if player already played today
        try {
            const response = await fetch(`${API_BASE}/game/daily-status/${this.profile.id}`);
            if (response.ok) {
                const status = await response.json();
                if (status.playedToday) {
                    // Already played - show ranking modal
                    this.showAlreadyPlayedModal(status);
                    return;
                }
            }
        } catch (e) {
            console.log('Could not check daily status');
        }
        // Can play - start new game
        this.newGame();
    }

    async showAlreadyPlayedModal(status) {
        document.getElementById('today-time').textContent = this.formatTime(status.todayTime);
        document.getElementById('today-rank').textContent = `#${status.todayRank || '?'}`;

        // Load today's ranking
        await this.loadTodayRanking('today-leaderboard');

        document.getElementById('already-played-modal').classList.add('show');
    }

    async loadTodayRanking(elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = '<p style="color: #888;">Loading...</p>';

        try {
            const response = await fetch(`${API_BASE}/game/today-ranking?limit=50`);
            if (response.ok) {
                const rankings = await response.json();
                container.innerHTML = '';

                if (rankings.length === 0) {
                    container.innerHTML = '<p style="color: #888;">No rankings yet today</p>';
                    return;
                }

                // Show top 5
                const top5 = rankings.slice(0, 5);
                let myEntry = null;
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
                        <div class="leaderboard-time">${this.formatTime(entry.completionTimeSeconds)}</div>
                    `;
                    container.appendChild(div);
                });

                // If my rank is not in top 5, show my rank separately
                if (!myRankInTop5) {
                    myEntry = rankings.find(entry => entry.playerId == this.profile.id);
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
                            <div class="leaderboard-time">${this.formatTime(myEntry.completionTimeSeconds)}</div>
                        `;
                        container.appendChild(div);
                    }
                }
            }
        } catch (e) {
            container.innerHTML = '<p style="color: #888;">Failed to load ranking</p>';
        }
    }

    showRankingModal() {
        this.loadTodayRanking('full-ranking');
        document.getElementById('ranking-modal').classList.add('show');
    }

    // Helper: Draw rounded rectangle (v7 compatible)
    drawRoundedRect(graphics, x, y, width, height, radius, fillColor, fillAlpha = 1) {
        graphics.beginFill(fillColor, fillAlpha);
        graphics.drawRoundedRect(x, y, width, height, radius);
        graphics.endFill();
    }

    // Helper: Draw circle (v7 compatible)
    drawCircle(graphics, x, y, radius, fillColor, fillAlpha = 1) {
        graphics.beginFill(fillColor, fillAlpha);
        graphics.drawCircle(x, y, radius);
        graphics.endFill();
    }

    bindEvents() {
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());

        // Ranking modal buttons
        document.getElementById('view-ranking-btn').addEventListener('click', () => this.showRankingModal());
        document.getElementById('view-ranking-btn-gameover').addEventListener('click', () => this.showRankingModal());
        document.getElementById('close-ranking-btn').addEventListener('click', () => {
            document.getElementById('ranking-modal').classList.remove('show');
        });

        // Click outside board to deselect
        this.app.view.addEventListener('pointerdown', (e) => {
            const rect = this.app.view.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
            const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);

            // Check if click is outside board area
            const boardLeft = this.padding;
            const boardTop = this.headerHeight;
            const boardRight = this.padding + this.cellSize * this.gridSize;
            const boardBottom = this.headerHeight + this.cellSize * this.gridSize;

            // Check if click is outside number pad area
            const padBounds = this.numberPadContainer.getBounds();
            const inPad = x >= padBounds.x && x <= padBounds.x + padBounds.width &&
                          y >= padBounds.y && y <= padBounds.y + padBounds.height;

            const inBoard = x >= boardLeft && x <= boardRight && y >= boardTop && y <= boardBottom;

            if (!inBoard && !inPad && this.selectedCell) {
                this.hideNumberPad();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.selectedCell !== null) {
                const { row, col } = this.selectedCell;
                if (!this.isFixedCell(row, col)) {
                    if (e.key >= '1' && e.key <= '6') {
                        this.enterNumber(parseInt(e.key));
                    } else if (e.key === 'Backspace' || e.key === 'Delete') {
                        this.enterNumber(0);
                    } else if (e.key === 'Escape') {
                        this.hideNumberPad();
                    }
                }
            }
        });
    }

    async newGame() {
        this.mistakes = 0;
        this.timer = 0;
        this.selectedCell = null;
        this.moveCount = 0;
        this.gameStartTime = Date.now();
        document.getElementById('mistakes').textContent = '0/3';
        document.getElementById('timer').textContent = '00:00';

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.ghostContainer.removeChildren();
        this.ghostSprites = [];

        // Try to start game via API
        try {
            const response = await fetch(`${API_BASE}/game/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.profile.id,
                    difficulty: this.difficulty.toUpperCase()
                })
            });

            if (response.ok) {
                const session = await response.json();
                this.gameSessionId = session.id;
                this.puzzleId = session.puzzle.id;
                this.difficulty = session.puzzle.difficulty;
                this.initialBoard = session.puzzle.initialBoard;
                this.board = this.initialBoard.map(row => [...row]);
                this.solution = this.solvePuzzle(this.initialBoard);

                // Update difficulty display
                const difficultyDisplay = document.getElementById('difficulty-display');
                if (difficultyDisplay) {
                    const difficultyNames = { 'EASY': 'Easy', 'MEDIUM': 'Medium', 'HARD': 'Hard' };
                    difficultyDisplay.textContent = difficultyNames[this.difficulty] || this.difficulty;
                }

                await this.loadGhostData();
            } else {
                // Check if daily limit reached
                const errorText = await response.text();
                if (errorText.includes('DAILY_LIMIT_REACHED')) {
                    // Fetch daily status and show already played modal
                    const statusResponse = await fetch(`${API_BASE}/game/daily-status/${this.profile.id}`);
                    if (statusResponse.ok) {
                        const status = await statusResponse.json();
                        this.showAlreadyPlayedModal(status);
                    }
                    return;
                }
                throw new Error('API error');
            }
        } catch (e) {
            console.log('Using local puzzle generation');
            this.gameSessionId = null;
            this.puzzleId = null;
            this.generatePuzzle();
        }

        this.renderBoard();
        this.hideNumberPad();
        this.startTimer();
        this.animateBoardEntrance();
    }

    async loadGhostData() {
        if (!this.puzzleId) return;

        try {
            const response = await fetch(`${API_BASE}/game/ghost/${this.puzzleId}`);
            if (response.ok) {
                this.ghostData = await response.json();
                this.renderGhostIndicator();
                this.startGhostReplay();
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
                <span style="color: #5e81f4">${this.formatTime(player.completionTimeSeconds)}</span>
            `;
            indicator.appendChild(div);
        });
    }

    startGhostReplay() {
        if (!this.ghostData || this.ghostData.ghostPlayers.length === 0) return;

        this.ghostData.ghostPlayers.forEach(player => {
            const avatar = DEFAULT_AVATARS.find(a => a.id === player.avatarId);

            player.moves.forEach(move => {
                setTimeout(() => {
                    this.showGhostMove(move.rowIndex, move.colIndex, player.avatarColor, avatar?.emoji || '👤');
                }, move.timestampMs);
            });
        });
    }

    showGhostMove(row, col, color, emoji) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;

        const ghost = new PIXI.Container();

        const circle = new PIXI.Graphics();
        this.drawCircle(circle, 0, 0, 20, parseInt(color.replace('#', '0x')), 0.6);
        ghost.addChild(circle);

        const text = new PIXI.Text(emoji, { fontSize: 20 });
        text.anchor.set(0.5);
        ghost.addChild(text);

        ghost.x = x;
        ghost.y = y;
        ghost.alpha = 0.8;

        this.ghostContainer.addChild(ghost);

        const startTime = Date.now();
        const duration = 2000;

        const fadeOut = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                this.ghostContainer.removeChild(ghost);
                return;
            }

            ghost.alpha = 0.8 * (1 - progress);
            ghost.scale.set(1 + progress * 0.3);
            requestAnimationFrame(fadeOut);
        };

        fadeOut();
    }

    solvePuzzle(board) {
        const grid = board.map(row => [...row]);
        this.solveSudoku(grid);
        return grid;
    }

    generatePuzzle() {
        this.solution = this.generateSolution();
        const cellsToRemove = { easy: 12, medium: 18, hard: 24 };
        this.board = this.solution.map(row => [...row]);
        this.removeNumbers(cellsToRemove[this.difficulty]);
        this.initialBoard = this.board.map(row => [...row]);
    }

    generateSolution() {
        const grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        this.solveSudoku(grid);
        return grid;
    }

    solveSudoku(grid) {
        const emptyCell = this.findEmptyCell(grid);
        if (!emptyCell) return true;

        const [row, col] = emptyCell;
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6]);

        for (const num of numbers) {
            if (this.isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                if (this.solveSudoku(grid)) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    findEmptyCell(grid) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (grid[row][col] === 0) return [row, col];
            }
        }
        return null;
    }

    isValidPlacement(grid, row, col, num) {
        if (grid[row].includes(num)) return false;
        for (let i = 0; i < this.gridSize; i++) {
            if (grid[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / this.boxRows) * this.boxRows;
        const boxCol = Math.floor(col / this.boxCols) * this.boxCols;
        for (let i = 0; i < this.boxRows; i++) {
            for (let j = 0; j < this.boxCols; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    removeNumbers(count) {
        const positions = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) positions.push(i);
        this.shuffleArray(positions);
        for (let i = 0; i < count; i++) {
            const pos = positions[i];
            this.board[Math.floor(pos / this.gridSize)][pos % this.gridSize] = 0;
        }
    }

    renderBoard() {
        this.boardContainer.removeChildren();
        this.cells = [];

        const bgGlow = new PIXI.Graphics();
        this.drawRoundedRect(bgGlow, -10, -10, this.cellSize * this.gridSize + 20, this.cellSize * this.gridSize + 20, 15, this.colors.border, 0.1);
        this.boardContainer.addChild(bgGlow);

        for (let row = 0; row < this.gridSize; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.createCell(row, col);
                this.cells[row][col] = cell;
                this.boardContainer.addChild(cell.container);
            }
        }

        this.drawGridLines();
    }

    createCell(row, col) {
        const container = new PIXI.Container();
        container.x = col * this.cellSize;
        container.y = row * this.cellSize;

        const bg = new PIXI.Graphics();
        const isFixed = this.initialBoard[row][col] !== 0;
        this.drawRoundedRect(bg, 2, 2, this.cellSize - 4, this.cellSize - 4, 8, isFixed ? this.colors.cellBgFixed : this.colors.cellBg);
        container.addChild(bg);

        const value = this.board[row][col];
        const text = new PIXI.Text(value || '', {
            fontFamily: 'Outfit, Arial, sans-serif',
            fontSize: this.fontSize,
            fontWeight: 'bold',
            fill: isFixed ? this.colors.textFixed : this.colors.textUser
        });
        text.anchor.set(0.5);
        text.x = this.cellSize / 2;
        text.y = this.cellSize / 2;
        container.addChild(text);

        container.eventMode = 'static';
        container.cursor = isFixed ? 'default' : 'pointer';

        const self = this;

        container.on('pointerover', () => {
            if (!isFixed) {
                bg.clear();
                self.drawRoundedRect(bg, 2, 2, self.cellSize - 4, self.cellSize - 4, 8, self.colors.cellBgHover);
            }
        });

        container.on('pointerout', () => {
            if (!isFixed && !(self.selectedCell?.row === row && self.selectedCell?.col === col)) {
                bg.clear();
                self.drawRoundedRect(bg, 2, 2, self.cellSize - 4, self.cellSize - 4, 8, self.colors.cellBg);
            }
        });

        container.on('pointertap', () => {
            if (!isFixed) self.selectCell(row, col);
        });

        return { container, bg, text, row, col };
    }

    drawGridLines() {
        const lines = new PIXI.Graphics();

        // Thick lines for boxes
        lines.lineStyle(3, this.colors.borderThick);
        for (let i = 0; i <= 2; i++) {
            const x = i * this.cellSize * this.boxCols;
            lines.moveTo(x, 0);
            lines.lineTo(x, this.cellSize * this.gridSize);
        }

        for (let i = 0; i <= 3; i++) {
            const y = i * this.cellSize * this.boxRows;
            lines.moveTo(0, y);
            lines.lineTo(this.cellSize * this.gridSize, y);
        }

        // Thin lines for cells
        lines.lineStyle(1, this.colors.border, 0.3);
        for (let i = 1; i < this.gridSize; i++) {
            if (i % this.boxCols !== 0) {
                const x = i * this.cellSize;
                lines.moveTo(x, 0);
                lines.lineTo(x, this.cellSize * this.gridSize);
            }
        }
        for (let i = 1; i < this.gridSize; i++) {
            if (i % this.boxRows !== 0) {
                const y = i * this.cellSize;
                lines.moveTo(0, y);
                lines.lineTo(this.cellSize * this.gridSize, y);
            }
        }

        this.boardContainer.addChild(lines);
    }

    selectCell(row, col) {
        this.clearHighlights();
        this.selectedCell = { row, col };

        const cell = this.cells[row][col];
        cell.bg.clear();
        this.drawRoundedRect(cell.bg, 2, 2, this.cellSize - 4, this.cellSize - 4, 8, this.colors.cellBgSelected);

        this.highlightRelatedCells(row, col);
        this.showNumberPad(row, col);
    }

    highlightRelatedCells(row, col) {
        const boxRow = Math.floor(row / this.boxRows);
        const boxCol = Math.floor(col / this.boxCols);

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (r === row && c === col) continue;

                const cellBoxRow = Math.floor(r / this.boxRows);
                const cellBoxCol = Math.floor(c / this.boxCols);

                if (r === row || c === col || (boxRow === cellBoxRow && boxCol === cellBoxCol)) {
                    if (this.initialBoard[r][c] === 0) {
                        const cell = this.cells[r][c];
                        cell.bg.clear();
                        this.drawRoundedRect(cell.bg, 2, 2, this.cellSize - 4, this.cellSize - 4, 8, this.colors.cellBgHighlight);
                    }
                }
            }
        }
    }

    clearHighlights() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.cells[r][c];
                const isFixed = this.initialBoard[r][c] !== 0;
                cell.bg.clear();
                this.drawRoundedRect(cell.bg, 2, 2, this.cellSize - 4, this.cellSize - 4, 8, isFixed ? this.colors.cellBgFixed : this.colors.cellBg);
            }
        }
        this.selectedCell = null;
    }

    createFixedNumberPad() {
        this.numberPadContainer.removeChildren();
        this.numberButtons = [];

        const btnSize = this.numberBtnSize;
        const gap = this.numberBtnGap;
        const numbers = [1, 2, 3, 4, 5, 6, 0];
        const totalWidth = numbers.length * btnSize + (numbers.length - 1) * gap;

        // Position at bottom center of board
        const boardWidth = this.cellSize * this.gridSize;
        this.numberPadContainer.x = this.padding + (boardWidth - totalWidth) / 2;
        this.numberPadContainer.y = this.headerHeight + this.cellSize * this.gridSize + 12;

        const self = this;
        const btnRadius = Math.floor(btnSize * 0.2);

        numbers.forEach((num, i) => {
            const btn = new PIXI.Container();
            btn.x = i * (btnSize + gap);
            btn.y = 0;

            const btnBg = new PIXI.Graphics();
            self.drawRoundedRect(btnBg, 0, 0, btnSize, btnSize, btnRadius, num === 0 ? 0xff6b6b : self.colors.numberBtnBg, 0.9);
            btn.addChild(btnBg);

            const btnText = new PIXI.Text(num === 0 ? '✕' : num.toString(), {
                fontFamily: 'Outfit, Arial, sans-serif',
                fontSize: self.numberBtnFontSize,
                fontWeight: 'bold',
                fill: 0xffffff
            });
            btnText.anchor.set(0.5);
            btnText.x = btnSize / 2;
            btnText.y = btnSize / 2;
            btn.addChild(btnText);

            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.buttonData = { bg: btnBg, num: num, size: btnSize, radius: btnRadius };

            btn.on('pointerover', () => {
                if (self.selectedCell) {
                    btnBg.clear();
                    self.drawRoundedRect(btnBg, 0, 0, btnSize, btnSize, btnRadius, num === 0 ? 0xff4444 : self.colors.numberBtnHover);
                    btn.scale.set(1.08);
                }
            });

            btn.on('pointerout', () => {
                btnBg.clear();
                self.drawRoundedRect(btnBg, 0, 0, btnSize, btnSize, btnRadius, num === 0 ? 0xff6b6b : self.colors.numberBtnBg, self.selectedCell ? 1 : 0.5);
                btn.scale.set(1);
            });

            btn.on('pointertap', () => {
                if (self.selectedCell) {
                    self.enterNumber(num);
                }
            });

            self.numberPadContainer.addChild(btn);
            self.numberButtons.push(btn);
        });

        // Start with disabled look
        this.updateNumberPadState(false);
    }

    updateNumberPadState(enabled) {
        this.numberButtons.forEach(btn => {
            const { bg, num, size, radius } = btn.buttonData;
            bg.clear();
            this.drawRoundedRect(bg, 0, 0, size, size, radius, num === 0 ? 0xff6b6b : this.colors.numberBtnBg, enabled ? 1 : 0.4);
            btn.cursor = enabled ? 'pointer' : 'default';
        });
    }

    showNumberPad(row, col) {
        // Just enable the fixed number pad
        this.numberPadVisible = true;
        this.updateNumberPadState(true);
    }

    hideNumberPad() {
        this.numberPadVisible = false;
        this.updateNumberPadState(false);
        this.clearHighlights();
    }

    async enterNumber(num) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const isCorrect = num === this.solution[row][col];
        const timestampMs = Date.now() - this.gameStartTime;

        if (this.gameSessionId && num !== 0) {
            try {
                await fetch(`${API_BASE}/game/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameSessionId: this.gameSessionId,
                        rowIndex: row,
                        colIndex: col,
                        inputNumber: num,
                        isCorrect: isCorrect,
                        timestampMs: timestampMs
                    })
                });
            } catch (e) {
                console.log('Failed to record move');
            }
        }

        if (num === 0) {
            this.board[row][col] = 0;
            this.cells[row][col].text.text = '';
            this.cells[row][col].text.style.fill = this.colors.textUser;
        } else {
            if (isCorrect) {
                this.board[row][col] = num;
                this.cells[row][col].text.text = num.toString();
                this.cells[row][col].text.style.fill = this.colors.textSuccess;

                this.animateCellSuccess(row, col);
                this.createSuccessParticles(row, col);

                setTimeout(() => {
                    if (this.cells[row]?.[col]) {
                        this.cells[row][col].text.style.fill = this.colors.textUser;
                    }
                }, 500);

                if (this.checkWin()) this.gameWon();
            } else {
                this.mistakes++;
                document.getElementById('mistakes').textContent = `${this.mistakes}/3`;
                this.board[row][col] = num;
                this.cells[row][col].text.text = num.toString();
                this.cells[row][col].text.style.fill = this.colors.textError;

                this.animateCellError(row, col);

                if (this.mistakes >= this.maxMistakes) this.gameOver();
            }
        }

        this.hideNumberPad();
    }

    isFixedCell(row, col) {
        return this.initialBoard[row][col] !== 0;
    }

    checkWin() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] !== this.solution[row][col]) return false;
            }
        }
        return true;
    }

    async gameWon() {
        clearInterval(this.timerInterval);

        const completionTime = this.timer;
        let rank = 1;

        if (this.gameSessionId) {
            try {
                const response = await fetch(`${API_BASE}/game/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameSessionId: this.gameSessionId,
                        completionTimeSeconds: completionTime,
                        mistakes: this.mistakes,
                        hintsUsed: 0
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    rank = result.rank || 1;
                }

                // Load today's ranking instead of puzzle leaderboard
                await this.loadTodayRanking('leaderboard');
            } catch (e) {
                console.log('Failed to complete game');
            }
        }

        document.getElementById('final-time').textContent = this.formatTime(completionTime);
        document.getElementById('rank-display').textContent = `#${rank}`;

        this.createVictoryParticles();

        setTimeout(() => {
            document.getElementById('win-modal').classList.add('show');
        }, 1000);
    }

    async loadLeaderboard() {
        if (!this.puzzleId) return;

        const leaderboardEl = document.getElementById('leaderboard');
        leaderboardEl.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE}/game/leaderboard/${this.puzzleId}?limit=5`);
            if (response.ok) {
                const data = await response.json();

                data.forEach((entry, index) => {
                    const isMe = entry.playerId == this.profile.id;

                    const div = document.createElement('div');
                    div.className = `leaderboard-item ${isMe ? 'me' : ''}`;
                    div.innerHTML = `
                        <div class="leaderboard-rank">#${index + 1}</div>
                        <div class="leaderboard-name">${entry.nickname || 'Player'}</div>
                        <div class="leaderboard-time">${this.formatTime(entry.completionTimeSeconds)}</div>
                    `;
                    leaderboardEl.appendChild(div);
                });
            }
        } catch (e) {
            console.log('Failed to load leaderboard');
        }
    }

    gameOver() {
        clearInterval(this.timerInterval);
        document.getElementById('gameover-modal').classList.add('show');
    }

    giveHint() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === 0 || this.board[row][col] !== this.solution[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const num = this.solution[row][col];

        this.board[row][col] = num;
        this.cells[row][col].text.text = num.toString();
        this.cells[row][col].text.style.fill = this.colors.textSuccess;

        this.animateCellSuccess(row, col);
        this.createSuccessParticles(row, col);

        setTimeout(() => {
            if (this.cells[row]?.[col]) {
                this.cells[row][col].text.style.fill = this.colors.textUser;
            }
        }, 500);

        if (this.checkWin()) this.gameWon();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.formatTime(this.timer);
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    // Animations
    animateBoardEntrance() {
        this.cells.forEach((row, r) => {
            row.forEach((cell, c) => {
                cell.container.alpha = 0;
                cell.container.scale.set(0.5);

                const delay = (r * this.gridSize + c) * 30;
                setTimeout(() => {
                    this.animateScale(cell.container, 0.5, 1, 300);
                    this.animateAlpha(cell.container, 0, 1, 300);
                }, delay);
            });
        });
    }

    animateNumberPadEntrance() {
        this.animateScale(this.numberPadContainer, 0.8, 1, 200);
        this.animateAlpha(this.numberPadContainer, 0, 1, 200);
    }

    animateCellSuccess(row, col) {
        const cell = this.cells[row][col];
        this.animateScale(cell.container, 1, 1.2, 150, () => {
            this.animateScale(cell.container, 1.2, 1, 150);
        });
    }

    animateCellError(row, col) {
        const cell = this.cells[row][col];
        const originalX = cell.container.x;

        const shakeAnimation = [
            { x: originalX - 5, duration: 50 },
            { x: originalX + 5, duration: 50 },
            { x: originalX - 3, duration: 50 },
            { x: originalX + 3, duration: 50 },
            { x: originalX, duration: 50 }
        ];

        let currentIndex = 0;
        const animate = () => {
            if (currentIndex >= shakeAnimation.length) return;

            const { x, duration } = shakeAnimation[currentIndex];
            const startX = cell.container.x;
            const startTime = Date.now();

            const tick = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                cell.container.x = startX + (x - startX) * progress;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    currentIndex++;
                    animate();
                }
            };
            tick();
        };
        animate();
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

    createSuccessParticles(row, col) {
        const x = this.padding + (col + 0.5) * this.cellSize;
        const y = this.headerHeight + (row + 0.5) * this.cellSize;

        for (let i = 0; i < 8; i++) {
            const particle = new PIXI.Graphics();
            this.drawCircle(particle, 0, 0, 4, this.colors.textSuccess);
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
                this.drawCircle(particle, 0, 0, size, colors[Math.floor(Math.random() * colors.length)]);
                particle.x = Math.random() * this.canvasWidth;
                particle.y = this.canvasHeight + 20;

                this.particleContainer.addChild(particle);
                this.particles.push({
                    sprite: particle,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -5 - Math.random() * 5,
                    life: 1,
                    gravity: 0.1
                });
            }, i * 30);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.sprite.x += p.vx;
            p.sprite.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life -= 0.02;
            p.sprite.alpha = p.life;

            if (p.life <= 0) {
                this.particleContainer.removeChild(p.sprite);
                this.particles.splice(i, 1);
            }
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Apply translations on load
    applyTranslations();

    new ProfileManager((profile) => {
        new SudokuGame(profile);
    });
});

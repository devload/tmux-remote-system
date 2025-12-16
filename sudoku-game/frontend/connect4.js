/**
 * Card Connect 4 - Game Logic & AI
 * 카드를 보드 위 아무 칸에나 놓는 방식
 * 기존 카드 위에는 더 높은 숫자만 덮을 수 있음
 * 데일리 모드: 모든 유저와 AI가 같은 카드 순서를 가짐
 */

// i18n - Internationalization for Card Connect 4
const i18n = {
    ko: {
        gameTitle: '카드 4목',
        back: '← 뒤로',
        turn: '턴',
        cardSum: '카드 합',
        estScore: '예상 점수',
        yourCard: '내 카드 (셀을 클릭해서 배치)',
        cardsRemaining: '남은 카드',
        yourTurn: '내 턴',
        placeCard: '카드를 보드에 배치하세요',
        aiThinking: 'AI가 생각 중...',
        noCardsLeft: '카드가 없습니다!',
        you: '나',
        ai: 'AI',
        newGame: '새 게임',
        // Tutorial
        tutorialTitle: '카드 4목',
        goal: '목표',
        goalDesc: 'AI보다 먼저 가로, 세로, 대각선으로 4개를 연결하세요!',
        howToPlay: '게임 방법',
        howToPlayDesc: '1. 매 턴, 덱에서 랜덤 카드를 뽑습니다\n2. 보드의 아무 셀이나 클릭해서 배치\n3. 빈 셀 또는 더 낮은 숫자 위에 배치 가능\n4. 먼저 4개를 연결하면 승리!',
        placementRule: '카드 배치 규칙',
        placementRuleDesc: '높은 숫자가 낮은 숫자를 덮을 수 있습니다!\n이미 카드가 있다면, 더 높은 숫자만 그 위에 놓을 수 있습니다.',
        yourDeck: '덱 구성 (20장)',
        scoring: '점수 계산',
        scoringDesc: '기본: 1000점\n− 카드 합 × 5 (낮은 카드 = 좋음!)\n− 턴 수 × 10 (빠를수록 좋음!)\n+ 속도 보너스 (≤10턴: +100)',
        dailyMode: '📅 데일리 모드',
        dailyModeDesc: '매일 모든 유저가 같은 카드 순서를 받습니다!\n당신과 AI 모두 같은 순서로 카드를 뽑습니다.',
        betaNote: '🧪 베타: 테스트를 위해 여러 번 플레이 가능',
        selectDifficulty: '난이도 선택 (AI 수)',
        easy: '쉬움 (AI 1명)',
        medium: '보통 (AI 2명)',
        hard: '어려움 (AI 3명)',
        startGame: '게임 시작',
        multiplayerDesc: '멀티플레이어 모드: 여러 AI와 동시 대결!\nAI는 Gemini LLM으로 구동됩니다.',
        // Result
        victory: '승리!',
        defeat: '패배',
        draw: '무승부',
        points: '점',
        baseScore: '기본 점수',
        cardSumPenalty: '카드 합 패널티',
        turnPenalty: '턴 패널티',
        speedBonus: '속도 보너스',
        superFast: '초고속!',
        fastWin: '빠른 승리',
        quickWin: '신속한 승리',
        aiWonMsg: 'AI가 이번 판을 이겼습니다.',
        tryAgainMsg: '더 낮은 난이도로 시도하거나\n더 신중하게 플레이해보세요!',
        drawMsg: '어느 쪽도 4목을 완성하지 못했습니다.',
        halfScoreMsg: '현재 점수의 절반을 받습니다.',
        backToGames: '게임 목록',
        playAgain: '다시 하기'
    },
    en: {
        gameTitle: 'Card Connect 4',
        back: '← Back',
        turn: 'Turn',
        cardSum: 'Card Sum',
        estScore: 'Est. Score',
        yourCard: 'Your Card (Click a cell to place)',
        cardsRemaining: 'Cards remaining',
        yourTurn: 'Your Turn',
        placeCard: 'Place card on the board',
        aiThinking: 'AI is thinking...',
        noCardsLeft: 'No cards left!',
        you: 'You',
        ai: 'AI',
        newGame: 'New Game',
        // Tutorial
        tutorialTitle: 'Card Connect 4',
        goal: 'Goal',
        goalDesc: 'Connect 4 of your cards in a row (horizontal, vertical, or diagonal) before the AI!',
        howToPlay: 'How to Play',
        howToPlayDesc: '1. Each turn, you draw a random card from your deck\n2. Click any cell on the board to place it\n3. You can place on empty cells OR on top of lower-numbered cards\n4. First to get 4 in a row wins!',
        placementRule: 'Card Placement Rule',
        placementRuleDesc: 'Higher cards can cover lower cards!\nIf there\'s already a card, you can only place a higher number on top of it.',
        yourDeck: 'Your Deck (20 cards)',
        scoring: 'Scoring',
        scoringDesc: 'Base: 1000 pts\n− Card sum × 5 (lower cards = better!)\n− Turns × 10 (faster = better!)\n+ Speed bonus (≤10 turns: +100)',
        dailyMode: '📅 Daily Mode',
        dailyModeDesc: 'Everyone gets the same card sequence each day!\nBoth you and AI draw cards in the same order.',
        betaNote: '🧪 Beta: You can play multiple times for testing',
        selectDifficulty: 'Select Difficulty (# of AIs)',
        easy: 'Easy (1 AI)',
        medium: 'Medium (2 AIs)',
        hard: 'Hard (3 AIs)',
        startGame: 'Start Game',
        multiplayerDesc: 'Multiplayer mode: Battle against multiple AIs!\nAI is powered by Gemini LLM.',
        // Result
        victory: 'Victory!',
        defeat: 'Defeat',
        draw: 'Draw',
        points: 'points',
        baseScore: 'Base Score',
        cardSumPenalty: 'Card Sum',
        turnPenalty: 'Turns',
        speedBonus: 'Speed Bonus',
        superFast: 'Super Fast!',
        fastWin: 'Fast Win',
        quickWin: 'Quick Win',
        aiWonMsg: 'The AI won this time.',
        tryAgainMsg: 'Try a lower difficulty or\nplan your moves more carefully!',
        drawMsg: 'Neither player achieved 4 in a row.',
        halfScoreMsg: 'You get half the current score.',
        backToGames: 'Back to Games',
        playAgain: 'Play Again'
    }
};

let currentLang = localStorage.getItem('game_language') || 'ko';

function t(key) {
    return i18n[currentLang][key] || i18n['en'][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        // 줄바꿈이 있으면 <br>로 변환
        if (text.includes('\n')) {
            el.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            el.textContent = text;
        }
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

    // 게임 UI도 업데이트
    if (game) {
        game.updateUI();
    }
}

class CardConnect4 {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.board = [];  // board[row][col] = { player: 'player'|'ai1'|'ai2'|'ai3', value: number } or null

        // 멀티플레이어 지원
        this.players = ['player'];  // 난이도에 따라 AI 추가
        this.decks = {};            // 각 플레이어별 덱
        this.currentCard = null;
        this.currentTurnIndex = 0;  // players 배열의 인덱스
        this.turnCount = 0;
        this.playerCardSum = 0;
        this.gameOver = false;
        this.difficulty = 'easy';
        this.winner = null;
        this.lastAIMove = null;

        // API 설정
        this.apiBaseUrl = 'https://a5uw0yavxc.execute-api.ap-northeast-2.amazonaws.com/prod';  // Lambda API
        this.useGeminiAI = true;  // LLM AI 사용 여부

        // 랜덤 시드 (매 게임마다 다른 카드)
        this.todayString = Date.now().toString();
        this.seed = this.hashString(this.todayString);

        // AI 색상
        this.playerColors = {
            'player': '#3498db',
            'ai1': '#e74c3c',
            'ai2': '#2ecc71',
            'ai3': '#9b59b6'
        };

        this.init();
    }

    get currentTurn() {
        return this.players[this.currentTurnIndex];
    }

    get totalPlayers() {
        return this.players.length;
    }

    // 오늘 날짜 문자열 (YYYY-MM-DD)
    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    // 문자열을 숫자 해시로 변환
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // 시드 기반 난수 생성기 (Linear Congruential Generator)
    seededRandom() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }

    // 시드 기반 배열 셔플 (Fisher-Yates)
    seededShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    init() {
        this.setupEventListeners();
        this.showTutorial();
    }

    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.difficulty = btn.dataset.diff;
            });
        });
    }

    showTutorial() {
        document.getElementById('tutorial-modal').classList.add('show');
    }

    startGame() {
        document.getElementById('tutorial-modal').classList.remove('show');

        // 난이도에 따라 플레이어 설정
        switch (this.difficulty) {
            case 'easy':
                this.players = ['player', 'ai1'];
                break;
            case 'medium':
                this.players = ['player', 'ai1', 'ai2'];
                break;
            case 'hard':
                this.players = ['player', 'ai1', 'ai2', 'ai3'];
                break;
            default:
                this.players = ['player', 'ai1'];
        }

        console.log('%c═══════════════════════════════════════════', 'color: #f39c12');
        console.log(`%c🎮 [GAME] Starting Card Connect 4 (${this.difficulty.toUpperCase()}, ${this.totalPlayers} players)`, 'color: #f39c12; font-size: 14px; font-weight: bold');
        console.log(`%c👥 Players: ${this.players.join(' vs ')}`, 'color: #888');
        console.log('%c═══════════════════════════════════════════', 'color: #f39c12');
        this.resetGame();
        this.updateLegend();
    }

    updateLegend() {
        const legendContainer = document.querySelector('.legend');
        if (!legendContainer) return;

        const t = i18n[currentLang] || i18n.en;
        const aiNames = { ai1: 'AI 1', ai2: 'AI 2', ai3: 'AI 3' };

        let html = `
            <div class="legend-item">
                <div class="legend-color player-color"></div>
                <span>${t.you}</span>
            </div>
        `;

        // 현재 게임의 AI들만 표시
        for (const player of this.players) {
            if (player !== 'player') {
                html += `
                    <div class="legend-item">
                        <div class="legend-color ${player}-color"></div>
                        <span>${aiNames[player]}</span>
                    </div>
                `;
            }
        }

        legendContainer.innerHTML = html;
    }

    resetGame() {
        // Initialize board
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));

        // 시드 초기화 (매 게임마다 새로운 랜덤)
        this.todayString = Date.now().toString();
        this.seed = this.hashString(this.todayString);

        // 각 플레이어별 덱 생성 및 셔플
        this.decks = {};
        for (const player of this.players) {
            this.decks[player] = this.createDeck();
            this.seededShuffle(this.decks[player]);
        }

        this.currentCard = null;
        this.currentTurnIndex = 0;
        this.turnCount = 0;
        this.playerCardSum = 0;
        this.gameOver = false;
        this.winner = null;
        this.lastAIMove = null;

        this.renderBoard();
        this.drawCard();  // 첫 카드 뽑기
        this.updateUI();

        document.getElementById('result-modal').classList.remove('show');
    }

    createDeck() {
        const deck = [];
        // 1, 2, 3: 3 each
        for (let i = 1; i <= 3; i++) {
            for (let j = 0; j < 3; j++) deck.push(i);
        }
        // 4, 5, 6, 7: 2 each
        for (let i = 4; i <= 7; i++) {
            for (let j = 0; j < 2; j++) deck.push(i);
        }
        // 8, 9, 10: 1 each
        for (let i = 8; i <= 10; i++) {
            deck.push(i);
        }
        return deck;
    }

    drawCard() {
        const currentPlayer = this.currentTurn;
        const deck = this.decks[currentPlayer];

        if (deck && deck.length > 0) {
            this.currentCard = deck.pop();
            const color = this.playerColors[currentPlayer] || '#888';
            const icon = currentPlayer === 'player' ? '🎴' : '🤖';
            console.log(`%c${icon} [${currentPlayer}] Drew card: ${this.currentCard} (${deck.length} remaining)`, `color: ${color}; font-weight: bold`);
        } else {
            this.currentCard = null;
            console.log('%c⚠️ No cards left!', 'color: #f39c12');
        }
        this.updateCurrentCardDisplay();
    }

    updateCurrentCardDisplay() {
        const cardEl = document.getElementById('current-card');
        const deckCountEl = document.getElementById('deck-count');
        const currentPlayer = this.currentTurn;
        const deck = this.decks[currentPlayer];

        if (this.currentCard !== null && currentPlayer === 'player') {
            cardEl.textContent = this.currentCard;
            cardEl.className = 'current-card-value player';
        } else if (this.currentCard !== null && currentPlayer.startsWith('ai')) {
            cardEl.textContent = '?';
            cardEl.className = 'current-card-value ai';
            cardEl.style.backgroundColor = this.playerColors[currentPlayer];
        } else {
            cardEl.textContent = '-';
            cardEl.className = 'current-card-value empty';
        }

        deckCountEl.textContent = deck ? deck.length : 0;
    }

    renderBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';

        // Render from top (row 5) to bottom (row 0)
        for (let row = this.ROWS - 1; row >= 0; row--) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    // 멀티플레이어: 각 플레이어별 클래스
                    if (piece.player === 'player') {
                        cell.classList.add('player');
                    } else {
                        // ai1, ai2, ai3 각각 다른 클래스 적용
                        cell.classList.add(piece.player);
                    }
                    cell.innerHTML = `<span class="card-number">${piece.value}</span>`;
                }

                // 플레이어 턴일 때만 클릭 가능
                if (this.currentTurn === 'player' && !this.gameOver && this.currentCard !== null) {
                    if (this.canPlaceAt(row, col, this.currentCard)) {
                        cell.classList.add('placeable');
                    }
                }

                cell.addEventListener('click', () => {
                    if (this.currentTurn === 'player' && !this.gameOver && this.currentCard !== null) {
                        this.playerMove(row, col);
                    }
                });

                boardEl.appendChild(cell);
            }
        }

        // AI 마지막 이동 하이라이트 다시 적용
        this.applyAIHighlight();
    }

    canPlaceAt(row, col, cardValue) {
        const currentPiece = this.board[row][col];

        if (currentPiece === null) {
            // 빈 칸은 아무 카드나 놓을 수 있음
            return true;
        }

        // 기존 카드가 있으면, 더 높은 숫자만 덮을 수 있음
        return cardValue > currentPiece.value;
    }

    playerMove(row, col) {
        if (!this.canPlaceAt(row, col, this.currentCard)) {
            return;
        }

        // 이전 AI 하이라이트 제거
        this.clearAIHighlight();

        const prevPiece = this.board[row][col];
        const action = prevPiece ? `covered ${prevPiece.value}` : 'empty cell';
        console.log(`%c📍 [Player] Placed ${this.currentCard} at (${row},${col}) - ${action}`, 'color: #3498db');

        // 카드 배치
        this.board[row][col] = { player: 'player', value: this.currentCard };
        this.playerCardSum += this.currentCard;
        this.turnCount++;

        this.renderBoard();
        this.updateUI();

        // Check for win
        if (this.checkWin('player')) {
            console.log(`%c🎉 [GAME] PLAYER WINS!`, 'color: #2ecc71; font-size: 16px; font-weight: bold');
            this.gameOver = true;
            this.winner = 'player';
            setTimeout(() => this.showResult(), 500);
            return;
        }

        // Check for draw
        if (this.checkDraw()) {
            console.log(`%c🤝 [GAME] DRAW!`, 'color: #f39c12; font-size: 16px; font-weight: bold');
            this.gameOver = true;
            this.winner = 'draw';
            setTimeout(() => this.showResult(), 500);
            return;
        }

        // 다음 플레이어로 전환
        this.nextTurn();
    }

    nextTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
        this.drawCard();
        this.updateUI();

        if (this.currentTurn.startsWith('ai')) {
            setTimeout(() => this.aiMove(), 800);
        } else {
            this.renderBoard();
        }
    }

    async aiMove() {
        const currentAI = this.currentTurn;
        const aiColor = this.playerColors[currentAI];

        if (this.currentCard === null) {
            // AI 덱이 비었으면 다음 턴
            this.nextTurn();
            return;
        }

        // Gemini API 호출 시도, 실패시 로컬 AI 사용
        let move;
        if (this.useGeminiAI) {
            move = await this.getGeminiMove(currentAI);
        }
        if (!move) {
            move = this.getLocalAIMove(currentAI);
        }

        if (move) {
            const { row, col } = move;
            const prevPiece = this.board[row][col];
            const action = prevPiece ? `covered ${prevPiece.player}'s ${prevPiece.value}` : 'empty cell';

            this.board[row][col] = { player: currentAI, value: this.currentCard };
            console.log(`%c🤖 [${currentAI}] Placed ${this.currentCard} at (${row},${col}) - ${action}`, `color: ${aiColor}; font-weight: bold`);

            this.renderBoard();
            this.highlightMove(row, col);

            // Check for win (이 AI가 이겼는지)
            if (this.checkWin(currentAI)) {
                console.log(`%c🏆 [GAME] ${currentAI.toUpperCase()} WINS!`, `color: ${aiColor}; font-size: 16px; font-weight: bold`);
                this.gameOver = true;
                this.winner = currentAI;
                setTimeout(() => this.showResult(), 500);
                return;
            }

            // Check for draw
            if (this.checkDraw()) {
                console.log(`%c🤝 [GAME] DRAW!`, 'color: #f39c12; font-size: 16px; font-weight: bold');
                this.gameOver = true;
                this.winner = 'draw';
                setTimeout(() => this.showResult(), 500);
                return;
            }
        }

        // 다음 플레이어로
        this.nextTurn();
    }

    // Gemini API 호출
    async getGeminiMove(aiPlayerId) {
        console.log(`%c🌐 [${aiPlayerId}] Calling Gemini API...`, 'color: #9b59b6');

        try {
            const response = await fetch(`${this.apiBaseUrl}/ai-move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    board: this.board,
                    aiCard: this.currentCard,
                    aiPlayerId: aiPlayerId,
                    totalPlayers: this.totalPlayers
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`%c✨ [${aiPlayerId}] Gemini chose: (${data.row}, ${data.col})`, 'color: #9b59b6; font-weight: bold');
                if (data.reason) {
                    console.log(`%c💭 [${aiPlayerId}] Reason: ${data.reason}`, 'color: #8e44ad');
                }
                // 유효성 검사
                if (this.canPlaceAt(data.row, data.col, this.currentCard)) {
                    return { row: data.row, col: data.col };
                } else {
                    console.log(`%c⚠️ [${aiPlayerId}] Gemini move invalid, using fallback`, 'color: #f39c12');
                }
            } else {
                console.log(`%c⚠️ [${aiPlayerId}] Gemini failed: ${data.error}, using fallback`, 'color: #f39c12');
            }
        } catch (error) {
            console.log(`%c⚠️ [${aiPlayerId}] API error: ${error.message}, using fallback`, 'color: #f39c12');
        }

        return null;
    }

    // 로컬 AI (기존 로직)
    getLocalAIMove(aiPlayerId) {
        console.log(`%c🧠 [${aiPlayerId}] Using local AI (Card: ${this.currentCard})`, 'color: #9b59b6; font-weight: bold');
        return this.getAIMove(aiPlayerId);
    }

    getAIMove(aiPlayerId = 'ai1') {
        console.log(`%c🧠 [${aiPlayerId}] Thinking... (Card: ${this.currentCard})`, 'color: #9b59b6; font-weight: bold');

        // Get all valid moves for current card
        const validMoves = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.canPlaceAt(row, col, this.currentCard)) {
                    validMoves.push({ row, col });
                }
            }
        }

        console.log(`   Valid moves: ${validMoves.length} positions`);

        if (validMoves.length === 0) {
            console.log('%c   ❌ No valid moves!', 'color: #e74c3c');
            return null;
        }

        let move;
        switch (this.difficulty) {
            case 'easy':
                move = this.getRandomMove(validMoves);
                console.log(`   🎲 Random move selected`);
                break;
            case 'medium':
                move = this.getMediumMove(validMoves);
                break;
            case 'hard':
                move = this.getHardMove(validMoves);
                break;
            default:
                move = this.getMediumMove(validMoves);
        }
        return move;
    }

    getRandomMove(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    getMediumMove(validMoves) {
        // 1. 즉시 이기는 수
        for (const move of validMoves) {
            if (this.wouldWin(move.row, move.col, 'ai')) {
                console.log(`%c   ✅ [Medium] WINNING MOVE at (${move.row},${move.col})`, 'color: #2ecc71; font-weight: bold');
                return move;
            }
        }

        // 2. 플레이어가 다음 턴에 이기는 것 방어
        for (const move of validMoves) {
            if (this.wouldPlayerWinHere(move.row, move.col)) {
                console.log(`%c   🛡️ [Medium] BLOCKING player win at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 3. 3목 만들기 (한 수 만에 이기는 위치)
        for (const move of validMoves) {
            if (this.wouldMakeThree(move.row, move.col, 'ai')) {
                console.log(`%c   🎯 [Medium] Making 3-in-a-row at (${move.row},${move.col})`, 'color: #3498db');
                return move;
            }
        }

        // 4. 플레이어 3목 방어 (연속 2개 + 양쪽 열림)
        for (const move of validMoves) {
            if (this.wouldBlockPlayerThree(move.row, move.col)) {
                console.log(`%c   🛡️ [Medium] Blocking player 3-in-a-row at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 4.5. 플레이어 2목 확장 방어 (열린 2목 막기)
        for (const move of validMoves) {
            if (this.wouldBlockOpenTwo(move.row, move.col)) {
                console.log(`%c   🛡️ [Medium] Blocking player open 2-in-a-row at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 5. 2목 만들기 (연결 확장)
        for (const move of validMoves) {
            if (this.wouldMakeTwo(move.row, move.col, 'ai')) {
                console.log(`%c   🔗 [Medium] Making 2-in-a-row at (${move.row},${move.col})`, 'color: #9b59b6');
                return move;
            }
        }

        // 6. 중앙 선호 + 빈 칸 선호 + 낮은 카드 보호
        validMoves.sort((a, b) => {
            const aCenter = Math.abs(a.row - 2.5) + Math.abs(a.col - 3);
            const bCenter = Math.abs(b.row - 2.5) + Math.abs(b.col - 3);
            const aEmpty = this.board[a.row][a.col] === null ? 0 : 1;
            const bEmpty = this.board[b.row][b.col] === null ? 0 : 1;
            // 낮은 카드는 중앙 피하기 (덮이기 쉬움)
            const aRisk = (this.currentCard <= 3 && aCenter < 2) ? 5 : 0;
            const bRisk = (this.currentCard <= 3 && bCenter < 2) ? 5 : 0;
            return (aEmpty - bEmpty) + (aRisk - bRisk) || (aCenter - bCenter);
        });

        console.log(`%c   📍 [Medium] Fallback: center preference at (${validMoves[0].row},${validMoves[0].col})`, 'color: #95a5a6');
        return validMoves[0];
    }

    getHardMove(validMoves) {
        // 1. 즉시 이기는 수
        for (const move of validMoves) {
            if (this.wouldWin(move.row, move.col, 'ai')) {
                console.log(`%c   ✅ [Hard] WINNING MOVE at (${move.row},${move.col})`, 'color: #2ecc71; font-weight: bold');
                return move;
            }
        }

        // 2. 플레이어가 다음 턴에 이기는 것 방어
        for (const move of validMoves) {
            if (this.wouldPlayerWinHere(move.row, move.col)) {
                console.log(`%c   🛡️ [Hard] BLOCKING player win at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 3. 포크 공격 (동시에 2곳에서 이기는 위협)
        for (const move of validMoves) {
            if (this.wouldCreateFork(move.row, move.col, 'ai')) {
                console.log(`%c   ⚔️ [Hard] FORK ATTACK at (${move.row},${move.col}) - double threat!`, 'color: #e74c3c; font-weight: bold');
                return move;
            }
        }

        // 4. 포크 방어 (플레이어 포크 차단)
        for (const move of validMoves) {
            if (this.wouldBlockPlayerFork(move.row, move.col)) {
                console.log(`%c   🛡️ [Hard] BLOCKING player fork at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 5. 3목 만들기
        for (const move of validMoves) {
            if (this.wouldMakeThree(move.row, move.col, 'ai')) {
                console.log(`%c   🎯 [Hard] Making 3-in-a-row at (${move.row},${move.col})`, 'color: #3498db');
                return move;
            }
        }

        // 6. 플레이어 3목 방어
        for (const move of validMoves) {
            if (this.wouldBlockPlayerThree(move.row, move.col)) {
                console.log(`%c   🛡️ [Hard] Blocking player 3-in-a-row at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 6.5. 플레이어 열린 2목 방어
        for (const move of validMoves) {
            if (this.wouldBlockOpenTwo(move.row, move.col)) {
                console.log(`%c   🛡️ [Hard] Blocking player open 2-in-a-row at (${move.row},${move.col})`, 'color: #e67e22');
                return move;
            }
        }

        // 7. 종합 평가로 최선의 수 선택
        let bestMove = null;
        let bestScore = -Infinity;
        const scoreLog = [];

        for (const move of validMoves) {
            const score = this.evaluateMoveAdvanced(move.row, move.col, 'ai');
            scoreLog.push({ pos: `(${move.row},${move.col})`, score });
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        // 상위 5개 점수 출력
        scoreLog.sort((a, b) => b.score - a.score);
        console.log(`%c   📊 [Hard] Evaluation scores (top 5):`, 'color: #9b59b6');
        scoreLog.slice(0, 5).forEach((s, i) => {
            console.log(`      ${i + 1}. ${s.pos}: ${s.score}`);
        });
        console.log(`%c   📍 [Hard] Best evaluated move at (${bestMove.row},${bestMove.col}) with score ${bestScore}`, 'color: #9b59b6');

        return bestMove || this.getRandomMove(validMoves);
    }

    // 플레이어가 이 위치에 놓으면 이기는지 체크
    wouldPlayerWinHere(row, col) {
        const originalPiece = this.board[row][col];
        // 플레이어가 가질 수 있는 모든 카드로 테스트
        for (let cardVal = 1; cardVal <= 10; cardVal++) {
            if (originalPiece === null || cardVal > originalPiece.value) {
                this.board[row][col] = { player: 'player', value: cardVal };
                if (this.checkWin('player')) {
                    this.board[row][col] = originalPiece;
                    return true;
                }
            }
        }
        this.board[row][col] = originalPiece;
        return false;
    }

    // 3목을 만드는지 체크 (4목까지 한 수 남음)
    wouldMakeThree(row, col, player) {
        const originalPiece = this.board[row][col];
        this.board[row][col] = { player, value: this.currentCard };

        const result = this.hasThreeInRow(row, col, player);

        this.board[row][col] = originalPiece;
        return result;
    }

    // 특정 위치에서 3목이 있는지
    hasThreeInRow(row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let count = 1;
            let openEnds = 0;

            // 양방향으로 체크
            for (let dir = -1; dir <= 1; dir += 2) {
                let hasOpen = false;
                for (let i = 1; i <= 3; i++) {
                    const r = row + dr * i * dir;
                    const c = col + dc * i * dir;
                    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;

                    const piece = this.board[r][c];
                    if (piece?.player === player) {
                        count++;
                    } else if (piece === null) {
                        hasOpen = true;
                        break;
                    } else {
                        // 상대 카드지만 덮을 수 있으면 열린 끝
                        if (piece.value < 10) hasOpen = true;
                        break;
                    }
                }
                if (hasOpen) openEnds++;
            }

            // 3목이고 최소 한쪽이 열려있으면
            if (count === 3 && openEnds >= 1) {
                return true;
            }
        }
        return false;
    }

    // 플레이어의 3목 차단 (플레이어가 이미 3개 연속일 때만 - 4번째 위치 차단)
    // 2개만 있을 때는 wouldBlockOpenTwo에서 처리 (더 낮은 우선순위)
    wouldBlockPlayerThree(row, col) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let countPositive = 0;
            let countNegative = 0;

            // 양의 방향
            for (let i = 1; i <= 3; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                if (this.board[r][c]?.player === 'player') {
                    countPositive++;
                } else break;
            }

            // 음의 방향
            for (let i = 1; i <= 3; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                if (this.board[r][c]?.player === 'player') {
                    countNegative++;
                } else break;
            }

            // 총 3개 이상 연속일 때만 차단 (실제로 위험한 상황)
            // 2개일 때 조기 차단하면 오히려 포크 상황을 만들어줌
            const total = countPositive + countNegative;
            if (total >= 3) {
                return true;
            }
        }
        return false;
    }

    // 플레이어의 열린 2목 차단 (확장 방지)
    wouldBlockOpenTwo(row, col) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            // 양방향으로 플레이어 카드 세기
            let countPositive = 0;
            let countNegative = 0;
            let openPositive = false;
            let openNegative = false;

            // 양의 방향
            for (let i = 1; i <= 2; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                const piece = this.board[r][c];
                if (piece?.player === 'player') {
                    countPositive++;
                } else if (piece === null || piece.value < 10) {
                    openPositive = true;
                    break;
                } else break;
            }

            // 음의 방향
            for (let i = 1; i <= 2; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                const piece = this.board[r][c];
                if (piece?.player === 'player') {
                    countNegative++;
                } else if (piece === null || piece.value < 10) {
                    openNegative = true;
                    break;
                } else break;
            }

            // 열린 2목: 한쪽에 2개 연속 + 반대쪽 열림
            // 또는: 양쪽에 1개씩 + 양쪽 열림
            if (countPositive >= 2 && openNegative) {
                return true;
            }
            if (countNegative >= 2 && openPositive) {
                return true;
            }
            if (countPositive === 1 && countNegative === 1 && (openPositive || openNegative)) {
                return true;
            }
        }
        return false;
    }

    // 2목 만들기
    wouldMakeTwo(row, col, player) {
        const originalPiece = this.board[row][col];
        this.board[row][col] = { player, value: this.currentCard };

        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        let result = false;

        for (const [dr, dc] of directions) {
            let count = 1;
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 1; i <= 2; i++) {
                    const r = row + dr * i * dir;
                    const c = col + dc * i * dir;
                    if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS &&
                        this.board[r][c]?.player === player) {
                        count++;
                    } else break;
                }
            }
            if (count === 2) {
                result = true;
                break;
            }
        }

        this.board[row][col] = originalPiece;
        return result;
    }

    // 포크 공격 (동시에 2곳에서 이기는 위협 생성)
    wouldCreateFork(row, col, player) {
        const originalPiece = this.board[row][col];
        this.board[row][col] = { player, value: this.currentCard };

        let winningThreats = 0;

        // 이 위치에서 각 방향으로 3목 체크
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            if (this.hasOpenThree(row, col, player, dr, dc)) {
                winningThreats++;
            }
        }

        this.board[row][col] = originalPiece;
        return winningThreats >= 2;
    }

    // 열린 3목 체크 (한 수에 이길 수 있는 위협)
    hasOpenThree(row, col, player, dr, dc) {
        let count = 1;
        let openEnds = 0;

        for (let dir = -1; dir <= 1; dir += 2) {
            let blocked = false;
            for (let i = 1; i <= 3; i++) {
                const r = row + dr * i * dir;
                const c = col + dc * i * dir;
                if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) {
                    blocked = true;
                    break;
                }

                const piece = this.board[r][c];
                if (piece?.player === player) {
                    count++;
                } else if (piece === null || piece.value < 10) {
                    openEnds++;
                    break;
                } else {
                    blocked = true;
                    break;
                }
            }
        }

        return count >= 3 && openEnds >= 1;
    }

    // 플레이어 포크 차단
    wouldBlockPlayerFork(row, col) {
        const originalPiece = this.board[row][col];

        // 플레이어가 여기에 놓으면 포크가 되는지 체크
        for (let cardVal = 1; cardVal <= 10; cardVal++) {
            if (originalPiece === null || cardVal > originalPiece.value) {
                this.board[row][col] = { player: 'player', value: cardVal };

                let threats = 0;
                const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
                for (const [dr, dc] of directions) {
                    if (this.hasOpenThree(row, col, 'player', dr, dc)) {
                        threats++;
                    }
                }

                this.board[row][col] = originalPiece;
                if (threats >= 2) return true;
            }
        }

        this.board[row][col] = originalPiece;
        return false;
    }

    // 고급 평가 함수
    evaluateMoveAdvanced(row, col, player) {
        const originalPiece = this.board[row][col];
        this.board[row][col] = { player, value: this.currentCard };

        let score = 0;

        // 1. 연결 점수
        score += this.countConnected(row, col, player) * 15;

        // 2. 중앙 보너스
        score += (3 - Math.abs(col - 3)) * 5;
        score += (2.5 - Math.abs(row - 2.5)) * 3;

        // 3. 빈 칸 선호 (덮기보다 새 위치)
        if (originalPiece === null) {
            score += 10;
        }

        // 4. 높은 카드로 낮은 위치 덮는 것 피하기
        if (originalPiece !== null && this.currentCard >= 8) {
            score -= 15; // 높은 카드는 아껴야 함
        }

        // 5. 덮일 위험 평가
        if (this.currentCard < 5) {
            // 낮은 카드는 쉽게 덮일 수 있음
            score -= (5 - this.currentCard) * 2;
        }

        // 6. 라인 확장 가능성
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            let potential = 0;
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 1; i <= 3; i++) {
                    const r = row + dr * i * dir;
                    const c = col + dc * i * dir;
                    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
                    const piece = this.board[r][c];
                    if (piece === null) potential += 2;
                    else if (piece.player === player) potential += 3;
                    else if (piece.value < this.currentCard) potential += 1;
                    else break;
                }
            }
            score += potential;
        }

        this.board[row][col] = originalPiece;
        return score;
    }

    wouldWin(row, col, player) {
        const originalPiece = this.board[row][col];
        this.board[row][col] = { player, value: this.currentCard };

        const wins = this.checkWin(player);

        this.board[row][col] = originalPiece;

        return wins;
    }

    countConnected(row, col, player) {
        let total = 0;
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal /
            [1, -1]   // diagonal \
        ];

        for (const [dr, dc] of directions) {
            let count = 1;
            // Count in positive direction
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS &&
                    this.board[r][c]?.player === player) {
                    count++;
                } else break;
            }
            // Count in negative direction
            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS &&
                    this.board[r][c]?.player === player) {
                    count++;
                } else break;
            }
            if (count >= 2) total += count;
        }

        return total;
    }

    checkWin(player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal /
            [1, -1]   // diagonal \
        ];

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]?.player !== player) continue;

                for (const [dr, dc] of directions) {
                    let count = 1;
                    const winningCells = [[row, col]];

                    for (let i = 1; i < 4; i++) {
                        const r = row + dr * i;
                        const c = col + dc * i;
                        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS &&
                            this.board[r][c]?.player === player) {
                            count++;
                            winningCells.push([r, c]);
                        } else break;
                    }

                    if (count >= 4) {
                        this.highlightWinningCells(winningCells);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    highlightWinningCells(cells) {
        cells.forEach(([row, col]) => {
            const cellEl = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cellEl) {
                cellEl.classList.add('winning');
            }
        });
    }

    highlightMove(row, col) {
        // AI 마지막 이동 저장
        this.lastAIMove = { row, col };
        this.applyAIHighlight();
    }

    applyAIHighlight() {
        // 이전 AI 하이라이트 제거
        document.querySelectorAll('.cell.ai-last-move').forEach(cell => {
            cell.classList.remove('ai-last-move');
        });

        // 새 하이라이트 적용
        if (this.lastAIMove) {
            const { row, col } = this.lastAIMove;
            const cellEl = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cellEl) {
                cellEl.classList.add('ai-last-move');
            }
        }
    }

    clearAIHighlight() {
        this.lastAIMove = null;
        document.querySelectorAll('.cell.ai-last-move').forEach(cell => {
            cell.classList.remove('ai-last-move');
        });
    }

    checkDraw() {
        // 모든 플레이어 덱이 비었고, 현재 카드도 없으면 무승부
        const allDecksEmpty = this.players.every(p => !this.decks[p] || this.decks[p].length === 0);
        if (allDecksEmpty && this.currentCard === null) {
            return true;
        }

        // 놓을 수 있는 곳이 없으면 (모든 칸이 10으로 차있으면)
        let hasValidMove = false;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] === null || this.board[row][col].value < 10) {
                    hasValidMove = true;
                    break;
                }
            }
            if (hasValidMove) break;
        }

        return !hasValidMove;
    }

    updateUI() {
        document.getElementById('turn-count').textContent = this.turnCount;
        document.getElementById('card-sum').textContent = this.playerCardSum;
        document.getElementById('est-score').textContent = this.calculateScore();

        const turnIndicator = document.getElementById('turn-indicator');
        const currentPlayer = this.currentTurn;

        if (currentPlayer === 'player') {
            turnIndicator.className = 'turn-indicator player';
            turnIndicator.style.background = '';
            turnIndicator.textContent = this.currentCard !== null
                ? `${t('yourTurn')} - [${this.currentCard}] ${t('placeCard')}`
                : t('noCardsLeft');
        } else if (currentPlayer.startsWith('ai')) {
            turnIndicator.className = `turn-indicator ${currentPlayer}`;
            turnIndicator.style.background = '';
            const aiNumber = currentPlayer.replace('ai', '');
            turnIndicator.textContent = `AI ${aiNumber} ${t('aiThinking')}`;
        }

        this.updateCurrentCardDisplay();
    }

    calculateScore() {
        const baseScore = 1000;
        const cardPenalty = this.playerCardSum * 5;
        const turnPenalty = this.turnCount * 10;
        return Math.max(0, baseScore - cardPenalty - turnPenalty);
    }

    calculateFinalScore() {
        let score = 1000;
        const cardPenalty = this.playerCardSum * 5;
        const turnPenalty = this.turnCount * 10;

        score -= cardPenalty;
        score -= turnPenalty;

        // Bonus for low cards in winning line
        let minCardInWin = 10;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        outer:
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]?.player !== 'player') continue;

                for (const [dr, dc] of directions) {
                    const cells = [[row, col]];
                    for (let i = 1; i < 4; i++) {
                        const r = row + dr * i;
                        const c = col + dc * i;
                        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS &&
                            this.board[r][c]?.player === 'player') {
                            cells.push([r, c]);
                        } else break;
                    }
                    if (cells.length >= 4) {
                        cells.forEach(([r, c]) => {
                            minCardInWin = Math.min(minCardInWin, this.board[r][c].value);
                        });
                        break outer;
                    }
                }
            }
        }

        // Low card bonus
        if (minCardInWin <= 1) score += 200;
        else if (minCardInWin <= 2) score += 150;
        else if (minCardInWin <= 3) score += 100;
        else if (minCardInWin <= 4) score += 50;

        // Fast win bonus
        if (this.turnCount <= 6) score += 150;
        else if (this.turnCount <= 10) score += 100;
        else if (this.turnCount <= 15) score += 50;

        return Math.max(0, score);
    }

    showResult() {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('result-title');
        const scoreEl = document.getElementById('final-score');
        const details = document.getElementById('score-details');

        if (this.winner === 'player') {
            title.textContent = t('victory');
            title.style.color = '#2ecc71';

            const finalScore = this.calculateFinalScore();
            scoreEl.textContent = finalScore;

            const cardPenalty = this.playerCardSum * 5;
            const turnPenalty = this.turnCount * 10;
            let bonusText = '';
            if (this.turnCount <= 6) bonusText = `+150 (${t('superFast')})`;
            else if (this.turnCount <= 10) bonusText = `+100 (${t('fastWin')})`;
            else if (this.turnCount <= 15) bonusText = `+50 (${t('quickWin')})`;
            else bonusText = '+0';

            details.innerHTML = `
                <p><span>${t('baseScore')}:</span><span>1000</span></p>
                <p><span>${t('cardSumPenalty')} (${this.playerCardSum} × 5):</span><span>-${cardPenalty}</span></p>
                <p><span>${t('turnPenalty')} (${this.turnCount} × 10):</span><span>-${turnPenalty}</span></p>
                <p><span>${t('speedBonus')}:</span><span>${bonusText}</span></p>
            `;

        } else if (this.winner && this.winner.startsWith('ai')) {
            // AI 승리 (ai1, ai2, ai3)
            const aiNumber = this.winner.replace('ai', '');
            const aiColor = this.playerColors[this.winner];
            title.textContent = `${t('defeat')} (AI${aiNumber})`;
            title.style.color = aiColor;
            scoreEl.textContent = '0';

            details.innerHTML = `
                <p><span>AI${aiNumber} ${t('aiWonMsg')}</span></p>
                <p><span>${t('tryAgainMsg').replace('\n', '</span></p><p><span>')}</span></p>
            `;

        } else {
            title.textContent = t('draw');
            title.style.color = '#f39c12';
            scoreEl.textContent = Math.floor(this.calculateScore() / 2);

            details.innerHTML = `
                <p><span>${t('drawMsg')}</span></p>
                <p><span>${t('halfScoreMsg')}</span></p>
            `;
        }

        modal.classList.add('show');
    }
}

// Global instance
let game;

function showTutorial() {
    document.getElementById('tutorial-modal').classList.add('show');
}

function startGame() {
    if (!game) {
        game = new CardConnect4();
    }
    game.startGame();
}

function restartGame() {
    if (game) {
        game.resetGame();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    game = new CardConnect4();
});

class SudokuGame {
    constructor() {
        // 6x6 Sudoku with 2x3 boxes
        this.gridSize = 6;
        this.boxRows = 2;  // 2 rows per box
        this.boxCols = 3;  // 3 columns per box

        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.selectedCell = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'medium';

        this.init();
    }

    init() {
        this.bindEvents();
        this.newGame();
    }

    bindEvents() {
        // Difficulty change
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        // Control buttons
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());
        document.getElementById('check-btn').addEventListener('click', () => this.checkBoard());
        document.getElementById('play-again').addEventListener('click', () => this.newGame());
        document.getElementById('try-again').addEventListener('click', () => this.newGame());

        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const num = parseInt(e.target.dataset.number);
                this.enterNumber(num);
            });
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('number-modal');
            if (!e.target.closest('.cell') && !e.target.closest('.number-modal')) {
                modal.classList.remove('show');
                if (this.selectedCell) {
                    this.selectedCell.classList.remove('selected');
                    this.selectedCell = null;
                }
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.selectedCell && !this.selectedCell.classList.contains('fixed')) {
                if (e.key >= '1' && e.key <= '6') {
                    this.enterNumber(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    this.enterNumber(0);
                } else if (e.key === 'Escape') {
                    document.getElementById('number-modal').classList.remove('show');
                    this.selectedCell.classList.remove('selected');
                    this.selectedCell = null;
                }
            }
        });
    }

    newGame() {
        // Reset state
        this.mistakes = 0;
        this.timer = 0;
        this.selectedCell = null;
        document.getElementById('mistakes').textContent = '0';
        document.getElementById('win-modal').classList.remove('show');
        document.getElementById('gameover-modal').classList.remove('show');
        document.getElementById('number-modal').classList.remove('show');

        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Generate new puzzle
        this.generatePuzzle();
        this.renderBoard();
        this.startTimer();
    }

    generatePuzzle() {
        // Generate a complete valid 6x6 Sudoku solution
        this.solution = this.generateSolution();

        // Create puzzle by removing numbers based on difficulty
        const cellsToRemove = {
            easy: 12,    // 36 - 12 = 24 cells filled
            medium: 18,  // 36 - 18 = 18 cells filled
            hard: 24     // 36 - 24 = 12 cells filled
        };

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
        // Check row
        if (grid[row].includes(num)) return false;

        // Check column
        for (let i = 0; i < this.gridSize; i++) {
            if (grid[i][col] === num) return false;
        }

        // Check 2x3 box
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
        const totalCells = this.gridSize * this.gridSize;
        const positions = [];
        for (let i = 0; i < totalCells; i++) positions.push(i);
        this.shuffleArray(positions);

        for (let i = 0; i < count; i++) {
            const pos = positions[i];
            const row = Math.floor(pos / this.gridSize);
            const col = pos % this.gridSize;
            this.board[row][col] = 0;
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('sudoku-board');
        boardEl.innerHTML = '';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.initialBoard[row][col] !== 0) {
                    cell.textContent = this.initialBoard[row][col];
                    cell.classList.add('fixed');
                } else if (this.board[row][col] !== 0) {
                    cell.textContent = this.board[row][col];
                }

                cell.addEventListener('click', (e) => this.cellClick(e, cell));
                boardEl.appendChild(cell);
            }
        }
    }

    cellClick(e, cell) {
        if (cell.classList.contains('fixed')) return;

        // Remove previous selection
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }

        // Clear highlights
        document.querySelectorAll('.cell.highlighted').forEach(c => {
            c.classList.remove('highlighted');
        });

        // Select new cell
        this.selectedCell = cell;
        cell.classList.add('selected');

        // Highlight related cells
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.highlightRelatedCells(row, col);

        // Position and show number modal
        this.showNumberModal(e);
    }

    highlightRelatedCells(row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);
            const boxRow = Math.floor(row / this.boxRows);
            const boxCol = Math.floor(col / this.boxCols);
            const cellBoxRow = Math.floor(cellRow / this.boxRows);
            const cellBoxCol = Math.floor(cellCol / this.boxCols);

            if (cellRow === row || cellCol === col ||
                (boxRow === cellBoxRow && boxCol === cellBoxCol)) {
                if (!(cellRow === row && cellCol === col)) {
                    cell.classList.add('highlighted');
                }
            }
        });
    }

    showNumberModal(e) {
        const modal = document.getElementById('number-modal');
        const board = document.getElementById('sudoku-board');
        const boardRect = board.getBoundingClientRect();
        const cellRect = e.target.getBoundingClientRect();

        // Calculate modal position
        let left = cellRect.left - boardRect.left + cellRect.width / 2;
        let top = cellRect.top - boardRect.top + cellRect.height;

        // Adjust if modal goes off-screen
        const modalWidth = 200; // Approximate modal width
        const modalHeight = 100; // Approximate modal height

        if (left + modalWidth / 2 > boardRect.width) {
            left = boardRect.width - modalWidth / 2 - 10;
        }
        if (left - modalWidth / 2 < 0) {
            left = modalWidth / 2 + 10;
        }

        // Position modal below cell, or above if near bottom
        if (top + modalHeight > boardRect.height) {
            top = cellRect.top - boardRect.top - modalHeight - 10;
        }

        modal.style.left = `${left}px`;
        modal.style.top = `${top + 10}px`;
        modal.style.transform = 'translateX(-50%)';
        modal.classList.add('show');
    }

    enterNumber(num) {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (num === 0) {
            // Erase
            this.board[row][col] = 0;
            this.selectedCell.textContent = '';
            this.selectedCell.classList.remove('error');
        } else {
            // Enter number
            if (num === this.solution[row][col]) {
                // Correct
                this.board[row][col] = num;
                this.selectedCell.textContent = num;
                this.selectedCell.classList.remove('error');
                this.selectedCell.classList.add('success');
                setTimeout(() => {
                    this.selectedCell?.classList.remove('success');
                }, 300);

                // Check win
                if (this.checkWin()) {
                    this.gameWon();
                }
            } else {
                // Wrong
                this.mistakes++;
                document.getElementById('mistakes').textContent = this.mistakes;
                this.selectedCell.textContent = num;
                this.selectedCell.classList.add('error');
                this.board[row][col] = num;

                if (this.mistakes >= this.maxMistakes) {
                    this.gameOver();
                }
            }
        }

        // Hide modal
        document.getElementById('number-modal').classList.remove('show');
    }

    checkWin() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    gameWon() {
        clearInterval(this.timerInterval);
        document.getElementById('final-time').textContent =
            document.getElementById('timer').textContent;
        document.getElementById('win-modal').classList.add('show');
    }

    gameOver() {
        clearInterval(this.timerInterval);
        document.getElementById('gameover-modal').classList.add('show');
    }

    giveHint() {
        // Find an empty cell and fill it with the correct answer
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === 0 ||
                    this.board[row][col] !== this.solution[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;
        const num = this.solution[row][col];

        this.board[row][col] = num;

        // Update UI
        const cells = document.querySelectorAll('.cell');
        const cellIndex = row * this.gridSize + col;
        cells[cellIndex].textContent = num;
        cells[cellIndex].classList.remove('error');
        cells[cellIndex].classList.add('success');

        setTimeout(() => {
            cells[cellIndex].classList.remove('success');
        }, 500);

        // Check win
        if (this.checkWin()) {
            this.gameWon();
        }
    }

    checkBoard() {
        const cells = document.querySelectorAll('.cell');

        cells.forEach((cell, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;

            if (this.board[row][col] !== 0 && !cell.classList.contains('fixed')) {
                if (this.board[row][col] === this.solution[row][col]) {
                    cell.classList.add('success');
                } else {
                    cell.classList.add('error');
                }

                setTimeout(() => {
                    cell.classList.remove('success');
                }, 1000);
            }
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
            const seconds = (this.timer % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});

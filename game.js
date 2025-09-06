class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.colors = {
            I: '#00ffff', // シアン
            O: '#ffff00', // 黄色
            T: '#ff00ff', // マゼンタ
            S: '#00ff00', // 緑
            Z: '#ff0000', // 赤
            J: '#0000ff', // 青
            L: '#ffa500'  // オレンジ
        };
        
        this.pieces = {
            I: [
                [0,0,0,0],
                [1,1,1,1],
                [0,0,0,0],
                [0,0,0,0]
            ],
            O: [
                [1,1],
                [1,1]
            ],
            T: [
                [0,1,0],
                [1,1,1],
                [0,0,0]
            ],
            S: [
                [0,1,1],
                [1,1,0],
                [0,0,0]
            ],
            Z: [
                [1,1,0],
                [0,1,1],
                [0,0,0]
            ],
            J: [
                [1,0,0],
                [1,1,1],
                [0,0,0]
            ],
            L: [
                [0,0,1],
                [1,1,1],
                [0,0,0]
            ]
        };
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.bindEvents();
        this.createParticles();
        this.updateDisplay();
    }
    
    initBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('resetButton').addEventListener('click', () => this.resetGame());
    }
    
    createParticles() {
        const container = document.getElementById('particleContainer');
        setInterval(() => {
            if (Math.random() < 0.1) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }
        }, 200);
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.initBoard();
            this.score = 0;
            this.level = 1;
            this.lines = 0;
            this.dropInterval = 1000;
            this.spawnPiece();
            this.spawnNextPiece();
            this.updateDisplay();
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            if (this.gamePaused) {
                this.showOverlay('PAUSED', 'スペースキーで再開');
            } else {
                this.hideOverlay();
                this.gameLoop();
            }
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.initBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.updateDisplay();
        this.draw();
        this.drawNext();
        this.hideOverlay();
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            const types = Object.keys(this.pieces);
            const type = types[Math.floor(Math.random() * types.length)];
            this.currentPiece = {
                type: type,
                shape: this.pieces[type],
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[type][0].length / 2),
                y: 0,
                color: this.colors[type]
            };
        }
        
        this.spawnNextPiece();
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    spawnNextPiece() {
        const types = Object.keys(this.pieces);
        const type = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = {
            type: type,
            shape: this.pieces[type],
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[type][0].length / 2),
            y: 0,
            color: this.colors[type]
        };
        this.drawNext();
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) {
            if (e.code === 'Space') {
                if (this.gamePaused) {
                    this.togglePause();
                } else if (!this.gameRunning) {
                    this.startGame();
                }
            }
            return;
        }
        
        switch(e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
                this.togglePause();
                break;
        }
        e.preventDefault();
    }
    
    movePiece(dx, dy) {
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.rotate(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.draw();
        }
    }
    
    rotate(matrix) {
        const N = matrix.length;
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotated[j][N - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    checkCollision(piece, dx, dy) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        // ドロップエフェクト
        this.createDropEffect(this.currentPiece.x * this.BLOCK_SIZE + this.BLOCK_SIZE/2, 
                             this.currentPiece.y * this.BLOCK_SIZE + this.BLOCK_SIZE/2);
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
        this.draw();
    }
    
    clearLines() {
        let linesCleared = 0;
        const linesToClear = [];
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            // ラインクリアエフェクト
            linesToClear.forEach(y => {
                this.createLineClearEffect(y);
            });
            
            setTimeout(() => {
                linesToClear.forEach(y => {
                    this.board.splice(y, 1);
                    this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                });
                
                linesCleared = linesToClear.length;
                this.lines += linesCleared;
                this.score += this.calculateScore(linesCleared);
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                this.updateDisplay();
                this.draw();
            }, 300);
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }
    
    createLineClearEffect(y) {
        const effect = document.createElement('div');
        effect.className = 'line-clear-effect';
        effect.style.top = (y * this.BLOCK_SIZE) + 'px';
        effect.style.left = '0px';
        this.canvas.parentElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 500);
    }
    
    createDropEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'piece-drop-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        this.canvas.parentElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showOverlay('GAME OVER', 'スペースキーでリスタート');
    }
    
    showOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        const titleElement = document.getElementById('overlayTitle');
        const messageElement = document.getElementById('overlayMessage');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        overlay.classList.add('show');
    }
    
    hideOverlay() {
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.remove('show');
    }
    
    draw() {
        // ボードをクリア
        this.ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッドを描画
        this.drawGrid();
        
        // 配置済みのブロックを描画
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // メインブロック
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // グロー効果
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        this.ctx.shadowBlur = 0;
        
        // ハイライト
        const gradient = this.ctx.createLinearGradient(pixelX, pixelY, pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
    
    drawNext() {
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 25;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const pixelX = offsetX + x * blockSize;
                        const pixelY = offsetY + y * blockSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
                        
                        this.nextCtx.shadowColor = this.nextPiece.color;
                        this.nextCtx.shadowBlur = 5;
                        this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
                        this.nextCtx.shadowBlur = 0;
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

// DOMが読み込まれてからゲームを初期化
document.addEventListener('DOMContentLoaded', function() {
    const game = new TetrisGame();
    game.draw();
    game.drawNext();
});

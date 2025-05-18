// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    // Состояние игры
    const gameState = {
        players: [
            { name: 'Игрок 1', position: 0, money: 1500, color: '#ff0000' },
            { name: 'Игрок 2', position: 0, money: 1500, color: '#0000ff' }
        ],
        currentPlayer: 0,
        lastRoll: [1, 1],
        isAnimating: false
    };

    // DOM элементы
    const diceElements = [document.getElementById('dice1'), document.getElementById('dice2')];
    const rollButton = document.getElementById('rollDice');
    const currentPlayerElement = document.getElementById('currentPlayer');
    const lastActionElement = document.getElementById('lastAction');
    const board = document.querySelector('.board');

    // Создание фишек игроков
    function createPlayerPieces() {
        gameState.players.forEach((player, index) => {
            const piece = document.createElement('div');
            piece.className = 'player-piece';
            piece.id = `player${index + 1}-piece`;
            piece.style.backgroundColor = player.color;
            board.appendChild(piece);
            updatePlayerPosition(index);
        });
    }

    // Получение координат для позиции игрока внутри клетки
    function getPlayerPositionInCell(playerIndex, totalPlayers) {
        const radius = 15;
        const angle = (2 * Math.PI * playerIndex) / totalPlayers;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }

    // Обновление позиции фишки игрока
    function updatePlayerPosition(playerIndex) {
        const player = gameState.players[playerIndex];
        const piece = document.getElementById(`player${playerIndex + 1}-piece`);
        const cell = document.getElementById(`cell-${player.position}`);

        if (!cell) {
            console.error('Клетка не найдена:', player.position);
            return;
        }

        const cellRect = cell.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();
        const position = getPlayerPositionInCell(playerIndex, gameState.players.length);

        const centerX = cellRect.left - boardRect.left + (cellRect.width / 2);
        const centerY = cellRect.top - boardRect.top + (cellRect.height / 2);

        piece.style.left = `${centerX + position.x - (piece.offsetWidth / 2)}px`;
        piece.style.top = `${centerY + position.y - (piece.offsetHeight / 2)}px`;
    }

    // Анимация броска кубиков
    function animateDice() {
        return new Promise(resolve => {
            let rolls = 0;
            const maxRolls = 10;
            const interval = setInterval(() => {
                diceElements.forEach(dice => {
                    dice.textContent = Math.floor(Math.random() * 6) + 1;
                });
                rolls++;
                if (rolls >= maxRolls) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    // Бросок кубиков
    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    // Обработка хода игрока
    async function handleTurn() {
        if (gameState.isAnimating) return;
        
        gameState.isAnimating = true;
        rollButton.disabled = true;

        const player = gameState.players[gameState.currentPlayer];
        
        // Анимация кубиков
        await animateDice();
        
        // Бросаем кубики
        gameState.lastRoll = [rollDice(), rollDice()];
        const totalRoll = gameState.lastRoll[0] + gameState.lastRoll[1];
        
        // Обновляем отображение кубиков
        diceElements[0].textContent = gameState.lastRoll[0];
        diceElements[1].textContent = gameState.lastRoll[1];
        
        // Перемещаем игрока
        player.position = (player.position + totalRoll) % 40;
        updatePlayerPosition(gameState.currentPlayer);
        
        // Обновляем статус игры
        lastActionElement.textContent = `${player.name} выбросил ${totalRoll} и переместился на поле ${player.position}`;
        
        // Переход хода к следующему игроку
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;

        setTimeout(() => {
            gameState.isAnimating = false;
            rollButton.disabled = false;
        }, 500);
    }

    // Обновление позиций всех игроков при изменении размера окна
    window.addEventListener('resize', () => {
        if (gameState.isAnimating) return;
        gameState.players.forEach((_, index) => {
            updatePlayerPosition(index);
        });
    });

    // Инициализация игры
    function initGame() {
        createPlayerPieces();
        rollButton.addEventListener('click', handleTurn);
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;
    }

    initGame();
}); 
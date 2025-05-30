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

    // Описания клеток
    const cellDescriptions = {
        0: "Стартовая клетка. Получите 200₽ каждый раз, когда проходите через неё!",
        1: "Центр переработки отходов. Получите награду за ваш вклад в экологию!",
        2: "Общественный сад, где жители выращивают овощи и фрукты.",
        3: "Эко-бонус! Получите награду за заботу об окружающей среде.",
        4: "Современный центр сортировки отходов.",
        5: "Штраф за загрязнение окружающей среды.",
        6: "Экологичный трамвай - транспорт будущего!",
        7: "Карта шанса - может принести удачу или неудачу!",
        8: "Биологический рынок с местными продуктами.",
        9: "Станция зарядки электромобилей.",
        10: "Зона загрязнения - заплатите штраф за очистку!",
        // ... добавьте описания для остальных клеток
    };

    // Определение клеток
    const boardCases = [
        { id: 0, name: "Старт", type: "special", action: (player) => { player.money += 200; return "Вы получаете 200₽ за прохождение через старт!"; }},
        { id: 1, name: "Переработка", type: "action", action: (player) => { player.money += 100; return "Отличная работа по переработке! Получите 100₽."; }},
        { id: 2, name: "Общий сад", type: "property", action: (player) => { player.money += 50; return "Ваш сад приносит урожай! Получите 50₽."; }},
        { id: 3, name: "Эко-бонус", type: "bonus", action: (player) => { const bonus = Math.floor(Math.random() * 150) + 50; player.money += bonus; return `Экологический бонус! Вы получаете ${bonus}₽!`; }},
        { id: 4, name: "Современный центр сортировки отходов", type: "property", action: (player) => { player.money += 75; return "Votre centre de tri fonctionne bien! Recevez 75€."; }},
        { id: 5, name: "Штраф за загрязнение окружающей среды", type: "penalty", action: (player) => { player.money -= 100; return "Vous devez payer une taxe pollution de 100€."; }},
        { id: 6, name: "Экологичный трамвай - транспорт будущего", type: "transport", action: (player) => { player.money += 50; return "Transport écologique! Recevez 50€."; }},
        { id: 7, name: "Карта шанса - может принести удачу или неудачу", type: "chance", action: (player) => {
            const chances = [
                { bonus: 200, message: "Vous avez gagné un prix pour votre initiative écologique!" },
                { bonus: -50, message: "Vous devez réparer votre vélo." },
                { bonus: 100, message: "Votre jardin produit des fruits!" },
                { bonus: -100, message: "Vous devez installer des panneaux solaires." }
            ];
            const chance = chances[Math.floor(Math.random() * chances.length)];
            player.money += chance.bonus;
            return `${chance.message} ${chance.bonus > 0 ? "Gagnez" : "Perdez"} ${Math.abs(chance.bonus)}€.`;
        }},
        { id: 8, name: "Биологический рынок с местными продуктами", type: "property", action: (player) => { player.money += 60; return "Vos produits bio se vendent bien! Recevez 60€."; }},
        { id: 9, name: "Станция зарядки электромобилей", type: "property", action: (player) => { player.money += 80; return "Votre station de recharge électrique est très utilisée! Recevez 80€."; }},
        { id: 10, name: "Зона загрязнения - заплатите штраф за очистку", type: "penalty", action: (player) => { player.money -= 150; return "Vous êtes dans une zone polluée! Payez 150€ pour la dépollution."; }},
        { id: 11, name: "Эко-квартал", type: "property", action: (player) => { player.money += 90; return "Votre éco-quartier attire de nouveaux habitants! Recevez 90€."; }},
        { id: 12, name: "Карта шанса - может принести удачу или неудачу", type: "chance", action: (player) => {
            const chances = [
                { bonus: 150, message: "Vos panneaux solaires produisent plus que prévu!" },
                { bonus: -75, message: "Réparation de votre système de récupération d'eau." },
                { bonus: 80, message: "Vente de produits recyclés!" },
                { bonus: -120, message: "Installation d'un nouveau système de compostage." }
            ];
            const chance = chances[Math.floor(Math.random() * chances.length)];
            player.money += chance.bonus;
            return `${chance.message} ${chance.bonus > 0 ? "Gagnez" : "Perdez"} ${Math.abs(chance.bonus)}€.`;
        }},
        { id: 13, name: "Zéro déchet", type: "property", action: (player) => { player.money += 70; return "Votre initiative zéro déchet inspire la communauté! Recevez 70€."; }},
        { id: 14, name: "Potager", type: "property", action: (player) => { player.money += 55; return "Votre potager urbain produit des légumes bio! Recevez 55€."; }},
        { id: 15, name: "Bus électrique", type: "transport", action: (player) => { player.money += 60; return "Votre ligne de bus électrique est un succès! Recevez 60€."; }},
        { id: 16, name: "Panneau solaire", type: "property", action: (player) => { player.money += 85; return "Production d'énergie solaire optimale! Recevez 85€."; }},
        { id: 17, name: "Эко-бонус", type: "bonus", action: (player) => { const bonus = Math.floor(Math.random() * 120) + 30; player.money += bonus; return `Экологический бонус! Вы получаете ${bonus}₽!`; }},
        { id: 18, name: "Vélo", type: "transport", action: (player) => { player.money += 40; return "Votre service de vélos partagés cartonne! Recevez 40€."; }},
        { id: 19, name: "Tri sélectif", type: "property", action: (player) => { player.money += 65; return "Votre système de tri est exemplaire! Recevez 65€."; }},
        { id: 20, name: "Parc écologique", type: "property", action: (player) => { player.money += 120; return "Votre parc écologique attire les visiteurs! Recevez 120€."; }},
        { id: 21, name: "Recyclage", type: "property", action: (player) => { player.money += 95; return "Votre centre de recyclage fonctionne à plein régime! Recevez 95€."; }},
        { id: 22, name: "Карта шанса - может принести удачу или неудачу", type: "chance", action: (player) => {
            const chances = [
                { bonus: 180, message: "Subvention pour vos projets écologiques!" },
                { bonus: -60, message: "Maintenance de vos équipements écologiques." },
                { bonus: 90, message: "Prix de l'innovation verte!" },
                { bonus: -110, message: "Mise aux normes environnementales." }
            ];
            const chance = chances[Math.floor(Math.random() * chances.length)];
            player.money += chance.bonus;
            return `${chance.message} ${chance.bonus > 0 ? "Gagnez" : "Perdez"} ${Math.abs(chance.bonus)}€.`;
        }},
        { id: 23, name: "Энергия солнца", type: "property", action: (player) => { player.money += 110; return "Votre ferme solaire produit beaucoup d'énergie! Recevez 110€."; }},
        { id: 24, name: "Эолийная электростанция", type: "property", action: (player) => { player.money += 105; return "Vos эолийные электростанции работают на полную мощность! Recevez 105€."; }},
        { id: 25, name: "Экологический транспорт", type: "transport", action: (player) => { player.money += 70; return "Ваши экологические транспортные решения очень популярны! Recevez 70€."; }},
        { id: 26, name: "Эко-сад", type: "property", action: (player) => { player.money += 75; return "Ваш эко-сад привлекает клиентов! Recevez 75€."; }},
        { id: 27, name: "Компостирование", type: "property", action: (player) => { player.money += 60; return "Ваша система компостирования работает идеально! Recevez 60€."; }},
        { id: 28, name: "Вода", type: "property", action: (player) => { player.money += 100; return "Ваша система фильтрации воды эффективна! Recevez 100€."; }},
        { id: 29, name: "Лес", type: "property", action: (player) => { player.money += 115; return "Ваш городской лес улучшает качество воздуха! Recevez 115€."; }},
        { id: 30, name: "Зона загрязнения - заплатите штраф за очистку", type: "penalty", action: (player) => { player.money -= 150; return "Vous êtes dans une zone polluée! Payez 150€ pour la dépollution."; }},
        { id: 31, name: "Биоразнообразие", type: "property", action: (player) => { player.money += 95; return "Ваш проект биоразнообразия успешно завершен! Recevez 95€."; }},
        { id: 32, name: "Улей", type: "property", action: (player) => { player.money += 70; return "Ваши пчелы производят мед! Recevez 70€."; }},
        { id: 33, name: "Эко-бонус", type: "bonus", action: (player) => { const bonus = Math.floor(Math.random() * 130) + 40; player.money += bonus; return `Экологический бонус! Вы получаете ${bonus}₽!`; }},
        { id: 34, name: "Эко-ферма", type: "property", action: (player) => { player.money += 85; return "Ваша эко-ферма процветает! Recevez 85€."; }},
        { id: 35, name: "Поезд", type: "transport", action: (player) => { player.money += 80; return "Ваш экологический железнодорожный маршрут прибыльный! Recevez 80€."; }},
        { id: 36, name: "Карта шанса - может принести удачу или неудачу", type: "chance", action: (player) => {
            const chances = [
                { bonus: 160, message: "Récompense pour votre engagement écologique!" },
                { bonus: -80, message: "Investissement dans des équipements verts." },
                { bonus: 120, message: "Succès de votre campagne de sensibilisation!" },
                { bonus: -90, message: "Formation aux pratiques écologiques." }
            ];
            const chance = chances[Math.floor(Math.random() * chances.length)];
            player.money += chance.bonus;
            return `${chance.message} ${chance.bonus > 0 ? "Gagnez" : "Perdez"} ${Math.abs(chance.bonus)}€.`;
        }},
        { id: 37, name: "Переработка", type: "property", action: (player) => { player.money += 90; return "Ваша переработка делает картон! Recevez 90€."; }},
        { id: 38, name: "Углеродный налог", type: "penalty", action: (player) => { player.money -= 120; return "Вы должны заплатить углеродный налог! Payez 120€."; }},
        { id: 39, name: "Природный парк", type: "property", action: (player) => { player.money += 130; return "Ваш природный парк очень ценится! Recevez 130€."; }}
    ];

    // Элементы DOM
    const diceElements = [document.getElementById('dice1'), document.getElementById('dice2')];
    const rollButton = document.getElementById('rollDice');
    const currentPlayerElement = document.getElementById('currentPlayer');
    const lastActionElement = document.getElementById('lastAction');
    const board = document.querySelector('.board');
    
    // Модальное окно для информации о клетке
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const closeModal = document.querySelector('.close');

    // Модальное окно результатов хода
    const turnModal = document.getElementById('turnModal');
    const turnPlayerName = document.getElementById('turnPlayerName');
    const turnDice1 = document.getElementById('turnDice1');
    const turnDice2 = document.getElementById('turnDice2');
    const turnResult = document.getElementById('turnResult');
    const turnCell = document.getElementById('turnCell');
    const turnMoneyChange = document.getElementById('turnMoneyChange');
    const continueTurn = document.getElementById('continueTurn');

    // Обработчики модального окна информации
    closeModal.onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Обработчик кнопки продолжения хода
    continueTurn.onclick = () => {
        turnModal.style.display = "none";
        gameState.isAnimating = false;
        rollButton.disabled = false;
    };

    // Показать результаты хода
    function showTurnResults(player, diceResults, cell, moneyChange) {
        turnPlayerName.textContent = player.name;
        turnDice1.textContent = diceResults[0];
        turnDice2.textContent = diceResults[1];
        turnCell.textContent = cell.name;
        
        // Отображение изменения денег
        if (moneyChange > 0) {
            turnMoneyChange.className = 'money-change positive-money';
            turnMoneyChange.textContent = `+${moneyChange}₽`;
        } else if (moneyChange < 0) {
            turnMoneyChange.className = 'money-change negative-money';
            turnMoneyChange.textContent = `${moneyChange}₽`;
        } else {
            turnMoneyChange.className = 'money-change';
            turnMoneyChange.textContent = '0₽';
        }

        turnModal.style.display = "block";
    }

    // Показать информацию о клетке
    function showCellInfo(cellId) {
        const cell = boardCases.find(c => c.id === cellId);
        if (cell) {
            modalTitle.textContent = cell.name;
            modalDescription.textContent = cellDescriptions[cellId] || "Информация о клетке отсутствует";
            modal.style.display = "block";
        }
    }

    // Добавление обработчиков клика для клеток
    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const cellId = parseInt(cell.id.split('-')[1]);
            showCellInfo(cellId);
        });
    });

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

    // Получение координат для позиции игрока
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

    // Анимация кубиков
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

    // Обновление отображения денег
    function updateMoneyDisplay() {
        gameState.players.forEach((player, index) => {
            const moneyElement = document.getElementById(`player${index + 1}-money`);
            if (moneyElement) {
                moneyElement.textContent = player.money;
            }
        });
    }

    // Обработка хода игрока
    async function handleTurn() {
        if (gameState.isAnimating) return;
        
        gameState.isAnimating = true;
        rollButton.disabled = true;

        const player = gameState.players[gameState.currentPlayer];
        const oldMoney = player.money;
        
        await animateDice();
        
        gameState.lastRoll = [rollDice(), rollDice()];
        const totalRoll = gameState.lastRoll[0] + gameState.lastRoll[1];
        
        diceElements[0].textContent = gameState.lastRoll[0];
        diceElements[1].textContent = gameState.lastRoll[1];
        
        // Обновление позиции
        const oldPosition = player.position;
        player.position = (player.position + totalRoll) % boardCases.length;
        updatePlayerPosition(gameState.currentPlayer);
        
        // Применение эффектов клетки
        const currentCase = boardCases[player.position];
        const actionResult = currentCase.action(player);
        
        // Обновление интерфейса
        lastActionElement.textContent = `${player.name} выбросил ${totalRoll}, попал на клетку ${currentCase.name}. ${actionResult}`;
        
        // Обновление денег
        updateMoneyDisplay();
        
        // Показ модального окна с результатами
        const moneyChange = player.money - oldMoney;
        showTurnResults(player, gameState.lastRoll, currentCase, moneyChange);
        
        // Переход хода
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;
    }

    // Обновление позиций при изменении размера окна
    window.addEventListener('resize', () => {
        if (gameState.isAnimating) return;
        gameState.players.forEach((_, index) => {
            updatePlayerPosition(index);
        });
    });

    // Инициализация игры
    function initGame() {
        createPlayerPieces();
        updateMoneyDisplay();
        rollButton.addEventListener('click', handleTurn);
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;
        lastActionElement.textContent = "Игра началась";
    }

    initGame();
}); 
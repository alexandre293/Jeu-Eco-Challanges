document.addEventListener('DOMContentLoaded', () => {
    const SAVE_KEY = 'eco_save_v7'; // même clé que la page d'accueil

    // ===== 1) Lecture de la config (page d'accueil) =====
    let savedConfig = null;
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) savedConfig = JSON.parse(raw);
    } catch (e) {
        console.error('Erreur lecture localStorage', e);
    }

    const nbPlayers = savedConfig?.players ?? 2;
    const savedNames = savedConfig?.names ?? [];
    const botMode = savedConfig?.bot ?? 'none';

    // Couleurs
    const playerColors = ['#ff0000', '#0000ff', '#00aa00', '#ff00ff'];

    // ===== 2) Création des joueurs (règlement: 30💰 / 40🌱 / 20⭐) =====
    const players = [];
    for (let i = 0; i < nbPlayers; i++) {
        players.push({
            name: savedNames[i] && savedNames[i].trim() !== '' ? savedNames[i].trim() : `Joueur ${i + 1}`,
            position: 0,
            money: 30,    // 💰
            eco: 40,      // 🌱
            stars: 20,    // ⭐
            color: playerColors[i % playerColors.length],
            isMayor: false,
            jailTurns: 0,          // tours restants en prison
            mustPayToLeaveJail: false,
            hasAntiPollution: false // tu pourras le mettre true quand tu coderas les entreprises anti-pollution
        });
    }

    // ===== 3) État du jeu =====
    const gameState = {
        players,
        botMode,
        currentPlayer: 0,
        lastRoll: [1, 1],
        isAnimating: false,
        mayorIndex: null
    };

    // ===== 4) Plateau (24 cases, conforme à ton HTML) =====
    const cellOrder = [
        0, 1, 2, 3, 4, 5, 6, 7,
        8, 9, 10, 11,
        12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23
    ];

    // ===== 5) Descriptions (FR) =====
    const cellDescriptions = {
        0: "Départ : quand tu fais un tour complet, tu gagnes +2 🌱, +2 💰 et +2 ⭐.",
        1: "Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        2: "Réduction des émissions 🌬️ : tu gagnes 3 🌱 et 2 ⭐.",
        3: "Case Spéciale 🎭 : tu tires une carte (Événement / Malus / Défi / Bonus).",
        4: "Manifestation 🪧 : tu perds 2 ⭐ OU tu changes de stratégie (−1 💰, +2 🌱).",
        5: "Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        6: "Prime Verte 💚 : tu gagnes 3 🌱 et 2 ⭐.",
        7: "Manifestation 🪧 : même effet (−2 ⭐ ou −1 💰 +2 🌱).",
        8: "Case Spéciale 🎭 : tu tires une carte.",
        9: "Pollution ☠️ : si tu as une entreprise anti-pollution → +1 ⭐, sinon rien (à relier aux entreprises).",
        10:"Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        11:"Pénurie de Ressources 💡 : tu perds 2 💰 mais tu gagnes 1 🌱.",
        12:"Recherche et Innovation 🔬 : lance le dé. Si 4/5/6 → +4 🌱 et +1 ⭐, sinon rien.",
        13:"Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        14:"Prison 🚔 : si pas Maire : pour sortir → faire 3, sinon tu attends 2 tours puis tu payes 1 💰 pour avancer.",
        15:"Case Spéciale 🎭 : tu tires une carte.",
        16:"Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        17:"Case Spéciale 🎭 : tu tires une carte.",
        18:"Partenariat Local 🤝 : tu gagnes 2 🌱 et 1 ⭐.",
        19:"Case Entreprise 🏢 : tu peux acheter ou améliorer une entreprise (à coder).",
        20:"Prime Verte 💚 : +3 🌱 et +2 ⭐.",
        21:"Manifestation 🪧 : −2 ⭐ ou (−1 💰, +2 🌱).",
        22:"Pollution ☠️ : +1 ⭐ si entreprise anti-pollution.",
        23:"Case du Maire 🏛️ : le premier à faire un tour complet devient Maire (bonus + immunité prison)."
    };

    // ===== 6) Effets des cases (FR, règlement) =====
    function applyManifestation(player) {
        // choix automatique simple : si peu d'étoiles -> stratégie, sinon -2⭐
        if (player.stars <= 2) {
            player.money -= 1;
            player.eco += 2;
            return "Manifestation : tu changes de stratégie (−1 💰, +2 🌱).";
        }
        player.stars -= 2;
        return "Manifestation : −2 ⭐.";
    }

    function applyPollution(player) {
        if (player.hasAntiPollution) {
            player.stars += 1;
            return "Pollution : tu as une entreprise anti-pollution → +1 ⭐.";
        }
        return "Pollution : aucun effet (pas d’entreprise anti-pollution).";
    }

    function applyInnovation(player) {
        const d = Math.floor(Math.random() * 6) + 1;
        if (d >= 4) {
            player.eco += 4;
            player.stars += 1;
            return `Recherche & Innovation : dé=${d} → réussite ! +4 🌱, +1 ⭐.`;
        }
        return `Recherche & Innovation : dé=${d} → échec. Aucun gain.`;
    }

    function applyPrison(player) {
        // Immunité du Maire
        if (player.isMayor) {
            return "Prison : immunité du Maire 🏛️ → tu avances normalement.";
        }

        // Si le joueur doit payer pour sortir (après 2 tours)
        if (player.mustPayToLeaveJail) {
            player.money -= 1;
            player.mustPayToLeaveJail = false;
            player.jailTurns = 0;
            return "Prison : tu as attendu 2 tours → tu payes 1 💰 et tu reprends la partie.";
        }

        // Tentative de sortie immédiate : faire 3
        const d = Math.floor(Math.random() * 6) + 1;
        if (d === 3) {
            return "Prison : tu fais 3 → tu sors immédiatement !";
        }

        // Sinon, le joueur est bloqué 2 tours
        player.jailTurns = 2;
        return `Prison : tu ne fais pas 3 (dé=${d}) → tu es bloqué 2 tours.`;
    }

    const boardCases = [
        { id: 0,  name: "Départ", action: (p) => "Départ." },
        { id: 1,  name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 2,  name: "Réduction des émissions 🌬️", action: (p) => { p.eco += 3; p.stars += 2; return "Réduction des émissions : +3 🌱, +2 ⭐."; } },
        { id: 3,  name: "Case Spéciale 🎭", action: (p) => "Case Spéciale : tire une carte (à coder)." },
        { id: 4,  name: "Case Manifestation 🪧", action: (p) => applyManifestation(p) },
        { id: 5,  name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 6,  name: "Case Prime Verte 💚", action: (p) => { p.eco += 3; p.stars += 2; return "Prime Verte : +3 🌱, +2 ⭐."; } },
        { id: 7,  name: "Case Manifestation 🪧", action: (p) => applyManifestation(p) },
        { id: 8,  name: "Case Spéciale 🎭", action: (p) => "Case Spéciale : tire une carte (à coder)." },
        { id: 9,  name: "Case Pollution ☠️", action: (p) => applyPollution(p) },
        { id: 10, name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 11, name: "Case Pénurie de Ressources 💡", action: (p) => { p.money -= 2; p.eco += 1; return "Pénurie : −2 💰, +1 🌱."; } },
        { id: 12, name: "Case Recherche et Innovation 🔬", action: (p) => applyInnovation(p) },
        { id: 13, name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 14, name: "Case Prison 🚔", action: (p) => applyPrison(p) },
        { id: 15, name: "Case Spéciale 🎭", action: (p) => "Case Spéciale : tire une carte (à coder)." },
        { id: 16, name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 17, name: "Case Spéciale 🎭", action: (p) => "Case Spéciale : tire une carte (à coder)." },
        { id: 18, name: "Case Partenariat Local 🤝", action: (p) => { p.eco += 2; p.stars += 1; return "Partenariat Local : +2 🌱, +1 ⭐."; } },
        { id: 19, name: "Case entreprise 🏢", action: (p) => "Entreprise : achat/gestion (à coder)." },
        { id: 20, name: "Case Prime Verte 💚", action: (p) => { p.eco += 3; p.stars += 2; return "Prime Verte : +3 🌱, +2 ⭐."; } },
        { id: 21, name: "Case Manifestation 🪧", action: (p) => applyManifestation(p) },
        { id: 22, name: "Case Pollution ☠️", action: (p) => applyPollution(p) },
        { id: 23, name: "Case du Maire 🏛️", action: (p) => "Case du Maire : le statut Maire s’obtient au 1er tour complet." }
    ];

    // ===== 7) DOM =====
    const diceElements = [document.getElementById('dice1'), document.getElementById('dice2')];
    const rollButton = document.getElementById('rollDice');
    const currentPlayerElement = document.getElementById('currentPlayer');
    const lastActionElement = document.getElementById('lastAction');
    const board = document.querySelector('.board');
    const playersPanel = document.getElementById('playersPanel');

    // Modal info case
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const closeModal = document.querySelector('.close');

    // Modal tour
    const turnModal = document.getElementById('turnModal');
    const turnPlayerName = document.getElementById('turnPlayerName');
    const turnDice1 = document.getElementById('turnDice1');
    const turnDice2 = document.getElementById('turnDice2');
    const turnCell = document.getElementById('turnCell');
    const turnMoneyChange = document.getElementById('turnMoneyChange'); // on affiche un résumé
    const continueTurn = document.getElementById('continueTurn');

    // ===== 8) UI joueurs =====
    function renderPlayersPanel() {
        playersPanel.innerHTML = '';
        gameState.players.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = `player player${i + 1}`;
            div.innerHTML = `
        <h3>${p.name}${p.isMayor ? " 🏛️" : ""}</h3>
        <p>💰 Argent : <span id="player${i + 1}-money">${p.money}</span></p>
        <p>🌱 Écologie : <span id="player${i + 1}-eco">${p.eco}</span></p>
        <p>⭐ Réputation : <span id="player${i + 1}-stars">${p.stars}</span></p>
        <div class="player-token" style="background-color:${p.color}"></div>
      `;
            playersPanel.appendChild(div);
        });
    }

    function updateResourcesDisplay() {
        gameState.players.forEach((p, i) => {
            document.getElementById(`player${i + 1}-money`).textContent = p.money;
            document.getElementById(`player${i + 1}-eco`).textContent = p.eco;
            document.getElementById(`player${i + 1}-stars`).textContent = p.stars;
        });
    }

    // ===== 9) Modals =====
    closeModal.onclick = () => (modal.style.display = "none");
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };

    continueTurn.onclick = () => {
        turnModal.style.display = "none";
        gameState.isAnimating = false;
        rollButton.disabled = false;
    };

    function showTurnResults(player, diceResults, cell, recapText) {
        turnPlayerName.textContent = player.name;
        turnDice1.textContent = diceResults[0];
        turnDice2.textContent = diceResults[1];
        turnCell.textContent = cell.name;
        turnMoneyChange.className = 'money-change';
        turnMoneyChange.textContent = recapText;
        turnModal.style.display = "block";
    }

    function showCellInfo(cellId) {
        const cell = boardCases.find(c => c.id === cellId);
        if (!cell) return;
        modalTitle.textContent = cell.name;
        modalDescription.textContent = cellDescriptions[cellId] || "Description indisponible.";
        modal.style.display = "block";
    }

    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const cellId = parseInt(cell.id.split('-')[1], 10);
            showCellInfo(cellId);
        });
    });

    // ===== 10) Pions =====
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

    async function animatePlayerMovement(playerIndex, startPosition, endPosition) {
        const piece = document.getElementById(`player${playerIndex + 1}-piece`);
        if (!piece) return;
        const boardRect = board.getBoundingClientRect();
        const totalCells = cellOrder.length;
        const steps = (endPosition - startPosition + totalCells) % totalCells;

        for (let s = 1; s <= steps; s++) {
            const logicalPos = (startPosition + s) % totalCells;
            const cellId = `cell-${cellOrder[logicalPos]}`;
            const cell = document.getElementById(cellId);
            if (!cell) continue;

            const cellRect = cell.getBoundingClientRect();
            const centerX = cellRect.left - boardRect.left + (cellRect.width / 2) - (piece.offsetWidth / 2);
            const centerY = cellRect.top - boardRect.top + (cellRect.height / 2) - (piece.offsetHeight / 2);

            piece.style.transition = 'all 0.3s cubic-bezier(.4,2,.6,1)';
            piece.style.left = `${centerX}px`;
            piece.style.top = `${centerY}px`;

            await new Promise(r => setTimeout(r, 300));
        }
    }

    // Evite la superposition : offsets si plusieurs joueurs sur la même case
    function updatePlayerPosition(playerIndex) {
        const player = gameState.players[playerIndex];
        const piece = document.getElementById(`player${playerIndex + 1}-piece`);
        if (!piece) return;

        const logicalPos = player.position;
        const cellId = `cell-${cellOrder[logicalPos]}`;
        const cell = document.getElementById(cellId);
        if (!cell) return;

        const cellRect = cell.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();

        const centerX = cellRect.left - boardRect.left + (cellRect.width / 2) - (piece.offsetWidth / 2);
        const centerY = cellRect.top - boardRect.top + (cellRect.height / 2) - (piece.offsetHeight / 2);

        const playersOnSameCell = gameState.players
            .map((p, idx) => ({ p, idx }))
            .filter(obj => obj.p.position === player.position);

        const count = playersOnSameCell.length;
        const gap = 12;
        let offsetX = 0, offsetY = 0;

        if (count > 1) {
            const indexInCell = playersOnSameCell.findIndex(obj => obj.idx === playerIndex);
            if (count === 2) {
                offsetX = indexInCell === 0 ? -gap : gap;
            } else if (count === 3) {
                const offsets = [{x:-gap,y:-gap},{x:+gap,y:-gap},{x:0,y:+gap}];
                offsetX = offsets[indexInCell].x;
                offsetY = offsets[indexInCell].y;
            } else {
                const offsets = [{x:-gap,y:-gap},{x:+gap,y:-gap},{x:-gap,y:+gap},{x:+gap,y:+gap}];
                const pos = offsets[indexInCell % 4];
                offsetX = pos.x; offsetY = pos.y;
            }
        }

        piece.style.transition = 'all 0.5s ease-in-out';
        piece.style.left = `${centerX + offsetX}px`;
        piece.style.top = `${centerY + offsetY}px`;
    }

    function updateAllPlayerPositions() {
        gameState.players.forEach((_, index) => updatePlayerPosition(index));
    }

    // ===== 11) Dés =====
    function animateDice() {
        return new Promise(resolve => {
            let rolls = 0;
            const maxRolls = 10;
            const interval = setInterval(() => {
                diceElements.forEach(d => d.textContent = Math.floor(Math.random() * 6) + 1);
                rolls++;
                if (rolls >= maxRolls) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    // ===== 12) Règles tour complet + maire =====
    function giveLapBonus(player) {
        player.money += 2;
        player.eco += 2;
        player.stars += 2;
        return "Tour complet : +2 💰, +2 🌱, +2 ⭐.";
    }

    function giveMayorLapBonus(player) {
        player.money += 2;
        player.eco += 2;
        player.stars += 2;
        return "Bonus du Maire : +2 💰, +2 🌱, +2 ⭐.";
    }

    // ===== 13) Tour de jeu =====
    async function handleTurn() {
        if (gameState.isAnimating) return;
        gameState.isAnimating = true;
        rollButton.disabled = true;

        const player = gameState.players[gameState.currentPlayer];

        // --- Gestion prison (bloqué 2 tours) ---
        if (!player.isMayor && player.jailTurns > 0) {
            player.jailTurns -= 1;

            // Quand il arrive à 0, au prochain tour il paiera 1💰 pour sortir
            if (player.jailTurns === 0) {
                player.mustPayToLeaveJail = true;
            }

            updateResourcesDisplay();
            updateAllPlayerPositions();

            const recap = player.jailTurns > 0
                ? `Prison : tu es bloqué. Tours restants : ${player.jailTurns}.`
                : "Prison : tu as fini d'attendre. Au prochain tour, tu paieras 1 💰 pour avancer.";

            showTurnResults(player, [0,0], { name: "Prison 🚔" }, recap);

            // joueur suivant
            gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
            currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;

            return;
        }

        const oldPos = player.position;

        await animateDice();
        gameState.lastRoll = [rollDice(), rollDice()];
        const totalRoll = gameState.lastRoll[0] + gameState.lastRoll[1];

        diceElements[0].textContent = gameState.lastRoll[0];
        diceElements[1].textContent = gameState.lastRoll[1];

        const totalCells = cellOrder.length;
        const passedStart = (player.position + totalRoll) >= totalCells;
        const newPosition = (player.position + totalRoll) % totalCells;

        await animatePlayerMovement(gameState.currentPlayer, oldPos, newPosition);
        player.position = newPosition;

        // Tour complet + Maire
        let lapMsg = "";
        if (passedStart) {
            lapMsg += giveLapBonus(player) + " ";

            // devient Maire au 1er tour complet
            if (gameState.mayorIndex === null) {
                gameState.mayorIndex = gameState.currentPlayer;
                player.isMayor = true;
                lapMsg += "Tu deviens le Maire 🏛️ ! ";
            }

            // bonus du Maire à chaque tour complet
            if (player.isMayor) {
                lapMsg += giveMayorLapBonus(player);
            }
        }

        // Effet case (IMPORTANT: on cherche par id)
        const currentCaseId = cellOrder[player.position];
        const currentCase = boardCases.find(c => c.id === currentCaseId) || boardCases[0];
        const actionResult = currentCase.action(player);

        updateResourcesDisplay();
        updateAllPlayerPositions();

        lastActionElement.textContent =
            `${player.name} a fait ${totalRoll} et arrive sur "${currentCase.name}". ${lapMsg} ${actionResult}`.trim();

        const recap = `${lapMsg ? lapMsg + " " : ""}${actionResult}`.trim();
        showTurnResults(player, gameState.lastRoll, currentCase, recap);

        // joueur suivant
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;
    }

    // ===== 14) Resize =====
    window.addEventListener('resize', () => {
        if (gameState.isAnimating) return;
        updateAllPlayerPositions();
    });

    // ===== 15) Init =====
    function initGame() {
        renderPlayersPanel();
        createPlayerPieces();
        updateResourcesDisplay();
        rollButton.addEventListener('click', handleTurn);
        currentPlayerElement.textContent = gameState.players[gameState.currentPlayer].name;
        lastActionElement.textContent = "La partie a commencé.";
    }

    initGame();
});

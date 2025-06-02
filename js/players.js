/**
 * Player functionality for the Travesía Nostálgica game
 */

let players = [];
let currentPlayerIndex = 0;

/**
 * Initialize players for the game
 */
async function initializePlayers() {
    const playerCountInput = document.getElementById('player-count');
    let numPlayers = parseInt(playerCountInput.value);

    if (isNaN(numPlayers) || numPlayers < 3 || numPlayers > 6) {
        alert("El número de jugadores debe ser entre 3 y 6. Se establecerá a 3.");
        numPlayers = 3;
        playerCountInput.value = 3;
    }
    updatePlayerNameInputsVisibility(numPlayers); // Ensure correct name inputs are visible
    
    players = []; 
    for (let i = 0; i < numPlayers; i++) {
        const nameInput = document.getElementById(`player-${i + 1}-name-input`);
        const playerName = nameInput.value.trim() || `Jugador ${i + 1}`;

        players.push({
            ...JSON.parse(JSON.stringify(BASE_PLAYER_STRUCTURE)), 
            id: `player${i + 1}`,
            name: playerName,
            color: PLAYER_COLORS[i % PLAYER_COLORS.length] 
        });
    }
    
    currentPlayerIndex = 0;
    const shuffledRoles = [...PLAYER_ROLES].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        player.role = shuffledRoles[i % shuffledRoles.length]; 
        player.role.abilityUsedThisTurn = false;
        player.role.abilityUsedThisGame = false; 
        player.role.abilityUsedThisRound = {}; 
        player.effects = {}; 
        player.hasReachedEnd = false;

        if (player.role.id === "la_musa") {
            if (players.length > 1) {
                const otherPlayers = players.filter(p => p.id !== player.id);
                if (otherPlayers.length > 0) {
                    const targetPlayerId = await promptForInteraction( 
                        `${player.name} (La Musa), elige tu objetivo:`,
                        `Elige un jugador al que seguirás. Si ganan puntos en su reto, tú también ganarás (una vez por ronda).`,
                        { type: 'player_select', players: otherPlayers }
                    );
                    if (targetPlayerId) { 
                        player.role.musaTargetId = targetPlayerId;
                    } else { player.role.musaTargetId = null; }
                } else { player.role.musaTargetId = null; }
            } else { player.role.musaTargetId = null; }
        }
    }

    for (let i = 0; i < 6; i++) { 
        const playerCard = document.getElementById(`player-card-${i + 1}`);
        const playerMarker = document.getElementById(`player-marker-${i}`);
        if (playerCard) playerCard.style.display = 'none';
        if (playerMarker) playerMarker.style.display = 'none';
    }
    
    players.forEach((player, index) => {
        updatePlayerMarker(index, player.position);
        updatePlayerCardUI(index); 
        const markerElement = document.getElementById(`player-marker-${index}`);
        if (markerElement) {
            markerElement.style.backgroundColor = player.color;
            markerElement.style.display = 'block';
        }
        const cardElement = document.getElementById(`player-card-${index + 1}`);
        if (cardElement) {
            cardElement.style.display = 'block';
            const colorIndicator = cardElement.querySelector('.player-color-indicator');
            if(colorIndicator) colorIndicator.style.backgroundColor = player.color;
        }
    });
    
    updateCurrentTurnDisplay();
    updateScoreBoard();
    setActivePlayerVisuals(currentPlayerIndex);
    const firstPlayer = getCurrentPlayer();
    if (firstPlayer) updateCurrentZone(firstPlayer.position); 
}


/**
 * Update a player's visual marker on the board
 * @param {number} playerIdx - The index of the player
 * @param {number} newPosition - The new game position for the player
 */
function updatePlayerMarker(playerIdx, newPosition) {
    const marker = document.getElementById(`player-marker-${playerIdx}`);
    if (marker) {
        const { left, bottom } = calculateBoardPosition(newPosition, playerIdx);
        marker.style.left = left;
        marker.style.bottom = bottom;
    }
}

/**
 * Update a player's position and their marker on the board
 * Also checks for triggering final rounds or reaching the absolute end.
 * @param {number} playerIdx - The index of the player to update
 * @param {number} newPosition - The new position for the player
 */
function updatePlayerPosition(playerIdx, newPosition) {
    if (playerIdx < 0 || playerIdx >= players.length) return;
    
    const player = players[playerIdx];
    player.position = Math.max(0, Math.min(newPosition, MAX_POSITION)); 
    
    updatePlayerMarker(playerIdx, player.position);
    updatePlayerCardUI(playerIdx); 
    updateCurrentZone(player.position); 

    if (player.position >= TRIGGER_END_GAME_POSITION && !gameState.finalRounds.isActive) {
        gameState.finalRounds.isActive = true;
        gameState.finalRounds.turnsRemaining = players.length * 2; // 2 full rounds for all players
        updateChallengeText(`${player.name} ha alcanzado la posición ${player.position} (o más)! Comienzan las últimas ${gameState.finalRounds.turnsRemaining} turnos del juego. Los jugadores en posición ${TRIGGER_END_GAME_POSITION} o más cederán sus turnos.`);
    }

    if (player.position === MAX_POSITION && !player.hasReachedEnd ) {
        player.hasReachedEnd = true;
    }
}


/**
 * Add points to a player
 * @param {number} playerIdx - The index of the player
 * @param {number} points - The number of points to add
 * @param {boolean} isMainPlayerEarning - True if points are earned by player directly (for Musa)
 */
function addPoints(playerIdx, points, isMainPlayerEarning = false) {
    if (playerIdx < 0 || playerIdx >= players.length || points <= 0) return;
    
    const targetPlayer = players[playerIdx];
    targetPlayer.points += points;
    updatePlayerCardUI(playerIdx);
    updateScoreBoard();

    if (isMainPlayerEarning) { 
        players.forEach((p, idx) => {
            if (p.role.id === 'la_musa' && p.role.musaTargetId === targetPlayer.id && idx !== playerIdx) {
                const roundKey = `round_${gameState.currentRound}`;
                const targetKey = `target_${targetPlayer.id}`;
                if (!p.role.abilityUsedThisRound[roundKey] || !p.role.abilityUsedThisRound[roundKey][targetKey]) {
                    updateChallengeTextProcessing(`${p.name} (La Musa) gana 1 punto porque ${targetPlayer.name} (${p.role.musaTargetId}) ganó puntos!`);
                    p.points += 1;
                    
                    if(!p.role.abilityUsedThisRound[roundKey]) p.role.abilityUsedThisRound[roundKey] = {};
                    p.role.abilityUsedThisRound[roundKey][targetKey] = true; 
                    
                    updatePlayerCardUI(idx); 
                    updateScoreBoard(); 
                    setTimeout(() => {
                        updateChallengeText(`${p.name} (La Musa) gana 1 punto porque ${targetPlayer.name} ganó puntos!`);
                    }, 100);
                }
            }
        });
    }
}


/**
 * Subtract points from a player
 * @param {number} playerIdx - The index of the player
 * @param {number} points - The number of points to subtract
 */
function subtractPoints(playerIdx, points) {
    if (playerIdx < 0 || playerIdx >= players.length || points <= 0) return;
    players[playerIdx].points = Math.max(0, players[playerIdx].points - points); 
    updatePlayerCardUI(playerIdx);
    updateScoreBoard();
}

/**
 * Move to the next player's turn, handling skips during final rounds.
 */
function nextPlayer() {
    if (!gameState.gameStarted && !gameState.finalRounds.isActive) return; 

    if (players.length === 0) { // Should not happen in normal game
        console.error("No players available to switch turn.");
        triggerRestartGame();
        return;
    }
    
    if (currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
        setActivePlayerVisuals(currentPlayerIndex, false);
    }

    let initialPlayerIndexForCycle = currentPlayerIndex; // To detect a full cycle for round increment

    function findAndSetNextActivePlayer() {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

        // Round increment logic
        if (currentPlayerIndex === initialPlayerIndexForCycle) { // Completed a full cycle
            gameState.currentRound++;
            players.forEach(p => { // Reset round-specific abilities
                p.role.abilityUsedThisRound = {}; // Reset for all roles, Musa handles specifics internally
            });
        }
        
        const prospectivePlayer = players[currentPlayerIndex];

        if (gameState.finalRounds.isActive) {
            gameState.finalRounds.turnsRemaining--;

            if (gameState.finalRounds.turnsRemaining < 0) {
                endGameAndDeclareWinner();
                return; // Game ends
            }

            if (prospectivePlayer.position >= TRIGGER_END_GAME_POSITION) {
                updateChallengeText(`${prospectivePlayer.name} (Pos ${prospectivePlayer.position}) cede su turno. ${gameState.finalRounds.turnsRemaining + 1} turnos restantes.`);
                // Quickly cycle through game state for skipped player
                gameState.diceRolled = false;
                gameState.cardDrawn = false;
                gameState.currentCard = null;
                gameState.challengeActive = false;
                hideCardDetails(); // Hide any card details from previous player
                // Call again to find the next actual player or end game
                findAndSetNextActivePlayer(); 
                return;
            }
            // If eligible in final rounds
            updateChallengeText(`Rondas Finales: ${gameState.finalRounds.turnsRemaining + 1} turnos restantes. Turno de ${prospectivePlayer.name}.`);
        }
        
        // If not final rounds OR eligible in final rounds:
        prospectivePlayer.role.abilityUsedThisTurn = false;
        setActivePlayerVisuals(currentPlayerIndex, true);
        updateCurrentTurnDisplay();
        updateCurrentZone(prospectivePlayer.position);

        // Reset state for the new turn
        gameState.diceRolled = false;
        gameState.cardDrawn = false;
        gameState.currentCard = null;
        gameState.challengeActive = false;
        hideCardDetails();
        setControlsState({ rollDice: true }); // Enable dice roll for the active player
    }

    findAndSetNextActivePlayer();
}


function endGameAndDeclareWinner() {
    if (!gameState.gameStarted && !gameState.finalRounds.isActive) return; 
    gameState.gameStarted = false; 
    
    let sortedPlayers = [...players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points; 
        if (b.position !== a.position) return b.position - a.position;
        if (a.hasReachedEnd && !b.hasReachedEnd) return -1; 
        if (!a.hasReachedEnd && b.hasReachedEnd) return 1;  
        return 0; 
    });

    let winner = sortedPlayers[0];
    const actualCoWinners = sortedPlayers.filter(p => p.points === winner.points && p.position === winner.position && p.hasReachedEnd === winner.hasReachedEnd);
    
    if (actualCoWinners.length > 1) {
        showWinnerDisplay(winner.id, winner.points, true, actualCoWinners.map(p=>p.name).join(' y ')); 
    } else {
        showWinnerDisplay(winner.id, winner.points);
    }
    
    setControlsState({ startGame: true }); 
    showPregameCustomization(true); 
}


/**
 * Update the UI for a specific player's card
 * @param {number} playerIdx - The index of the player to update
 */
function updatePlayerCardUI(playerIdx) {
    if (playerIdx < 0 || playerIdx >= players.length) return;

    const player = players[playerIdx];
    const playerNum = playerIdx + 1; 

    const nameEl = document.getElementById(`player${playerNum}-name`);
    const posEl = document.getElementById(`player${playerNum}-pos`);
    const pointsEl = document.getElementById(`player${playerNum}-points`);
    const roleEl = document.getElementById(`player${playerNum}-role`);
    const roleImageEl = document.getElementById(`player${playerNum}-role-image`);
    const roleAbilityEl = document.getElementById(`player${playerNum}-role-ability`);
    const playerCardEl = document.getElementById(`player-card-${playerNum}`);
    
    if (!playerCardEl) return; 

    const colorIndicatorEl = playerCardEl.querySelector('.player-color-indicator');

    if (nameEl) nameEl.textContent = player.name;
    if (posEl) posEl.textContent = player.position;
    if (pointsEl) pointsEl.textContent = player.points;
    
    if (player.role && player.role.name) { 
        if (roleEl) roleEl.textContent = player.role.name;
        if (roleImageEl) {
            roleImageEl.src = player.role.image || 'images/roles/default.jpg';
            roleImageEl.alt = `Rol de ${player.name}`;
        }
        if (roleAbilityEl) roleAbilityEl.textContent = player.role.abilityText || '';
    } else { 
        if (roleEl) roleEl.textContent = 'Sin rol';
        if (roleImageEl) {
            roleImageEl.src = 'images/roles/default.jpg';
            roleImageEl.alt = `Rol de ${player.name}`;
        }
        if (roleAbilityEl) roleAbilityEl.textContent = '';
    }
    if (colorIndicatorEl) colorIndicatorEl.style.backgroundColor = player.color;
}


/**
 * Set active player visuals (marker and card)
 * @param {number} playerIdx - The index of the player
 * @param {boolean} isActive - True to activate, false to deactivate
 */
function setActivePlayerVisuals(playerIdx, isActive = true) {
    if (playerIdx < 0 || playerIdx >= players.length) return;

    const marker = document.getElementById(`player-marker-${playerIdx}`);
    const card = document.getElementById(`player-card-${playerIdx + 1}`);

    if (marker) {
        isActive ? marker.classList.add('active') : marker.classList.remove('active');
    }
    if (card) { 
        isActive ? card.classList.add('active-player') : card.classList.remove('active-player');
    }
}

/**
 * Update the current turn display in the UI
 */
function updateCurrentTurnDisplay() {
    const currentTurnDisplay = document.getElementById('current-turn-display');
    const currentPlayer = getCurrentPlayer();
    if (currentTurnDisplay && currentPlayer && currentPlayer.name) {
        currentTurnDisplay.textContent = currentPlayer.name;
    } else if (currentTurnDisplay) {
        currentTurnDisplay.textContent = ""; 
    }
}

/**
 * Update the score board with current player points
 */
function updateScoreBoard() {
    const scoreList = document.getElementById('score-list');
    if (!scoreList) return;
    
    scoreList.innerHTML = ''; 
    
    const displayPlayersSorted = [...players].sort((a, b) => { 
        if (b.points !== a.points) return b.points - a.points;
        return b.position - a.position; 
    });
    
    players.forEach(player => { 
        const listItem = document.createElement('li');
        listItem.className = 'score-item';
        
        if (displayPlayersSorted.length > 0 && player.id === displayPlayersSorted[0].id && player.points > 0 ) {
            const isLeader = displayPlayersSorted.some(sortedPlayer => 
                sortedPlayer.id === player.id && 
                sortedPlayer.points === displayPlayersSorted[0].points &&
                sortedPlayer.position === displayPlayersSorted[0].position 
            );
            if (isLeader) {
                listItem.classList.add('leader');
            }
        }
        
        listItem.innerHTML = `
            <div class="player-info">
                <div class="player-color" style="background-color: ${player.color};"></div>
                <div class="player-name">${player.name}</div>
            </div>
            <div class="player-score">${player.points}</div>
        `;
        scoreList.appendChild(listItem);
    });
}

/**
 * Get the current player object
 * @returns {Object|null}
 */
function getCurrentPlayer() {
    if (players.length > 0 && currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
        return players[currentPlayerIndex];
    }
    return null; 
}

/**
 * Get player object by ID
 * @param {string} playerId
 * @returns {Object|null}
 */
function getPlayerById(playerId) {
    return players.find(p => p.id === playerId) || null;
}
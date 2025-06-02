/**
 * Main game logic for the Travesía Nostálgica game
 */

// Game state
let gameState = {
    gameStarted: false,
    diceRolled: false,
    currentCard: null,
    cardDrawn: false,
    challengeActive: false, 
    currentRound: 1,
    finalRounds: {
        isActive: false,
        turnsRemaining: 0 
    },
    lastCardPlayed: null, 
    lastCardPlayerId: null, 
    interactionData: {} 
};

// Control buttons
const startGameBtn = document.getElementById('start-game');
const rollDiceBtn = document.getElementById('roll-dice');
const drawCardBtnElement = document.getElementById('draw-card'); 
const endTurnBtn = document.getElementById('end-turn');
const completeChallengeBtn = document.getElementById('complete-challenge');
const skipChallengeBtn = document.getElementById('skip-challenge');
const useAbilityBtn = document.getElementById('use-ability');

const pregameCustomizationSection = document.getElementById('pregame-customization');
const addCustomCardBtn = document.getElementById('add-custom-card-btn');
const customCardsDisplayArea = document.getElementById('custom-cards-display-area');
const playerCountInput = document.getElementById('player-count');


function showPregameCustomization(show) {
    if (pregameCustomizationSection) {
        pregameCustomizationSection.style.display = show ? 'block' : 'none';
    }
    if (playerCountInput) {
        playerCountInput.disabled = !show; 
    }
    for (let i = 1; i <= 6; i++) {
        const nameInput = document.getElementById(`player-${i}-name-input`);
        if (nameInput) nameInput.disabled = !show;
    }
    if (show && playerCountInput) {
        updatePlayerNameInputsVisibility(parseInt(playerCountInput.value));
    }
}

function updatePlayerNameInputsVisibility(count) {
    if (isNaN(count) || count < 3 || count > 6) count = 3; // Default to 3 if invalid
    for (let i = 1; i <= 6; i++) {
        const nameGroup = document.getElementById(`p${i}-name-group`);
        if (nameGroup) {
            nameGroup.style.display = i <= count ? 'flex' : 'none';
        }
    }
}

function addVisualCustomCard() {
    const title = document.getElementById('custom-card-title').value.trim();
    const description = document.getElementById('custom-card-description').value.trim();
    const imageUrl = document.getElementById('custom-card-image-url').value.trim();

    if (!title && !description && !imageUrl) {
        alert("Por favor, introduce algún dato para la carta visual.");
        return;
    }
    const cardDiv = document.createElement('div');
    cardDiv.className = 'custom-card-visual';
    let content = '';
    if (title) content += `<h4>${escapeHTML(title)}</h4>`;
    if (description) content += `<p>${escapeHTML(description).replace(/\n/g, '<br>')}</p>`;
    if (imageUrl) {
        if (imageUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null) { 
            content += `<img src="${escapeHTML(imageUrl)}" alt="Imagen Personalizada">`;
        } else {
            content += `<p><small>(URL de imagen no válida o no es una imagen directa)</small></p>`;
        }
    }
    cardDiv.innerHTML = content;
    customCardsDisplayArea.appendChild(cardDiv);
    document.getElementById('custom-card-title').value = '';
    document.getElementById('custom-card-description').value = '';
    document.getElementById('custom-card-image-url').value = '';
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, match => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[match]));
}

async function startGame() {
    let numPlayersSelected = parseInt(playerCountInput.value);
    if (isNaN(numPlayersSelected) || numPlayersSelected < 3 || numPlayersSelected > 6) {
        alert("Por favor, selecciona un número de jugadores válido (3-6).");
        playerCountInput.value = 3; 
        updatePlayerNameInputsVisibility(3);
        return;
    }

    showPregameCustomization(false); 
    gameState = {
        gameStarted: true,
        diceRolled: false,
        currentCard: null,
        cardDrawn: false,
        challengeActive: false,
        currentRound: 1,
        finalRounds: { isActive: false, turnsRemaining: 0 },
        lastCardPlayed: null,
        lastCardPlayerId: null,
        interactionData: {}
    };
    
    await initializePlayers(); 
    shuffleDeck();
    
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer && currentPlayer.name) { 
        updateChallengeText(`Turno de ${currentPlayer.name}. Lanza el dado para avanzar.`);
    } else {
        updateChallengeText("Error al iniciar jugadores. Intenta de nuevo."); 
        showPregameCustomization(true);
        return;
    }
    
    setControlsState({ startGame: false, rollDice: true });
    hideCardDetails();
    configureDiceDots(1); 
}

async function rollDiceAndMove() {
    if (!gameState.gameStarted || gameState.diceRolled) return;
    if (gameState.finalRounds.isActive && getCurrentPlayer()?.position >= TRIGGER_END_GAME_POSITION) {
        updateChallengeText(`${getCurrentPlayer().name} está en o más allá de la posición ${TRIGGER_END_GAME_POSITION} y no puede jugar en rondas finales. Cediendo turno.`);
        endCurrentTurn(); // Should effectively skip to next player via nextPlayer() logic
        return;
    }
    
    setControlsState({rollDice: false}); 
    
    let diceValue = await animateDiceRoll();
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) { 
        console.error("Current player not found during rollDiceAndMove.");
        setControlsStateBasedOnGameState(); 
        return;
    }

    if (currentPlayer.role.id === 'el_aleatorio' && !currentPlayer.role.abilityUsedThisTurn) {
        updateChallengeTextProcessing(`${currentPlayer.name} (El Aleatorio) lanza su dado extra...`);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const extraDiceValue = rollDiceValue(); 
        configureDiceDots(extraDiceValue); 
        await new Promise(resolve => setTimeout(resolve, 1000)); 

        if (extraDiceValue === 6) {
            addPoints(currentPlayerIndex, 1, true); 
            updateChallengeText(`${currentPlayer.name} (El Aleatorio) sacó un 6 en su dado extra y gana 1 punto! Ahora, su tirada principal...`);
        } else {
            updateChallengeText(`${currentPlayer.name} (El Aleatorio) sacó un ${extraDiceValue}. Sin puntos extra. Ahora, su tirada principal...`);
        }
        currentPlayer.role.abilityUsedThisTurn = true; 
        diceValue = await animateDiceRoll(); 
    }
    
    gameState.diceRolled = true;
    const oldPosition = currentPlayer.position;
    let newPosition = currentPlayer.position + diceValue; 
    
    updatePlayerPosition(currentPlayerIndex, newPosition); 
    
    const playersOnSameSpot = players.filter((p, idx) => idx !== currentPlayerIndex && p.position === currentPlayer.position && p.position !== 0 && p.position !== MAX_POSITION ); 
    if (currentPlayer.role.id === 'viajero' && playersOnSameSpot.length > 0 && !currentPlayer.role.abilityUsedThisTurn) {
        const useViajero = await promptForInteraction(
            "Habilidad Viajero",
            `${currentPlayer.name}, has caído en una casilla ocupada por ${playersOnSameSpot.map(p=>p.name).join(', ')}. ¿Usar habilidad para mover 1 casilla extra?`,
            { type: 'boolean_choice', choices: [{label: 'Sí, mover +1', value: true}, {label: 'No, quedarse', value: false}]}
        );
        if (useViajero === true) { 
            let viajeroNewPos = Math.min(currentPlayer.position + 1, MAX_POSITION);
            updatePlayerPosition(currentPlayerIndex, viajeroNewPos); 
            updateChallengeText(`${currentPlayer.name} (Viajero) usó su habilidad y avanzó a la casilla ${viajeroNewPos}.`);
            currentPlayer.role.abilityUsedThisTurn = true;
        }
    }
    
    const message = `${currentPlayer.name} sacó un ${diceValue} y avanzó a la casilla ${currentPlayer.position}.`;
    const currentZoneObject = getZoneByPosition(currentPlayer.position); 
    const currentZoneName = currentZoneObject.name;

    if (crossedZoneBoundary(oldPosition, currentPlayer.position)) {
        const zoneDisplayName = (currentZoneName === "Inicio" && currentPlayer.position === 0) ? "Comienzo del Viaje" : currentZoneName;
        updateChallengeText(`${message} Ha entrado en ${zoneDisplayName}. ¡Roba una carta!`);
    } else {
        updateChallengeText(`${message} Está en ${currentZoneName}. ¡Roba una carta!`);
    }
    setControlsState({ drawCard: true });
}

function handleDrawCardClick() {
    if (!gameState.gameStarted || gameState.cardDrawn || !gameState.diceRolled) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return; 
    if (gameState.finalRounds.isActive && currentPlayer.position >= TRIGGER_END_GAME_POSITION) {
        // This check might be redundant if rollDice already handles it, but good for safety.
        updateChallengeText(`${currentPlayer.name} está en o más allá de la posición ${TRIGGER_END_GAME_POSITION} y no puede robar cartas. Cediendo turno.`);
        endCurrentTurn();
        return;
    }
    
    const card = drawCardFromDeck();
    if (card) {
        gameState.currentCard = card;
        gameState.cardDrawn = true;
        gameState.challengeActive = true; 
        gameState.lastCardPlayed = card; 
        gameState.lastCardPlayerId = currentPlayer.id; 
        
        displayCardDetails(card);
        updateChallengeText(`¡${currentPlayer.name} ha robado "${card.title}"! ${card.description}`);
        
        let controls = { drawCard: false, completeChallenge: true, skipChallenge: true };
        if (currentPlayer.role.id === 'el_critico' && !currentPlayer.role.abilityUsedThisGame) {
            controls.useAbility = true; 
        }
        setControlsState(controls);
        handleCardEffect(card, 'draw');
    } else {
        updateChallengeText("No quedan cartas. Barajando de nuevo...");
        shuffleDeck(); 
        if (gameDeck.length > 0) {
             setControlsState({ drawCard: true }); 
        } else {
            updateChallengeText("No hay más cartas en el juego. Termina tu turno.");
            setControlsState({ endTurn: true });
        }
    }
}

async function completeCurrentChallenge() {
    if (!gameState.gameStarted || !gameState.challengeActive || !gameState.currentCard) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    const card = gameState.currentCard;
    updateChallengeTextProcessing(`${currentPlayer.name} está resolviendo "${card.title}"...`);
    setControlsState({}); 
    await handleCardEffect(card, 'complete');
    gameState.challengeActive = false;
    
    if (!gameState.finalRounds.isActive || gameState.finalRounds.turnsRemaining >= 0) { 
         setControlsState({ endTurn: true });
    } else { 
        endGameAndDeclareWinner();
    }
}

async function skipCurrentChallenge() {
    if (!gameState.gameStarted || !gameState.challengeActive || !gameState.currentCard) return;
    const currentPlayer = getCurrentPlayer();
     if (!currentPlayer) return;

    const card = gameState.currentCard;
    setControlsState({}); 
    await handleCardEffect(card, 'skip'); 
    gameState.challengeActive = false;
    if (!gameState.finalRounds.isActive || gameState.finalRounds.turnsRemaining >= 0) {
         setControlsState({ endTurn: true });
    } else {
        endGameAndDeclareWinner();
    }
}

function endCurrentTurn() {
    if (!gameState.gameStarted && !gameState.finalRounds.isActive && gameState.finalRounds.turnsRemaining <=0 ) { // Game already ended
        return;
    }
    if (gameState.gameStarted && gameState.challengeActive ) { 
        if(gameState.challengeActive) updateChallengeText("Debes completar o saltar el desafío antes de terminar el turno.");
        return;
    }
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) { 
        console.error("Cannot end turn: current player is undefined.");
        if(gameState.gameStarted) triggerRestartGame(); 
        return;
    }

    if (currentPlayer.effects.nieblaMental > 0) {
        currentPlayer.effects.nieblaMental--;
        if (currentPlayer.effects.nieblaMental === 0) updateChallengeText(`${currentPlayer.name} ya no sufre Niebla Mental.`);
    }
    if (currentPlayer.effects.piedraSilencio > 0) {
        currentPlayer.effects.piedraSilencio--;
         if (currentPlayer.effects.piedraSilencio === 0) { 
            if (currentPlayer.effects.hasOwnProperty('piedraSilencioFulfilledAttempt')) {
                if (currentPlayer.effects.piedraSilencioFulfilledAttempt) { 
                    addPoints(currentPlayerIndex, 1, true); 
                    updateChallengeText(`${currentPlayer.name} cumplió la Piedra del Silencio y gana 1 punto.`);
                } else {
                    updateChallengeText(`${currentPlayer.name} no cumplió la Piedra del Silencio. No gana puntos.`);
                }
                delete currentPlayer.effects.piedraSilencioFulfilledAttempt; 
            }
        }
    }

    if (gameState.currentCard) discardCard(gameState.currentCard); 
    gameState.currentCard = null; // Ensure current card is cleared for the next player
    gameState.cardDrawn = false; // Reset card drawn state
    gameState.diceRolled = false; // Reset dice rolled state
    gameState.challengeActive = false; // Reset challenge active state
    hideCardDetails(); // Hide card details for next player
    
    nextPlayer(); // This will handle final rounds logic, skips, and setting up the next turn or ending game.
}

async function usePlayerAbility() {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    setControlsState({}); 

    if (currentPlayer.role.id === 'el_critico' && gameState.currentCard && !currentPlayer.role.abilityUsedThisGame) {
        const confirmUse = await promptForInteraction(
            "Habilidad Crítico",
            `¿Usar habilidad para anular "${gameState.currentCard.title}" y robar otra carta? (Solo 1 vez por partida)`,
            {type: 'boolean_choice', choices: [{label: 'Sí, anular', value: true}, {label: 'No', value: false}]}
        );
        if (confirmUse === true) {
            currentPlayer.role.abilityUsedThisGame = true;
            updateChallengeText(`${currentPlayer.name} (El Crítico) usa su habilidad para anular "${gameState.currentCard.title}". Robando nueva carta...`);
            discardCard(gameState.currentCard);
            gameState.currentCard = null;
            gameState.cardDrawn = false; 
            gameState.challengeActive = false;
            hideCardDetails();
            handleDrawCardClick(); 
        } else {
            setControlsStateBasedOnGameState();
        }
    } else {
        updateChallengeText("No se puede usar la habilidad en este momento o ya fue usada.");
        setControlsStateBasedOnGameState();
    }
}

function setControlsStateBasedOnGameState() {
    if (!gameState.gameStarted) {
        setControlsState({ startGame: true });
        return;
    }
    const currentPlayer = getCurrentPlayer(); 
    if (!currentPlayer) { 
        setControlsState({ startGame: true });
        return;
    }
    // If in final rounds and current player should be skipped
    if (gameState.finalRounds.isActive && currentPlayer.position >= TRIGGER_END_GAME_POSITION) {
        setControlsState({ endTurn: true }); // Allow to click "End Turn" to advance, which will trigger skip in nextPlayer
        return;
    }

    if (!gameState.diceRolled) setControlsState({rollDice: true});
    else if (!gameState.cardDrawn) setControlsState({drawCard: true});
    else if (gameState.challengeActive) {
        let controls = { completeChallenge: true, skipChallenge: true };
        if (currentPlayer.role.id === 'el_critico' && !currentPlayer.role.abilityUsedThisGame && gameState.currentCard) {
            controls.useAbility = true;
        }
        setControlsState(controls);
    } else setControlsState({endTurn: true});
}

function triggerRestartGame() { 
    gameState = { gameStarted: false, finalRounds: {isActive: false, turnsRemaining: 0} }; 
    customCardsDisplayArea.innerHTML = ''; 
    showPregameCustomization(true); 
    updateChallengeText('Configura el número de jugadores y sus nombres, y haz clic en "Iniciar Juego".');
    setControlsState({ startGame: true });
    hideCardDetails();
    configureDiceDots(1);
    document.querySelectorAll('.player-card').forEach(pc => pc.style.display = 'none');
    document.querySelectorAll('.player-marker').forEach(pm => pm.style.display = 'none');
    const currentTurnDisplay = document.getElementById('current-turn-display');
    if(currentTurnDisplay) currentTurnDisplay.textContent = "";
    const scoreList = document.getElementById('score-list');
    if(scoreList) scoreList.innerHTML = "";
    const winnerModal = document.getElementById('winner-modal');
    if (winnerModal) winnerModal.style.display = 'none';

    if (playerCountInput) { 
        playerCountInput.value = 3;
        playerCountInput.disabled = false;
    }
    updatePlayerNameInputsVisibility(3); 
    for (let i = 1; i <= 6; i++) { 
        const nameInput = document.getElementById(`player-${i}-name-input`);
        if (nameInput) {
            nameInput.value = ``; // Clear name, placeholder will show
            nameInput.disabled = false;
        }
    }
}

async function handleCardEffect(card, phase) { 
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return; 
    const playerIdx = currentPlayerIndex;

    if (phase === 'draw') {
        switch (card.id) {
            case 'pesadez_corazon':
                const currentZoneName = getZoneByPosition(currentPlayer.position).name;
                if (card.conditionalZones.includes(currentZoneName)) {
                    subtractPoints(playerIdx, card.pointsLost);
                    updateChallengeText(`${currentPlayer.name} está en ${currentZoneName} y pierde ${card.pointsLost} puntos por ${card.title}.`);
                } else {
                     updateChallengeText(`${card.title} no tiene efecto en esta zona.`);
                }
                gameState.challengeActive = false; // This card's effect is immediate, no challenge to complete/skip
                setControlsState({endTurn:true}); // Allow ending turn directly
                return; 
            case 'niebla_mental':
                 updateChallengeText(`${currentPlayer.name} sufre ${card.title}. No podrá usar habilidades de rol por ${card.duration} turnos.`);
                 currentPlayer.effects.nieblaMental = card.duration + 1; 
                 gameState.challengeActive = false; // Immediate effect
                 setControlsState({endTurn:true});
                 return;
        }
    }

    if (phase === 'complete') {
        switch (card.id) {
            case 'memoria_compartida':
                const partnerIndex = (playerIdx + (players.length > 1 ? 2 % players.length : 0) ) % players.length; // 3rd player to right or self if alone
                const partner = players[partnerIndex];
                if (!partner) { updateChallengeText("Error: No se encontró el jugador compañero."); break;}

                updateChallengeTextProcessing(`${currentPlayer.name} y ${partner.name} deben compartir una memoria (real o inventada). Los demás adivinan.`);
                
                const storyReal = await promptForInteraction(
                    "Memoria Compartida",
                    `${currentPlayer.name} y ${partner.name}, ¿vuestra memoria es real o inventada?`,
                    {type: 'boolean_choice', choices: [{label: "Real", value: true}, {label: "Inventada", value: false}]}
                );

                let correctGuesses = 0; let totalVoters = 0; const voterPromises = [];
                for(let i=0; i < players.length; i++) {
                    if (i !== playerIdx && i !== partnerIndex) {
                        totalVoters++;
                        voterPromises.push(
                            promptForInteraction(
                                `Adivina: ${players[i].name}`,
                                `¿La historia de ${currentPlayer.name} y ${partner.name} es real o inventada?`,
                                {type: 'boolean_choice', choices: [{label: "Real", value: true}, {label: "Inventada", value: false}]}
                            ).then(guess => { if (guess === storyReal) correctGuesses++; })
                        );
                    }
                }
                await Promise.all(voterPromises); 
                if (totalVoters === 0 && players.length <=2 ) { // Only 1 or 2 players total
                     updateChallengeText("No hay suficientes jugadores para adivinar. Los narradores ganan 1 punto.");
                     addPoints(playerIdx,1,true); if (playerIdx !== partnerIndex) addPoints(partnerIndex,1,true);
                } else if (correctGuesses > totalVoters / 2) { 
                    updateChallengeText("¡Mayoría acertó! Los adivinadores ganan puntos.");
                    for(let i=0; i < players.length; i++) { if (i !== playerIdx && i !== partnerIndex) addPoints(i,1, false); }
                } else { 
                    updateChallengeText(`¡Fallaron! ${currentPlayer.name} y ${partner.name} ganan puntos.`);
                    addPoints(playerIdx,1,true); if (playerIdx !== partnerIndex) addPoints(partnerIndex,1,true);
                }
                break;
            
            case 'piedra_silencio':
                updateChallengeText(`${currentPlayer.name} acepta el reto de ${card.title}.`);
                currentPlayer.effects.piedraSilencio = card.duration + 1; 
                const fulfilled = await promptForInteraction(
                     "Piedra del Silencio - Compromiso",
                     `${currentPlayer.name}, debes mantener silencio durante tu próximo turno completo. ¿Te comprometes?`,
                     {type: 'boolean_choice', choices: [{label: "Sí, me comprometo", value: true}, {label: "No (cancela el reto)", value: false}]}
                 );
                 if (fulfilled) {
                    currentPlayer.effects.piedraSilencioFulfilledAttempt = true; 
                    updateChallengeText(`${currentPlayer.name} se compromete a la Piedra del Silencio.`);
                 } else {
                    currentPlayer.effects.piedraSilencio = 0; 
                    updateChallengeText(`${currentPlayer.name} ha decidido no aceptar el reto.`);
                 }
                break;

            case 'reto_dualidad':
                 const playerLeftIndex = (playerIdx === 0) ? players.length - 1 : playerIdx - 1;
                 const dilemaSetter = players[playerLeftIndex];
                 if (!dilemaSetter) { updateChallengeText("Error: No se encontró el jugador para el dilema."); break; }
                 updateChallengeTextProcessing(`${dilemaSetter.name}, presenta un dilema con dos opciones a ${currentPlayer.name}.`);
                 const dilemaText = await promptForInteraction( 
                     `Dilema para ${currentPlayer.name}`,
                     `${dilemaSetter.name}, escribe tu dilema (Ej: ¿Playa o Montaña?):`,
                     {type: 'text_input', placeholder: "Ej: ¿Madrugar o Trasnochar?"}
                 );
                 const choice = await promptForInteraction(
                     `Reto de Dualidad para ${currentPlayer.name}`,
                     `Dilema de ${dilemaSetter.name}: "${dilemaText || 'Un dilema no especificado'}". ${currentPlayer.name}, elige y explica:`,
                     {type: 'boolean_choice', choices: [{label: "Opción A / Primera", value: 'A'}, {label: "Opción B / Segunda", value: 'B'}]} 
                 );
                 let agreements_dualidad = 0; let dualidadVoters = 0; const dualidadPromises = [];
                 for(let i=0; i < players.length; i++) {
                    if (i !== playerIdx && i !== playerLeftIndex) { 
                        dualidadVoters++;
                        dualidadPromises.push(
                            promptForInteraction(
                                `Votación: ${players[i].name}`,
                                `Dilema: "${dilemaText}". ${currentPlayer.name} eligió ${choice === 'A' ? 'Opción A/Primera' : 'Opción B/Segunda'}. ¿De acuerdo?`,
                                {type: 'boolean_choice', choices: [{label: "Sí", value: true}, {label: "No", value: false}]}
                            ).then(agreed => { if(agreed) agreements_dualidad++; })
                        );
                    }
                 }
                 await Promise.all(dualidadPromises);
                 if (dualidadVoters === 0 || agreements_dualidad > dualidadVoters / 2) {
                    addPoints(playerIdx, 1, true); updateChallengeText(`${currentPlayer.name} gana 1 punto por el Reto de la Dualidad!`);
                 } else { updateChallengeText(`${currentPlayer.name} no consiguió mayoría.`); }
                break;
            case 'espejo_roto':
                updateChallengeTextProcessing(`${currentPlayer.name} debe imitar una emoción. Los demás adivinan.`);
                await promptForInteraction( "Espejo Roto", `${currentPlayer.name}, imita una emoción. (Clic en Confirmar tras actuación y adivinanzas).`,
                    {type: 'boolean_choice', choices: [{label: "Confirmar Actuación", value:true}]} );
                addPoints(playerIdx, 1, true); updateChallengeText(`${currentPlayer.name} completó "Espejo Roto" y gana 1 punto.`);
                break;
            case 'gesto_inesperado':
                const otherPlayersForGesto = players.filter(p => p.id !== currentPlayer.id);
                if (otherPlayersForGesto.length === 0) { updateChallengeText("No hay otros jugadores."); break; }
                const targetPlayerId_gesto = await promptForInteraction( `${currentPlayer.name}, elige a quién hacer un cumplido:`, "Elige un jugador.",
                    { type: 'player_select', players: otherPlayersForGesto } );
                if (targetPlayerId_gesto) {
                    const targetPlayerObj_gesto = players.find(p => p.id === targetPlayerId_gesto);
                    if (targetPlayerObj_gesto) {
                        updateChallengeText(`${currentPlayer.name} le hace un cumplido a ${targetPlayerObj_gesto.name}. Ambos ganan 1 punto.`);
                        addPoints(playerIdx, 1, true);
                        const targetIdx = players.findIndex(p => p.id === targetPlayerId_gesto);
                        if (targetIdx !== -1) addPoints(targetIdx, 1, false); 
                    }
                } else { updateChallengeText(`${currentPlayer.name} no eligió a nadie.`); }
                break;
            case 'retroceso_dulce':
                updatePlayerPosition(playerIdx, Math.max(0, currentPlayer.position + card.move));
                updateChallengeText(`${currentPlayer.name} retrocede a ${currentPlayer.position}. Gana ${card.bonusPoints} puntos.`);
                addPoints(playerIdx, card.bonusPoints, true); 
                break;
            case 'minijuego_objeto':
                 updateChallengeTextProcessing(`${currentPlayer.name} usa un objeto para representar un recuerdo.`);
                 await promptForInteraction( "Minijuego del Objeto", `${currentPlayer.name}, presenta tu objeto y recuerdo. (Confirmar tras presentación).`,
                    {type: 'boolean_choice', choices: [{label: "Confirmar", value:true}]} );
                 addPoints(playerIdx, 1, true); updateChallengeText(`${currentPlayer.name} completó y gana 1 punto.`);
                break;
            case 'caja_tesoros':
                updateChallengeTextProcessing(`${currentPlayer.name} describe tres objetos para su caja nostálgica.`);
                 await promptForInteraction( "Caja de Tesoros", `${currentPlayer.name}, describe tus objetos. (Confirmar tras descripción y votación).`,
                    {type: 'boolean_choice', choices: [{label: "Confirmar", value:true}]} );
                addPoints(playerIdx, card.points || 2, true); updateChallengeText(`${currentPlayer.name} completó y gana ${card.points || 2} puntos.`);
                break;
            case 'culpabilidad_silenciosa':
                const otherPlayersForCulpa = players.filter(p => p.id !== currentPlayer.id);
                 if (otherPlayersForCulpa.length === 0) { updateChallengeText("No hay otros jugadores."); break; }
                 const giftTargetId_culpa = await promptForInteraction( `${currentPlayer.name}, elige a quién regalar 1 punto:`, "Escoge a otro jugador.",
                    { type: 'player_select', players: otherPlayersForCulpa } );
                 if (giftTargetId_culpa) {
                    const targetPlayerObj_culpa = players.find(p => p.id === giftTargetId_culpa);
                    if (targetPlayerObj_culpa) {
                        updateChallengeText(`${currentPlayer.name} regala 1 punto a ${targetPlayerObj_culpa.name}.`);
                        const giftTargetIdx = players.findIndex(p => p.id === giftTargetId_culpa);
                        if (giftTargetIdx !== -1) addPoints(giftTargetIdx, 1, false); 
                    }
                 } else { updateChallengeText(`${currentPlayer.name} no eligió a nadie.`); }
                break;
            default: 
                updateChallengeText(`${currentPlayer.name} completó "${card.title}". Gana 1 punto.`);
                addPoints(playerIdx, 1, true); 
        }
    } else if (phase === 'skip') {
        updateChallengeText(`${currentPlayer.name} saltó el desafío de "${card.title}".`);
    }
}

function updateChallengeTextProcessing(text) {
    const el = document.getElementById('current-challenge-text');
    if(el) el.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
}

startGameBtn.addEventListener('click', startGame);
rollDiceBtn.addEventListener('click', rollDiceAndMove);
drawCardBtnElement.addEventListener('click', handleDrawCardClick); 
endTurnBtn.addEventListener('click', endCurrentTurn);
completeChallengeBtn.addEventListener('click', completeCurrentChallenge);
skipChallengeBtn.addEventListener('click', skipCurrentChallenge);
if(useAbilityBtn) useAbilityBtn.addEventListener('click', usePlayerAbility);
if(addCustomCardBtn) addCustomCardBtn.addEventListener('click', addVisualCustomCard);

if (playerCountInput) {
    playerCountInput.addEventListener('input', (event) => { // Use 'input' for immediate feedback
        const count = parseInt(event.target.value);
        updatePlayerNameInputsVisibility(count);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    showPregameCustomization(true); 
    const initialPlayerCount = playerCountInput ? parseInt(playerCountInput.value) : 3;
    updatePlayerNameInputsVisibility(initialPlayerCount); 
    setControlsState({ startGame: true });
    hideCardDetails();
    configureDiceDots(1);
    const initialChallengeText = document.getElementById('current-challenge-text');
    if(initialChallengeText) initialChallengeText.textContent = 'Configura el número de jugadores y sus nombres, y haz clic en "Iniciar Juego".';
});
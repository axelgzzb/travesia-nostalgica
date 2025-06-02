/**
 * UI functionality for the Travesía Nostálgica game
 */

// UI elements
const currentChallengeTextElement = document.getElementById('current-challenge-text');
const winnerModalElement = document.getElementById('winner-modal');
const winnerNameElement = document.getElementById('winner-name');
const winnerPointsElement = document.getElementById('winner-points');
const closeModalBtn = document.getElementById('close-modal');
const restartBtn = document.getElementById('restart-btn');

const interactionModalElement = document.getElementById('interaction-modal');
const interactionTitleElement = document.getElementById('interaction-title');
const interactionPromptElement = document.getElementById('interaction-prompt');
const interactionOptionsElement = document.getElementById('interaction-options');
const interactionSubmitBtn = document.getElementById('interaction-submit');

let interactionResolve = null; 


/**
 * Show the winner modal
 * @param {string} playerId - The ID of the winning player (or one of them in a tie)
 * @param {number} points - The points of the winning player
 * @param {boolean} isTie - If it's a tie
 * @param {string} tieWinnerNames - Names of tied players if applicable
 */
function showWinnerDisplay(playerId, points, isTie = false, tieWinnerNames = "") {
    const player = getPlayerById(playerId); // Get one of the winners for display
    if (!player && !isTie) return; // Should not happen if logic is correct
    
    if (isTie && tieWinnerNames) {
         winnerNameElement.textContent = `¡Es un empate entre ${tieWinnerNames}!`;
    } else if (player) {
        winnerNameElement.textContent = `¡${player.name} ha ganado!`;
    } else {
         winnerNameElement.textContent = `¡Fin del Juego!`; // Fallback
    }
    winnerPointsElement.textContent = `Con ${points} puntos`;
    winnerModalElement.style.display = 'flex';
}


/**
 * Update challenge text / game notifications
 * @param {string} text - The text to display
 */
function updateChallengeText(text) {
    if (currentChallengeTextElement) {
        currentChallengeTextElement.innerHTML = text; 
    }
}

/**
 * Enable or disable game controls
 * @param {Object} states - The control states
 */
function setControlsState(states) {
    const controls = {
        startGame: false, rollDice: false, drawCard: false, endTurn: false,
        completeChallenge: false, skipChallenge: false, useAbility: false,
        ...states 
    };

    document.getElementById('start-game').disabled = !controls.startGame;
    document.getElementById('roll-dice').disabled = !controls.rollDice;
    document.getElementById('draw-card').disabled = !controls.drawCard;
    document.getElementById('end-turn').disabled = !controls.endTurn;
    document.getElementById('complete-challenge').disabled = !controls.completeChallenge;
    document.getElementById('skip-challenge').disabled = !controls.skipChallenge;
    
    const abilityBtn = document.getElementById('use-ability');
    if (abilityBtn) {
        abilityBtn.disabled = !controls.useAbility;
        abilityBtn.style.display = controls.useAbility ? 'inline-block' : 'none';
    }
}


if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        winnerModalElement.style.display = 'none';
    });
}

if (restartBtn) { 
    restartBtn.addEventListener('click', () => {
        winnerModalElement.style.display = 'none';
        triggerRestartGame(); 
    });
}


function promptForInteraction(title, promptText, optionsConfig) {
    return new Promise((resolve) => {
        interactionResolve = resolve; 

        interactionTitleElement.textContent = title;
        interactionPromptElement.innerHTML = promptText; 
        interactionOptionsElement.innerHTML = ''; 

        if (optionsConfig.type === 'player_select') {
            const select = document.createElement('select');
            select.id = 'player-select-dropdown';
            optionsConfig.players.forEach((p) => { // Removed unused idx
                // Exclude based on passed ID rather than current player, if needed
                if (optionsConfig.excludePlayerId && p.id === optionsConfig.excludePlayerId) return;
                const option = document.createElement('option');
                option.value = p.id; 
                option.textContent = p.name;
                select.appendChild(option);
            });
            interactionOptionsElement.appendChild(select);
            interactionSubmitBtn.style.display = 'inline-block'; // Show submit for select
        } else if (optionsConfig.type === 'boolean_choice') { 
            optionsConfig.choices.forEach(choice => {
                 const button = document.createElement('button');
                 button.classList.add('game-button'); // Style as game button
                 button.textContent = choice.label;
                 button.dataset.value = choice.value; // Store boolean value directly
                 button.addEventListener('click', () => {
                    if (interactionResolve) interactionResolve(choice.value); // Resolve with the boolean
                    interactionModalElement.style.display = 'none';
                 });
                 interactionOptionsElement.appendChild(button);
            });
            interactionSubmitBtn.style.display = 'none'; // Hide general submit for direct action buttons
        } else if (optionsConfig.type === 'text_input') {
            const textarea = document.createElement('textarea');
            textarea.id = 'interaction-text-input';
            textarea.placeholder = optionsConfig.placeholder || "Escribe aquí...";
            interactionOptionsElement.appendChild(textarea);
            interactionSubmitBtn.style.display = 'inline-block'; // Show submit for text input
        }
        interactionModalElement.style.display = 'flex';
    });
}

interactionSubmitBtn.addEventListener('click', () => {
    if (interactionResolve) {
        let result;
        const playerSelect = document.getElementById('player-select-dropdown');
        const textInput = document.getElementById('interaction-text-input');

        if (playerSelect && playerSelect.options.length > 0) { 
            result = playerSelect.value;
        } else if (textInput) {
            result = textInput.value;
        }
        interactionResolve(result); // Resolve with the collected result
    }
    interactionModalElement.style.display = 'none';
});

function promptForPlayerChoice(currentPlayerIdToExclude, allPlayers, promptMessage = "Elige un jugador:") { // Parameter name changed for clarity
     return promptForInteraction("Seleccionar Jugador", promptMessage, {
        type: 'player_select',
        players: allPlayers,
        excludePlayerId: currentPlayerIdToExclude // Pass the ID of the player to exclude
    }).then(chosenPlayerId => {
        if (chosenPlayerId === null || chosenPlayerId === undefined) return null; // Handle no choice
        return allPlayers.findIndex(p => p.id === chosenPlayerId);
    });
}
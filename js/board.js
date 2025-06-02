/**
 * Board functionality for the Travesía Nostálgica game
 */

// const gameBoardElement = document.getElementById('game-board'); // Not strictly needed if board image is static

/**
 * Update the current zone display text based on player position
 * This function now primarily serves to get the zone name, as the display element is removed.
 * @param {number} position - The player's position on the board
 */
function updateCurrentZone(position) {
    const currentZone = getZoneByPosition(position);
    // const currentZoneDisplay = document.getElementById('current-zone-display'); // Element removed from HTML

    // if (currentZoneDisplay) {
        // const zoneDisplayName = (currentZone.name === "Inicio" && position === 0) ? "Comienzo del Viaje" : currentZone.name;
        // currentZoneDisplay.textContent = zoneDisplayName;
    // }
    
    // The main board image (tablero.jpg) is static.
    // Dynamic zone image changing is commented out as before.
}

/**
 * Get the current zone object based on position
 * @param {number} position - The position on the board
 * @returns {Object} - The zone object
 */
function getZoneByPosition(position) {
    let currentZone = GAME_ZONES[0]; 
    for (let i = GAME_ZONES.length - 1; i >= 0; i--) {
        if (position >= GAME_ZONES[i].position) {
            currentZone = GAME_ZONES[i];
            break;
        }
    }
    return currentZone;
}

/**
 * Check if the player has crossed into a new zone
 * @param {number} oldPosition - The player's old position
 * @param {number} newPosition - The player's new position
 * @returns {boolean} - True if the player crossed a zone boundary
 */
function crossedZoneBoundary(oldPosition, newPosition) {
    const oldZone = getZoneByPosition(oldPosition);
    const newZone = getZoneByPosition(newPosition);
    return oldZone.name !== newZone.name;
}

/**
 * Calculate a player's visual position on the board in percentages.
 * IMPORTANT: This function requires SIGNIFICANT CALIBRATION to match your 'tablero.jpg'.
 * The current values are placeholders and will likely not align correctly.
 * You need to find the correct X (left) and Y (bottom) coordinates for each
 * logical position on your specific board image.
 * @param {number} position - The player's game position (0 to MAX_POSITION)
 * @param {number} playerIndex - The player's index (0 to 5 for staggering)
 * @returns {Object} - The {left, bottom} position as strings (e.g., '50%')
 */
function calculateBoardPosition(position, playerIndex) {
    const normalizedPosition = Math.min(position / MAX_POSITION, 1); // 0 to 1

    // --- START CRITICAL CALIBRATION SECTION ---
    // These percentages are ILLUSTRATIVE. You MUST adjust them based on your 'tablero.jpg'
    let leftPercent = 5 + normalizedPosition * 85; 
    let bottomPercent = 15 + playerIndex * 4; // Adjusted staggering slightly for more players

    if (position <= 0) {
        leftPercent = 3 + playerIndex * 1.5; 
        bottomPercent = 50 - playerIndex * 8; 
    } else if (position > 0 && position <= GAME_ZONES[1].position) { // Primavera
        leftPercent = 10 + (position / GAME_ZONES[1].position) * 15 + playerIndex * 0.8; 
        bottomPercent = 60 - playerIndex * 2.5;
    } else if (position <= GAME_ZONES[2].position) { // Verano
        leftPercent = 25 + ((position - GAME_ZONES[1].position) / (GAME_ZONES[2].position - GAME_ZONES[1].position)) * 18 + playerIndex * 0.8;
        bottomPercent = 50 - playerIndex * 2.5;
    } else if (position <= GAME_ZONES[3].position) { // Otoño
        leftPercent = 43 + ((position - GAME_ZONES[2].position) / (GAME_ZONES[3].position - GAME_ZONES[2].position)) * 18 + playerIndex * 0.8;
        bottomPercent = 55 - playerIndex * 2.5;
    } else if (position <= GAME_ZONES[4].position) { // Invierno
        leftPercent = 61 + ((position - GAME_ZONES[3].position) / (GAME_ZONES[4].position - GAME_ZONES[3].position)) * 18 + playerIndex * 0.8;
        bottomPercent = 50 - playerIndex * 2.5;
    } else if (position <= GAME_ZONES[5].position) { // Tormenta
        leftPercent = 79 + ((position - GAME_ZONES[4].position) / (GAME_ZONES[5].position - GAME_ZONES[4].position)) * 10 + playerIndex * 0.8;
        bottomPercent = 55 - playerIndex * 2.5;
    } else { // Espejo de la Verdad (Final Zone)
        leftPercent = 90 + playerIndex * 0.8; 
        bottomPercent = 45 - playerIndex * 4; 
    }
    
    leftPercent = Math.max(1, Math.min(leftPercent, 96)); 
    bottomPercent = Math.max(3, Math.min(bottomPercent, 85)); // Adjusted min bottom
    // --- END CRITICAL CALIBRATION SECTION ---

    return { 
        left: `${leftPercent}%`, 
        bottom: `${bottomPercent}%` 
    };
}
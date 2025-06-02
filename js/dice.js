/**
 * Dice functionality for the Travesía Nostálgica game
 */

// Get the dice element
const diceElement = document.getElementById('dice');

/**
 * Configure the dice dots based on the value
 * @param {number} value - The value to display (1-6)
 */
function configureDiceDots(value) {
    diceElement.innerHTML = ''; // Clear previous dots
    
    const diceFace = document.createElement('div');
    diceFace.className = 'dice-face';
    
    // Add dots based on value
    switch(value) {
        case 1:
            diceFace.innerHTML = '<div class="dice-dot center"></div>';
            break;
        case 2:
            diceFace.innerHTML = `
                <div class="dice-dot top-left"></div>
                <div class="dice-dot bottom-right"></div>
            `;
            break;
        case 3:
            diceFace.innerHTML = `
                <div class="dice-dot top-left"></div>
                <div class="dice-dot center"></div>
                <div class="dice-dot bottom-right"></div>
            `;
            break;
        case 4:
            diceFace.innerHTML = `
                <div class="dice-dot top-left"></div>
                <div class="dice-dot top-right"></div>
                <div class="dice-dot bottom-left"></div>
                <div class="dice-dot bottom-right"></div>
            `;
            break;
        case 5:
            diceFace.innerHTML = `
                <div class="dice-dot top-left"></div>
                <div class="dice-dot top-right"></div>
                <div class="dice-dot center"></div>
                <div class="dice-dot bottom-left"></div>
                <div class="dice-dot bottom-right"></div>
            `;
            break;
        case 6: // Corrected dot placement for 6 based on common dice and CSS
            diceFace.innerHTML = `
                <div class="dice-dot top-left"></div>
                <div class="dice-dot top-right"></div>
                <div class="dice-dot mid-left"></div> 
                <div class="dice-dot mid-right"></div>
                <div class="dice-dot bottom-left"></div>
                <div class="dice-dot bottom-right"></div>
            `;
            break;
        default: // Should not happen with rollDiceValue logic
            diceFace.innerHTML = '<div class="dice-dot center"></div>'; 
    }
    
    diceElement.appendChild(diceFace);
}

/**
 * Roll the dice and return a random value
 * @returns {number} - A random number between 1 and MAX_DICE_VALUE
 */
function rollDiceValue() {
    return Math.floor(Math.random() * MAX_DICE_VALUE) + 1;
}

/**
 * Animate dice rolling and return a promise that resolves with the dice value
 * @returns {Promise<number>} - A promise that resolves with the dice value
 */
function animateDiceRoll() {
    return new Promise((resolve) => {
        diceElement.classList.add('dice-rolling');
        
        let rollCount = 0;
        const maxRolls = 10; // Number of "fast rolls" for animation
        const rollIntervalTime = 80; // ms per fast roll

        const rollInterval = setInterval(() => {
            const randomValue = rollDiceValue();
            configureDiceDots(randomValue);
            
            rollCount++;
            if (rollCount >= maxRolls) {
                clearInterval(rollInterval);
                
                const finalValue = rollDiceValue();
                configureDiceDots(finalValue);
                
                setTimeout(() => { // Brief pause before removing class and resolving
                    diceElement.classList.remove('dice-rolling');
                    resolve(finalValue);
                }, 200); // ms
            }
        }, rollIntervalTime);
    });
}

// Initialize dice with value 1 on load
if (diceElement) {
    configureDiceDots(1);
}
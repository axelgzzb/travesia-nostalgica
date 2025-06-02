/**
 * Card functionality for the Travesía Nostálgica game
 */

// Card-related DOM elements
const cardDetailsElement = document.getElementById('card-details');
const cardImageElement = document.getElementById('card-image');
const cardTitleElement = document.getElementById('card-title');
const cardDescriptionElement = document.getElementById('card-description');
// const cardAreaElement = document.getElementById('card-area'); // Removed as visual deck is gone

// Game deck (will be shuffled at start)
let gameDeck = [];
let discardPile = [];

/**
 * Shuffle the game deck using Fisher-Yates algorithm
 */
function shuffleDeck() {
    gameDeck = [...GAME_CARDS]; // Create a copy of the original cards
    
    // Fisher-Yates shuffle
    for (let i = gameDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
    }
    
    // Reset discard pile
    discardPile = [];
    
    // updateCardArea(); // Removed: No visual deck area to update
}

/**
 * Update the card area with visual representation of the deck
 * This function is no longer used as the visual deck area has been removed.
 */
/*
function updateCardArea() {
    // cardAreaElement.innerHTML = ''; // Clear the card area
    
    // if (gameDeck.length > 0) {
    //     const deckElement = document.createElement('div');
    //     deckElement.className = 'game-card'; // This is the deck pile
    //     deckElement.innerHTML = `
    //         <i class="fas fa-layer-group card-back-icon"></i> <div>Mazo (${gameDeck.length})</div>
    //     `;
    //     cardAreaElement.appendChild(deckElement);
    // } else {
    //     // cardAreaElement.innerHTML = '<p>Mazo vacío. ¡Barajando!</p>';
    // }
}
*/

/**
 * Draw a card from the top of the deck
 * If the deck is empty, reshuffle the discard pile to form a new deck
 * @returns {Object|null} - The drawn card or null if deck is truly empty
 */
function drawCardFromDeck() { 
    if (gameDeck.length === 0) {
        if (discardPile.length > 0) {
            gameDeck = [...discardPile];
            discardPile = [];
            
            for (let i = gameDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
            }
            // updateCardArea(); // Removed: No visual deck area to update
            // updateChallengeText("Mazo vacío, barajando el descarte..."); // UI update in game.js
        } else {
            // updateChallengeText("¡No quedan cartas en el mazo ni en el descarte!"); // UI update in game.js
            return null; // Both deck and discard pile are empty
        }
    }
    
    const drawnCard = gameDeck.pop();
    // updateCardArea(); // Removed: No visual deck area to update
    return drawnCard;
}

/**
 * Display card details in the UI
 * @param {Object} card - The card to display
 */
function displayCardDetails(card) {
    if (!card) {
        hideCardDetails();
        return;
    }
    
    cardImageElement.src = card.image || 'images/cards/default.jpg';
    cardTitleElement.textContent = card.title;
    cardDescriptionElement.textContent = card.description;
    
    cardDetailsElement.classList.add('active'); // Show the card details section
}

/**
 * Hide the card details in the UI
 */
function hideCardDetails() {
    cardDetailsElement.classList.remove('active');
}

/**
 * Add the current card to the discard pile
 * @param {Object} card - The card to discard
 */
function discardCard(card) {
    if (card) {
        discardPile.push(card);
    }
}
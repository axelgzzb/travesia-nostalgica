/**
 * Configuration and initial data for the Travesía Nostálgica game
 */

// Game zones
const GAME_ZONES = [
    { name: "Inicio", position: 0, image: "images/board/inicio.jpg" },
    { name: "Primavera de Inocencia", position: 10, image: "images/board/primavera.jpg" },
    { name: "Verano de Crecimiento", position: 20, image: "images/board/verano.jpg" },
    { name: "Otoño de Pérdidas", position: 25, image: "images/board/otono.jpg" },
    { name: "Invierno de Reflexión", position: 30, image: "images/board/invierno.jpg" }, // Position 40 triggers end-game sequence
    { name: "Tormenta de Melancolía", position: 35, image: "images/board/tormenta.jpg" },
    { name: "Espejo de la Verdad", position: 40, image: "images/board/espejo.jpg" } // Final space on board
];

const MAX_POSITION = GAME_ZONES[GAME_ZONES.length - 1].position; // Max physical position on board
const TRIGGER_END_GAME_POSITION = 40; // Position that triggers the final rounds
const POINTS_TO_WIN = 15; // This might be less relevant if game ends by rounds after pos 40. Winner is highest score.

const PLAYER_COLORS = [
    'var(--blue)', 
    'var(--red)', 
    'var(--green)', 
    'var(--purple)', 
    'var(--orange)', 
    'var(--teal)'
];

const BASE_PLAYER_STRUCTURE = {
    position: 0, 
    points: 0, 
    role: {}, 
    effects: {}, 
    hasReachedEnd: false, // Tracks if player reached actual MAX_POSITION (60)
    // No need for hasTriggeredFinalRounds on player, gameState.finalRounds.isActive handles it globally
};

const PLAYER_ROLES = [
    {
        id: "viajero",
        name: "El Viajero",
        description: "Avanza 1 casilla extra si: Llega a una casilla ocupada por otro jugador, u otro jugador entra en su casilla. (No acumulable; solo una vez por turno).",
        image: "images/roles/viajero.jpg",
        abilityText: "Movimiento condicional +1",
        abilityType: "passive_movement" 
    },
    {
        id: "empatico",
        name: "El Empático",
        description: "Avanza una casilla cada vez que colabora en un reto con otro jugador.",
        image: "images/roles/empatico.jpg",
        abilityText: "Movimiento por colaboración",
        abilityType: "event_movement" 
    },
    {
        id: "la_chispa",
        name: "La Chispa",
        description: "Si hace reír a otro jugador durante un reto, gana 1 punto (máx. 1 vez por ronda). (Difícil de automatizar, se basa en honor).",
        image: "images/roles/la_chispa.jpg",
        abilityText: "Punto por humor (manual)",
        abilityType: "manual_point" 
    },
    {
        id: "el_critico",
        name: "El Crítico",
        description: "Puede anular un reto una vez por partida y pedir uno nuevo.",
        image: "images/roles/critico.jpg",
        abilityText: "Anular reto (1 vez)",
        abilityType: "action_once" 
    },
    {
        id: "el_aleatorio",
        name: "El Aleatorio",
        description: "Cada turno lanza un dado adicional; si en este saca un 6, gana 1 punto.",
        image: "images/roles/el_aleatorio.jpg",
        abilityText: "Dado extra, punto con 6",
        abilityType: "passive_turn_start"
    },
    {
        id: "la_musa",
        name: "La Musa",
        description: "Elige a un jugador al empezar la partida: si este gana un punto en su reto, la Musa también lo gana (una vez por ronda).",
        image: "images/roles/la_musa.jpg",
        abilityText: "Punto por aliado (1 vez/ronda)",
        abilityType: "setup_choice_passive_point" 
    },
    {
        id: "el_doble",
        name: "El Doble",
        description: "Si cae en la misma casilla que otro jugador, puede copiar su reto y hacerlo también para ganar puntos.",
        image: "images/roles/el_doble.jpg",
        abilityText: "Copiar reto en misma casilla",
        abilityType: "conditional_action" 
    }
];

// Ensure these image paths match your actual files in images/cards/
const GAME_CARDS = [
    {
        id: "memoria_compartida",
        title: "Memoria Compartida",
        description: "El jugador y el tercero a su derecha comparten una memoria (real o inventada). El resto debe adivinar si es verdadera. Si adivinan bien, todos los demás ganan 1 punto. Si se equivocan, los que contaron la memoria ganan 1 punto cada uno.",
        image: "images/cards/memoria_compartida.jpg",
        type: "social_interactive",
        requiresInteraction: true
    },
    {
        id: "piedra_silencio",
        title: "Piedra del Silencio",
        description: "El jugador no puede hablar durante el próximo turno. Si lo cumple correctamente, gana 1 punto.",
        image: "images/cards/piedra_silencio.jpg", // Example: PDF shows "PIEDRA DEL SILENCIO"
        type: "personal_challenge",
        duration: 1 
    },
    {
        id: "reto_dualidad",
        title: "Reto de la Dualidad",
        description: "El jugador recibe dos opciones (por parte del jugador de su izquierda) sobre un dilema. Debe elegir una y explicarla. Si su opinión coincide con la mayoría de jugadores, gana un punto.",
        image: "images/cards/reto_dualidad.jpg", // Example: PDF shows "RETO DE LA DUALIDAD"
        type: "social_interactive",
        requiresInteraction: true
    },
    {
        id: "espejo_roto",
        title: "Espejo Roto",
        description: "El jugador debe imitar emocionalmente una expresión (tristeza, alegría, miedo). Los otros deben adivinar la emoción. Si al menos la mitad acierta, se gana 1 punto.",
        image: "images/cards/espejo_roto.jpg", // Example: PDF shows "ESPEJO ROTO"
        type: "performance_interactive",
        requiresInteraction: true
    },
    {
        id: "gesto_inesperado",
        title: "Gesto Inesperado",
        description: "El jugador debe hacer un cumplido sincero a otro. Si lo hace, gana 1 punto. El jugador que recibe el cumplido también gana 1 punto.",
        image: "images/cards/gesto_inesperado.jpg", // Example: PDF shows "GESTO INESPERADO"
        type: "social_positive",
        requiresInteraction: true 
    },
    {
        id: "retroceso_dulce",
        title: "Retroceso Dulce",
        description: "Retrocede 2 casillas... pero gana +2 puntos si participas en el reto que hay allí. (Si no hay reto o es solo movimiento, gana 1 punto por el esfuerzo).",
        image: "images/cards/retroceso_dulce.jpg", // Example: PDF shows "RETROCESO DULCE"
        type: "movement_challenge",
        move: -2,
        bonusPoints: 2 
    },
    {
        id: "minijuego_objeto",
        title: "Minijuego del Objeto",
        description: "Usa algo cercano (una taza, bolígrafo, etc.) para representar un recuerdo. Explica por qué. Si al menos 2 jugadores conectan con la historia, ganas 1 punto.",
        image: "images/cards/minijuego_objeto.jpg", // Example: PDF shows "MINIJUEGO DEL OBJETO" (with accent on first O)
        type: "creative_interactive",
        requiresInteraction: true 
    },
    {
        id: "caja_tesoros",
        title: "Caja de Tesoros",
        description: "Describe tres objetos que guardarías en una caja nostálgica. Si los demás jugadores aprueban, ganas +2 puntos.",
        image: "images/cards/caja_tesoros.jpg", // Example: PDF shows "CAJA DE TESOROS"
        type: "creative_interactive",
        points: 2, 
        requiresInteraction: true 
    },
    {
        id: "niebla_mental",
        title: "Niebla Mental",
        description: "No puedes usar cartas de habilidad de rol por los próximos dos turnos.", 
        image: "images/cards/niebla_mental.jpg", // Example: PDF shows "NIEBLA MENTAL"
        type: "restriction",
        duration: 2 
    },
    {
        id: "pesadez_corazon",
        title: "Pesadez en el Corazón",
        description: "Pierdes 2 puntos si estás en la zona de Otoño de Pérdidas o Tormenta de Melancolía.",
        image: "images/cards/pesadez_corazon.jpg", // Example: PDF shows "PESADEZ EN EL CORAZÓN"
        type: "penalty_conditional",
        pointsLost: 2,
        conditionalZones: ["Otoño de Pérdidas", "Tormenta de Melancolía"]
    },
    {
        id: "culpabilidad_silenciosa",
        title: "Culpabilidad Silenciosa",
        description: "Escoge a otro jugador: debes regalarle 1 punto (representa una disculpa que nunca diste).",
        image: "images/cards/culpabilidad_silenciosa.jpg", // Example: PDF shows "CULPABILIDAD SILENCIOSA"
        type: "social_penalty", 
        requiresInteraction: true 
    }
    // "Caos Emocional" card is intentionally omitted from random draw as per previous request.
    // {
    //     id: "caos_emocional",
    //     title: "Caos Emocional",
    //     description: "Todos los jugadores intercambian sus roles al azar. Cada uno debe actuar con el nuevo rol a partir del siguiente turno.",
    //     image: "images/cards/caos_emocional.jpg",
    //     type: "game_changing",
    //     action: "swap_roles"
    // },
];

const MAX_DICE_VALUE = 6;
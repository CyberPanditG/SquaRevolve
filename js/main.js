// Canvas setup
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Simulation speed and timing
let simulationSpeed = 1.0;
let lastFrameTime = 0;
const targetFps = 60;
let autoResetTimer = 0;
let isFirstInitialization = true;

// Initialize on load and resize
window.addEventListener('load', initialize);
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupGrid();
}

function updateEntitySpeeds() {
    const newDelay = Math.max(1, Math.round(baseEntityMoveDelay / simulationSpeed));
    entities.forEach(entity => {
        entity.moveDelay = newDelay;
    });
}

function initialize() {
    resizeCanvas();
    
    // Create initial entities
    for (let i = 0; i < initialProducers; i++) {
        entities.push(createEntity());
    }
    
    addFood(initialFoodCount);
    
    // Initialize stats panel
    initializeStats();
    
    if (isFirstInitialization) {
        lastFrameTime = performance.now();
        requestAnimationFrame(simulationLoop);
        isFirstInitialization = false;
    }
}

function simulationLoop(timestamp) {
    // Calculate time since last frame
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Update FPS counter in stats panel
    updateFpsCounter(deltaTime);
    
    // Clear and draw
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    // Maintain minimum food level
    if (foods.length < minFoodAmount) {
        addFood(minFoodAmount - foods.length);
    }
    
    clearGrid();
    drawFood();
    updateEntities();
    
    // Update entity stats display
    updateEntityStats(entities, foods);
    
    // Check for auto-reset condition
    if (entities.length === 0) {
        autoResetTimer += deltaTime;
        if (autoResetTimer >= 1000) {
            resetSimulation();
        }
    } else {
        autoResetTimer = 0;
    }
    
    requestAnimationFrame(simulationLoop);
}

function resetSimulation() {
    entities = [];
    foods = [];
    resetStatsTracking();
    lastFrameTime = performance.now();
    autoResetTimer = 0;
    initialize();
}
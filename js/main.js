// Canvas setup
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Simulation speed and timing
let simulationSpeed = 1.0;
let lastFrameTime = 0;
const targetFps = 60;
let autoResetTimer = 0;
let isFirstInitialization = true;
let isPaused = false; // Flag to track if simulation is paused

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

    // Update food limits based on the new grid size
    updateFoodLimits();

    // Create initial entities
    for (let i = 0; i < initialProducers; i++) {
        entities.push(createEntity());
    }

    // Add food according to the dynamically calculated minimum
    addFood(minFoodAmount);

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

    // Only update simulation if not paused
    if (!isPaused) {
        // Maintain minimum food level
        if (foods.length < minFoodAmount) {
            addFood(minFoodAmount - foods.length);
        }

        clearGrid();
        drawFood();
        updateEntities();

        // Check for auto-reset condition
        if (entities.length === 0) {
            autoResetTimer += deltaTime;
            if (autoResetTimer >= 1000) {
                resetSimulation();
            }
        } else {
            autoResetTimer = 0;
        }

    } else {
        // When paused, still draw everything but don't update state
        clearGrid();
        drawFood();
        batchDrawEntities(entities);

        // Draw "PAUSED" text overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    // Update entity stats display (always show stats even when paused)
    updateEntityStats(entities, foods);

    requestAnimationFrame(simulationLoop);
}

function resetSimulation() {
    entities = [];
    foods = [];

    // Reset mutation tracking statistics
    mutationStats.blueToRed = 0;
    mutationStats.redToBlue = 0;

    resetStatsTracking();
    refreshGrid(); // Ensure grid is redrawn on reset
    lastFrameTime = performance.now();
    autoResetTimer = 0;
    initialize();
}
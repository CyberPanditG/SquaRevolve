// Canvas setup
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Stats elements
const blueCountElement = document.getElementById('blueCount');
const redCountElement = document.getElementById('redCount');
const foodCountElement = document.getElementById('foodCount');
const minFoodSlider = document.getElementById('minFoodSlider');
const minFoodValueDisplay = document.getElementById('minFoodValue');
const speedSlider = document.getElementById('speedSlider');
const speedValueDisplay = document.getElementById('speedValue');
const fpsCountElement = document.getElementById('fpsCount');
const targetFpsElement = document.getElementById('targetFps');

// Simulation speed and timing
let simulationSpeed = 1.0;
let lastFrameTime = 0;
let frameTimes = []; // Store last 30 frame times for calculating average FPS
const framesToTrack = 30;
const targetFps = 60;

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Recalculate grid dimensions whenever canvas is resized
    setupGrid();
}

// Initialize on load and resize
window.addEventListener('load', initialize);
window.addEventListener('resize', resizeCanvas);

// Add event listeners
minFoodSlider.addEventListener('input', () => {
    minFoodAmount = parseInt(minFoodSlider.value);
    minFoodValueDisplay.textContent = minFoodAmount;
});

speedSlider.addEventListener('input', () => {
    simulationSpeed = parseFloat(speedSlider.value);
    speedValueDisplay.textContent = simulationSpeed.toFixed(1);
    
    // Update entity movement speed based on simulation speed
    updateEntitySpeeds();
});

function updateEntitySpeeds() {
    // Update move delay for all entities based on simulation speed
    // Lower delay = faster movement
    const baseDelay = 15; // The default delay at 1.0x speed
    const newDelay = Math.max(1, Math.round(baseDelay / simulationSpeed));
    
    entities.forEach(entity => {
        entity.moveDelay = newDelay;
    });
}

function initialize() {
    resizeCanvas(); // This also sets up the grid
    
    // Create initial entities (basic squares - producers)
    for (let i = 0; i < initialProducers; i++) {
        entities.push(createEntity());
    }
    
    // Create initial food
    addFood(initialFoodCount);
    
    // Initialize displays
    minFoodValueDisplay.textContent = minFoodSlider.value;
    speedValueDisplay.textContent = simulationSpeed.toFixed(1);
    targetFpsElement.textContent = targetFps;
    
    // Start the simulation loop
    lastFrameTime = performance.now();
    requestAnimationFrame(simulationLoop);
}

function simulationLoop(timestamp) {
    // Calculate actual FPS
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Store frame time for FPS tracking
    frameTimes.push(deltaTime);
    if (frameTimes.length > framesToTrack) {
        frameTimes.shift(); // Remove oldest frame time
    }
    
    // Calculate average FPS based on recent frames
    if (frameTimes.length > 0) {
        const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const currentFps = Math.round(1000 / averageFrameTime);
        fpsCountElement.textContent = currentFps;
    }
    
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Maintain minimum food level
    if (foods.length < minFoodAmount) {
        addFood(minFoodAmount - foods.length);
    }
    
    // Clear grid occupancy before updating positions
    clearGrid();
    
    // Draw and update food
    drawFood();
    
    // Update and draw entities
    updateEntities();
    
    // Update stats
    updateStats();
    
    // Continue loop
    requestAnimationFrame(simulationLoop);
}

function updateStats() {
    const blueCount = entities.filter(e => !e.mutations.mouth).length;
    const redCount = entities.filter(e => e.mutations.mouth).length;
    
    blueCountElement.textContent = blueCount;
    redCountElement.textContent = redCount;
    foodCountElement.textContent = foods.length;
}
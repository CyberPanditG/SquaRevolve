// Stats panel elements and functionality
// This file handles all UI-related code separated from the main simulation

// DOM element references
const blueCountElement = document.getElementById('blueCount');
const redCountElement = document.getElementById('redCount');
const foodCountElement = document.getElementById('foodCount');
const minFoodSlider = document.getElementById('minFoodSlider');
const minFoodValueDisplay = document.getElementById('minFoodValue');
const speedSlider = document.getElementById('speedSlider');
const speedValueDisplay = document.getElementById('speedValue');
const fpsCountElement = document.getElementById('fpsCount');
const targetFpsElement = document.getElementById('targetFps');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const resetBtn = document.getElementById('resetBtn');

// Stats panel elements
const statsPanel = document.querySelector('.stats');
const toggleButton = document.getElementById('toggleStats');
const statsHeader = document.querySelector('.stats-header');

// Debug mutation counters - can be removed later
const debugStatsContainer = document.createElement('div');
debugStatsContainer.className = 'debug-stats';
debugStatsContainer.style.cssText = 'position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px; border-radius: 4px; font-family: monospace; z-index: 1000;';
document.body.appendChild(debugStatsContainer);

// Variables for FPS calculation
let frameTimes = []; // Store frame times for FPS calculation
const framesToTrack = 30;

// Variables for panel dragging
let isDragging = false;
let dragStartX, dragStartY;
let initialX, initialY;

// Initialize stats panel
function initializeStats() {
    // Set initial display values
    minFoodValueDisplay.textContent = minFoodSlider.value;
    speedValueDisplay.textContent = simulationSpeed.toFixed(1);
    targetFpsElement.textContent = targetFps;
    
    // Add event listeners
    setupStatsEventListeners();
}

// Set up all event listeners for stats panel
function setupStatsEventListeners() {
    // Minimize/maximize toggle
    toggleButton.addEventListener('click', toggleStatsPanel);
    
    // Food slider control
    minFoodSlider.addEventListener('input', updateMinFoodValue);
    
    // Speed slider control
    speedSlider.addEventListener('input', updateSimulationSpeed);
    
    // Pause/Resume button
    pauseResumeBtn.addEventListener('click', togglePauseResume);
    
    // Reset button
    resetBtn.addEventListener('click', () => resetSimulation());
    
    // Draggable panel functionality
    statsHeader.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch support for mobile - explicitly mark as non-passive since we use preventDefault()
    statsHeader.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

// Toggle stats panel between minimized and expanded states
function toggleStatsPanel() {
    statsPanel.classList.toggle('minimized');
    toggleButton.textContent = statsPanel.classList.contains('minimized') ? '+' : '-';
}

// Update minimum food value from slider
function updateMinFoodValue() {
    minFoodAmount = parseInt(minFoodSlider.value);
    
    // Calculate and store the user's preferred food percentage
    const availableSpaces = getAvailableGridSpaces();
    if (availableSpaces > 0) {
        userSetFoodPercentage = minFoodAmount / availableSpaces;
    }
    
    // Update the display
    updateFoodPercentage(minFoodAmount);
}

// Update simulation speed from slider
function updateSimulationSpeed() {
    simulationSpeed = parseFloat(speedSlider.value);
    speedValueDisplay.textContent = simulationSpeed.toFixed(1);
    updateEntitySpeeds();
}

// Toggle pause/resume state
function togglePauseResume() {
    // Toggle the pause state
    isPaused = !isPaused;
    
    // Update button text
    pauseResumeBtn.textContent = isPaused ? 'Resume' : 'Pause';
    
    // Visual feedback on button
    if (isPaused) {
        pauseResumeBtn.style.background = 'rgba(80, 200, 120, 0.7)'; // Green when paused (ready to resume)
    } else {
        pauseResumeBtn.style.background = 'rgba(60, 60, 60, 0.7)'; // Default when running
    }
}

// Start dragging the panel
function startDrag(e) {
    // Ignore if clicking the toggle button
    if (e.target === toggleButton) return;
    
    // Get current touch or mouse position
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    isDragging = true;
    
    // Get initial mouse position
    dragStartX = clientX;
    dragStartY = clientY;
    
    // Get current panel position
    const rect = statsPanel.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    // Prevent default behavior
    e.preventDefault();
}

// Move the panel during drag
function drag(e) {
    if (!isDragging) return;
    
    // Get current touch or mouse position
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : dragStartX);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : dragStartY);
    
    // Calculate how far the mouse has moved
    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;
    
    // Update panel position
    let newX = initialX + deltaX;
    let newY = initialY + deltaY;
    
    // Get window dimensions and panel size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const panelRect = statsPanel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    
    // Keep panel within window boundaries
    newX = Math.max(0, Math.min(windowWidth - panelWidth, newX));
    newY = Math.max(0, Math.min(windowHeight - panelHeight, newY));
    
    // Apply new position using transform for better performance
    statsPanel.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    statsPanel.style.left = '0';
    statsPanel.style.top = '0';
    
    // Prevent default behavior to avoid text selection during drag
    e.preventDefault();
}

// End dragging
function endDrag() {
    isDragging = false;
}

// Update the FPS counter
function updateFpsCounter(deltaTime) {
    // Only store reasonable frame times (< 1 second)
    if (deltaTime < 1000) {
        frameTimes.push(deltaTime);
        if (frameTimes.length > framesToTrack) {
            frameTimes.shift(); // Remove oldest frame time
        }
    }
    
    // Calculate average FPS from stored frame times
    if (frameTimes.length > 0) {
        const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const currentFps = Math.round(1000 / averageFrameTime);
        fpsCountElement.textContent = currentFps;
    }
}

// Add mutation tracking display to the debug panel
function updateDebugStats() {
    // Calculate total grid cells
    const totalGridCells = gridWidth * gridHeight;
    // Get current entity count
    const totalEntities = entities.length;
    
    // Count speedy and bulky mutations
    const speedyMutations = entities.filter(e => e.mutations.speedy).length;
    const fastBlue = entities.filter(e => e.mutations.grassAffinity && e.mutations.speedy).length;
    const fastRed = entities.filter(e => e.mutations.entityAffinity && e.mutations.speedy).length;
    
    const bulkyMutations = entities.filter(e => e.mutations.bulky).length;
    const bulkyBlue = entities.filter(e => e.mutations.grassAffinity && e.mutations.bulky).length;
    const bulkyRed = entities.filter(e => e.mutations.entityAffinity && e.mutations.bulky).length;
    
    // Count normal entities (those without speedy or bulky)
    const normalBlue = entities.filter(e => e.mutations.grassAffinity && !e.mutations.speedy && !e.mutations.bulky).length;
    const normalRed = entities.filter(e => e.mutations.entityAffinity && !e.mutations.speedy && !e.mutations.bulky).length;
    const normalTotal = normalBlue + normalRed;
    
    debugStatsContainer.innerHTML = `
        <div style="margin-bottom: 5px; font-weight: bold;">Mutation Tracking (Debug)</div>
        <div style="margin-top: 5px;">Normal Entities: ${normalTotal} (${Math.round(normalTotal/totalEntities*100 || 0)}%)</div>
        <div>- Normal Blue: ${normalBlue}</div>
        <div>- Normal Red: ${normalRed}</div>
        <div style="margin-top: 5px;">Speedy Mutations: ${speedyMutations} (${Math.round(speedyMutations/totalEntities*100 || 0)}%)</div>
        <div>- Fast Blue: ${fastBlue}</div>
        <div>- Fast Red: ${fastRed}</div>
        <div style="margin-top: 5px;">Bulky Mutations: ${bulkyMutations} (${Math.round(bulkyMutations/totalEntities*100 || 0)}%)</div>
        <div>- Bulky Blue: ${bulkyBlue}</div>
        <div>- Bulky Red: ${bulkyRed}</div>
        <div style="margin-top: 8px; border-top: 1px solid #555; padding-top: 8px;">
            <div>Grid Cells: ${totalGridCells} (${gridWidth}x${gridHeight})</div>
            <div>Total Entities: ${totalEntities}</div>
        </div>
    `;
}

// Update the entity counts in the stats panel
function updateEntityStats(entities, foods) {
    // Blue squares are those with grassAffinity mutation
    const blueCount = entities.filter(e => e.mutations.grassAffinity).length;
    // Red squares are those with entityAffinity mutation
    const redCount = entities.filter(e => e.mutations.entityAffinity).length;
    
    blueCountElement.textContent = blueCount;
    redCountElement.textContent = redCount;
    foodCountElement.textContent = foods.length;
    
    // Update debug stats
    updateDebugStats();
}

// Reset FPS tracking for new simulation
function resetStatsTracking() {
    frameTimes = [];
}
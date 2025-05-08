// Grid settings
const gridCellSize = 20; // Size of each cell in the grid
let gridWidth, gridHeight; // Will be calculated based on canvas size
let grid = []; // 2D array to store grid cells
let gridCanvas; // Offscreen canvas for grid drawing
let gridCtx; // Context for grid canvas
let gridNeedsUpdate = true; // Flag to track if grid needs redrawing

// Efficient grid occupancy tracking
let occupancyMap = {}; // Maps "x,y" strings to entities for fast lookups

// Initialize grid
function setupGrid() {
    gridWidth = Math.floor(canvas.width / gridCellSize);
    gridHeight = Math.floor(canvas.height / gridCellSize);
    
    // Initialize empty grid
    grid = new Array(gridHeight);
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = new Array(gridWidth).fill(null);
    }
    
    // Reset occupancy map
    occupancyMap = {};
    
    // Create or resize offscreen canvas for grid
    if (!gridCanvas) {
        gridCanvas = document.createElement('canvas');
        gridCtx = gridCanvas.getContext('2d');
    }
    gridCanvas.width = canvas.width;
    gridCanvas.height = canvas.height;
    
    // Mark grid for redrawing
    gridNeedsUpdate = true;
    
    // Update food limits based on new grid size
    if (typeof updateFoodLimits === 'function') {
        updateFoodLimits();
    }
}

// Draw grid to offscreen canvas
function updateGridCanvas() {
    if (!gridNeedsUpdate) return;
    
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    gridCtx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= gridWidth; x++) {
        gridCtx.beginPath();
        gridCtx.moveTo(x * gridCellSize, 0);
        gridCtx.lineTo(x * gridCellSize, gridCanvas.height);
        gridCtx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= gridHeight; y++) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y * gridCellSize);
        gridCtx.lineTo(gridCanvas.width, y * gridCellSize);
        gridCtx.stroke();
    }
    
    gridNeedsUpdate = false;
}

function drawGrid() {
    // Update the grid canvas if needed
    updateGridCanvas();
    
    // Draw the cached grid
    ctx.drawImage(gridCanvas, 0, 0);
}

// Call this when the grid needs to be redrawn (e.g., window resize)
function refreshGrid() {
    gridNeedsUpdate = true;
}

function clearGrid() {
    // Reset all grid cells to null
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            grid[y][x] = null;
        }
    }
    
    // Reset occupancy map
    occupancyMap = {};
}

// Get grid coordinates from pixel position
function getGridCoords(x, y) {
    const gridX = Math.floor(x / gridCellSize);
    const gridY = Math.floor(y / gridCellSize);
    return {
        x: Math.max(0, Math.min(gridWidth - 1, gridX)),
        y: Math.max(0, Math.min(gridHeight - 1, gridY))
    };
}

// Get pixel position from grid coordinates
function getPixelCoords(gridX, gridY) {
    return {
        x: gridX * gridCellSize + gridCellSize / 2,
        y: gridY * gridCellSize + gridCellSize / 2
    };
}
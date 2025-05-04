// Grid settings
const gridCellSize = 20; // Size of each cell in the grid
let gridWidth, gridHeight; // Will be calculated based on canvas size
let grid = []; // 2D array to store grid cells

// Initialize grid
function setupGrid() {
    gridWidth = Math.floor(canvas.width / gridCellSize);
    gridHeight = Math.floor(canvas.height / gridCellSize);
    
    // Initialize empty grid
    grid = new Array(gridHeight);
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = new Array(gridWidth).fill(null);
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gridCellSize, 0);
        ctx.lineTo(x * gridCellSize, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gridCellSize);
        ctx.lineTo(canvas.width, y * gridCellSize);
        ctx.stroke();
    }
}

function clearGrid() {
    // Reset all grid cells to null
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            grid[y][x] = null;
        }
    }
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

function updateGridOccupancy() {
    // Place entities in the grid
    entities.forEach(entity => {
        const gridCoords = getGridCoords(entity.x, entity.y);
        entity.gridX = gridCoords.x;
        entity.gridY = gridCoords.y;
        grid[gridCoords.y][gridCoords.x] = entity;
    });
}
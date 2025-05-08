// Utility functions shared across multiple modules

// Get adjacent cells around a position (8 directions)
function getAdjacentCells() {
    return [
        { dx: -1, dy: -1 }, // Top-left
        { dx: 0, dy: -1 },  // Top
        { dx: 1, dy: -1 },  // Top-right
        { dx: -1, dy: 0 },  // Left
        { dx: 1, dy: 0 },   // Right
        { dx: -1, dy: 1 },  // Bottom-left
        { dx: 0, dy: 1 },   // Bottom
        { dx: 1, dy: 1 }    // Bottom-right
    ];
}

// Fisher-Yates shuffle algorithm for arrays
function shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Get a random element from an array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Find an empty cell adjacent to the parent
function findEmptyCellNearParent(parent) {
    const adjacentCells = shuffleArray(getAdjacentCells());

    // Try each adjacent cell in the shuffled order
    for (const cell of adjacentCells) {
        const tempX = parent.gridX + cell.dx;
        const tempY = parent.gridY + cell.dy;

        // Check if this cell is valid and unoccupied
        if (!isCellOccupied(tempX, tempY)) {
            return { x: tempX, y: tempY };
        }
    }

    // If we couldn't find an empty cell, return null
    return null;
}

// Add a function for batch drawing entities by color
function batchDrawEntities(entities) {
        // Group entities by color to minimize context switching
    const colorGroups = {};
    
    // Organize entities by their color
    entities.forEach(entity => {
        const color = getEntityColor(entity);
        if (!colorGroups[color]) {
            colorGroups[color] = [];
        }
        colorGroups[color].push(entity);
    });
    
    // Draw each color group in a single batch
    Object.entries(colorGroups).forEach(([color, entitiesOfColor]) => {
        ctx.fillStyle = color;
        
        // Draw all entities of this color in one go
        entitiesOfColor.forEach(entity => {
                        ctx.fillRect(
                entity.x - entity.size / 2,
                entity.y - entity.size / 2,
                entity.size,
                entity.size
            );
        });
    });
    }

// Helper function to add an entity to the occupancy map
function addEntityToOccupancyMap(entity) {
    const key = `${entity.gridX},${entity.gridY}`;
    occupancyMap[key] = entity;
}

// Helper function to remove an entity from the occupancy map
function removeEntityFromOccupancyMap(entity) {
    const key = `${entity.gridX},${entity.gridY}`;
    delete occupancyMap[key];
}

// Function to get current survival time adjusted for simulation speed
function getCurrentSurvivalTime() {
    return Math.round(baseSurvivalTime / simulationSpeed);
}

// Helper function to check if a grid cell is occupied
function isCellOccupied(gridX, gridY, excludeEntity = null) {
    // Check if position is within grid bounds
    if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
        return true; // Consider out-of-bounds as "occupied"
    }

    // Fast lookup using occupancy map instead of looping through all entities
    const key = `${gridX},${gridY}`;
    const occupant = occupancyMap[key];

    // If there's no entity at this position, or it's the excluded entity itself
    if (!occupant || occupant === excludeEntity) {
        return false;
    }

    return true;
}


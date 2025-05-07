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
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

// Profiling utilities
const profiler = {
    metrics: {},
    active: false,
    sampleCount: 0,
    maxSamples: 100, // Number of samples to collect before calculating averages
    
    // Start measuring a function's execution time
    start: function(label) {
        if (!this.active) return;
        
        if (!this.metrics[label]) {
            this.metrics[label] = {
                calls: 0,
                totalTime: 0,
                minTime: Number.MAX_VALUE,
                maxTime: 0,
                startTime: 0
            };
        }
        
        this.metrics[label].startTime = performance.now();
        this.metrics[label].calls++;
    },
    
    // End measuring a function's execution time
    end: function(label) {
        if (!this.active || !this.metrics[label]) return;
        
        const endTime = performance.now();
        const executionTime = endTime - this.metrics[label].startTime;
        
        this.metrics[label].totalTime += executionTime;
        this.metrics[label].minTime = Math.min(this.metrics[label].minTime, executionTime);
        this.metrics[label].maxTime = Math.max(this.metrics[label].maxTime, executionTime);
    },
    
    // Toggle profiling on/off
    toggle: function() {
        this.active = !this.active;
        if (this.active) {
            console.log("Profiling started - collecting data...");
            this.reset();
        } else {
            console.log("Profiling stopped - displaying results:");
            this.report();
        }
        return this.active;
    },
    
    // Reset profiling data
    reset: function() {
        this.metrics = {};
        this.sampleCount = 0;
    },
    
    // Generate a performance report
    report: function() {
        console.group("Performance Report");
        
        // Sort functions by total time (descending)
        const sortedMetrics = Object.entries(this.metrics).sort((a, b) => {
            return b[1].totalTime - a[1].totalTime;
        });
        
        // Calculate total measured time across all functions
        const totalTime = sortedMetrics.reduce((sum, [_, data]) => sum + data.totalTime, 0);
        
        // Display metrics for each function
        sortedMetrics.forEach(([label, data]) => {
            const avgTime = data.totalTime / data.calls;
            const percentage = (data.totalTime / totalTime * 100).toFixed(2);
            
            console.log(`${label}:
    Calls: ${data.calls}
    Total: ${data.totalTime.toFixed(2)}ms (${percentage}% of measured time)
    Avg: ${avgTime.toFixed(3)}ms
    Min: ${data.minTime.toFixed(3)}ms
    Max: ${data.maxTime.toFixed(3)}ms`);
        });
        
        console.groupEnd();
    }
};

// Add keyboard shortcut for toggling profiling (Ctrl+P)
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        const isActive = profiler.toggle();
        
        // Create a visual indicator for profiling status
        let statusElement = document.getElementById('profilerStatus');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'profilerStatus';
            statusElement.style.position = 'fixed';
            statusElement.style.top = '10px';
            statusElement.style.right = '10px';
            statusElement.style.padding = '5px 10px';
            statusElement.style.borderRadius = '5px';
            statusElement.style.fontSize = '12px';
            statusElement.style.fontFamily = 'monospace';
            statusElement.style.zIndex = 1000;
            document.body.appendChild(statusElement);
        }
        
        if (isActive) {
            statusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            statusElement.textContent = 'Profiling: ON';
        } else {
            statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            statusElement.textContent = 'Profiling: OFF';
        }
    }
});
// Entity management
const foodNeededToReproduce = 5;
const baseSurvivalTime = 600; // 10 seconds at 60fps at normal speed
const dyingAnimationTime = 30; // Frames to show dying animation
const initialProducers = 10;
const baseEntityMoveDelay = 15; // Default delay at 1.0x speed

// Entity collection
let entities = [];

function createEntity(parent = null) {
    const size = gridCellSize * 0.8; // Make entity slightly smaller than grid cell

    // Calculate position on grid
    let gridX, gridY;

    if (parent) {
        // Try to find an empty cell near the parent
        const emptyCell = findEmptyCellNearParent(parent);

        // If we couldn't find an empty cell, return null
        if (!emptyCell) {
            return null;
        }

        gridX = emptyCell.x;
        gridY = emptyCell.y;
    } else {
        // For initial entities, just place them randomly
        gridX = Math.floor(Math.random() * gridWidth);
        gridY = Math.floor(Math.random() * gridHeight);
    }

    // Get pixel coordinates from grid position
    const position = getPixelCoords(gridX, gridY);

    // Apply current simulation speed to movement delay
    const moveDelay = Math.max(1, Math.round(baseEntityMoveDelay / simulationSpeed));

    // Create a new entity with default properties
    const entity = {
        x: position.x,
        y: position.y,
        gridX: gridX,
        gridY: gridY,
        previousGridX: gridX, // Add tracking for previous position
        previousGridY: gridY, // Add tracking for previous position
        hasMoved: false,      // Flag to track if entity has moved since last grid update
        size: size,
        foodCollected: 0,
        mutations: {},  // Back to using an object to track multiple mutations
        baseColor: '#777777', // Gray default color
        timeSinceLastMeal: 0, // Counter for hunger system
        isDying: false, // Visual indicator for dying state
        moveCooldown: 0, // Counter to control movement speed
        moveDelay: moveDelay // Apply current speed
    };

    // Handle mutations using the centralized function from mutations.js
    handleMutations(entity, parent);

    return entity;
}

function moveEntityOnGrid(entity) {
    // Get possible movement directions
    const directions = getAdjacentCells();

    // Special case for predators (entities with entityAffinity) to allow them to move onto prey
    const isPredator = entity.mutations.entityAffinity;

    // Filter out directions that would go off the grid or into occupied cells (with special handling for predators)
    const validDirections = directions.filter(dir => {
        const newGridX = entity.gridX + dir.dx;
        const newGridY = entity.gridY + dir.dy;

        // Check if position is within grid bounds
        if (newGridX < 0 || newGridX >= gridWidth || newGridY < 0 || newGridY >= gridHeight) {
            return false;
        }

        // For predators, we need special handling to allow them to move onto prey cells
        if (isPredator && canPredatorAttack(entity, newGridX, newGridY)) {
            return true;
        }

        // Use our helper function to check if cell is occupied (excluding this entity)
        const result = !isCellOccupied(newGridX, newGridY, entity);
        profiler.end('isCellOccupied');
        return result;
    });

    if (validDirections.length > 0) {
        // Choose a random direction from valid options
        const direction = getRandomElement(validDirections);

        // Store previous position
        entity.previousGridX = entity.gridX;
        entity.previousGridY = entity.gridY;

        // Remove entity from previous grid position in occupancy map
        const oldKey = `${entity.gridX},${entity.gridY}`;
        delete occupancyMap[oldKey];

        // Update grid coordinates
        entity.gridX += direction.dx;
        entity.gridY += direction.dy;

        // Update pixel coordinates
        const newPosition = getPixelCoords(entity.gridX, entity.gridY);
        entity.x = newPosition.x;
        entity.y = newPosition.y;

        // Add entity to new grid position in occupancy map
        const newKey = `${entity.gridX},${entity.gridY}`;
        occupancyMap[newKey] = entity;

        // Set hasMoved flag to true
        entity.hasMoved = true;
        profiler.end('applyMovement');
    }
    // If no valid directions, entity stays in place
}

function attemptReproduction(entity) {
    // Calculate health percentage (0-100%)
    const hungerRatio = entity.timeSinceLastMeal / getCurrentSurvivalTime();
    const healthPercentage = (1 - hungerRatio) * 100;

    // Only allow reproduction when entity is healthy (above 70% health)
    if (healthPercentage < 70) {
        return; // Too hungry to reproduce
    }

    // Check local population density
    const localEntities = countNearbyEntities(entity, 5); // Count entities within 5 grid cells

    // Reduce reproduction chance when overcrowded
    let densityFactor = 1.0;
    if (localEntities > 5) {
        densityFactor = 5 / localEntities; // Reduces as density increases
    }

    // Base reproduction chance on health
    const reproductionChance = 0.1 * (healthPercentage / 100) * densityFactor;

    // Check food and random chance with health factor
    if (entity.foodCollected >= foodNeededToReproduce && Math.random() < reproductionChance) {
        entity.foodCollected -= foodNeededToReproduce;

        // Reset hunger timer partially after reproduction (reproduction takes energy)
        entity.timeSinceLastMeal += getCurrentSurvivalTime() * 0.2; // Add 20% of survival time

        const offspring = createEntity(entity);
        if (offspring) {
            // Start offspring with some hunger
            offspring.timeSinceLastMeal = getCurrentSurvivalTime() * 0.3; // 30% hungry to start
            entities.push(offspring);
        }
    }
}

// Helper function to count nearby entities more efficiently
function countNearbyEntities(entity, radius) {
    // Define the bounds of our search area
    const minX = Math.max(0, entity.gridX - radius);
    const maxX = Math.min(gridWidth - 1, entity.gridX + radius);
    const minY = Math.max(0, entity.gridY - radius);
    const maxY = Math.min(gridHeight - 1, entity.gridY + radius);

    let count = 0;

    // Only check entities in cells within our defined bounds
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const key = `${x},${y}`;
            const occupant = occupancyMap[key];

            // If there's an entity here and it's not the one we're checking
            if (occupant && occupant !== entity) {
                count++;
            }
        }
    }

    return count;
}

function updateEntities() {
    // First, process all entities with special mutation behaviors
    processEntityMutations();

    // Now handle movement, hunger, and reproduction
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];

        // Update hunger status
        entity.timeSinceLastMeal++;

        // Get the current adjusted survival time based on simulation speed
        const currentSurvivalTime = getCurrentSurvivalTime();

        // Check if entity should die from hunger
        if (entity.timeSinceLastMeal >= currentSurvivalTime) {
            // Show dying animation
            entity.isDying = true;

            // Remove entity after brief flashing animation
            if (entity.timeSinceLastMeal >= currentSurvivalTime + dyingAnimationTime) {
                // Remove entity from occupancy map before removing from entities array
                removeEntityFromOccupancyMap(entity);
                entities.splice(i, 1);
                continue;
            }
        }

        // Handle grid-based movement
        if (entity.moveCooldown <= 0) {
            moveEntityOnGrid(entity);
            entity.moveCooldown = entity.moveDelay;
        } else {
            entity.moveCooldown--;
        }

        if (entity.foodCollected >= foodNeededToReproduce) {
            attemptReproduction(entity); // Attempt reproduction
        }
    }
    // Draw all entities in batches by color (replaces individual drawing)
    batchDrawEntities(entities);
}
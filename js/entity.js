// Entity management
const foodNeededToReproduce = 5;
const baseSurvivalTime = 600; // 10 seconds at 60fps at normal speed
const dyingAnimationTime = 30; // Frames to show dying animation
const initialProducers = 10;
const baseEntityMoveDelay = 15; // Default delay at 1.0x speed

// Entity collection
let entities = [];

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

    // Check if cell is occupied by an entity
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (entity === excludeEntity) continue; // Skip the excluded entity
        if (entity.gridX === gridX && entity.gridY === gridY) {
            return true;
        }
    }

    return false;
}

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
        return !isCellOccupied(newGridX, newGridY, entity);
    });

    if (validDirections.length > 0) {
        // Choose a random direction from valid options
        const direction = getRandomElement(validDirections);

        // Update grid coordinates
        entity.gridX += direction.dx;
        entity.gridY += direction.dy;

        // Update pixel coordinates
        const newPosition = getPixelCoords(entity.gridX, entity.gridY);
        entity.x = newPosition.x;
        entity.y = newPosition.y;
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

// Helper function to count nearby entities
function countNearbyEntities(entity, radius) {
    return entities.filter(other => {
        if (entity === other) return false;
        
        const dx = Math.abs(entity.gridX - other.gridX);
        const dy = Math.abs(entity.gridY - other.gridY);
        return dx <= radius && dy <= radius;
    }).length;
}

function updateEntities() {
    // First, process all entities with special mutation behaviors
    processEntityMutations();

    // Update grid with entity positions
    updateGridOccupancy();

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

        attemptReproduction(entity); // Attempt reproduction

        // Draw entity
        ctx.fillStyle = getEntityColor(entity);
        ctx.fillRect(
            entity.x - entity.size / 2,
            entity.y - entity.size / 2,
            entity.size,
            entity.size
        );
    }
}
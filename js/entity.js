// Entity management
const foodNeededToReproduce = 3;
const baseSurvivalTime = 600; // 10 seconds at 60fps at normal speed
const dyingAnimationTime = 30; // Frames to show dying animation
const initialProducers = 10;
const baseEntityMoveDelay = 15; // Default delay at 1.0x speed

// Debug tracking - mutation counts
const mutationStats = {
    blueToRed: 0,  // grassAffinity to entityAffinity
    redToBlue: 0   // entityAffinity to grassAffinity
};

// Entity collection
let entities = [];

// Function to get current survival time adjusted for simulation speed
function getCurrentSurvivalTime() {
    return Math.round(baseSurvivalTime / simulationSpeed);
}

function createEntity(parent = null) {
    const size = gridCellSize * 0.8; // Make entity slightly smaller than grid cell
    
    // Calculate position on grid
    let gridX, gridY;
    
    if (parent) {
        // Check only the 8 adjacent squares around the parent
        const adjacentCells = [
            { dx: -1, dy: -1 }, // Top-left
            { dx: 0, dy: -1 },  // Top
            { dx: 1, dy: -1 },  // Top-right
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 },   // Right
            { dx: -1, dy: 1 },  // Bottom-left
            { dx: 0, dy: 1 },   // Bottom
            { dx: 1, dy: 1 }    // Bottom-right
        ];
        
        // Shuffle the adjacent cells to randomize which one is chosen
        for (let i = adjacentCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [adjacentCells[i], adjacentCells[j]] = [adjacentCells[j], adjacentCells[i]];
        }
        
        // Try each adjacent cell in the shuffled order
        let foundEmptyCell = false;
        for (const cell of adjacentCells) {
            const tempX = parent.gridX + cell.dx;
            const tempY = parent.gridY + cell.dy;
            
            // Check if this position is within grid bounds
            if (tempX < 0 || tempX >= gridWidth || tempY < 0 || tempY >= gridHeight) {
                continue; // Skip this position if it's out of bounds
            }
            
            // Check if this cell is already occupied by another entity
            let cellOccupied = false;
            for (let i = 0; i < entities.length; i++) {
                if (entities[i].gridX === tempX && entities[i].gridY === tempY) {
                    cellOccupied = true;
                    break;
                }
            }
            
            if (!cellOccupied) {
                gridX = tempX;
                gridY = tempY;
                foundEmptyCell = true;
                break;
            }
        }
        
        // If we couldn't find an empty cell, return null
        if (!foundEmptyCell) {
            return null;
        }
    } else {
        // For initial entities, just place them randomly
        // (This only happens at the start when the grid is nearly empty)
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
    
    // Define mutation groups (mutations that cannot coexist)
    const mutationGroups = {
        foodSource: ['grassAffinity', 'entityAffinity'] // Entities can only have one food source
        // In the future you can add more groups, like:
        // movement: ['fastMovement', 'teleportation']
        // defense: ['armor', 'camouflage']
    };
    
    // Get all mutations and their groups
    const mutationToGroup = {};
    Object.entries(mutationGroups).forEach(([groupName, mutations]) => {
        mutations.forEach(mutation => {
            mutationToGroup[mutation] = groupName;
        });
    });
    
    // Handle mutations
    if (parent) {
        // Track original parent mutation (for debugging)
        const hadGrassAffinity = parent.mutations.grassAffinity;
        const hadEntityAffinity = parent.mutations.entityAffinity;
        
        // Inherit parent mutations
        Object.keys(parent.mutations).forEach(mutationName => {
            entity.mutations[mutationName] = true;
        });
        
        // Chance for new mutations
        Object.keys(mutations).forEach(mutationName => {
            // Skip if entity already has this mutation
            if (entity.mutations[mutationName]) return;
            
            // Check for mutation with 8% chance
            if (Math.random() < mutations[mutationName].chance) {
                // If this mutation belongs to a group, remove any existing mutations from same group
                const group = mutationToGroup[mutationName];
                if (group) {
                    mutationGroups[group].forEach(groupMutation => {
                        if (entity.mutations[groupMutation]) {
                            delete entity.mutations[groupMutation];
                        }
                    });
                }
                
                // Add the new mutation
                entity.mutations[mutationName] = true;
                
                // Track mutation changes for debugging - moved here for consistency
                if (hadGrassAffinity && mutationName === 'entityAffinity') {
                    mutationStats.blueToRed++;
                } else if (hadEntityAffinity && mutationName === 'grassAffinity') {
                    mutationStats.redToBlue++;
                }
            }
        });
    } else {
        // Initial entities start with grassAffinity
        entity.mutations.grassAffinity = true;
    }
    
    return entity;
}

function getEntityColor(entity) {
    // If entity is dying, show a flashing effect
    if (entity.isDying) {
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            return 'rgba(255, 255, 255, 0.7)'; // Flashing white
        }
    }
    
    // Return color based on mutations (priority to certain mutations)
    if (entity.mutations.entityAffinity) return mutations.entityAffinity.color;
    if (entity.mutations.grassAffinity) return mutations.grassAffinity.color;
    
    // Default color if no mutations affecting appearance
    return entity.baseColor;
}

function moveEntityOnGrid(entity) {
    // Get possible movement directions
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        // Diagonals
        { dx: 1, dy: -1 },  // Up-right
        { dx: 1, dy: 1 },   // Down-right
        { dx: -1, dy: 1 },  // Down-left
        { dx: -1, dy: -1 }  // Up-left
    ];
    
    // Special case for predators (entities with entityAffinity) to allow them to move onto prey
    const isPredator = entity.mutations.entityAffinity;
    
    // Filter out directions that would go off the grid or into occupied cells (with special handling for predators)
    const validDirections = directions.filter(dir => {
        const newGridX = entity.gridX + dir.dx;
        const newGridY = entity.gridY + dir.dy;
        
        // First check if it's within grid bounds
        if (newGridX < 0 || newGridX >= gridWidth || newGridY < 0 || newGridY >= gridHeight) {
            return false;
        }
        
        // Then check if the cell is already occupied by another entity
        for (let i = 0; i < entities.length; i++) {
            const otherEntity = entities[i];
            // Skip checking against itself
            if (otherEntity === entity) continue;
            
            if (otherEntity.gridX === newGridX && otherEntity.gridY === newGridY) {
                // If this entity is a predator and the other entity is prey, the move is valid
                if (isPredator && !otherEntity.mutations.entityAffinity) {
                    return true;
                }
                return false; // Cell is occupied by non-prey or the entity is not a predator
            }
        }
        
        return true; // Cell is valid and unoccupied
    });
    
    if (validDirections.length > 0) {
        // Choose a random direction from valid options
        const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
        
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
        
        // Reproduce if enough food collected
        if (entity.foodCollected >= foodNeededToReproduce) {
            entity.foodCollected = 0;
            
            // Try to create a new entity
            const newEntity = createEntity(entity);
            
            // Only add the entity if we found a valid position for it
            if (newEntity) {
                entities.push(newEntity);
            }
        }
        
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

function processEntityMutations() {
    // Process each mutation's behavior
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        
        // Check each mutation the entity has and call its update function
        Object.keys(entity.mutations).forEach(mutationName => {
            if (mutations[mutationName].onUpdate) {
                const actionTaken = mutations[mutationName].onUpdate(entity, entities);
                
                // Reset hunger timer if prey was eaten
                if (actionTaken) {
                    entity.timeSinceLastMeal = 0;
                }
                
                // If an action was taken that might have modified the entities array,
                // we need to make sure our index is still valid
                if (actionTaken && i >= entities.length) {
                    i = entities.length - 1;
                }
            }
        });
    }
}
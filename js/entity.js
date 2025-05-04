// Entity management
const foodNeededToReproduce = 3;
const survivalTime = 600; // 10 seconds at 60fps
const dyingAnimationTime = 30; // Frames to show dying animation
const initialProducers = 10;

// Entity collection
let entities = [];

function createEntity(parent = null) {
    const size = gridCellSize * 0.8; // Make entity slightly smaller than grid cell
    
    // Calculate position on grid
    let gridX, gridY;
    
    if (parent) {
        // Position near parent (within 2 cells) but on grid
        const parentGridCoords = getGridCoords(parent.x, parent.y);
        gridX = Math.max(0, Math.min(gridWidth - 1, parentGridCoords.x + Math.floor(Math.random() * 5 - 2)));
        gridY = Math.max(0, Math.min(gridHeight - 1, parentGridCoords.y + Math.floor(Math.random() * 5 - 2)));
    } else {
        // Random position on grid
        gridX = Math.floor(Math.random() * gridWidth);
        gridY = Math.floor(Math.random() * gridHeight);
    }
    
    // Get pixel coordinates from grid position
    const position = getPixelCoords(gridX, gridY);
    
    // Create a new entity with default properties
    const entity = {
        x: position.x,
        y: position.y,
        gridX: gridX,
        gridY: gridY,
        size: size,
        foodCollected: 0,
        mutations: {},
        baseColor: '#3b82f6', // Blue
        timeSinceLastMeal: 0, // Counter for hunger system
        isDying: false, // Visual indicator for dying state
        moveCooldown: 0, // Counter to control movement speed
        moveDelay: 15 // Frames between moves (controls speed)
    };
    
    // Handle mutations if parent exists
    if (parent) {
        // Inherit parent mutations
        Object.keys(parent.mutations).forEach(mutationName => {
            entity.mutations[mutationName] = true;
        });
        
        // Chance for new mutations
        Object.keys(mutations).forEach(mutationName => {
            // Skip if entity already has this mutation
            if (entity.mutations[mutationName]) return;
            
            // Check for mutation
            if (Math.random() < mutations[mutationName].chance) {
                entity.mutations[mutationName] = true;
            }
        });
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
    if (entity.mutations.mouth) return mutations.mouth.color;
    // Add more mutation color checks here when adding mutations
    
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
    
    // Filter out directions that would go off the grid
    const validDirections = directions.filter(dir => {
        const newGridX = entity.gridX + dir.dx;
        const newGridY = entity.gridY + dir.dy;
        return newGridX >= 0 && newGridX < gridWidth && newGridY >= 0 && newGridY < gridHeight;
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
}

function updateEntities() {
    // First, process all entities with special mutation behaviors
    processEntityMutations();
    
    // Update grid with entity positions
    updateGridOccupancy();
    
    // Now handle movement, edges, food collection and reproduction
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        
        // Update hunger status
        entity.timeSinceLastMeal++;
        
        // Check if entity should die from hunger
        if (entity.timeSinceLastMeal >= survivalTime) {
            // Show dying animation
            entity.isDying = true;
            
            // Remove entity after brief flashing animation
            if (entity.timeSinceLastMeal >= survivalTime + dyingAnimationTime) {
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
        
        // Check for food collection - only if entity doesn't have mouth
        if (!entity.mutations.mouth) {
            collectFood(entity);
        }
        
        // Reproduce if enough food collected
        if (entity.foodCollected >= foodNeededToReproduce) {
            entity.foodCollected = 0;
            entities.push(createEntity(entity));
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
            if (entity.mutations[mutationName] && mutations[mutationName].onUpdate) {
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
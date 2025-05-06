// Mutation definitions - easy to add new mutations
const mutations = {
    grassAffinity: {
        chance: 0.10, // 1% chance to get this mutation
        color: '#3b82f6', // Blue
        onUpdate: (entity, allEntities) => {
            // Skip if entity has entityAffinity (conflicting food source)
            if (entity.mutations.entityAffinity) return false;
            
            // Use the collectFood function from food.js
            const foodsBeforeCollection = foods.length;
            collectFood(entity);
            
            // Return true if any food was eaten (foods array length changed)
            return foods.length < foodsBeforeCollection;
        }
    },
    entityAffinity: {
        chance: 0.10, // 1% chance to get this mutation
        color: '#ef4444', // Red
        onUpdate: (entity, allEntities) => {
            // Find potential prey in the same grid cell
            for (let j = allEntities.length - 1; j >= 0; j--) {
                const target = allEntities[j];
                
                // Skip itself or entities with entityAffinity mutation
                if (entity === target || target.mutations.entityAffinity) continue;
                
                // Check if they are in the same grid cell
                if (entity.gridX === target.gridX && entity.gridY === target.gridY) {
                    // Predator gets food from eating prey
                    entity.foodCollected++;
                    
                    // Remove the prey
                    allEntities.splice(j, 1);
                    
                    // Only eat one prey per frame
                    return true; // Return true to indicate prey was eaten
                }
            }
            return false; // No prey eaten
        }
    }
    // Add more mutations here in the future, like:
    // speed: { chance: 0.01, color: '#9333ea', onUpdate: ... }
    // size: { chance: 0.01, color: '#0369a1', onUpdate: ... }
    // etc.
};

// Debug tracking - mutation counts
const mutationStats = {
    blueToRed: 0,  // grassAffinity to entityAffinity
    redToBlue: 0   // entityAffinity to grassAffinity
};

// Define mutation groups (mutations that cannot coexist)
const mutationGroups = {
    foodSource: ['grassAffinity', 'entityAffinity'] // Entities can only have one food source
    // In the future you can add more groups, like:
    // movement: ['fastMovement', 'teleportation']
    // defense: ['armor', 'camouflage']
};

// Pre-compute mutation group mappings
const mutationToGroup = {};
Object.entries(mutationGroups).forEach(([groupName, mutationTypes]) => {
    mutationTypes.forEach(mutation => {
        mutationToGroup[mutation] = groupName;
    });
});

// Handle mutation inheritance and potential new mutations
function handleMutations(entity, parent) {
    if (!parent) {
        // Initial entities start with grassAffinity
        entity.mutations.grassAffinity = true;
        return;
    }
    
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
        
        // Check for mutation based on chance
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
            
            // Track mutation changes for debugging
            if (hadGrassAffinity && mutationName === 'entityAffinity') {
                mutationStats.blueToRed++;
            } else if (hadEntityAffinity && mutationName === 'grassAffinity') {
                mutationStats.redToBlue++;
            }
        }
    });
}

// Get color for an entity based on its mutations
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

// Process all mutation behaviors for entities
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

// Check if a predator can move to a cell containing potential prey
function canPredatorAttack(predator, gridX, gridY) {
    for (let i = 0; i < entities.length; i++) {
        const otherEntity = entities[i];
        if (otherEntity === predator) continue;
        
        if (otherEntity.gridX === gridX && otherEntity.gridY === gridY) {
            // Predators can move onto cells with non-predator entities
            return !otherEntity.mutations.entityAffinity;
        }
    }
    
    return false;
}
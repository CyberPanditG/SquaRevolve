// Mutation definitions - easy to add new mutations
const mutations = {
    grassAffinity: {
        chance: 0.01, // 8% chance to get this mutation, like others
        color: '#3b82f6', // Blue
        onUpdate: (entity, allEntities) => {
            // Skip if entity has entityAffinity (conflicting food source)
            if (entity.mutations.entityAffinity) return false;
            
            // Grid-based food collection
            for (let i = foods.length - 1; i >= 0; i--) {
                const food = foods[i];
                
                // Check if entity and food are in the same grid cell
                if (entity.gridX === food.gridX && entity.gridY === food.gridY) {
                    entity.foodCollected++;
                    foods.splice(i, 1);
                    return true; // Return true to indicate food was eaten (resets hunger timer)
                }
            }
            return false; // No food eaten
        }
    },
    entityAffinity: {
        chance: 0.01,
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
    // speed: { chance: 0.08, color: '#9333ea', onUpdate: ... }
    // size: { chance: 0.08, color: '#0369a1', onUpdate: ... }
    // etc.
};
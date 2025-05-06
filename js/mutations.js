// Mutation definitions - easy to add new mutations
const mutations = {
    grassAffinity: {
        chance: 0.01, // 1% chance to get this mutation
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
        chance: 0.01, // 1% chance to get this mutation
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
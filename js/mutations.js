// Mutation definitions - easy to add new mutations
const mutations = {
    mouth: {
        chance: 0.08,
        color: '#8F00FF', // Red
        onUpdate: (entity, allEntities) => {
            // Grid-based predation - entities with mouth eat entities in the same grid cell
            
            // Find potential prey in the same grid cell
            for (let j = allEntities.length - 1; j >= 0; j--) {
                const target = allEntities[j];
                
                // Skip itself or entities with the same mutations
                if (entity === target || target.mutations.mouth) continue;
                
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
    // speed: { chance: 0.05, color: '#9333ea', onUpdate: ... }
    // size: { chance: 0.07, color: '#0369a1', onUpdate: ... }
    // etc.
};
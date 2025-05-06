// Food management
const initialFoodCount = 200;
const maxFood = 500;

// Food collection
let foods = [];
let minFoodAmount = 250; // Default minimum food amount

function createFood() {
    // Place food at grid cell centers
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    const position = getPixelCoords(gridX, gridY);
    
    return {
        x: position.x,
        y: position.y,
        gridX: gridX,
        gridY: gridY,
        radius: 4,
        color: '#4ade80' // Green
    };
}

function addFood(amount) {
    const foodToAdd = Math.min(amount, maxFood - foods.length);
    for (let i = 0; i < foodToAdd; i++) {
        foods.push(createFood());
    }
}

function drawFood() {
    foods.forEach(food => {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function collectFood(entity) {
    // Grid-base food collection
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        
        // Check if entity and food are in the same grid cell
        if (entity.gridX === food.gridX && entity.gridY === food.gridY) {
            entity.foodCollected++;
            entity.timeSinceLastMeal = 0; // Reset hunger timer when food is eaten
            foods.splice(i, 1);
            break; // Collect only one food per frame
        }
    }
}
// Food management
const initialFoodCount = 200;
// Make maxFood and minFoodAmount dynamic based on grid size
let maxFood = 500; // Initial default, will be updated when grid is created
let minFoodAmount = 250; // Initial default, will be updated when grid is created

// Function to update food limits based on grid size
function updateFoodLimits() {
    const totalGridCells = gridWidth * gridHeight;
    // Max food is half of total grid cells
    maxFood = Math.floor(totalGridCells / 2);
    
    // Min food is 15% of total grid cells
    const rawMinFood = totalGridCells * 0.15;
    // Round to nearest 10
    minFoodAmount =  Math.round(rawMinFood / 10) * 10;
    
    // Update UI if it exists
    if (minFoodSlider) {
        minFoodSlider.max = maxFood;
        minFoodSlider.value = minFoodAmount;
        minFoodValueDisplay.textContent = minFoodAmount;
    }
}

// Food collection
let foods = [];

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
        radius: gridCellSize * 0.2, // Radius proportional to grid size (20% of cell)
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
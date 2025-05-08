// Food management
let maxFood = 500; // Maximum possible food in the grid
let minFoodAmount = 250; // Target minimum food amount
let totalGridCells = 0; // Total grid cells for percentage calculations
let userSetFoodPercentage = 0.2; // User's preferred food percentage (default 20%)
let foods = []; // Food collection

/**
 * Calculate available grid spaces (total minus entities)
 * @returns {number} Number of available grid spaces
 */
function getAvailableGridSpaces() {
    return totalGridCells - entities.length;
}

/**
 * Update food limits based on current grid and entity state
 * @param {boolean} isInitial - Whether this is the initial setup or a periodic update
 */
function updateFoodLimits(isInitial = false) {
    totalGridCells = gridWidth * gridHeight;
    const availableSpaces = getAvailableGridSpaces();
    
    // Max food is 100% of available grid cells
    maxFood = availableSpaces;
    
    if (isInitial) {
        // Initialize with default percentage
        minFoodAmount = calculateFoodAmount(userSetFoodPercentage, availableSpaces);
    } else {
        // Only update if max has decreased below current setting
        if (maxFood < minFoodAmount) {
            minFoodAmount = Math.min(maxFood, minFoodAmount);
        }
    }
    
    // Update UI if it exists
    if (minFoodSlider) {
        minFoodSlider.max = maxFood;
        
        // Only update slider value during initial setup or if needed
        if (isInitial || parseFloat(minFoodSlider.value) !== minFoodAmount) {
            minFoodSlider.value = minFoodAmount;
            updateFoodPercentage(minFoodAmount);
        }
    }
}

/**
 * Calculate food amount based on percentage and available space
 * @param {number} percentage - Decimal percentage (0-1)
 * @param {number} availableSpace - Available grid spaces
 * @returns {number} Rounded food amount
 */
function calculateFoodAmount(percentage, availableSpace) {
    const rawAmount = availableSpace * percentage;
    // Round to nearest 10 and ensure it's not negative
    return Math.max(0, Math.round(rawAmount / 10) * 10);
}

/**
 * Update the food percentage display
 * @param {number} foodAmount - Current food amount
 */
function updateFoodPercentage(foodAmount) {
    const availableSpaces = getAvailableGridSpaces();
    
    // Calculate percentage based on available spaces
    userSetFoodPercentage = availableSpaces > 0 ? 
        foodAmount / availableSpaces : 0;
    
    const percentage = Math.round(userSetFoodPercentage * 100);
    
    // Show both the raw amount and percentage of available space
    minFoodValueDisplay.textContent = `${foodAmount} (${percentage}% of available)`;
}

/**
 * Create a new food item at a random grid position
 * @returns {Object} Food object
 */
function createFood() {
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    const position = getPixelCoords(gridX, gridY);
    
    return {
        x: position.x,
        y: position.y,
        gridX: gridX,
        gridY: gridY,
        radius: gridCellSize * 0.2, // 20% of cell size
        color: '#4ade80' // Green
    };
}

/**
 * Add food to the simulation
 * @param {number} amount - Amount of food to add
 */
function addFood(amount) {
    const foodToAdd = Math.min(amount, maxFood - foods.length);
    for (let i = 0; i < foodToAdd; i++) {
        foods.push(createFood());
    }
}

/**
 * Draw all food items on the canvas
 */
function drawFood() {
    ctx.fillStyle = '#4ade80'; // Set color only once for all food
    
    foods.forEach(food => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Allow entity to collect food from the same grid cell
 * @param {Object} entity - The entity collecting food
 */
function collectFood(entity) {
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        
        // Check if entity and food are in the same grid cell
        if (entity.gridX === food.gridX && entity.gridY === food.gridY) {
            entity.foodCollected++;
            entity.timeSinceLastMeal = 0; // Reset hunger timer
            foods.splice(i, 1);
            break; // Collect only one food per frame
        }
    }
}
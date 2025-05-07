// Script loader for SquaRevolve
// This file dynamically loads all required JavaScript files in the correct order

// Array of scripts to load in specific order
const scripts = [
    'js/utils.js',      // Utility functions (load first)
    'js/grid.js',       // Grid system 
    'js/mutations.js',  // Mutations definitions
    'js/food.js',       // Food management
    'js/entity.js',     // Entity management
    'js/stats.js',      // Stats panel and UI
    'js/main.js'        // Main simulation loop (must load last)
];

// Function to load scripts sequentially
function loadScripts(scriptArray, index = 0) {
    if (index >= scriptArray.length) {
        console.log('All scripts loaded successfully');
        return;
    }
    
    const script = document.createElement('script');
    script.src = scriptArray[index];
    script.onload = () => {
        console.log(`Loaded: ${scriptArray[index]}`);
        loadScripts(scriptArray, index + 1);
    };
    script.onerror = (error) => {
        console.error(`Error loading ${scriptArray[index]}:`, error);
    };
    document.body.appendChild(script);
}

// Start loading all scripts
loadScripts(scripts);
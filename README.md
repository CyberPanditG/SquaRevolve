# SquaRevolve

SquaRevolve is a grid-based life simulation where squares evolve and interact in a virtual ecosystem.

## Live Demo

You can try the simulation online at: [https://cyberpanditg.github.io/SquaRevolve/](https://cyberpanditg.github.io/SquaRevolve/)

## Features

- Grid-based movement system
- Blue squares collect food to survive and reproduce
- Red predators evolve from blue squares and hunt them
- Adjustable minimum food level
- Simulation speed control
- Real-time FPS tracking
- Automatic simulation reset when population dies out
- Draggable and minimizable stats panel
- Dynamic entity survival time based on simulation speed

## How to Run

Simply open the `index.html` file in a web browser to start the simulation.

## Controls

- **Minimum Food Slider**: Controls the minimum amount of food that should always be available
- **Simulation Speed Slider**: Adjusts how fast the simulation runs (0.1x to 5x)
- **Stats Panel**: Can be minimized by clicking the "-" button and dragged by clicking and holding the header
- **Auto-Reset**: Simulation automatically restarts after 1 second if all entities die out

## Evolution Rules

- Blue squares need to collect 3 food items to reproduce
- With each reproduction, there's an 8% chance of a mutation
- Squares that don't eat for approximately 10 seconds will die (time scales with simulation speed)
- Red squares (with mouth mutation) eat blue squares instead of food

## Technical Details

- Modular architecture with separated concerns:
  - `entity.js`: Entity behavior and reproduction
  - `food.js`: Food generation and consumption
  - `grid.js`: Grid-based movement system
  - `mutations.js`: Mutation definitions and inheritance
  - `stats.js`: UI controls and statistics display
  - `main.js`: Core simulation logic
  - `loader.js`: Script loading management

- Lightweight codebase (~0.023 MB total)

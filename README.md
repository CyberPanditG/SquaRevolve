# SquaRevolve

SquaRevolve is a grid-based life simulation where squares evolve and interact in a virtual ecosystem.

## Features

- Grid-based movement system
- Blue squares collect food to survive and reproduce
- Red predators evolve from blue squares and hunt them
- Adjustable minimum food level
- Simulation speed control
- Real-time FPS tracking

## How to Run

Simply open the `index.html` file in a web browser to start the simulation.

## Controls

- **Minimum Food Slider**: Controls the minimum amount of food that should always be available
- **Simulation Speed Slider**: Adjusts how fast the simulation runs (0.1x to 5x)

## Evolution Rules

- Blue squares need to collect 3 food items to reproduce
- With each reproduction, there's an 8% chance of a mutation
- Squares that don't eat for approximately 10 seconds will die
- Red squares (with mouth mutation) eat blue squares instead of food
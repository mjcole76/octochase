# 🐙 Octo Sprint

A mobile-first 2D swim-chase game built with React, TypeScript, and Canvas. Play as an octopus navigating through dangerous ocean depths, collecting food while avoiding predators and hazards.

## 🎮 Game Features

### Core Gameplay
- **360° Movement**: Smooth joystick controls with touch support
- **Special Abilities**: 
  - Jet Dash: Quick burst movement with 3-second cooldown
  - Ink Cloud: 2-second stealth ability that reduces sonar effectiveness
- **Combo System**: Chain food pickups for higher scores with timer extensions from pearls

### Food & Scoring
- **Crabs**: 3 points each
- **Shrimp**: 2 points each  
- **Clams**: 2 points each
- **Pearls**: 0 points but extend combo timer by 3 seconds

### Predators (AI-Driven)
- **Moray Eel**: Aggressive close-range predator
- **Reef Shark**: Fast-moving hunter with persistent chase
- **Dolphin**: Intelligent predator with sonar pulse detection every 5 seconds

### Hazards
- **Fishing Nets**: Sticky traps that slow movement
- **Fishing Hooks**: Sharp snags that briefly immobilize
- **Jellyfish**: Electric stun for 0.5 seconds
- **Rip Currents**: Push player in various directions
- **Sea Urchins**: Direct damage dealers
- **Floodlights**: Expose player with vision cones

### Level System
- **9 Levels** across 3 biomes (Reef, Kelp Forest, Ship Graveyard)
- **45-90 second** levels with midpoint checkpoints
- **Bronze/Silver/Gold** medal system based on score thresholds
- **Survival bonus** for completing levels quickly

### Mobile Features
- **Touch-Optimized**: Large touch targets and intuitive controls
- **Haptic Feedback**: Gentle vibrations for pickups, abilities, and damage
- **Responsive HUD**: Hearts, ink meter, combo bar, and breadcrumb navigation

## 🏗️ Technical Implementation

### AI System
- **State Machine**: Predators use Patrol → Investigate → Chase → Lost states
- **Dynamic Detection**: Ink clouds reduce sonar effectiveness by 70%
- **Adaptive Behavior**: Different predator types with unique characteristics

### Level Architecture
- **Procedural Elements**: Dynamic food spawning based on density multipliers
- **Checkpoint System**: Mid-level save points for longer stages
- **Biome Themes**: Visual and gameplay variations across ocean environments

### Performance
- **Canvas Rendering**: Smooth 60fps gameplay with efficient draw calls
- **Mobile Optimized**: Tested for mid-range Android devices
- **Touch Events**: Proper preventDefault and touch handling

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Start development server**:
   ```bash
   yarn dev
   ```

3. **Build for production**:
   ```bash
   yarn build
   ```

## 🎯 Controls

- **Movement**: Touch and drag the joystick in bottom-left corner
- **Jet Dash**: Yellow lightning button (bottom-right)
- **Ink Cloud**: Purple smoke button (bottom-right)
- **Pause**: Top-right pause button

## 🏆 Scoring System

Score = (Food Value × Combo Multiplier) + Survival Bonus

- Combo multiplier increases with consecutive pickups
- Combo resets on damage or after 4 seconds without pickup
- Pearls extend combo timer by 3 seconds
- Survival bonus based on time remaining when level completed

## 📱 Mobile Experience

The game is designed mobile-first with:
- Large, accessible touch targets
- Haptic feedback for key interactions
- Smooth joystick controls
- Optimized performance for mobile devices
- Portrait and landscape support
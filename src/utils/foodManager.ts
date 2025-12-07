import type { Position, GameObject } from '../components/gameEntities';
import type { EnhancedFoodType } from '../types/gameEnhancements';

export interface EnhancedFood extends GameObject {
  foodType: EnhancedFoodType;
  points: number;
  comboExtension?: number;
  specialEffect?: string;
  isMoving?: boolean;
  moveSpeed?: number;
  movePattern?: 'flee' | 'random' | 'circle';
}

export class FoodManager {
  static getFoodConfig(type: EnhancedFoodType) {
    const configs: Record<EnhancedFoodType, {
      points: number;
      color: string;
      size: number;
      rarity: string;
      comboExtension?: number;
      isMoving?: boolean;
      moveSpeed?: number;
      specialEffect?: string;
    }> = {
      crab: { points: 3, color: '#ff6b35', size: 16, rarity: 'common' },
      shrimp: { points: 2, color: '#ff9999', size: 14, rarity: 'common' },
      clam: { points: 2, color: '#99ccff', size: 15, rarity: 'common' },
      pearl: { points: 0, color: '#ffffff', size: 12, rarity: 'uncommon', comboExtension: 3000 },
      golden_fish: { points: 30, color: '#ffd700', size: 20, rarity: 'rare', isMoving: true, moveSpeed: 100 },
      mystery_box: { points: 0, color: '#ff00ff', size: 18, rarity: 'rare', specialEffect: 'random' },
      combo_extender: { points: 0, color: '#00ff00', size: 14, rarity: 'uncommon', comboExtension: 10000 },
      health_kelp: { points: 0, color: '#228b22', size: 16, rarity: 'uncommon', specialEffect: 'heal' },
      speed_plankton: { points: 1, color: '#00ffff', size: 10, rarity: 'common', specialEffect: 'speed_boost' }
    };
    
    return configs[type];
  }

  static createFood(type: EnhancedFoodType, position: Position, id: string): EnhancedFood {
    const config = this.getFoodConfig(type);
    
    return {
      id,
      position,
      velocity: { x: 0, y: 0 },
      type: type,
      foodType: type,
      value: config.points,
      points: config.points,
      active: true,
      size: config.size,
      comboExtension: config.comboExtension,
      specialEffect: config.specialEffect,
      isMoving: config.isMoving || false,
      moveSpeed: config.moveSpeed || 0,
      movePattern: type === 'golden_fish' ? 'flee' : undefined
    };
  }

  static updateMovingFood(food: EnhancedFood, playerPosition: Position, deltaTime: number, worldWidth: number, worldHeight: number): EnhancedFood {
    if (!food.isMoving) return food;

    const newFood = { ...food };

    if (food.movePattern === 'flee') {
      // Golden fish flees from player
      const dx = food.position.x - playerPosition.x;
      const dy = food.position.y - playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200 && distance > 0) {
        const angle = Math.atan2(dy, dx);
        newFood.velocity.x = Math.cos(angle) * (food.moveSpeed || 100);
        newFood.velocity.y = Math.sin(angle) * (food.moveSpeed || 100);
      } else {
        newFood.velocity.x *= 0.95;
        newFood.velocity.y *= 0.95;
      }
    } else if (food.movePattern === 'random') {
      // Random movement
      if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        newFood.velocity.x = Math.cos(angle) * (food.moveSpeed || 50);
        newFood.velocity.y = Math.sin(angle) * (food.moveSpeed || 50);
      }
    }

    newFood.position.x += newFood.velocity.x * deltaTime / 1000;
    newFood.position.y += newFood.velocity.y * deltaTime / 1000;

    // Keep within bounds
    newFood.position.x = Math.max(20, Math.min(worldWidth - 20, newFood.position.x));
    newFood.position.y = Math.max(20, Math.min(worldHeight - 20, newFood.position.y));

    return newFood;
  }

  static applyFoodEffect(food: EnhancedFood, player: any, gameState: any): {
    player: any;
    gameState: any;
    message: string;
    particles?: { type: string; color: string; count: number };
  } {
    let message = '';
    let particles = undefined;
    const newPlayer = { ...player };
    const newGameState = { ...gameState };

    switch (food.specialEffect) {
      case 'heal':
        if (newGameState.lives < 5) {
          newGameState.lives += 1;
          message = '❤️ +1 Life!';
          particles = { type: 'glow', color: '#ff0000', count: 15 };
        }
        break;
      case 'speed_boost':
        newPlayer.speedBoostTimer = 3000;
        message = '💨 Speed Boost!';
        particles = { type: 'trail', color: '#00ffff', count: 10 };
        break;
      case 'random':
        // Mystery box - random effect
        const effects = ['score', 'life', 'powerup', 'bad'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        switch (effect) {
          case 'score':
            const bonus = 50 + Math.floor(Math.random() * 100);
            newGameState.score += bonus;
            message = `💰 +${bonus} Bonus!`;
            particles = { type: 'star', color: '#ffd700', count: 20 };
            break;
          case 'life':
            if (newGameState.lives < 5) {
              newGameState.lives += 1;
              message = '❤️ Extra Life!';
              particles = { type: 'glow', color: '#ff0000', count: 15 };
            }
            break;
          case 'powerup':
            message = '✨ Random Power-Up!';
            particles = { type: 'sparkle', color: '#ff00ff', count: 25 };
            break;
          case 'bad':
            newGameState.combo = Math.max(1, newGameState.combo - 1);
            message = '💀 Combo Reduced!';
            particles = { type: 'smoke', color: '#444444', count: 10 };
            break;
        }
        break;
    }

    return { player: newPlayer, gameState: newGameState, message, particles };
  }

  static spawnFoodWithRarity(position: Position, id: string): EnhancedFood {
    const roll = Math.random();
    let type: EnhancedFoodType;

    if (roll < 0.02) {
      // 2% rare
      type = Math.random() < 0.5 ? 'golden_fish' : 'mystery_box';
    } else if (roll < 0.15) {
      // 13% uncommon
      const uncommon: EnhancedFoodType[] = ['pearl', 'combo_extender', 'health_kelp'];
      type = uncommon[Math.floor(Math.random() * uncommon.length)];
    } else {
      // 85% common
      const common: EnhancedFoodType[] = ['crab', 'shrimp', 'clam', 'speed_plankton'];
      type = common[Math.floor(Math.random() * common.length)];
    }

    return this.createFood(type, position, id);
  }
}

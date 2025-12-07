import type { Position } from '../components/gameEntities';
import type { DynamicEvent } from '../types/gameEnhancements';

export class DynamicEventManager {
  static createEvent(type: DynamicEvent['type'], position?: Position): DynamicEvent {
    const configs = {
      feeding_frenzy: {
        duration: 10000,
        intensity: 1.5,
        description: '🐟 Feeding Frenzy! Food spawns rapidly!'
      },
      predator_swarm: {
        duration: 15000,
        intensity: 2,
        description: '⚠️ Predator Swarm! Extra enemies incoming!'
      },
      treasure_chest: {
        duration: 20000,
        intensity: 1,
        description: '💎 Treasure Chest appeared! Reach it quickly!'
      },
      whirlpool: {
        duration: 12000,
        intensity: 1.2,
        description: '🌀 Whirlpool! Strong currents ahead!'
      },
      darkness: {
        duration: 8000,
        intensity: 0.8,
        description: '🌑 Darkness falls! Limited visibility!'
      }
    };

    const config = configs[type];

    return {
      id: `event-${type}-${Date.now()}`,
      type,
      startTime: Date.now(),
      duration: config.duration,
      intensity: config.intensity,
      position: position || {
        x: 200 + Math.random() * 600,
        y: 200 + Math.random() * 350
      },
      active: true
    };
  }

  static updateEvent(event: DynamicEvent): DynamicEvent | null {
    const elapsed = Date.now() - event.startTime;
    
    if (elapsed >= event.duration) {
      return null;
    }

    return { ...event };
  }

  static applyEventEffects(
    event: DynamicEvent,
    player: any,
    gameState: any,
    worldPosition: Position
  ): { player: any; gameState: any; spawnFood?: boolean; spawnPredator?: boolean } {
    const newPlayer = { ...player };
    const newGameState = { ...gameState };
    let result: any = { player: newPlayer, gameState: newGameState };

    switch (event.type) {
      case 'feeding_frenzy':
        result.spawnFood = Math.random() < 0.3;
        newGameState.foodSpawnMultiplier = event.intensity;
        break;

      case 'predator_swarm':
        result.spawnPredator = Math.random() < 0.01;
        newGameState.predatorSpeedMultiplier = event.intensity;
        break;

      case 'whirlpool':
        if (event.position) {
          const dx = event.position.x - worldPosition.x;
          const dy = event.position.y - worldPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const pullStrength = (1 - distance / 200) * event.intensity * 50;
            newPlayer.velocity = newPlayer.velocity || { x: 0, y: 0 };
            newPlayer.velocity.x += (dx / distance) * pullStrength;
            newPlayer.velocity.y += (dy / distance) * pullStrength;
          }
        }
        break;

      case 'darkness':
        newGameState.visibilityMultiplier = 0.3;
        newGameState.lightingIntensity = 0.2;
        break;

      case 'treasure_chest':
        break;
    }

    return result;
  }

  static getEventReward(event: DynamicEvent): { score: number; currency: number; xp: number } {
    const rewards = {
      feeding_frenzy: { score: 100, currency: 20, xp: 50 },
      predator_swarm: { score: 200, currency: 40, xp: 100 },
      treasure_chest: { score: 500, currency: 100, xp: 200 },
      whirlpool: { score: 150, currency: 30, xp: 75 },
      darkness: { score: 180, currency: 35, xp: 90 }
    };

    return rewards[event.type];
  }

  static shouldSpawnEvent(gameTime: number, lastEventTime: number): boolean {
    const timeSinceLastEvent = gameTime - lastEventTime;
    const minTimeBetweenEvents = 30000;
    
    if (timeSinceLastEvent < minTimeBetweenEvents) return false;
    
    return Math.random() < 0.001;
  }

  static getRandomEventType(): DynamicEvent['type'] {
    const types: DynamicEvent['type'][] = [
      'feeding_frenzy',
      'predator_swarm',
      'treasure_chest',
      'whirlpool',
      'darkness'
    ];
    
    return types[Math.floor(Math.random() * types.length)];
  }
}

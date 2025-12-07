import type { Position } from '../components/gameEntities';
import type { EnhancedPowerUpType } from '../types/gameEnhancements';

export interface EnhancedPowerUp {
  id: string;
  position: Position;
  type: EnhancedPowerUpType;
  active: boolean;
  size: number;
  duration: number;
  rotationSpeed: number;
  effectDuration?: number;
}

export class PowerUpManager {
  static getPowerUpConfig(type: EnhancedPowerUpType) {
    const configs = {
      speed: {
        color: '#00ff00',
        icon: '⚡',
        effectDuration: 5000,
        description: 'Increased movement speed'
      },
      shield: {
        color: '#0099ff',
        icon: '🛡️',
        effectDuration: 8000,
        description: 'Absorbs one hit'
      },
      magnet: {
        color: '#ff00ff',
        icon: '🧲',
        effectDuration: 10000,
        description: 'Attracts nearby food'
      },
      multiplier: {
        color: '#ffff00',
        icon: '✖️',
        effectDuration: 15000,
        description: '2x score multiplier'
      },
      time: {
        color: '#00ffff',
        icon: '⏰',
        effectDuration: 0,
        description: '+10 seconds'
      },
      camouflage: {
        color: '#88ff88',
        icon: '👻',
        effectDuration: 5000,
        description: 'Invisible to predators'
      },
      shrink: {
        color: '#ff88ff',
        icon: '🔽',
        effectDuration: 7000,
        description: 'Become smaller'
      },
      freeze: {
        color: '#88ffff',
        icon: '❄️',
        effectDuration: 4000,
        description: 'Slow nearby predators'
      },
      score_chain: {
        color: '#ffaa00',
        icon: '🔗',
        effectDuration: 12000,
        description: 'Chaining score multiplier'
      },
      invincibility: {
        color: '#ffffff',
        icon: '⭐',
        effectDuration: 3000,
        description: 'Complete invulnerability'
      }
    };
    
    return configs[type];
  }

  static applyPowerUpEffect(
    type: EnhancedPowerUpType,
    player: any,
    gameState: any
  ): { player: any; gameState: any; message: string } {
    const config = this.getPowerUpConfig(type);
    let message = `${config.icon} ${config.description}!`;

    const newPlayer = { ...player };
    const newGameState = { ...gameState };

    switch (type) {
      case 'speed':
        newPlayer.speedMultiplier = 1.5;
        break;
      case 'shield':
        newPlayer.hasShield = true;
        break;
      case 'magnet':
        newPlayer.magnetActive = true;
        newPlayer.magnetRadius = 150;
        break;
      case 'multiplier':
        newGameState.scoreMultiplier = 2;
        break;
      case 'time':
        newGameState.gameTime = Math.max(0, newGameState.gameTime - 10000);
        message = '⏰ +10 seconds!';
        break;
      case 'camouflage':
        newPlayer.isCamouflaged = true;
        break;
      case 'shrink':
        newPlayer.sizeMultiplier = 0.6;
        break;
      case 'freeze':
        newGameState.predatorsFrozen = true;
        break;
      case 'score_chain':
        newGameState.scoreChainActive = true;
        newGameState.scoreChainMultiplier = 1;
        break;
      case 'invincibility':
        newPlayer.isInvincible = true;
        break;
    }

    return { player: newPlayer, gameState: newGameState, message };
  }

  static removePowerUpEffect(type: EnhancedPowerUpType, player: any, gameState: any) {
    const newPlayer = { ...player };
    const newGameState = { ...gameState };

    switch (type) {
      case 'speed':
        newPlayer.speedMultiplier = 1;
        break;
      case 'shield':
        newPlayer.hasShield = false;
        break;
      case 'magnet':
        newPlayer.magnetActive = false;
        break;
      case 'multiplier':
        newGameState.scoreMultiplier = 1;
        break;
      case 'camouflage':
        newPlayer.isCamouflaged = false;
        break;
      case 'shrink':
        newPlayer.sizeMultiplier = 1;
        break;
      case 'freeze':
        newGameState.predatorsFrozen = false;
        break;
      case 'score_chain':
        newGameState.scoreChainActive = false;
        newGameState.scoreChainMultiplier = 1;
        break;
      case 'invincibility':
        newPlayer.isInvincible = false;
        break;
    }

    return { player: newPlayer, gameState: newGameState };
  }
}

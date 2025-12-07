import type { Upgrade } from '../types/gameEnhancements';

export class UpgradeSystem {
  static getAvailableUpgrades(): Upgrade[] {
    return [
      {
        id: 'dash_cooldown',
        name: 'Faster Dash',
        description: 'Reduce dash cooldown by 20% per level',
        category: 'ability',
        cost: 100,
        maxLevel: 5,
        currentLevel: 0,
        effect: { type: 'dash_cooldown_reduction', value: 0.2 }
      },
      {
        id: 'ink_capacity',
        name: 'Ink Capacity',
        description: 'Increase ink meter capacity by 20 per level',
        category: 'ability',
        cost: 80,
        maxLevel: 5,
        currentLevel: 0,
        effect: { type: 'ink_capacity', value: 20 }
      },
      {
        id: 'extra_life',
        name: 'Extra Life',
        description: 'Start with +1 life',
        category: 'stats',
        cost: 200,
        maxLevel: 3,
        currentLevel: 0,
        effect: { type: 'starting_lives', value: 1 }
      },
      {
        id: 'speed_boost',
        name: 'Swift Swimmer',
        description: 'Increase base movement speed by 10%',
        category: 'stats',
        cost: 120,
        maxLevel: 5,
        currentLevel: 0,
        effect: { type: 'movement_speed', value: 0.1 }
      },
      {
        id: 'magnet_range',
        name: 'Food Magnet',
        description: 'Passively attract food from 50 units away',
        category: 'passive',
        cost: 150,
        maxLevel: 3,
        currentLevel: 0,
        effect: { type: 'passive_magnet', value: 50 }
      },
      {
        id: 'combo_timer',
        name: 'Combo Master',
        description: 'Extend combo timer by 1 second per level',
        category: 'passive',
        cost: 100,
        maxLevel: 5,
        currentLevel: 0,
        effect: { type: 'combo_duration', value: 1000 }
      },
      {
        id: 'score_multiplier',
        name: 'Score Boost',
        description: 'Permanent 5% score increase per level',
        category: 'passive',
        cost: 180,
        maxLevel: 10,
        currentLevel: 0,
        effect: { type: 'score_multiplier', value: 0.05 }
      }
    ];
  }

  static purchaseUpgrade(upgrade: Upgrade, currency: number): { success: boolean; newCurrency: number; message: string } {
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      return { success: false, newCurrency: currency, message: 'Upgrade maxed out!' };
    }

    const cost = this.getUpgradeCost(upgrade);
    
    if (currency < cost) {
      return { success: false, newCurrency: currency, message: 'Not enough currency!' };
    }

    return { 
      success: true, 
      newCurrency: currency - cost, 
      message: `Purchased ${upgrade.name}!` 
    };
  }

  static getUpgradeCost(upgrade: Upgrade): number {
    return Math.floor(upgrade.cost * Math.pow(1.5, upgrade.currentLevel));
  }

  static applyUpgrades(upgrades: Upgrade[], player: any, gameState: any): { player: any; gameState: any } {
    const newPlayer = { ...player };
    const newGameState = { ...gameState };

    upgrades.forEach(upgrade => {
      if (upgrade.currentLevel === 0) return;

      const totalValue = upgrade.effect.value * upgrade.currentLevel;

      switch (upgrade.effect.type) {
        case 'dash_cooldown_reduction':
          newPlayer.dashCooldownMultiplier = 1 - totalValue;
          break;
        case 'ink_capacity':
          newPlayer.maxInkMeter = 100 + totalValue;
          break;
        case 'starting_lives':
          newGameState.maxLives = 3 + totalValue;
          break;
        case 'movement_speed':
          newPlayer.baseSpeedMultiplier = 1 + totalValue;
          break;
        case 'passive_magnet':
          newPlayer.passiveMagnetRadius = totalValue;
          break;
        case 'combo_duration':
          newGameState.comboTimerBonus = totalValue;
          break;
        case 'score_multiplier':
          newGameState.permanentScoreMultiplier = 1 + totalValue;
          break;
      }
    });

    return { player: newPlayer, gameState: newGameState };
  }
}

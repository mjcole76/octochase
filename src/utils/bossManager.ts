import type { Position, Player } from '../components/gameEntities';
import type { Boss } from '../types/gameEnhancements';

export class BossManager {
  static createBoss(level: number, position: Position): Boss {
    const bossTypes: Array<Boss['type']> = ['mega_shark', 'kraken', 'electric_eel'];
    const type = bossTypes[(Math.floor(level / 3) - 1) % 3];
    
    const configs = {
      mega_shark: {
        name: 'Mega Shark',
        maxHealth: 300,
        size: 120,
        attackPattern: 'charge' as const,
        speed: 150
      },
      kraken: {
        name: 'The Kraken',
        maxHealth: 500,
        size: 150,
        attackPattern: 'tentacle' as const,
        speed: 100
      },
      electric_eel: {
        name: 'Thunder Eel',
        maxHealth: 250,
        size: 100,
        attackPattern: 'pulse' as const,
        speed: 180
      }
    };

    const config = configs[type];

    return {
      id: `boss-${level}`,
      name: config.name,
      type,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      phase: 1,
      position,
      velocity: { x: 0, y: 0 },
      size: config.size,
      attackPattern: config.attackPattern,
      attackCooldown: 0,
      isInvulnerable: false,
      specialAbilityReady: true
    };
  }

  static updateBoss(boss: Boss, player: Player, deltaTime: number): Boss {
    const newBoss = { ...boss };
    
    // Update phase based on health
    if (boss.health < boss.maxHealth * 0.33) {
      newBoss.phase = 3;
    } else if (boss.health < boss.maxHealth * 0.66) {
      newBoss.phase = 2;
    }

    // Update attack cooldown
    newBoss.attackCooldown = Math.max(0, boss.attackCooldown - deltaTime);

    // AI behavior based on attack pattern and phase
    const speedMultiplier = boss.phase * 0.5 + 0.5; // Faster in later phases
    
    switch (boss.attackPattern) {
      case 'charge':
        this.handleChargePattern(newBoss, player, speedMultiplier);
        break;
      case 'circle':
        this.handleCirclePattern(newBoss, player, speedMultiplier);
        break;
      case 'pulse':
        this.handlePulsePattern(newBoss, player, speedMultiplier);
        break;
      case 'tentacle':
        this.handleTentaclePattern(newBoss, player, speedMultiplier);
        break;
    }

    // Update position
    newBoss.position.x += newBoss.velocity.x * deltaTime / 1000;
    newBoss.position.y += newBoss.velocity.y * deltaTime / 1000;

    // Keep boss in bounds
    newBoss.position.x = Math.max(60, Math.min(940, newBoss.position.x));
    newBoss.position.y = Math.max(60, Math.min(690, newBoss.position.y));

    return newBoss;
  }

  private static handleChargePattern(boss: Boss, player: Player, speedMultiplier: number): void {
    if (boss.attackCooldown <= 0) {
      // Charge at player
      const dx = player.position.x - boss.position.x;
      const dy = player.position.y - boss.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const speed = 200 * speedMultiplier;
        boss.velocity.x = (dx / distance) * speed;
        boss.velocity.y = (dy / distance) * speed;
        boss.attackCooldown = 2000 / speedMultiplier;
      }
    } else {
      // Slow down between charges
      boss.velocity.x *= 0.95;
      boss.velocity.y *= 0.95;
    }
  }

  private static handleCirclePattern(boss: Boss, player: Player, speedMultiplier: number): void {
    const angle = Math.atan2(player.position.y - boss.position.y, player.position.x - boss.position.x);
    const circleAngle = angle + Math.PI / 2;
    const speed = 120 * speedMultiplier;
    
    boss.velocity.x = Math.cos(circleAngle) * speed;
    boss.velocity.y = Math.sin(circleAngle) * speed;
  }

  private static handlePulsePattern(boss: Boss, player: Player, speedMultiplier: number): void {
    const dx = player.position.x - boss.position.x;
    const dy = player.position.y - boss.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 300) {
      const speed = 80 * speedMultiplier;
      boss.velocity.x = (dx / distance) * speed;
      boss.velocity.y = (dy / distance) * speed;
    } else if (distance < 150) {
      const speed = 60 * speedMultiplier;
      boss.velocity.x = -(dx / distance) * speed;
      boss.velocity.y = -(dy / distance) * speed;
    } else {
      boss.velocity.x *= 0.9;
      boss.velocity.y *= 0.9;
    }
  }

  private static handleTentaclePattern(boss: Boss, player: Player, speedMultiplier: number): void {
    const dx = player.position.x - boss.position.x;
    const dy = player.position.y - boss.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 250) {
      const speed = 60 * speedMultiplier;
      boss.velocity.x = (dx / distance) * speed;
      boss.velocity.y = (dy / distance) * speed;
    } else {
      boss.velocity.x *= 0.85;
      boss.velocity.y *= 0.85;
    }
  }

  static takeDamage(boss: Boss, damage: number): Boss {
    if (boss.isInvulnerable) return boss;
    
    return {
      ...boss,
      health: Math.max(0, boss.health - damage),
      isInvulnerable: true
    };
  }

  static getBossRewards(boss: Boss): { xp: number; score: number; currency: number } {
    const baseRewards = {
      mega_shark: { xp: 500, score: 1000, currency: 100 },
      kraken: { xp: 800, score: 1500, currency: 150 },
      electric_eel: { xp: 600, score: 1200, currency: 120 }
    };

    return baseRewards[boss.type];
  }
}

export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  velocity: Position;
  type: string;
  value?: number;
  active: boolean;
  size: number;
}

export interface Player extends GameObject {
  rotation: number;
  dashCooldown: number;
  inkCooldown: number;
  inkMeter: number;
  isDashing: boolean;
  inkCloudActive: boolean;
  invulnerable: boolean;
  lives: number;
}

export type PredatorState = 'patrol' | 'investigate' | 'chase' | 'lost';

export interface Predator extends GameObject {
  state: PredatorState;
  targetPosition: Position;
  alertLevel: number;
  stateTimer: number;
  patrolPath: Position[];
  patrolIndex: number;
  lastSeenPlayerPos?: Position;
  maxSpeed: number;
  detectionRange: number;
  investigateRange: number;
  loseTargetTime: number;
}

export interface Hazard extends GameObject {
  hazardType: 'net' | 'hook' | 'jellyfish' | 'current' | 'urchin' | 'floodlight';
  effect: string;
  duration?: number;
  direction?: Position;
  visionCone?: number;
}

export interface Food extends GameObject {
  foodType: 'crab' | 'shrimp' | 'clam' | 'pearl';
  points: number;
  comboExtension?: number;
}

export class PredatorAI {
  static updatePredator(predator: Predator, player: Player, deltaTime: number): Predator {
    const newPredator = { ...predator };
    newPredator.stateTimer += deltaTime;

    const distanceToPlayer = this.getDistance(predator.position, player.position);
    const canSeePlayer = this.canSeePlayer(predator, player);

    switch (predator.state) {
      case 'patrol':
        this.handlePatrolState(newPredator, player, canSeePlayer, distanceToPlayer);
        break;
      case 'investigate':
        this.handleInvestigateState(newPredator, player, canSeePlayer, distanceToPlayer);
        break;
      case 'chase':
        this.handleChaseState(newPredator, player, canSeePlayer, distanceToPlayer);
        break;
      case 'lost':
        this.handleLostState(newPredator, player, canSeePlayer, distanceToPlayer);
        break;
    }

    this.moveTowardsTarget(newPredator, deltaTime);
    this.updateAlertLevel(newPredator, canSeePlayer, deltaTime);

    return newPredator;
  }

  private static handlePatrolState(predator: Predator, player: Player, canSeePlayer: boolean, distance: number) {
    if (canSeePlayer && distance < predator.detectionRange) {
      predator.state = 'investigate';
      predator.targetPosition = { ...player.position };
      predator.alertLevel = 0.3;
      predator.stateTimer = 0;
      return;
    }

    const target = predator.patrolPath[predator.patrolIndex];
    const distanceToTarget = this.getDistance(predator.position, target);
    
    if (distanceToTarget < 30) {
      predator.patrolIndex = (predator.patrolIndex + 1) % predator.patrolPath.length;
    }
    
    predator.targetPosition = predator.patrolPath[predator.patrolIndex];
  }

  private static handleInvestigateState(predator: Predator, player: Player, canSeePlayer: boolean, distance: number) {
    if (canSeePlayer && distance < predator.investigateRange) {
      predator.state = 'chase';
      predator.lastSeenPlayerPos = { ...player.position };
      predator.alertLevel = 1.0;
      predator.stateTimer = 0;
      return;
    }

    if (predator.stateTimer > 3000) {
      predator.state = 'patrol';
      predator.alertLevel = 0;
      predator.stateTimer = 0;
      return;
    }

    predator.targetPosition = predator.lastSeenPlayerPos || predator.targetPosition;
  }

  private static handleChaseState(predator: Predator, player: Player, canSeePlayer: boolean, distance: number) {
    if (canSeePlayer) {
      predator.targetPosition = { ...player.position };
      predator.lastSeenPlayerPos = { ...player.position };
      predator.stateTimer = 0;
    } else if (predator.stateTimer > predator.loseTargetTime) {
      predator.state = 'lost';
      predator.alertLevel = 0.5;
      predator.stateTimer = 0;
    }
  }

  private static handleLostState(predator: Predator, player: Player, canSeePlayer: boolean, distance: number) {
    if (canSeePlayer && distance < predator.detectionRange) {
      predator.state = 'chase';
      predator.targetPosition = { ...player.position };
      predator.lastSeenPlayerPos = { ...player.position };
      predator.alertLevel = 1.0;
      predator.stateTimer = 0;
      return;
    }

    if (predator.stateTimer > 5000) {
      predator.state = 'patrol';
      predator.alertLevel = 0;
      predator.stateTimer = 0;
    }

    if (predator.lastSeenPlayerPos) {
      const distanceToLastSeen = this.getDistance(predator.position, predator.lastSeenPlayerPos);
      if (distanceToLastSeen < 50) {
        predator.lastSeenPlayerPos = undefined;
      } else {
        predator.targetPosition = predator.lastSeenPlayerPos;
      }
    }
  }

  private static moveTowardsTarget(predator: Predator, deltaTime: number) {
    const dx = predator.targetPosition.x - predator.position.x;
    const dy = predator.targetPosition.y - predator.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const speed = predator.maxSpeed * (predator.state === 'chase' ? 1.5 : 1);
      const moveX = (dx / distance) * speed * (deltaTime / 1000);
      const moveY = (dy / distance) * speed * (deltaTime / 1000);
      
      predator.position.x += moveX;
      predator.position.y += moveY;
      predator.velocity.x = moveX * 60;
      predator.velocity.y = moveY * 60;
    }
  }

  private static updateAlertLevel(predator: Predator, canSeePlayer: boolean, deltaTime: number) {
    if (canSeePlayer) {
      predator.alertLevel = Math.min(1, predator.alertLevel + deltaTime / 2000);
    } else {
      predator.alertLevel = Math.max(0, predator.alertLevel - deltaTime / 3000);
    }
  }

  private static canSeePlayer(predator: Predator, player: Player): boolean {
    const distance = this.getDistance(predator.position, player.position);
    if (distance > predator.detectionRange) return false;

    const effectiveness = player.inkCloudActive ? 0.3 : 1.0;
    const detectionChance = effectiveness * (1 - distance / predator.detectionRange);
    
    return Math.random() < detectionChance;
  }

  private static getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static createPredator(type: 'moray' | 'shark' | 'dolphin', position: Position, patrolPath: Position[]): Predator {
    const baseConfig = {
      id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      velocity: { x: 0, y: 0 },
      type,
      active: true,
      state: 'patrol' as PredatorState,
      targetPosition: patrolPath[0],
      alertLevel: 0,
      stateTimer: 0,
      patrolPath,
      patrolIndex: 0,
      loseTargetTime: 3000,
    };

    switch (type) {
      case 'moray':
        return {
          ...baseConfig,
          size: 35,
          maxSpeed: 80,
          detectionRange: 100,
          investigateRange: 60,
        };
      case 'shark':
        return {
          ...baseConfig,
          size: 50,
          maxSpeed: 120,
          detectionRange: 150,
          investigateRange: 80,
          loseTargetTime: 2000,
        };
      case 'dolphin':
        return {
          ...baseConfig,
          size: 45,
          maxSpeed: 100,
          detectionRange: 200,
          investigateRange: 120,
          loseTargetTime: 4000,
        };
    }
  }
}

export class HazardManager {
  static updateHazards(hazards: Hazard[], player: Player, deltaTime: number): { hazards: Hazard[], playerEffect: any } {
    let playerEffect = null;
    
    const updatedHazards = hazards.map(hazard => {
      const newHazard = { ...hazard };
      const distance = this.getDistance(hazard.position, player.position);
      
      if (distance < hazard.size + 20) {
        playerEffect = this.applyHazardEffect(hazard, player);
      }
      
      if (hazard.hazardType === 'current') {
        if (distance < hazard.size + 30) {
          player.position.x += hazard.direction!.x * deltaTime / 1000;
          player.position.y += hazard.direction!.y * deltaTime / 1000;
        }
      }
      
      return newHazard;
    });
    
    return { hazards: updatedHazards, playerEffect };
  }

  private static applyHazardEffect(hazard: Hazard, player: Player) {
    switch (hazard.hazardType) {
      case 'net':
        return { type: 'stuck', duration: 1000 };
      case 'hook':
        return { type: 'snag', duration: 500 };
      case 'jellyfish':
        return { type: 'stun', duration: 500 };
      case 'urchin':
        return { type: 'damage', amount: 1 };
      case 'floodlight':
        return { type: 'exposed', duration: 2000 };
      default:
        return null;
    }
  }

  private static getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static createHazard(type: Hazard['hazardType'], position: Position): Hazard {
    const baseConfig = {
      id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      velocity: { x: 0, y: 0 },
      type: 'hazard',
      active: true,
      hazardType: type,
      effect: '',
    };

    switch (type) {
      case 'net':
        return { ...baseConfig, size: 60, effect: 'Sticky trap that slows movement' };
      case 'hook':
        return { ...baseConfig, size: 20, effect: 'Sharp hook that snags the player' };
      case 'jellyfish':
        return { ...baseConfig, size: 30, effect: 'Electric shock that stuns' };
      case 'current':
        return { 
          ...baseConfig, 
          size: 80, 
          effect: 'Water current that pushes',
          direction: { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 }
        };
      case 'urchin':
        return { ...baseConfig, size: 25, effect: 'Spiky damage dealer' };
      case 'floodlight':
        return { 
          ...baseConfig, 
          size: 40, 
          effect: 'Light that exposes the player',
          visionCone: Math.PI / 3
        };
    }
  }
}
import type { Position, Predator, Hazard } from './gameEntities';
import { PredatorAI, HazardManager } from './gameEntities';

export interface LevelConfig {
  id: number;
  name: string;
  biome: 'reef' | 'kelp' | 'wreck';
  duration: number;
  checkpointTime: number;
  endGatePosition: Position;
  checkpointPosition: Position;
  startPosition: Position;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  predatorConfigs: Array<{
    type: 'moray' | 'shark' | 'dolphin';
    position: Position;
    patrolPath: Position[];
  }>;
  hazardConfigs: Array<{
    type: 'net' | 'hook' | 'jellyfish' | 'current' | 'urchin' | 'floodlight';
    position: Position;
  }>;
  foodDensity: number;
}

export interface LevelProgress {
  currentLevel: number;
  levelStartTime: number;
  checkpointReached: boolean;
  levelComplete: boolean;
  survivalBonus: number;
}

export class LevelManager {
  private static levels: LevelConfig[] = [
    {
      id: 1,
      name: "Shallow Reef",
      biome: 'reef',
      duration: 45000,
      checkpointTime: 22500,
      startPosition: { x: 100, y: 300 },
      checkpointPosition: { x: 400, y: 300 },
      endGatePosition: { x: 700, y: 300 },
      bronzeThreshold: 50,
      silverThreshold: 100,
      goldThreshold: 150,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 200, y: 200 },
          patrolPath: [
            { x: 200, y: 200 },
            { x: 300, y: 150 },
            { x: 250, y: 250 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'net', position: { x: 350, y: 250 } },
        { type: 'jellyfish', position: { x: 500, y: 200 } }
      ],
      foodDensity: 1.0
    },
    {
      id: 2,
      name: "Coral Garden",
      biome: 'reef',
      duration: 60000,
      checkpointTime: 30000,
      startPosition: { x: 50, y: 400 },
      checkpointPosition: { x: 400, y: 200 },
      endGatePosition: { x: 750, y: 400 },
      bronzeThreshold: 80,
      silverThreshold: 140,
      goldThreshold: 200,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 150, y: 300 },
          patrolPath: [
            { x: 150, y: 300 },
            { x: 200, y: 200 },
            { x: 250, y: 350 }
          ]
        },
        {
          type: 'shark',
          position: { x: 500, y: 100 },
          patrolPath: [
            { x: 500, y: 100 },
            { x: 600, y: 200 },
            { x: 450, y: 250 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'net', position: { x: 300, y: 350 } },
        { type: 'jellyfish', position: { x: 200, y: 150 } },
        { type: 'urchin', position: { x: 550, y: 300 } },
        { type: 'current', position: { x: 350, y: 200 } }
      ],
      foodDensity: 1.2
    },
    {
      id: 3,
      name: "Deep Reef Passage",
      biome: 'reef',
      duration: 75000,
      checkpointTime: 37500,
      startPosition: { x: 50, y: 500 },
      checkpointPosition: { x: 400, y: 100 },
      endGatePosition: { x: 750, y: 500 },
      bronzeThreshold: 120,
      silverThreshold: 200,
      goldThreshold: 280,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 150, y: 400 },
          patrolPath: [
            { x: 150, y: 400 },
            { x: 250, y: 300 },
            { x: 200, y: 450 }
          ]
        },
        {
          type: 'shark',
          position: { x: 500, y: 200 },
          patrolPath: [
            { x: 500, y: 200 },
            { x: 600, y: 300 },
            { x: 450, y: 350 }
          ]
        },
        {
          type: 'dolphin',
          position: { x: 350, y: 250 },
          patrolPath: [
            { x: 350, y: 250 },
            { x: 450, y: 200 },
            { x: 300, y: 300 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'net', position: { x: 250, y: 200 } },
        { type: 'jellyfish', position: { x: 400, y: 400 } },
        { type: 'urchin', position: { x: 550, y: 150 } },
        { type: 'current', position: { x: 300, y: 350 } },
        { type: 'floodlight', position: { x: 500, y: 450 } }
      ],
      foodDensity: 1.4
    },
    {
      id: 4,
      name: "Kelp Forest Entry",
      biome: 'kelp',
      duration: 50000,
      checkpointTime: 25000,
      startPosition: { x: 100, y: 200 },
      checkpointPosition: { x: 400, y: 400 },
      endGatePosition: { x: 700, y: 200 },
      bronzeThreshold: 90,
      silverThreshold: 160,
      goldThreshold: 230,
      predatorConfigs: [
        {
          type: 'shark',
          position: { x: 300, y: 300 },
          patrolPath: [
            { x: 300, y: 300 },
            { x: 400, y: 200 },
            { x: 500, y: 350 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'current', position: { x: 200, y: 300 } },
        { type: 'current', position: { x: 500, y: 250 } },
        { type: 'jellyfish', position: { x: 350, y: 150 } }
      ],
      foodDensity: 1.1
    },
    {
      id: 5,
      name: "Dense Kelp Maze",
      biome: 'kelp',
      duration: 65000,
      checkpointTime: 32500,
      startPosition: { x: 50, y: 300 },
      checkpointPosition: { x: 400, y: 150 },
      endGatePosition: { x: 750, y: 450 },
      bronzeThreshold: 110,
      silverThreshold: 190,
      goldThreshold: 270,
      predatorConfigs: [
        {
          type: 'shark',
          position: { x: 250, y: 200 },
          patrolPath: [
            { x: 250, y: 200 },
            { x: 350, y: 250 },
            { x: 200, y: 300 }
          ]
        },
        {
          type: 'dolphin',
          position: { x: 550, y: 350 },
          patrolPath: [
            { x: 550, y: 350 },
            { x: 600, y: 250 },
            { x: 500, y: 400 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'current', position: { x: 150, y: 200 } },
        { type: 'current', position: { x: 450, y: 300 } },
        { type: 'current', position: { x: 350, y: 400 } },
        { type: 'net', position: { x: 300, y: 250 } },
        { type: 'jellyfish', position: { x: 500, y: 200 } }
      ],
      foodDensity: 1.3
    },
    {
      id: 6,
      name: "Kelp Forest Depths",
      biome: 'kelp',
      duration: 80000,
      checkpointTime: 40000,
      startPosition: { x: 100, y: 100 },
      checkpointPosition: { x: 400, y: 500 },
      endGatePosition: { x: 700, y: 100 },
      bronzeThreshold: 150,
      silverThreshold: 250,
      goldThreshold: 350,
      predatorConfigs: [
        {
          type: 'shark',
          position: { x: 200, y: 300 },
          patrolPath: [
            { x: 200, y: 300 },
            { x: 300, y: 200 },
            { x: 400, y: 350 }
          ]
        },
        {
          type: 'dolphin',
          position: { x: 500, y: 250 },
          patrolPath: [
            { x: 500, y: 250 },
            { x: 600, y: 350 },
            { x: 450, y: 400 }
          ]
        },
        {
          type: 'moray',
          position: { x: 350, y: 150 },
          patrolPath: [
            { x: 350, y: 150 },
            { x: 450, y: 200 },
            { x: 300, y: 250 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'current', position: { x: 200, y: 400 } },
        { type: 'current', position: { x: 500, y: 150 } },
        { type: 'net', position: { x: 300, y: 300 } },
        { type: 'urchin', position: { x: 450, y: 450 } },
        { type: 'floodlight', position: { x: 550, y: 400 } }
      ],
      foodDensity: 1.5
    },
    {
      id: 7,
      name: "Sunken Ship",
      biome: 'wreck',
      duration: 55000,
      checkpointTime: 27500,
      startPosition: { x: 50, y: 250 },
      checkpointPosition: { x: 400, y: 300 },
      endGatePosition: { x: 750, y: 350 },
      bronzeThreshold: 100,
      silverThreshold: 180,
      goldThreshold: 260,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 200, y: 200 },
          patrolPath: [
            { x: 200, y: 200 },
            { x: 300, y: 250 },
            { x: 250, y: 350 }
          ]
        },
        {
          type: 'shark',
          position: { x: 500, y: 400 },
          patrolPath: [
            { x: 500, y: 400 },
            { x: 600, y: 300 },
            { x: 550, y: 450 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'hook', position: { x: 250, y: 150 } },
        { type: 'hook', position: { x: 450, y: 350 } },
        { type: 'net', position: { x: 350, y: 400 } },
        { type: 'floodlight', position: { x: 300, y: 250 } }
      ],
      foodDensity: 1.2
    },
    {
      id: 8,
      name: "Ship Graveyard",
      biome: 'wreck',
      duration: 70000,
      checkpointTime: 35000,
      startPosition: { x: 100, y: 450 },
      checkpointPosition: { x: 400, y: 150 },
      endGatePosition: { x: 700, y: 450 },
      bronzeThreshold: 130,
      silverThreshold: 220,
      goldThreshold: 310,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 150, y: 350 },
          patrolPath: [
            { x: 150, y: 350 },
            { x: 250, y: 300 },
            { x: 200, y: 400 }
          ]
        },
        {
          type: 'shark',
          position: { x: 450, y: 250 },
          patrolPath: [
            { x: 450, y: 250 },
            { x: 550, y: 200 },
            { x: 500, y: 350 }
          ]
        },
        {
          type: 'dolphin',
          position: { x: 350, y: 400 },
          patrolPath: [
            { x: 350, y: 400 },
            { x: 400, y: 300 },
            { x: 300, y: 450 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'hook', position: { x: 200, y: 250 } },
        { type: 'hook', position: { x: 500, y: 400 } },
        { type: 'hook', position: { x: 350, y: 200 } },
        { type: 'net', position: { x: 300, y: 350 } },
        { type: 'floodlight', position: { x: 450, y: 150 } },
        { type: 'urchin', position: { x: 550, y: 450 } }
      ],
      foodDensity: 1.4
    },
    {
      id: 9,
      name: "Abyss Entrance",
      biome: 'wreck',
      duration: 90000,
      checkpointTime: 45000,
      startPosition: { x: 50, y: 500 },
      checkpointPosition: { x: 400, y: 100 },
      endGatePosition: { x: 750, y: 500 },
      bronzeThreshold: 180,
      silverThreshold: 300,
      goldThreshold: 420,
      predatorConfigs: [
        {
          type: 'moray',
          position: { x: 200, y: 400 },
          patrolPath: [
            { x: 200, y: 400 },
            { x: 300, y: 300 },
            { x: 250, y: 450 }
          ]
        },
        {
          type: 'shark',
          position: { x: 400, y: 250 },
          patrolPath: [
            { x: 400, y: 250 },
            { x: 500, y: 200 },
            { x: 450, y: 350 }
          ]
        },
        {
          type: 'shark',
          position: { x: 600, y: 400 },
          patrolPath: [
            { x: 600, y: 400 },
            { x: 650, y: 300 },
            { x: 550, y: 450 }
          ]
        },
        {
          type: 'dolphin',
          position: { x: 350, y: 350 },
          patrolPath: [
            { x: 350, y: 350 },
            { x: 450, y: 300 },
            { x: 300, y: 400 }
          ]
        }
      ],
      hazardConfigs: [
        { type: 'hook', position: { x: 150, y: 300 } },
        { type: 'hook', position: { x: 350, y: 200 } },
        { type: 'hook', position: { x: 550, y: 350 } },
        { type: 'net', position: { x: 250, y: 250 } },
        { type: 'net', position: { x: 500, y: 450 } },
        { type: 'floodlight', position: { x: 400, y: 400 } },
        { type: 'floodlight', position: { x: 300, y: 150 } },
        { type: 'urchin', position: { x: 450, y: 500 } },
        { type: 'current', position: { x: 200, y: 200 } }
      ],
      foodDensity: 1.6
    }
  ];

  static getLevel(levelId: number): LevelConfig | null {
    return this.levels.find(level => level.id === levelId) || null;
  }

  static getTotalLevels(): number {
    return this.levels.length;
  }

  static initializeLevel(levelConfig: LevelConfig): {
    predators: Predator[];
    hazards: Hazard[];
  } {
    const predators = levelConfig.predatorConfigs.map(config =>
      PredatorAI.createPredator(config.type, config.position, config.patrolPath)
    );

    const hazards = levelConfig.hazardConfigs.map(config =>
      HazardManager.createHazard(config.type, config.position)
    );

    return { predators, hazards };
  }

  static calculateMedal(score: number, levelConfig: LevelConfig): 'bronze' | 'silver' | 'gold' | null {
    if (score >= levelConfig.goldThreshold) return 'gold';
    if (score >= levelConfig.silverThreshold) return 'silver';
    if (score >= levelConfig.bronzeThreshold) return 'bronze';
    return null;
  }

  static calculateSurvivalBonus(timeRemaining: number, levelDuration: number): number {
    const survivalRatio = timeRemaining / levelDuration;
    return Math.floor(survivalRatio * 100);
  }

  static isLevelComplete(progress: LevelProgress, currentTime: number): boolean {
    const elapsedTime = currentTime - progress.levelStartTime;
    return elapsedTime >= this.getLevel(progress.currentLevel)!.duration;
  }

  static shouldShowCheckpoint(progress: LevelProgress, currentTime: number): boolean {
    const elapsedTime = currentTime - progress.levelStartTime;
    const level = this.getLevel(progress.currentLevel)!;
    return elapsedTime >= level.checkpointTime && !progress.checkpointReached;
  }

  static getBiomeColors(biome: 'reef' | 'kelp' | 'wreck'): {
    background: string;
    accent: string;
    particles: string;
  } {
    switch (biome) {
      case 'reef':
        return {
          background: '#001a33',
          accent: '#0066cc',
          particles: '#66ccff'
        };
      case 'kelp':
        return {
          background: '#001a0d',
          accent: '#004d1a',
          particles: '#66cc66'
        };
      case 'wreck':
        return {
          background: '#1a1a0d',
          accent: '#4d4d1a',
          particles: '#cccc66'
        };
    }
  }
}
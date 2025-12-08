import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { PredatorAI, HazardManager } from './gameEntities';
import { LevelManager } from './levelSystem';
import { useAudio } from '../hooks/use-audio';
import { useSocialFeatures } from '../hooks/useSocialFeatures';
import { GameResults } from './GameResults';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '../contexts/AuthContext';
import { User, Trophy, Palette, Music } from 'lucide-react';
import { CustomizationMenu } from './CustomizationMenu';
import { useCustomization } from '../hooks/useCustomization';
import { OctopusRenderer } from '../utils/octopusRenderer';
import { MobileControls } from './MobileControls';
import { useIsMobile, useDeviceOrientation, useMobilePerformance } from '../hooks/use-mobile';
import { useProgression } from '../hooks/useProgression';
import { AchievementNotification } from './AchievementNotification';
import { LevelUpNotification, XpGainDisplay } from './LevelUpNotification';
import { ProgressionPanel } from './ProgressionPanel';
import { BonusGoalsDisplay } from './BonusGoalsDisplay';
import { AudioSettings } from './AudioSettings';
import { PuzzleObjectiveDisplay } from './PuzzleObjectiveDisplay';
import { TreasureRadarDisplay } from './TreasureRadarDisplay';
import type { Position, Player, GameObject, Predator, Hazard } from './gameEntities';
import type { PuzzleObjective, PuzzleProgress, PUZZLE_LEVELS } from '../types/puzzleTypes';
import type { Treasure, TreasureMap, TreasureKey, TreasureRadar, TreasureRarity } from '../types/treasureTypes';
import { PUZZLE_LEVELS as PUZZLES } from '../types/puzzleTypes';
import { TREASURE_VALUES, TREASURE_COLORS, TREASURE_EMOJIS } from '../types/treasureTypes';
import type { LevelConfig, LevelProgress } from './levelSystem';
import type { Achievement } from '../types/progression';

// NEW: Enhanced game systems
import { PowerUpManager, type EnhancedPowerUp } from '../utils/powerUpManager';
import { FoodManager, type EnhancedFood } from '../utils/foodManager';
import { BossManager } from '../utils/bossManager';
import { UpgradeSystem } from '../utils/upgradeSystem';
import { DynamicEventManager } from '../utils/dynamicEvents';
import type { Boss, DynamicEvent, Upgrade, EnhancedPowerUpType, BonusGoal } from '../types/gameEnhancements';

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  combo: number;
  comboTimer: number;
  lives: number;
  level: number;
  gameTime: number;
  playerEffects: PlayerEffect[];
  showResults: boolean;
  medal: 'bronze' | 'silver' | 'gold' | null;
  screenShake: number;
  streak: number;
  currentGameMode: GameMode;
}

type GameMode = 'classic' | 'time_attack' | 'survival' | 'zen' | 'challenge' | 'endless' | 'speed_run' | 'puzzle' | 'treasure_hunt';

interface GameModeConfig {
  name: string;
  description: string;
  icon: string;
  settings: {
    hasTimeLimit?: boolean;
    timeLimit?: number;
    hasLives?: boolean;
    startingLives?: number;
    scoringMultiplier?: number;
    difficultyProgression?: boolean;
    specialRules?: string[];
  };
}

interface SonarPulse {
  id: string;
  position: Position;
  radius: number;
  maxRadius: number;
  startTime: number;
}

interface Particle {
  id: string;
  position: Position;
  velocity: Position;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'bubble' | 'sparkle' | 'splash' | 'trail' | 'explosion' | 'bubbles' | 'sparkles' | 'rainbow' | 'ink' | 'glow' | 'star' | 'wave' | 'flash' | 'smoke' | 'electric';
  rotation?: number;
  rotationSpeed?: number;
  pulsePhase?: number;
  intensity?: number;
}

interface ScorePopup {
  id: string;
  position: Position;
  text: string;
  color: string;
  startTime: number;
  duration: number;
}

interface PowerUp {
  id: string;
  position: Position;
  type: EnhancedPowerUpType;
  active: true;
  size: number;
  duration: number;
  rotationSpeed: number;
}

interface PlayerEffect {
  type: string;
  amount?: number;
  duration: number;
  startTime: number;
}

interface Transition {
  id: string;
  startValue: number;
  endValue: number;
  duration: number;
  startTime: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

interface EnvironmentalEffect {
  id: string;
  type: 'current' | 'debris' | 'school_fish' | 'jellyfish_swarm' | 'seaweed' | 'thermal_vent' | 'whale' | 'turtle' | 'manta_ray' | 'dolphin_pod' | 'coral' | 'anemone' | 'starfish';
  position: Position;
  velocity: Position;
  size: number;
  strength: number;
  active: boolean;
  lifetime: number;
  maxLifetime: number;
  direction?: number;
  amplitude?: number;
  frequency?: number;
  swimSpeed?: number;
  animationPhase?: number;
}

interface WeatherEffect {
  type: 'storm' | 'calm' | 'turbulent';
  intensity: number;
  duration: number;
  particles: Particle[];
}

const BASE_GAME_WIDTH = 1200;  // Base width for desktop
const BASE_GAME_HEIGHT = 800;  // Base height for desktop
const WORLD_WIDTH = 1400;  // Increased proportionally
const WORLD_HEIGHT = 1000;  // Increased proportionally
const PLAYER_SIZE = 40;
const JOYSTICK_SIZE = 80;

// Helper to calculate responsive game dimensions
const getResponsiveGameDimensions = (isMobile: boolean, orientation: 'portrait' | 'landscape') => {
  if (typeof window === 'undefined') {
    return { width: BASE_GAME_WIDTH, height: BASE_GAME_HEIGHT, scale: 1 };
  }
  
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0', 10);
  const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10);
  
  if (isMobile) {
    const availableWidth = window.innerWidth - 16; // 8px padding on each side
    const availableHeight = window.innerHeight - 180 - safeAreaTop - safeAreaBottom; // Leave room for UI/controls
    
    if (orientation === 'landscape') {
      // Landscape: prioritize width, constrain height
      const scale = Math.min(availableWidth / BASE_GAME_WIDTH, availableHeight / BASE_GAME_HEIGHT);
      return {
        width: Math.floor(BASE_GAME_WIDTH * scale),
        height: Math.floor(BASE_GAME_HEIGHT * scale),
        scale
      };
    } else {
      // Portrait: fit to width, adjust height proportionally
      const scale = Math.min(availableWidth / BASE_GAME_WIDTH, 1);
      const scaledHeight = Math.min(availableHeight, BASE_GAME_HEIGHT * scale);
      return {
        width: Math.floor(availableWidth),
        height: Math.floor(scaledHeight),
        scale
      };
    }
  }
  
  return { width: BASE_GAME_WIDTH, height: BASE_GAME_HEIGHT, scale: 1 };
};

// Use these for game logic (keep consistent regardless of display size)
const GAME_WIDTH = BASE_GAME_WIDTH;
const GAME_HEIGHT = BASE_GAME_HEIGHT;

const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    name: 'Classic',
    description: 'Traditional gameplay with progressive levels',
    icon: '🐙',
    settings: {
      hasLives: true,
      startingLives: 3,
      scoringMultiplier: 1,
      difficultyProgression: true
    }
  },
  time_attack: {
    name: 'Time Attack',
    description: 'Race against the clock to score as many points as possible',
    icon: '⏱️',
    settings: {
      hasTimeLimit: true,
      timeLimit: 120,
      hasLives: false,
      scoringMultiplier: 1.5,
      difficultyProgression: false,
      specialRules: ['Fast-paced gameplay', 'No lives system', 'Bonus time powerups']
    }
  },
  survival: {
    name: 'Survival',
    description: 'Survive waves of enemies with increasing difficulty - up to 15 predators!',
    icon: '⚡',
    settings: {
      hasLives: true,
      startingLives: 1,
      scoringMultiplier: 2,
      difficultyProgression: true,
      specialRules: ['One life only', 'Enemies spawn every 30s', 'Speed increases over time', 'Up to 15 predators']
    }
  },
  zen: {
    name: 'Zen Mode',
    description: 'Relaxed gameplay without pressure',
    icon: '🧘',
    settings: {
      hasLives: false,
      scoringMultiplier: 0.5,
      difficultyProgression: false,
      specialRules: ['No game over', 'Peaceful environment', 'Meditation music']
    }
  },
  challenge: {
    name: 'Challenge',
    description: 'Complete specific objectives to win',
    icon: '🎯',
    settings: {
      hasLives: true,
      startingLives: 5,
      scoringMultiplier: 3,
      difficultyProgression: false,
      specialRules: ['Specific win conditions', 'Bonus objectives', 'Achievement-based progression']
    }
  },
  endless: {
    name: 'Endless',
    description: 'Play forever with continuous progression',
    icon: '♾️',
    settings: {
      hasLives: true,
      startingLives: 3,
      scoringMultiplier: 1.2,
      difficultyProgression: true,
      specialRules: ['Infinite levels', 'Progressive difficulty scaling', 'Milestone rewards']
    }
  },
  speed_run: {
    name: 'Speed Run',
    description: 'Complete levels as quickly as possible',
    icon: '💨',
    settings: {
      hasLives: true,
      startingLives: 3,
      scoringMultiplier: 2,
      difficultyProgression: true,
      specialRules: ['Time-based scoring', 'Speed bonuses', 'Leaderboard tracking']
    }
  },
  puzzle: {
    name: 'Puzzle',
    description: 'Solve strategic challenges with limited moves',
    icon: '🧩',
    settings: {
      hasLives: false,
      scoringMultiplier: 1.5,
      difficultyProgression: false,
      specialRules: ['Limited moves per level', 'Strategic thinking required', 'Perfect solution bonuses']
    }
  },
  treasure_hunt: {
    name: 'Treasure Hunt',
    description: 'Find hidden treasures across the ocean',
    icon: '🏴‍☠️',
    settings: {
      hasLives: true,
      startingLives: 5,
      scoringMultiplier: 2,
      difficultyProgression: false,
      specialRules: ['Find treasure chests', 'Collect map pieces', 'Unlock secret areas', 'Boss guards legendary treasure']
    }
  }
};

export const OctoSprint: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const audio = useAudio();
  const { user, player: authPlayer } = useAuth();
  const { customization } = useCustomization();
  const {
    submitGameSession,
    unlockedAchievements,
    clearAchievements,
    submitError,
    clearError,
    isSubmitting
  } = useSocialFeatures();
  
  const isMobile = useIsMobile();
  const orientation = useDeviceOrientation();
  const { isLowPerformance } = useMobilePerformance();
  const { processGameEnd, getActiveSkillEffects } = useProgression();
  
  // Responsive canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState(() => 
    getResponsiveGameDimensions(false, 'portrait')
  );
  
  // Update canvas dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions(getResponsiveGameDimensions(isMobile, orientation));
    };
    
    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, orientation]);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 1,
    comboTimer: 0,
    lives: 3,
    level: 1,
    gameTime: 0,
    playerEffects: [],
    showResults: false,
    medal: null,
    screenShake: 0,
    streak: 0,
    currentGameMode: 'classic',
  });

  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('classic');
  const [showGameModeSelect, setShowGameModeSelect] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [movesRemaining, setMovesRemaining] = useState<number | null>(null);
  const [challengeObjectives, setChallengeObjectives] = useState<string[]>([]);
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([]);
  
  // Puzzle Mode State
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleObjective | null>(null);
  const [puzzleProgress, setPuzzleProgress] = useState<Map<number, PuzzleProgress>>(new Map());
  const [puzzleStats, setPuzzleStats] = useState({
    dashUsed: 0,
    inkUsed: 0,
    damageTaken: 0,
    foodCollected: 0,
    colorsCollected: new Set<string>(),
    stayedInArea: true
  });
  
  // Treasure Hunt State
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [treasureMaps, setTreasureMaps] = useState<TreasureMap[]>([]);
  const [treasureKeys, setTreasureKeys] = useState<TreasureKey[]>([]);
  const [treasureRadar, setTreasureRadar] = useState<TreasureRadar>({
    active: false,
    targetTreasure: null,
    distance: 0,
    direction: 'cold'
  });
  const [treasuresCollected, setTreasuresCollected] = useState(0);

  const [player, setPlayer] = useState<Player>({
    id: 'player',
    position: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    type: 'player',
    active: true,
    size: PLAYER_SIZE,
    rotation: 0,
    dashCooldown: 0,
    inkCooldown: 0,
    inkMeter: 100,
    isDashing: false,
    inkCloudActive: false,
    invulnerable: false,
    lives: 3,
  });

  // Camera state to follow the player
  const [camera, setCamera] = useState<Position>({
    x: WORLD_WIDTH / 2 - GAME_WIDTH / 2,
    y: WORLD_HEIGHT / 2 - GAME_HEIGHT / 2
  });

  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [predators, setPredators] = useState<Predator[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [currentLevelConfig, setCurrentLevelConfig] = useState<LevelConfig | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    currentLevel: 1,
    levelStartTime: 0,
    checkpointReached: false,
    levelComplete: false,
    survivalBonus: 0,
  });
  const [sonarPulses, setSonarPulses] = useState<SonarPulse[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [showProgressionPanel, setShowProgressionPanel] = useState(false);
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; skillPointsGained: number; xpGained: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [xpGainVisible, setXpGainVisible] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [nextFoodPosition, setNextFoodPosition] = useState<Position | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState<Position>({ x: 0, y: 0 });
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const touchRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [environmentalEffects, setEnvironmentalEffects] = useState<EnvironmentalEffect[]>([]);
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>({ type: 'calm', intensity: 0, duration: 0, particles: [] });
  const [lightingIntensity, setLightingIntensity] = useState(0.8);
  
  // NEW: Enhanced game features state
  const [boss, setBoss] = useState<Boss | null>(null);
  const [activeEvent, setActiveEvent] = useState<DynamicEvent | null>(null);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [currency, setCurrency] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UpgradeSystem.getAvailableUpgrades());
  const [activePowerUpEffects, setActivePowerUpEffects] = useState<Map<EnhancedPowerUpType, number>>(new Map());
  
  // Game statistics tracking for social features
  const [gameStats, setGameStats] = useState({
    gameStartTime: 0,
    totalEnemiesDefeated: 0,
    totalFoodCollected: 0,
    powerUpsUsed: 0
  });

  // Bonus Goals System
  const [bonusGoals, setBonusGoals] = useState<BonusGoal[]>([]);
  const [completedGoalsThisGame, setCompletedGoalsThisGame] = useState<Set<string>>(new Set());

  const [showCustomizationMenu, setShowCustomizationMenu] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [transitions, setTransitions] = useState<Transition[]>([]);

  // Easing functions for smooth transitions
  const easingFunctions = {
    linear: (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
    'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    bounce: (t: number) => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  const createTransition = (
    id: string,
    startValue: number,
    endValue: number,
    duration: number,
    easing: Transition['easing'] = 'ease-out',
    onUpdate?: (value: number) => void,
    onComplete?: () => void
  ) => {
    const transition: Transition = {
      id,
      startValue,
      endValue,
      duration,
      startTime: Date.now(),
      easing,
      onUpdate,
      onComplete
    };
    
    setTransitions(prev => prev.filter(t => t.id !== id).concat(transition));
  };

  // Update bonus goal progress and check for completion
  const updateBonusGoal = (type: BonusGoal['type'], value: number) => {
    setBonusGoals(prev => prev.map(goal => {
      if (goal.type === type && !goal.completed) {
        const newCurrent = Math.min(goal.target, goal.current + value);
        const justCompleted = newCurrent >= goal.target && !completedGoalsThisGame.has(goal.id);
        
        if (justCompleted) {
          // Mark as completed
          setCompletedGoalsThisGame(prev => new Set(prev).add(goal.id));
          
          // Award rewards
          setGameState(prevState => ({
            ...prevState,
            score: prevState.score + goal.reward.points
          }));
          setCurrency(prev => prev + goal.reward.currency);
          
          // Show completion notification
          createScorePopup(
            player.position,
            `${goal.icon} ${goal.title} Complete! +${goal.reward.points}`,
            '#ffd700',
            true
          );
          
          console.log(`🎯 BONUS GOAL COMPLETED: ${goal.title} | +${goal.reward.points} points, +${goal.reward.currency} currency`);
          
          return { ...goal, current: newCurrent, completed: true };
        }
        
        return { ...goal, current: newCurrent };
      }
      return goal;
    }));
  };

  // Generate bonus goals for the current game mode
  const generateBonusGoals = (mode: GameMode): BonusGoal[] => {
    const goals: BonusGoal[] = [];
    
    // Common goals for all modes
    goals.push({
      id: 'collect_food_30',
      title: 'Food Collector',
      description: 'Collect 30 food items',
      type: 'collect_food',
      target: 30,
      current: 0,
      completed: false,
      reward: { points: 500, currency: 50 },
      icon: '🐟'
    });
    
    // Mode-specific goals
    if (mode === 'survival' || mode === 'endless') {
      goals.push({
        id: 'survive_60s',
        title: 'Survivor',
        description: 'Survive for 60 seconds',
        type: 'survive_time',
        target: 60,
        current: 0,
        completed: false,
        reward: { points: 1000, currency: 100 },
        icon: '⏱️'
      });
      
      goals.push({
        id: 'avoid_damage_30s',
        title: 'Untouchable',
        description: 'Avoid damage for 30 seconds',
        type: 'avoid_damage',
        target: 30,
        current: 0,
        completed: false,
        reward: { points: 750, currency: 75 },
        icon: '🛡️'
      });
    }
    
    if (mode === 'time_attack' || mode === 'speed_run') {
      goals.push({
        id: 'reach_score_2000',
        title: 'High Scorer',
        description: 'Reach 2000 points',
        type: 'reach_score',
        target: 2000,
        current: 0,
        completed: false,
        reward: { points: 500, currency: 50 },
        icon: '⭐'
      });
    }
    
    // Universal goal
    goals.push({
      id: 'collect_powerups_3',
      title: 'Power Player',
      description: 'Collect 3 power-ups',
      type: 'collect_powerups',
      target: 3,
      current: 0,
      completed: false,
      reward: { points: 300, currency: 30 },
      icon: '✨'
    });
    
    goals.push({
      id: 'combo_streak_10',
      title: 'Combo Master',
      description: 'Reach a 10x combo',
      type: 'combo_streak',
      target: 10,
      current: 0,
      completed: false,
      reward: { points: 400, currency: 40 },
      icon: '🔥'
    });
    
    return goals;
  };

  // Initialize Treasure Hunt mode
  const initializeTreasureHunt = () => {
    const newTreasures: Treasure[] = [];
    const newMaps: TreasureMap[] = [];
    const newKeys: TreasureKey[] = [];
    
    // Spawn treasures at random locations
    const treasureCount = 5 + Math.floor(Math.random() * 3); // 5-7 treasures
    for (let i = 0; i < treasureCount; i++) {
      const rarity: TreasureRarity = 
        i === 0 ? 'legendary' : // First treasure is always legendary
        Math.random() < 0.1 ? 'epic' :
        Math.random() < 0.3 ? 'rare' : 'common';
      
      const isLocked = rarity === 'legendary' || (rarity === 'epic' && Math.random() < 0.5);
      
      newTreasures.push({
        id: `treasure-${i}`,
        position: {
          x: 200 + Math.random() * (WORLD_WIDTH - 400),
          y: 200 + Math.random() * (WORLD_HEIGHT - 400)
        },
        rarity,
        value: rarity === 'common' ? 100 : rarity === 'rare' ? 500 : rarity === 'epic' ? 1000 : 5000,
        isLocked,
        keyRequired: isLocked ? `key-${i}` : undefined,
        collected: false,
        revealed: !isLocked // Common treasures start revealed
      });
      
      // Create key for locked treasures
      if (isLocked) {
        newKeys.push({
          id: `key-${i}`,
          position: {
            x: 200 + Math.random() * (WORLD_WIDTH - 400),
            y: 200 + Math.random() * (WORLD_HEIGHT - 400)
          },
          collected: false,
          unlocksChest: `treasure-${i}`
        });
      }
    }
    
    // Spawn treasure maps
    const mapCount = 3;
    for (let i = 0; i < mapCount; i++) {
      const mapPos = {
        x: 200 + Math.random() * (WORLD_WIDTH - 400),
        y: 200 + Math.random() * (WORLD_HEIGHT - 400)
      };
      
      newMaps.push({
        id: `map-${i}`,
        position: mapPos,
        collected: false,
        revealsArea: {
          x: mapPos.x,
          y: mapPos.y,
          radius: 300
        },
        treasuresRevealed: newTreasures
          .filter(t => {
            const dx = t.position.x - mapPos.x;
            const dy = t.position.y - mapPos.y;
            return Math.sqrt(dx * dx + dy * dy) < 300;
          })
          .map(t => t.id)
      });
    }
    
    setTreasures(newTreasures);
    setTreasureMaps(newMaps);
    setTreasureKeys(newKeys);
    setTreasuresCollected(0);
    setTreasureRadar({
      active: true,
      targetTreasure: newTreasures[0]?.id || null,
      distance: 0,
      direction: 'cold'
    });
  };

  // Check if puzzle objective is complete
  const checkPuzzleCompletion = () => {
    if (!currentPuzzle) return;
    
    const req = currentPuzzle.requirements;
    let isComplete = true;
    
    // Check collection requirements
    if (req.collectFood && puzzleStats.foodCollected < req.collectFood) {
      isComplete = false;
    }
    
    // Check color requirements
    if (req.collectColor) {
      const hasAllColors = req.collectColor.every(color => 
        puzzleStats.colorsCollected.has(color)
      );
      if (!hasAllColors) isComplete = false;
    }
    
    // Check damage requirement
    if (req.noDamage && puzzleStats.damageTaken > 0) {
      isComplete = false;
    }
    
    // Check dash requirement
    if (req.noDash && puzzleStats.dashUsed > 0) {
      isComplete = false;
    }
    
    // Check ink requirement
    if (req.useInkExactly !== undefined && puzzleStats.inkUsed !== req.useInkExactly) {
      isComplete = false;
    }
    
    // Check area requirement
    if (req.stayInArea && !puzzleStats.stayedInArea) {
      isComplete = false;
    }
    
    if (isComplete) {
      completePuzzle();
    }
  };

  // Complete current puzzle
  const completePuzzle = () => {
    if (!currentPuzzle) return;
    
    const movesUsed = currentPuzzle.targetMoves - (movesRemaining || 0);
    let stars = 0;
    
    if (movesUsed <= currentPuzzle.starThresholds.threeStar) stars = 3;
    else if (movesUsed <= currentPuzzle.starThresholds.twoStar) stars = 2;
    else if (movesUsed <= currentPuzzle.starThresholds.oneStar) stars = 1;
    
    // Update puzzle progress
    setPuzzleProgress(prev => {
      const newProgress = new Map(prev);
      newProgress.set(currentPuzzle.id, {
        levelId: currentPuzzle.id,
        completed: true,
        stars,
        bestMoves: movesUsed,
        attempts: (prev.get(currentPuzzle.id)?.attempts || 0) + 1
      });
      return newProgress;
    });
    
    // Show completion message
    createScorePopup(
      player.position,
      `PUZZLE COMPLETE! ${stars} ⭐`,
      '#FFD700'
    );
    
    audio.playSound('powerup');
    addScreenShake(10);
    
    // Award bonus points
    const bonusPoints = stars * 500;
    setGameState(prev => ({
      ...prev,
      score: prev.score + bonusPoints
    }));
    
    // Load next puzzle or end game
    setTimeout(() => {
      const nextPuzzle = PUZZLES[currentPuzzle.id]; // id is 0-indexed, so id+1 is next
      if (nextPuzzle) {
        setCurrentPuzzle(nextPuzzle);
        setMovesRemaining(nextPuzzle.targetMoves);
        setPuzzleStats({
          dashUsed: 0,
          inkUsed: 0,
          damageTaken: 0,
          foodCollected: 0,
          colorsCollected: new Set<string>(),
          stayedInArea: true
        });
      } else {
        // All puzzles complete!
        setGameState(prev => ({ ...prev, showResults: true, isPlaying: false }));
      }
    }, 2000);
  };

  // Update treasure radar
  const updateTreasureRadar = () => {
    if (gameState.currentGameMode !== 'treasure_hunt' || !treasureRadar.active) return;
    
    // Find nearest uncollected treasure
    const uncollectedTreasures = treasures.filter(t => !t.collected && t.revealed);
    if (uncollectedTreasures.length === 0) return;
    
    let nearestTreasure = uncollectedTreasures[0];
    let minDistance = Infinity;
    
    uncollectedTreasures.forEach(treasure => {
      const dx = treasure.position.x - player.position.x;
      const dy = treasure.position.y - player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestTreasure = treasure;
      }
    });
    
    // Determine direction
    let direction: 'hot' | 'warmer' | 'colder' | 'cold' = 'cold';
    if (minDistance < 100) direction = 'hot';
    else if (minDistance < 300) direction = 'warmer';
    else if (minDistance < 600) direction = 'colder';
    
    setTreasureRadar({
      active: true,
      targetTreasure: nearestTreasure.id,
      distance: minDistance,
      direction
    });
  };

  const startGame = (mode: GameMode = selectedGameMode) => {
    const levelConfig = LevelManager.getLevel(1);
    if (!levelConfig) return;
    
    const modeConfig = GAME_MODES[mode];
    
    setCurrentLevelConfig(levelConfig);
    setPlayer(prev => ({ ...prev, position: { ...levelConfig.startPosition } }));
    setLevelProgress({
      currentLevel: 1,
      levelStartTime: Date.now(),
      checkpointReached: false,
      levelComplete: false,
      survivalBonus: 0,
    });

    // Initialize game mode specific settings
    if (modeConfig.settings.hasTimeLimit && modeConfig.settings.timeLimit) {
      setTimeRemaining(modeConfig.settings.timeLimit);
    } else {
      setTimeRemaining(null);
    }

    if (mode === 'puzzle') {
      // Initialize first puzzle level
      const firstPuzzle = PUZZLES[0];
      setCurrentPuzzle(firstPuzzle);
      setMovesRemaining(firstPuzzle.targetMoves);
      setPuzzleStats({
        dashUsed: 0,
        inkUsed: 0,
        damageTaken: 0,
        foodCollected: 0,
        colorsCollected: new Set<string>(),
        stayedInArea: true
      });
    } else {
      setMovesRemaining(null);
      setCurrentPuzzle(null);
    }

    if (mode === 'challenge') {
      setChallengeObjectives(['Collect 100 food items', 'Survive for 60 seconds', 'Reach combo x10']);
      setCompletedObjectives([]);
    }
    
    if (mode === 'treasure_hunt') {
      // Initialize treasures, maps, and keys
      initializeTreasureHunt();
    }

    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isPaused: false, 
      showResults: false,
      medal: null,
      lives: modeConfig.settings.hasLives ? (modeConfig.settings.startingLives || 3) : 999,
      score: 0,
      currentGameMode: mode,
      combo: 1,
      comboTimer: 0,
      gameTime: 0,
      screenShake: 0,
      streak: 0
    }));
    
    // Smooth camera transition to player start position
    createTransition(
      'camera-start-x',
      camera.x,
      levelConfig.startPosition.x - GAME_WIDTH / 2,
      1000,
      'ease-out',
      (value) => setCamera(prev => ({ ...prev, x: value }))
    );
    
    createTransition(
      'camera-start-y',
      camera.y,
      levelConfig.startPosition.y - GAME_HEIGHT / 2,
      1000,
      'ease-out',
      (value) => setCamera(prev => ({ ...prev, y: value }))
    );
    
    // Initialize game statistics tracking
    setGameStats({
      gameStartTime: Date.now(),
      totalEnemiesDefeated: 0,
      totalFoodCollected: 0,
      powerUpsUsed: 0
    });
    
    // Initialize bonus goals for this game
    const newGoals = generateBonusGoals(mode);
    setBonusGoals(newGoals);
    setCompletedGoalsThisGame(new Set());
    console.log(`🎯 Generated ${newGoals.length} bonus goals for ${mode} mode`);
    
    // Clear any previous achievements notifications
    clearAchievements();
    
    // Give player spawn protection - longer for modes with more enemies
    const protectionTime = mode === 'survival' ? 15000 : 
                          (mode === 'endless' || mode === 'time_attack' || mode === 'challenge') ? 10000 : 
                          5000; // 15s survival, 10s action modes (3 enemies), 5s standard (2 enemies)
    
    setPlayer(prev => ({
      ...prev,
      invulnerable: true
    }));
    
    console.log(`🛡️ SPAWN PROTECTION ACTIVATED: ${protectionTime / 1000}s | Mode: ${mode}`);
    
    // Show spawn protection message
    const protectionSeconds = protectionTime / 1000;
    createScorePopup(
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 - 100 },
      `🛡️ SPAWN PROTECTION (${protectionSeconds}s)`,
      '#00ffff'
    );
    
    setTimeout(() => {
      setPlayer(prev => ({
        ...prev,
        invulnerable: false
      }));
      console.log(`⚠️ SPAWN PROTECTION ENDED after ${protectionTime / 1000}s`);
      // Notify when protection ends
      createScorePopup(
        player.position,
        '⚠️ Protection Ended!',
        '#ffaa00'
      );
    }, protectionTime);
    
    const { predators, hazards } = LevelManager.initializeLevel(levelConfig);
    
    // ADD MORE STARTING ENEMIES FOR ALL MODES!
    const enhancedPredators: Predator[] = [...predators];
    
    // Helper function to create a predator with patrol path - SPAWN AWAY FROM PLAYER!
    const createPredator = (id: string, type: 'shark' | 'barracuda' | 'eel' | 'dolphin', x: number, y: number) => {
      const playerStartX = levelConfig.startPosition.x;
      const playerStartY = levelConfig.startPosition.y;
      
      // Ensure enemy spawns at least 400 pixels away from player
      const minDistance = 400;
      let spawnX = x;
      let spawnY = y;
      
      const distance = Math.sqrt(
        Math.pow(spawnX - playerStartX, 2) + 
        Math.pow(spawnY - playerStartY, 2)
      );
      
      // If too close, push enemy away from player
      if (distance < minDistance) {
        const angle = Math.atan2(spawnY - playerStartY, spawnX - playerStartX);
        spawnX = playerStartX + Math.cos(angle) * minDistance;
        spawnY = playerStartY + Math.sin(angle) * minDistance;
        
        // Keep within world bounds
        spawnX = Math.max(50, Math.min(WORLD_WIDTH - 50, spawnX));
        spawnY = Math.max(50, Math.min(WORLD_HEIGHT - 50, spawnY));
      }
      
      const patrolPath: Position[] = [];
      for (let j = 0; j < 4; j++) {
        patrolPath.push({
          x: Math.random() * WORLD_WIDTH,
          y: Math.random() * WORLD_HEIGHT
        });
      }
      
      return {
        id,
        position: { x: spawnX, y: spawnY },
        velocity: { x: 0, y: 0 },
        type,
        active: true,
        size: type === 'shark' ? 60 : type === 'dolphin' ? 50 : type === 'eel' ? 55 : type === 'barracuda' ? 55 : 45,
        maxSpeed: type === 'barracuda' ? 120 : type === 'eel' ? 100 : 90,
        detectionRange: 200,
        investigateRange: 150,
        state: 'patrol' as const,
        targetPosition: patrolPath[0],
        alertLevel: 0,
        stateTimer: 0,
        patrolPath: patrolPath,
        patrolIndex: 0,
        loseTargetTime: 5000
      };
    };
    
    // Add enemies based on game mode
    if (mode === 'survival') {
      // Survival: 4 additional enemies (5 total)
      const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['shark', 'barracuda', 'eel', 'dolphin'];
      for (let i = 0; i < 4; i++) {
        const startX = (WORLD_WIDTH / 5) * (i + 1);
        const startY = Math.random() * WORLD_HEIGHT;
        enhancedPredators.push(createPredator(`survival-start-${i}`, predatorTypes[i % 4], startX, startY));
      }
      console.log(`Survival mode started with ${enhancedPredators.length} predators`);
    } else if (mode === 'time_attack' || mode === 'endless' || mode === 'challenge') {
      // Time Attack, Endless, Challenge: 2 additional enemies (3 total)
      const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['barracuda', 'eel'];
      for (let i = 0; i < 2; i++) {
        const startX = i === 0 ? WORLD_WIDTH * 0.3 : WORLD_WIDTH * 0.7;
        const startY = Math.random() * WORLD_HEIGHT;
        enhancedPredators.push(createPredator(`${mode}-start-${i}`, predatorTypes[i], startX, startY));
      }
      console.log(`${mode} mode started with ${enhancedPredators.length} predators`);
    } else {
      // Classic, Speed Run, Zen: 1 additional enemy (2 total)
      const startX = WORLD_WIDTH * 0.5;
      const startY = Math.random() * WORLD_HEIGHT;
      enhancedPredators.push(createPredator(`${mode}-start-0`, 'eel', startX, startY));
      console.log(`${mode} mode started with ${enhancedPredators.length} predators`);
    }
    
    setPredators(enhancedPredators);
    
    setHazards(hazards);
    spawnInitialFood(levelConfig.foodDensity);
    
    // NEW: Check if this is a boss level (levels 3, 6, 9)
    if (levelProgress.currentLevel % 3 === 0) {
      const bossPosition = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 3 };
      const newBoss = BossManager.createBoss(levelProgress.currentLevel, bossPosition);
      setBoss(newBoss);
      createScorePopup(bossPosition, `⚠️ BOSS: ${newBoss.name}!`, '#ff0000', true);
    } else {
      setBoss(null);
    }
    
    // Initialize environmental effects with MORE sea life!
    createEnvironmentalEffect('seaweed', { x: 100, y: WORLD_HEIGHT - 50 });
    createEnvironmentalEffect('seaweed', { x: 300, y: WORLD_HEIGHT - 50 });
    createEnvironmentalEffect('seaweed', { x: 700, y: WORLD_HEIGHT - 50 });
    createEnvironmentalEffect('seaweed', { x: 1000, y: WORLD_HEIGHT - 50 });
    createEnvironmentalEffect('thermal_vent', { x: WORLD_WIDTH - 100, y: WORLD_HEIGHT - 50 });
    createEnvironmentalEffect('current', { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 3 });
    
    // Add initial sea creatures for a lively ocean!
    createEnvironmentalEffect('school_fish');
    createEnvironmentalEffect('school_fish');
    createEnvironmentalEffect('school_fish');
    createEnvironmentalEffect('jellyfish_swarm');
    createEnvironmentalEffect('jellyfish_swarm');
    createEnvironmentalEffect('turtle');
    createEnvironmentalEffect('manta_ray');
    createEnvironmentalEffect('dolphin_pod');
    createEnvironmentalEffect('coral');
    createEnvironmentalEffect('coral');
    createEnvironmentalEffect('anemone');
    createEnvironmentalEffect('anemone');
    createEnvironmentalEffect('starfish');
    createEnvironmentalEffect('starfish');
    createEnvironmentalEffect('starfish');
    
    // Start with calm weather
    setWeatherEffect({ type: 'calm', intensity: 0, duration: 0, particles: [] });
    setLightingIntensity(0.8);
    
    // Reset event timer
    setLastEventTime(0);
    setActiveEvent(null);
    
    // Start background music when game begins
    audio.playBackgroundMusic();
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const spawnInitialFood = (density: number = 1.0) => {
    const food: GameObject[] = [];
    const totalFoodCount = Math.floor(20 * density); // Spawn 20 food items with density multiplier

    for (let i = 0; i < totalFoodCount; i++) {
      const position = {
        x: Math.random() * (WORLD_WIDTH - 40) + 20,
        y: Math.random() * (WORLD_HEIGHT - 40) + 20,
      };
      // Use new FoodManager with rarity system
      const enhancedFood = FoodManager.spawnFoodWithRarity(position, `food-${i}`);
      food.push(enhancedFood as GameObject);
    }

    setGameObjects(food);
  };


  const createSonarPulse = (position: Position) => {
    const newPulse: SonarPulse = {
      id: `sonar-${Date.now()}-${Math.random()}`,
      position: { ...position },
      radius: 0,
      maxRadius: 150,
      startTime: Date.now(),
    };
    setSonarPulses(prev => [...prev, newPulse]);
  };

  const createParticles = (position: Position, type: Particle['type'], count: number = 5, color: string = '#ffffff') => {
    // Mobile optimization: reduce particle count by 50%
    const adjustedCount = isMobile ? Math.ceil(count / 2) : count;
    const newParticles: Particle[] = [];
    for (let i = 0; i < adjustedCount; i++) {
      const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
      let speed = 100 + Math.random() * 100;
      let size = 2 + Math.random() * 4;
      let life = 1000 + Math.random() * 500;
      
      // Enhanced properties based on particle type
      let rotation = 0;
      let rotationSpeed = 0;
      let pulsePhase = Math.random() * Math.PI * 2;
      let intensity = 1;
      
      switch (type) {
        case 'glow':
          size = 4 + Math.random() * 8;
          life = 2000 + Math.random() * 1000;
          intensity = 0.8 + Math.random() * 0.4;
          break;
        case 'star':
          size = 3 + Math.random() * 5;
          rotationSpeed = 2 + Math.random() * 4;
          life = 1500 + Math.random() * 500;
          break;
        case 'wave':
          speed *= 0.3;
          size = 1 + Math.random() * 2;
          life = 3000 + Math.random() * 2000;
          break;
        case 'flash':
          size = 6 + Math.random() * 10;
          life = 300 + Math.random() * 200;
          intensity = 1.5;
          break;
        case 'smoke':
          speed *= 0.5;
          size = 3 + Math.random() * 6;
          life = 4000 + Math.random() * 2000;
          break;
        case 'electric':
          size = 2 + Math.random() * 3;
          life = 800 + Math.random() * 400;
          rotationSpeed = 10 + Math.random() * 20;
          break;
      }
      
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color,
        size,
        life,
        maxLife: life,
        type,
        rotation,
        rotationSpeed,
        pulsePhase,
        intensity
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createScorePopup = (position: Position, text: string, color: string = '#ffff00', withEffects: boolean = true) => {
    const popup: ScorePopup = {
      id: `popup-${Date.now()}`,
      position: { ...position },
      text,
      color,
      startTime: Date.now(),
      duration: 1500
    };
    setScorePopups(prev => [...prev, popup]);
    
    // Add visual effects for score popups
    if (withEffects) {
      if (text.includes('COMBO') || text.includes('STREAK')) {
        // Special effects for combo/streak bonuses
        createParticles(position, 'star', 6, color);
        createParticles(position, 'glow', 4, color);
        addScreenShake(3, 200);
      } else if (text.includes('MASTER') || text.includes('COMPLETE')) {
        // Achievement effects
        createParticles(position, 'flash', 5, '#ffffff');
        createParticles(position, 'star', 8, color);
        createParticles(position, 'glow', 10, color);
        addScreenShake(5, 300);
      } else if (text.startsWith('+')) {
        // Regular score effects
        createParticles(position, 'sparkle', 3, color);
        createParticles(position, 'glow', 2, color);
      }
    }
  };

  const addScreenShake = (intensity: number = 10, duration: number = 500) => {
    // Cap intensity to prevent excessive shaking
    const cappedIntensity = Math.min(intensity, 25);
    
    setGameState(prev => ({ 
      ...prev, 
      screenShake: Math.min(Math.max(prev.screenShake, cappedIntensity), 30) // Cap total shake at 30
    }));
    
    // Auto-decay screen shake over time - removed to rely on game loop decay
    // This prevents multiple setTimeout calls from accumulating
  };

  const spawnPowerUp = () => {
    // Enhanced power-up types including new ones
    const types: EnhancedPowerUpType[] = [
      'speed', 'shield', 'magnet', 'multiplier', 'time',
      'camouflage', 'shrink', 'freeze', 'score_chain', 'invincibility'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Spawn power-ups in world space, within a reasonable distance from player
    const spawnRadius = 300;
    const angle = Math.random() * 2 * Math.PI;
    const distance = 150 + Math.random() * spawnRadius;
    
    const powerUp: PowerUp = {
      id: `powerup-${Date.now()}`,
      position: {
        x: Math.max(50, Math.min(WORLD_WIDTH - 50, player.position.x + Math.cos(angle) * distance)),
        y: Math.max(50, Math.min(WORLD_HEIGHT - 50, player.position.y + Math.sin(angle) * distance)),
      },
      type,
      active: true,
      size: 24,
      duration: 15000,
      rotationSpeed: 2
    };
    setPowerUps(prev => [...prev, powerUp]);
  };

  const createEnvironmentalEffect = (type: EnvironmentalEffect['type'], position?: Position) => {
    const effectPosition = position || {
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT
    };
    
    const effect: EnvironmentalEffect = {
      id: `env-${type}-${Date.now()}-${Math.random()}`,
      type,
      position: effectPosition,
      velocity: { x: 0, y: 0 },
      size: 50,
      strength: 1,
      active: true,
      lifetime: 0,
      maxLifetime: 30000, // 30 seconds default
      direction: Math.random() * 2 * Math.PI,
      amplitude: 20 + Math.random() * 30,
      frequency: 0.001 + Math.random() * 0.002
    };

    switch (type) {
      case 'current':
        effect.velocity = { 
          x: (Math.random() - 0.5) * 100, 
          y: (Math.random() - 0.5) * 100 
        };
        effect.size = 100 + Math.random() * 100;
        effect.strength = 0.5 + Math.random() * 0.5;
        break;
      case 'debris':
        effect.velocity = { 
          x: (Math.random() - 0.5) * 50, 
          y: (Math.random() - 0.5) * 50 
        };
        effect.size = 20 + Math.random() * 40;
        effect.maxLifetime = 60000; // Longer for debris
        break;
      case 'school_fish':
        effect.velocity = { 
          x: (Math.random() - 0.5) * 80, 
          y: (Math.random() - 0.5) * 80 
        };
        effect.size = 60 + Math.random() * 80;
        effect.maxLifetime = 45000;
        break;
      case 'jellyfish_swarm':
        effect.velocity = { 
          x: (Math.random() - 0.5) * 30, 
          y: -20 - Math.random() * 20 
        }; // Jellyfish tend to float upward
        effect.size = 40 + Math.random() * 60;
        break;
      case 'seaweed':
        effect.velocity = { x: 0, y: 0 }; // Stationary
        effect.size = 80 + Math.random() * 120;
        effect.maxLifetime = 120000; // Very long-lived
        break;
      case 'thermal_vent':
        effect.velocity = { x: 0, y: -50 }; // Bubbles rising
        effect.size = 30;
        effect.maxLifetime = 90000;
        break;
      case 'whale':
        effect.velocity = { 
          x: 40 + Math.random() * 30, 
          y: (Math.random() - 0.5) * 20 
        };
        effect.size = 150 + Math.random() * 100; // Large!
        effect.maxLifetime = 60000;
        effect.swimSpeed = 40;
        effect.animationPhase = Math.random() * Math.PI * 2;
        break;
      case 'turtle':
        effect.velocity = { 
          x: 20 + Math.random() * 20, 
          y: (Math.random() - 0.5) * 15 
        };
        effect.size = 40 + Math.random() * 30;
        effect.maxLifetime = 50000;
        effect.swimSpeed = 20;
        effect.animationPhase = Math.random() * Math.PI * 2;
        break;
      case 'manta_ray':
        effect.velocity = { 
          x: 60 + Math.random() * 40, 
          y: (Math.random() - 0.5) * 30 
        };
        effect.size = 80 + Math.random() * 60;
        effect.maxLifetime = 45000;
        effect.swimSpeed = 60;
        effect.animationPhase = Math.random() * Math.PI * 2;
        break;
      case 'dolphin_pod':
        effect.velocity = { 
          x: 80 + Math.random() * 40, 
          y: Math.sin(Date.now() / 1000) * 30 
        };
        effect.size = 50 + Math.random() * 40;
        effect.maxLifetime = 40000;
        effect.swimSpeed = 80;
        effect.animationPhase = Math.random() * Math.PI * 2;
        break;
      case 'coral':
        effect.velocity = { x: 0, y: 0 }; // Stationary
        effect.position.y = WORLD_HEIGHT - 100 - Math.random() * 50; // Near bottom
        effect.size = 60 + Math.random() * 80;
        effect.maxLifetime = 180000; // Very long-lived
        break;
      case 'anemone':
        effect.velocity = { x: 0, y: 0 }; // Stationary
        effect.position.y = WORLD_HEIGHT - 80 - Math.random() * 40; // Near bottom
        effect.size = 40 + Math.random() * 40;
        effect.maxLifetime = 180000;
        effect.animationPhase = Math.random() * Math.PI * 2;
        break;
      case 'starfish':
        effect.velocity = { x: 0, y: 0 }; // Stationary
        effect.position.y = WORLD_HEIGHT - 60 - Math.random() * 30; // On bottom
        effect.size = 25 + Math.random() * 25;
        effect.maxLifetime = 180000;
        break;
    }

    setEnvironmentalEffects(prev => [...prev, effect]);
  };

  const createWeatherEffect = (type: WeatherEffect['type'], intensity: number = 1) => {
    const weatherParticles: Particle[] = [];
    
    if (type === 'storm') {
      // Create storm particles - debris, strong currents
      for (let i = 0; i < 20 * intensity; i++) {
        weatherParticles.push({
          id: `storm-${i}`,
          position: { x: Math.random() * WORLD_WIDTH, y: Math.random() * WORLD_HEIGHT },
          velocity: { 
            x: (Math.random() - 0.5) * 200 * intensity, 
            y: (Math.random() - 0.5) * 200 * intensity 
          },
          color: '#4682b4',
          size: 3 + Math.random() * 5,
          life: 5000 + Math.random() * 5000,
          maxLife: 10000,
          type: 'bubble'
        });
      }
    } else if (type === 'turbulent') {
      // Create turbulent water particles
      for (let i = 0; i < 15 * intensity; i++) {
        weatherParticles.push({
          id: `turbulent-${i}`,
          position: { x: Math.random() * WORLD_WIDTH, y: Math.random() * WORLD_HEIGHT },
          velocity: { 
            x: (Math.random() - 0.5) * 150 * intensity, 
            y: (Math.random() - 0.5) * 150 * intensity 
          },
          color: '#87ceeb',
          size: 2 + Math.random() * 3,
          life: 3000 + Math.random() * 3000,
          maxLife: 6000,
          type: 'splash'
        });
      }
    }

    setWeatherEffect({
      type,
      intensity,
      duration: 15000 + Math.random() * 15000, // 15-30 seconds
      particles: weatherParticles
    });
    
    // Adjust lighting based on weather
    const newLightingIntensity = type === 'storm' ? 0.3 : type === 'turbulent' ? 0.6 : 0.8;
    setLightingIntensity(newLightingIntensity);
  };

  const updateNextFoodPosition = useCallback(() => {
    const activeFood = gameObjects.filter(obj => obj.active);
    if (activeFood.length > 0) {
      const closestFood = activeFood.reduce((closest, food) => {
        const distToFood = Math.sqrt(
          Math.pow(player.position.x - food.position.x, 2) +
          Math.pow(player.position.y - food.position.y, 2)
        );
        const distToClosest = Math.sqrt(
          Math.pow(player.position.x - closest.position.x, 2) +
          Math.pow(player.position.y - closest.position.y, 2)
        );
        return distToFood < distToClosest ? food : closest;
      });
      setNextFoodPosition(closestFood.position);
    } else {
      setNextFoodPosition(null);
    }
  }, [gameObjects, player.position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
    const y = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);

    // Expand joystick area significantly for better mobile experience
    const joystickX = 80;
    const joystickY = GAME_HEIGHT - 80;
    const distance = Math.sqrt((x - joystickX) ** 2 + (y - joystickY) ** 2);
    
    // Much larger touch area for joystick - entire left third of screen
    if (distance < JOYSTICK_SIZE * 2 || (x < GAME_WIDTH / 3 && y > GAME_HEIGHT - 300)) {
      touchRef.current = {
        startX: joystickX,
        startY: joystickY,
        currentX: x,
        currentY: y,
      };
      setJoystickActive(true);
      triggerHaptic('light'); // Provide feedback when joystick activates
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;

    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
    const y = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);

    touchRef.current.currentX = x;
    touchRef.current.currentY = y;

    const dx = x - touchRef.current.startX;
    const dy = y - touchRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = JOYSTICK_SIZE / 2;

    if (distance <= maxDistance) {
      setJoystickPosition({ x: dx, y: dy });
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickPosition({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance,
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
  }, []);

  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      };
      navigator.vibrate(patterns[intensity]);
    }
  };

  const jetDash = () => {
    if (player.dashCooldown <= 0) {
      triggerHaptic('medium');
      addScreenShake(8);
      createParticles(player.position, 'explosion', 8, '#00ffff');
      createParticles(
        { x: player.position.x - Math.cos(player.rotation) * 20, y: player.position.y - Math.sin(player.rotation) * 20 }, 
        'trail', 
        12, 
        '#ffffff'
      );
      
      // Play dash sound effect
      audio.playSound('dash');
      
      // Puzzle Mode: Track dash usage
      if (gameState.currentGameMode === 'puzzle' && currentPuzzle) {
        setPuzzleStats(prev => ({ ...prev, dashUsed: prev.dashUsed + 1 }));
      }
      
      setPlayer(prev => ({
        ...prev,
        isDashing: true,
        dashCooldown: 3000,
        velocity: {
          x: prev.velocity.x * 3,
          y: prev.velocity.y * 3,
        },
      }));
      
      setTimeout(() => {
        setPlayer(prev => ({ ...prev, isDashing: false }));
      }, 200);
    }
  };

  const useInkCloud = () => {
    if (player.inkCooldown <= 0 && player.inkMeter >= 30) {
      triggerHaptic('light');
      createParticles(player.position, 'splash', 15, '#000000');
      
      // Play bubble sound for ink cloud
      audio.playSound('bubble', 1.5);
      
      // Puzzle Mode: Track ink usage
      if (gameState.currentGameMode === 'puzzle' && currentPuzzle) {
        setPuzzleStats(prev => ({ ...prev, inkUsed: prev.inkUsed + 1 }));
      }
      
      setPlayer(prev => ({
        ...prev,
        inkCloudActive: true,
        inkCooldown: 6000,
        inkMeter: prev.inkMeter - 30,
      }));
      
      setTimeout(() => {
        setPlayer(prev => ({ ...prev, inkCloudActive: false }));
      }, 2000);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeysPressed(prev => new Set([...prev, e.key.toLowerCase()]));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === ' ') {
      jetDash();
    } else if (e.key.toLowerCase() === 'c') {
      useInkCloud();
    }
    setKeysPressed(prev => {
      const newKeys = new Set(prev);
      newKeys.delete(e.key.toLowerCase());
      return newKeys;
    });
  }, [jetDash, useInkCloud]);

  const handleMobileMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Apply skill effects to movement speed
    const activeSkillEffects = getActiveSkillEffects();
    let moveDistance = isLowPerformance ? 8 : 12;
    
    // Apply speed skill effects
    activeSkillEffects.forEach(effect => {
      if (effect.type === 'speed') {
        moveDistance *= (1 + effect.value);
      }
    });
    
    moveDistance = Math.round(moveDistance);
    
    setPlayer(prev => {
      const newPos = { ...prev.position };
      switch (direction) {
        case 'left':
          newPos.x = Math.max(prev.size / 2, newPos.x - moveDistance);
          break;
        case 'right':
          newPos.x = Math.min(GAME_WIDTH - prev.size / 2, newPos.x + moveDistance);
          break;
        case 'up':
          newPos.y = Math.max(prev.size / 2, newPos.y - moveDistance);
          break;
        case 'down':
          newPos.y = Math.min(GAME_HEIGHT - prev.size / 2, newPos.y + moveDistance);
          break;
      }
      return { ...prev, position: newPos };
    });
  }, [gameState.isPlaying, gameState.isPaused, isLowPerformance, getActiveSkillEffects]);

  const handleMobileJump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    jetDash();
  }, [gameState.isPlaying, gameState.isPaused, jetDash]);

  const handleMobilePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleMobileInkCloud = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    useInkCloud();
  }, [gameState.isPlaying, gameState.isPaused, useInkCloud]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  // Hide XP gain display after 3 seconds
  useEffect(() => {
    if (xpGainVisible) {
      const timer = setTimeout(() => setXpGainVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [xpGainVisible]);

  // Update treasure radar periodically
  useEffect(() => {
    if (gameState.currentGameMode === 'treasure_hunt' && gameState.isPlaying) {
      const interval = setInterval(() => {
        updateTreasureRadar();
      }, isMobile ? 1000 : 500); // Update every 1s on mobile, 500ms on desktop
      
      return () => clearInterval(interval);
    }
  }, [gameState.currentGameMode, gameState.isPlaying, isMobile]);

  // Track bonus goals progress
  useEffect(() => {
    if (!gameState.isPlaying || gameState.showResults) return;
    
    // Update score goal
    bonusGoals.forEach(goal => {
      if (goal.type === 'reach_score' && !goal.completed) {
        setBonusGoals(prev => prev.map(g => 
          g.id === goal.id ? { ...g, current: gameState.score } : g
        ));
      }
      
      // Update combo goal
      if (goal.type === 'combo_streak' && !goal.completed && gameState.combo > goal.current) {
        setBonusGoals(prev => prev.map(g => 
          g.id === goal.id ? { ...g, current: gameState.combo } : g
        ));
        
        // Check if just completed
        if (gameState.combo >= goal.target && !completedGoalsThisGame.has(goal.id)) {
          updateBonusGoal('combo_streak', 0); // Trigger completion check
        }
      }
      
      // Update survival time goal
      if (goal.type === 'survive_time' && !goal.completed) {
        const survivalSeconds = Math.floor(gameState.gameTime / 1000);
        setBonusGoals(prev => prev.map(g => 
          g.id === goal.id ? { ...g, current: survivalSeconds } : g
        ));
        
        if (survivalSeconds >= goal.target && !completedGoalsThisGame.has(goal.id)) {
          updateBonusGoal('survive_time', 0); // Trigger completion check
        }
      }
    });
  }, [gameState.score, gameState.combo, gameState.gameTime, gameState.isPlaying, gameState.showResults, bonusGoals, completedGoalsThisGame]);

  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.isPaused || !gameState.isPlaying || gameState.showResults) return;

    setPlayer(prev => {
      const newPlayer = { ...prev };
      
      // Calculate base speed with skill effects
      let baseSpeed = gameState.playerEffects.find(e => e.type === 'stuck') ? 50 : 200;
      
      // Apply speed skill effects
      const activeSkillEffects = getActiveSkillEffects();
      activeSkillEffects.forEach(effect => {
        if (effect.type === 'speed') {
          baseSpeed *= (1 + effect.value);
        }
      });
      
      const speed = baseSpeed;
      const maxDistance = JOYSTICK_SIZE / 2;
      const intensity = Math.sqrt(joystickPosition.x ** 2 + joystickPosition.y ** 2) / maxDistance;
      
      // Handle keyboard input
      const keyboardVelocity = { x: 0, y: 0 };
      if (keysPressed.has('w') || keysPressed.has('arrowup')) keyboardVelocity.y = -1;
      if (keysPressed.has('s') || keysPressed.has('arrowdown')) keyboardVelocity.y = 1;
      if (keysPressed.has('a') || keysPressed.has('arrowleft')) keyboardVelocity.x = -1;
      if (keysPressed.has('d') || keysPressed.has('arrowright')) keyboardVelocity.x = 1;
      
      const keyboardIntensity = Math.sqrt(keyboardVelocity.x ** 2 + keyboardVelocity.y ** 2);
      if (keyboardIntensity > 0) {
        keyboardVelocity.x /= keyboardIntensity;
        keyboardVelocity.y /= keyboardIntensity;
      }
      
      if ((joystickActive && intensity > 0.1) || keyboardIntensity > 0) {
        if (!gameState.playerEffects.find(e => e.type === 'stun')) {
          // Puzzle mode - decrease moves when player makes a move
          if (gameState.currentGameMode === 'puzzle' && movesRemaining !== null) {
            // Only decrement if player was previously stationary (velocity near 0)
            const wasStationary = Math.abs(player.velocity.x) < 1 && Math.abs(player.velocity.y) < 1;
            if (wasStationary) {
              setMovesRemaining(prev => {
                const newMoves = (prev || 0) - 1;
                if (newMoves <= 0) {
                  setGameState(prev => ({ ...prev, isPlaying: false, showResults: true }));
                }
                return Math.max(0, newMoves);
              });
            }
          }
          
          if (keyboardIntensity > 0) {
            newPlayer.velocity.x = keyboardVelocity.x * speed;
            newPlayer.velocity.y = keyboardVelocity.y * speed;
            newPlayer.rotation = Math.atan2(keyboardVelocity.y, keyboardVelocity.x);
          } else {
            const angle = Math.atan2(joystickPosition.y, joystickPosition.x);
            newPlayer.velocity.x = Math.cos(angle) * speed * intensity;
            newPlayer.velocity.y = Math.sin(angle) * speed * intensity;
            newPlayer.rotation = angle;
          }
        }
      } else {
        newPlayer.velocity.x *= 0.9;
        newPlayer.velocity.y *= 0.9;
      }

      newPlayer.position.x += newPlayer.velocity.x * deltaTime / 1000;
      newPlayer.position.y += newPlayer.velocity.y * deltaTime / 1000;

      // Keep octopus within bounds that ensure visibility - use stricter constraints
      const safetyMargin = PLAYER_SIZE;
      const minX = safetyMargin;
      const maxX = WORLD_WIDTH - safetyMargin;
      const minY = safetyMargin;
      const maxY = WORLD_HEIGHT - safetyMargin;
      
      // Ensure octopus stays within safe visible bounds
      newPlayer.position.x = Math.max(minX, Math.min(maxX, newPlayer.position.x));
      newPlayer.position.y = Math.max(minY, Math.min(maxY, newPlayer.position.y));

      newPlayer.dashCooldown = Math.max(0, newPlayer.dashCooldown - deltaTime);
      newPlayer.inkCooldown = Math.max(0, newPlayer.inkCooldown - deltaTime);
      newPlayer.inkMeter = Math.min(100, newPlayer.inkMeter + deltaTime / 50);

      // Create trail particles if trail effects are enabled and player is moving
      if (customization.octopus.trailEffect !== 'none' && (Math.abs(newPlayer.velocity.x) > 50 || Math.abs(newPlayer.velocity.y) > 50)) {
        const trailType = customization.octopus.trailEffect;
        let trailColor = '#ffffff';
        
        switch (trailType) {
          case 'bubbles':
            trailColor = '#add8e6';
            break;
          case 'sparkles':
            trailColor = '#ffd700';
            break;
          case 'rainbow':
            trailColor = `hsl(${(gameState.gameTime / 50) % 360}, 70%, 60%)`;
            break;
          case 'ink':
            trailColor = '#1a1a2e';
            break;
        }
        
        if (Math.random() < 0.3) { // 30% chance per frame when moving
          createParticles(
            { x: newPlayer.position.x - newPlayer.velocity.x * 0.05, y: newPlayer.position.y - newPlayer.velocity.y * 0.05 },
            trailType as Particle['type'],
            1,
            trailColor
          );
        }
      }

      return newPlayer;
    });

    // Update camera to follow player with improved constraints to keep octopus visible
    setCamera(prevCamera => {
      // Target camera position to center the player
      const targetCameraX = player.position.x - GAME_WIDTH / 2;
      const targetCameraY = player.position.y - GAME_HEIGHT / 2;
      
      // Constrain camera to world bounds with safety margins
      const minCameraX = 0;
      const maxCameraX = Math.max(0, WORLD_WIDTH - GAME_WIDTH);
      const minCameraY = 0;
      const maxCameraY = Math.max(0, WORLD_HEIGHT - GAME_HEIGHT);
      
      let constrainedTargetX = Math.max(minCameraX, Math.min(maxCameraX, targetCameraX));
      let constrainedTargetY = Math.max(minCameraY, Math.min(maxCameraY, targetCameraY));
      
      // Emergency visibility check - if octopus would be off screen, force camera adjustment
      const playerScreenX = player.position.x - constrainedTargetX;
      const playerScreenY = player.position.y - constrainedTargetY;
      const visibilityMargin = PLAYER_SIZE * 2;
      
      if (playerScreenX < visibilityMargin) {
        constrainedTargetX = Math.max(minCameraX, player.position.x - visibilityMargin);
      } else if (playerScreenX > GAME_WIDTH - visibilityMargin) {
        constrainedTargetX = Math.min(maxCameraX, player.position.x - (GAME_WIDTH - visibilityMargin));
      }
      
      if (playerScreenY < visibilityMargin) {
        constrainedTargetY = Math.max(minCameraY, player.position.y - visibilityMargin);
      } else if (playerScreenY > GAME_HEIGHT - visibilityMargin) {
        constrainedTargetY = Math.min(maxCameraY, player.position.y - (GAME_HEIGHT - visibilityMargin));
      }
      
      // Faster camera movement for better tracking
      const cameraSpeed = 0.25;
      const newCameraX = prevCamera.x + (constrainedTargetX - prevCamera.x) * cameraSpeed;
      const newCameraY = prevCamera.y + (constrainedTargetY - prevCamera.y) * cameraSpeed;
      
      // Ensure camera values are valid numbers (prevent NaN)
      if (isNaN(newCameraX) || isNaN(newCameraY)) {
        console.warn('Camera position became NaN, resetting to center player');
        return {
          x: Math.max(0, Math.min(maxCameraX, player.position.x - GAME_WIDTH / 2)),
          y: Math.max(0, Math.min(maxCameraY, player.position.y - GAME_HEIGHT / 2))
        };
      }
      
      return {
        x: newCameraX,
        y: newCameraY
      };
    });

    setPredators(prev => prev.map(predator => {
      const updatedPredator = PredatorAI.updatePredator(predator, player, deltaTime);
      
      if (updatedPredator.type === 'dolphin' && Math.random() < 0.0008) {
        createSonarPulse(updatedPredator.position);
      }
      
      return updatedPredator;
    }));

    // NEW: Update boss if active
    if (boss) {
      const updatedBoss = BossManager.updateBoss(boss, player, deltaTime);
      setBoss(updatedBoss);
      
      // Check boss collision with player
      const bossDistance = Math.sqrt(
        (player.position.x - updatedBoss.position.x) ** 2 +
        (player.position.y - updatedBoss.position.y) ** 2
      );
      
      if (bossDistance < updatedBoss.size / 2 + PLAYER_SIZE / 2 && !player.invulnerable) {
        triggerHaptic('heavy');
        addScreenShake(20, 1000);
        createParticles(player.position, 'explosion', 15, '#ff0000');
        audio.playSound('hit');
        
        // Puzzle Mode: Track damage
        if (gameState.currentGameMode === 'puzzle' && currentPuzzle) {
          setPuzzleStats(prev => ({ ...prev, damageTaken: prev.damageTaken + 1 }));
        }
        
        setGameState(prev => {
          const newLives = Math.max(0, prev.lives - 1);
          console.log(`Boss hit! Lives: ${prev.lives} -> ${newLives}`);
          return {
            ...prev,
            lives: newLives,
            combo: 1,
            comboTimer: 0
          };
        });
        
        setPlayer(prev => ({ ...prev, invulnerable: true }));
        setTimeout(() => setPlayer(prev => ({ ...prev, invulnerable: false })), 3000);
      }
      
      // Check if boss is defeated
      if (updatedBoss.health <= 0 && boss.health > 0) {
        const rewards = BossManager.getBossRewards(updatedBoss);
        setGameState(prev => ({ ...prev, score: prev.score + rewards.score }));
        setCurrency(prev => prev + rewards.currency);
        createScorePopup(updatedBoss.position, `BOSS DEFEATED! +${rewards.score}`, '#ffd700', true);
        createParticles(updatedBoss.position, 'explosion', 30, '#ffd700');
        createParticles(updatedBoss.position, 'star', 20, '#ffffff');
        addScreenShake(15, 1500);
        audio.playSound('combo');
        setBoss(null);
      }
    }

    const hazardResult = HazardManager.updateHazards(hazards, player, deltaTime);
    if (hazardResult.playerEffect && !player.invulnerable) {
      setGameState(prevState => {
        const newState = { ...prevState };
        if (hazardResult.playerEffect.type === 'damage') {
          newState.lives = Math.max(0, newState.lives - hazardResult.playerEffect.amount);
          
          // Add invulnerability period after hazard damage
          setPlayer(prev => ({
            ...prev,
            invulnerable: true,
          }));
          
          setTimeout(() => {
            setPlayer(prev => ({
              ...prev,
              invulnerable: false,
            }));
          }, 1500); // Shorter invulnerability for hazards
        } else {
          const existingEffect = newState.playerEffects.find(e => e.type === hazardResult.playerEffect.type);
          if (!existingEffect) {
            newState.playerEffects = [...newState.playerEffects, {
              ...hazardResult.playerEffect,
              startTime: Date.now()
            }];
          }
        }
        return newState;
      });
    }

    setGameState(prev => {
      const newState = { ...prev };
      newState.gameTime += deltaTime;
      
      newState.playerEffects = newState.playerEffects.filter(effect => {
        const elapsed = Date.now() - effect.startTime;
        return elapsed < effect.duration;
      });
      
      if (newState.comboTimer > 0) {
        newState.comboTimer = Math.max(0, newState.comboTimer - deltaTime);
        if (newState.comboTimer === 0) {
          newState.combo = 1;
        }
      }
      
      // Update screen shake - more aggressive decay to prevent accumulation
      if (newState.screenShake > 0) {
        newState.screenShake = Math.max(0, newState.screenShake - deltaTime / 20);
        // Force reset if very small to prevent floating point issues
        if (newState.screenShake < 0.1) {
          newState.screenShake = 0;
        }
      }
      
      // Spawn power-ups more frequently for better gameplay
      if (Math.random() < 0.002 && powerUps.length < 3) {
        spawnPowerUp();
      }
      
      // NEW: Check for dynamic event spawning
      if (DynamicEventManager.shouldSpawnEvent(newState.gameTime, lastEventTime)) {
        const eventType = DynamicEventManager.getRandomEventType();
        const event = DynamicEventManager.createEvent(eventType);
        setActiveEvent(event);
        setLastEventTime(newState.gameTime);
        createScorePopup(event.position || player.position, `🌟 ${eventType.toUpperCase().replace('_', ' ')}!`, '#ff00ff', true);
        addScreenShake(10, 500);
      }
      
      // NEW: Update active event
      if (activeEvent) {
        const updatedEvent = DynamicEventManager.updateEvent(activeEvent);
        if (!updatedEvent) {
          // Event ended - give rewards
          const rewards = DynamicEventManager.getEventReward(activeEvent);
          setCurrency(prev => prev + rewards.currency);
          newState.score += rewards.score;
          createScorePopup(player.position, `Event Complete! +${rewards.currency}🪙`, '#00ff00', true);
          setActiveEvent(null);
        } else {
          setActiveEvent(updatedEvent);
          
          // Apply event effects
          if (activeEvent.type === 'feeding_frenzy' && Math.random() < 0.1) {
            // Spawn extra food during feeding frenzy
            const position = {
              x: Math.random() * (WORLD_WIDTH - 40) + 20,
              y: Math.random() * (WORLD_HEIGHT - 40) + 20,
            };
            const newFood = FoodManager.spawnFoodWithRarity(position, `event-food-${Date.now()}`);
            setGameObjects(prev => [...prev, newFood as GameObject]);
          }
        }
      }
      
      // Spawn environmental effects dynamically - INCREASED RATE for more action!
      if (Math.random() < 0.015) { // Increased from 0.001 to 0.015 (15x more)
        const effectTypes: EnvironmentalEffect['type'][] = [
          'school_fish', 'school_fish', 'school_fish', // More fish schools
          'jellyfish_swarm', 'jellyfish_swarm', // More jellyfish
          'turtle', 'turtle', // Sea turtles
          'manta_ray', // Manta rays
          'dolphin_pod', // Dolphin pods
          'whale', // Occasional whale
          'current', 'debris', 'seaweed', 'thermal_vent',
          'coral', 'anemone', 'starfish' // Bottom dwellers
        ];
        const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
        createEnvironmentalEffect(randomType);
      }
      
      // Change weather occasionally
      if (Math.random() < 0.0005) {
        const weatherTypes: WeatherEffect['type'][] = ['calm', 'turbulent', 'storm'];
        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        const intensity = 0.5 + Math.random() * 0.5;
        createWeatherEffect(randomWeather, intensity);
      }
      
      // Dynamically spawn new food when running low
      const activeFood = gameObjects.filter(obj => obj.active).length;
      if (activeFood < 5 && Math.random() < 0.01) {
        const position = {
          x: Math.random() * (WORLD_WIDTH - 40) + 20,
          y: Math.random() * (WORLD_HEIGHT - 40) + 20,
        };
        const newFood = FoodManager.spawnFoodWithRarity(position, `food-${Date.now()}`);
        setGameObjects(prev => [...prev, newFood as GameObject]);
      }
      
      // NEW: Update moving food (like Golden Fish)
      setGameObjects(prev => prev.map(obj => {
        const food = obj as EnhancedFood;
        if (food.isMoving && food.active) {
          return FoodManager.updateMovingFood(food, player.position, deltaTime, WORLD_WIDTH, WORLD_HEIGHT) as GameObject;
        }
        return obj;
      }));
      
      // Add swimming bubbles
      if (Math.random() < 0.3) {
        createParticles(
          { x: player.position.x + Math.random() * 20 - 10, y: player.position.y + Math.random() * 20 - 10 },
          'bubble',
          1,
          '#87CEEB'
        );
        
        // Play occasional bubble sounds while swimming
        if (Math.random() < 0.05) {
          audio.playSound('bubble', 0.3);
        }
      }
      
      const playerCollisions = predators.filter(predator => {
        const dx = player.position.x - predator.position.x;
        const dy = player.position.y - predator.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < PLAYER_SIZE / 2 + predator.size / 2;
      });

      // Log collision attempts (even if blocked by invulnerability)
      if (playerCollisions.length > 0) {
        if (player.invulnerable) {
          console.log(`🛡️ BLOCKED HIT! Enemy nearby: ${playerCollisions.map(p => p.type).join(', ')} | Invulnerable: YES | Time: ${(newState.gameTime / 1000).toFixed(1)}s`);
        } else if (player.inkCloudActive) {
          console.log(`💨 BLOCKED HIT! Enemy nearby: ${playerCollisions.map(p => p.type).join(', ')} | Ink Cloud: YES | Time: ${(newState.gameTime / 1000).toFixed(1)}s`);
        }
      }
      
      if (playerCollisions.length > 0 && !player.inkCloudActive && !player.invulnerable) {
        triggerHaptic('heavy');
        addScreenShake(15, 800); // Heavy shake for enemy collision
        
        // Enhanced collision effects
        createParticles(player.position, 'explosion', 10, '#ff0000');
        createParticles(player.position, 'flash', 5, '#ffffff');
        createParticles(player.position, 'electric', 8, '#ffff00');
        createParticles(player.position, 'smoke', 6, '#444444');
        
        // Play hit sound effect
        audio.playSound('hit');
        
        const newLives = Math.max(0, newState.lives - 1);
        const collidedWith = playerCollisions.map(p => p.type).join(', ');
        console.log(`🔴 PREDATOR HIT! Collided with: ${collidedWith} | Lives: ${newState.lives} -> ${newLives} | Invulnerable: NO | Time: ${(newState.gameTime / 1000).toFixed(1)}s`);
        newState.lives = newLives;
        newState.combo = 1;
        newState.comboTimer = 0;
        newState.streak = 0;
        
        // Add invulnerability period to prevent multiple hits
        setPlayer(prev => ({
          ...prev,
          invulnerable: true,
        }));
        
        // Remove invulnerability after 3 seconds (increased for better recovery)
        setTimeout(() => {
          setPlayer(prev => ({
            ...prev,
            invulnerable: false,
          }));
          console.log(`⚠️ Post-hit invulnerability ended | Time: ${(newState.gameTime / 1000).toFixed(1)}s`);
        }, 3000);
      }

      if (currentLevelConfig && !newState.showResults) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - levelProgress.levelStartTime;
        
        if (LevelManager.shouldShowCheckpoint(levelProgress, currentTime) && !levelProgress.checkpointReached) {
          setLevelProgress(prev => ({ ...prev, checkpointReached: true }));
        }
        
        const reachedEndGate = Math.sqrt(
          Math.pow(player.position.x - currentLevelConfig.endGatePosition.x, 2) +
          Math.pow(player.position.y - currentLevelConfig.endGatePosition.y, 2)
        ) < 50;
        
        // Only end game if lives are truly 0 AND game mode requires lives
        const currentModeConfig = GAME_MODES[newState.currentGameMode];
        const shouldEndDueToLives = newState.lives <= 0 && 
                                     currentModeConfig.settings.hasLives && 
                                     !newState.showResults;
        
        // Only Classic mode should end on level completion/duration
        // All other modes have their own ending conditions (time limit, lives, etc.)
        const isClassicMode = newState.currentGameMode === 'classic';
        const shouldEndLevel = isClassicMode && (reachedEndGate || LevelManager.isLevelComplete(levelProgress, currentTime));
        
        if (shouldEndLevel || shouldEndDueToLives) {
          console.log(`🏁 GAME ENDING | Reason: ${shouldEndLevel ? 'Level Complete' : 'Lives Depleted'} | Lives: ${newState.lives} | Time: ${(newState.gameTime / 1000).toFixed(1)}s | Mode: ${newState.currentGameMode}`);
          
          const timeRemaining = Math.max(0, currentLevelConfig.duration - elapsedTime);
          const survivalBonus = LevelManager.calculateSurvivalBonus(timeRemaining, currentLevelConfig.duration);
          const finalScore = newState.score + survivalBonus;
          const medal = LevelManager.calculateMedal(finalScore, currentLevelConfig);
          
          newState.showResults = true;
          newState.medal = medal;
          newState.score = finalScore;
          newState.isPlaying = false;
          
          setLevelProgress(prev => ({
            ...prev,
            levelComplete: true,
            survivalBonus
          }));
          
          // Submit game statistics and process progression
          if (user) {
            const gameDuration = currentTime - gameStats.gameStartTime;
            const gameSessionData = {
              score: finalScore,
              level: levelProgress.currentLevel,
              combo: newState.combo,
              duration: gameDuration,
              medal: medal,
              totalEnemiesDefeated: gameStats.totalEnemiesDefeated,
              totalFoodCollected: gameStats.totalFoodCollected,
              timesSurvived: newState.lives > 0 ? 1 : 0,
              powerUpsUsed: gameStats.powerUpsUsed
            };
            
            // Process progression (handles XP, levels, achievements)
            processGameEnd(gameSessionData).then(result => {
              if (result.xpGained > 0) {
                setXpGained(result.xpGained);
                setXpGainVisible(true);
              }
              
              if (result.leveledUp) {
                setLevelUpData({
                  newLevel: result.newLevel || 0,
                  skillPointsGained: result.skillPointsGained || 0,
                  xpGained: result.xpGained
                });
                setShowLevelUpNotification(true);
              }
              
              if (result.newAchievements && result.newAchievements.length > 0) {
                setNewAchievements(result.newAchievements);
              }
            }).catch(err => console.error('Error processing progression:', err));
            
            // Also submit to social features system for backwards compatibility
            submitGameSession(gameSessionData).catch(err => console.error('Error submitting game session:', err));
          }
        }
      }

      // Game mode specific logic
      const modeConfig = GAME_MODES[newState.currentGameMode];
      
      // Time Attack mode - countdown timer
      if (newState.currentGameMode === 'time_attack' && timeRemaining !== null) {
        const newTimeRemaining = Math.max(0, timeRemaining - deltaTime / 1000);
        setTimeRemaining(newTimeRemaining);
        if (newTimeRemaining <= 0) {
          newState.isPlaying = false;
          newState.showResults = true;
        }
      }

      // Zen mode - no game over conditions, FEWER enemies
      if (newState.currentGameMode === 'zen') {
        newState.lives = 999; // Prevent game over
        // Remove excess predators to keep it peaceful
        if (predators.length > 2) {
          setPredators(prev => prev.slice(0, 2));
        }
        // Slow down predators
        setPredators(prev => prev.map(pred => ({
          ...pred,
          maxSpeed: pred.maxSpeed * 0.5
        })));
      }

      // Survival mode - increasing difficulty with MORE ENEMIES!
      if (newState.currentGameMode === 'survival') {
        const difficultyMultiplier = 1 + (newState.gameTime / 30000); // Increase every 30 seconds
        
        // Spawn more predators as time goes on - MUCH HIGHER RATE!
        const spawnChance = 0.02 * difficultyMultiplier; // 2% chance (10x higher!)
        if (Math.random() < spawnChance && predators.length < 15) { // Allow up to 15 predators
          const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['shark', 'barracuda', 'eel', 'dolphin'];
          const randomType = predatorTypes[Math.floor(Math.random() * predatorTypes.length)];
          
          // Generate patrol path
          const patrolPath: Position[] = [];
          for (let j = 0; j < 4; j++) {
            patrolPath.push({
              x: Math.random() * WORLD_WIDTH,
              y: Math.random() * WORLD_HEIGHT
            });
          }
          
          const newPredator: Predator = {
            id: `survival-predator-${Date.now()}-${Math.random()}`,
            position: {
              x: Math.random() < 0.5 ? -50 : WORLD_WIDTH + 50,
              y: Math.random() * WORLD_HEIGHT
            },
            velocity: { x: 0, y: 0 },
            type: randomType,
            active: true,
            size: randomType === 'shark' ? 60 : randomType === 'dolphin' ? 50 : randomType === 'eel' ? 55 : randomType === 'barracuda' ? 55 : 45,
            maxSpeed: (randomType === 'barracuda' ? 120 : randomType === 'eel' ? 100 : 80) * difficultyMultiplier,
            detectionRange: 200 * difficultyMultiplier,
            investigateRange: 150 * difficultyMultiplier,
            state: 'patrol',
            targetPosition: patrolPath[0],
            alertLevel: 0,
            stateTimer: 0,
            patrolPath: patrolPath,
            patrolIndex: 0,
            loseTargetTime: 5000
          };
          
          setPredators(prev => [...prev, newPredator]);
          createScorePopup(newPredator.position, '⚠️ NEW THREAT!', '#ff0000');
        }
        
        // Increase existing predator speed over time
        setPredators(prev => prev.map(pred => ({
          ...pred,
          maxSpeed: pred.maxSpeed * (1 + difficultyMultiplier * 0.01)
        })));
      }

      // Time Attack mode - FAST-PACED with more enemies!
      if (newState.currentGameMode === 'time_attack') {
        // Spawn enemies more frequently for action-packed gameplay
        if (Math.random() < 0.003 && predators.length < 8) {
          const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['barracuda', 'barracuda', 'eel']; // Favor fast enemies
          const randomType = predatorTypes[Math.floor(Math.random() * predatorTypes.length)];
          
          // Generate patrol path
          const patrolPath: Position[] = [];
          for (let j = 0; j < 4; j++) {
            patrolPath.push({
              x: Math.random() * WORLD_WIDTH,
              y: Math.random() * WORLD_HEIGHT
            });
          }
          
          const newPredator: Predator = {
            id: `timeattack-predator-${Date.now()}-${Math.random()}`,
            position: {
              x: Math.random() < 0.5 ? -50 : WORLD_WIDTH + 50,
              y: Math.random() * WORLD_HEIGHT
            },
            velocity: { x: 0, y: 0 },
            type: randomType,
            active: true,
            size: 45,
            maxSpeed: 150, // Fast!
            detectionRange: 250,
            investigateRange: 180,
            state: 'patrol',
            targetPosition: patrolPath[0],
            alertLevel: 0,
            stateTimer: 0,
            patrolPath: patrolPath,
            patrolIndex: 0,
            loseTargetTime: 3000
          };
          
          setPredators(prev => [...prev, newPredator]);
        }
      }
      
      // Endless mode - gradual difficulty increase with variety
      if (newState.currentGameMode === 'endless') {
        const endlessMultiplier = 1 + (newState.gameTime / 60000); // Every minute
        if (Math.random() < 0.001 * endlessMultiplier && predators.length < 10) {
          const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['shark', 'barracuda', 'eel', 'dolphin'];
          const randomType = predatorTypes[Math.floor(Math.random() * predatorTypes.length)];
          
          // Generate patrol path
          const patrolPath: Position[] = [];
          for (let j = 0; j < 4; j++) {
            patrolPath.push({
              x: Math.random() * WORLD_WIDTH,
              y: Math.random() * WORLD_HEIGHT
            });
          }
          
          const newPredator: Predator = {
            id: `endless-predator-${Date.now()}-${Math.random()}`,
            position: {
              x: Math.random() < 0.5 ? -50 : WORLD_WIDTH + 50,
              y: Math.random() * WORLD_HEIGHT
            },
            velocity: { x: 0, y: 0 },
            type: randomType,
            active: true,
            size: randomType === 'shark' ? 60 : randomType === 'dolphin' ? 50 : randomType === 'eel' ? 55 : randomType === 'barracuda' ? 55 : 45,
            maxSpeed: (randomType === 'barracuda' ? 110 : 90) * endlessMultiplier,
            detectionRange: 200,
            investigateRange: 150,
            state: 'patrol',
            targetPosition: patrolPath[0],
            alertLevel: 0,
            stateTimer: 0,
            patrolPath: patrolPath,
            patrolIndex: 0,
            loseTargetTime: 5000
          };
          
          setPredators(prev => [...prev, newPredator]);
        }
      }

      // Speed run mode - time-based scoring bonus
      if (newState.currentGameMode === 'speed_run') {
        const timeBonus = Math.max(0, 100 - Math.floor(newState.gameTime / 1000));
        newState.score += timeBonus * 0.1; // Small continuous time bonus
      }

      // Challenge mode - MORE ENEMIES and objectives
      if (newState.currentGameMode === 'challenge') {
        const survivalSeconds = Math.floor(newState.gameTime / 1000);
        if (survivalSeconds >= 60 && !completedObjectives.includes('Survive for 60 seconds')) {
          setCompletedObjectives(prev => [...prev, 'Survive for 60 seconds']);
          createScorePopup(player.position, 'SURVIVAL MASTER!', '#00ff00');
        }
        
        // Spawn enemies to make challenges harder
        if (Math.random() < 0.002 && predators.length < 7) {
          const predatorTypes: Array<'shark' | 'barracuda' | 'eel' | 'dolphin'> = ['shark', 'barracuda', 'eel', 'dolphin'];
          const randomType = predatorTypes[Math.floor(Math.random() * predatorTypes.length)];
          
          // Generate patrol path
          const patrolPath: Position[] = [];
          for (let j = 0; j < 4; j++) {
            patrolPath.push({
              x: Math.random() * WORLD_WIDTH,
              y: Math.random() * WORLD_HEIGHT
            });
          }
          
          const newPredator: Predator = {
            id: `challenge-predator-${Date.now()}-${Math.random()}`,
            position: {
              x: Math.random() < 0.5 ? -50 : WORLD_WIDTH + 50,
              y: Math.random() * WORLD_HEIGHT
            },
            velocity: { x: 0, y: 0 },
            type: randomType,
            active: true,
            size: randomType === 'shark' ? 60 : randomType === 'dolphin' ? 50 : randomType === 'eel' ? 55 : randomType === 'barracuda' ? 55 : 45,
            maxSpeed: 100,
            detectionRange: 220,
            investigateRange: 160,
            state: 'patrol',
            targetPosition: patrolPath[0],
            alertLevel: 0,
            stateTimer: 0,
            patrolPath: patrolPath,
            patrolIndex: 0,
            loseTargetTime: 5000
          };
          
          setPredators(prev => [...prev, newPredator]);
        }
      }

      // Apply scoring multiplier
      if (modeConfig.settings.scoringMultiplier && modeConfig.settings.scoringMultiplier !== 1) {
        // This will be applied when score is actually earned
      }
      
      return newState;
    });

    setGameObjects(prev => prev.map(obj => {
      if (!obj.active) return obj;
      
      const dx = player.position.x - obj.position.x;
      const dy = player.position.y - obj.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < PLAYER_SIZE / 2 + 15) {
        triggerHaptic('light');
        
        // NEW: Handle special food effects
        const food = obj as EnhancedFood;
        if (food.specialEffect) {
          const effectResult = FoodManager.applyFoodEffect(food, player, gameState);
          setPlayer(effectResult.player);
          setGameState(effectResult.gameState);
          if (effectResult.message) {
            createScorePopup(food.position, effectResult.message, '#00ff00', true);
          }
          if (effectResult.particles) {
            createParticles(food.position, effectResult.particles.type as any, effectResult.particles.count, effectResult.particles.color);
          }
        }
        
        // Create enhanced collection particles
        const colors: Record<string, string> = {
          crab: '#ff6b35',
          shrimp: '#ff9999',
          clam: '#99ccff',
          pearl: '#ffffff',
          golden_fish: '#ffd700',
          mystery_box: '#ff00ff',
          combo_extender: '#00ff00',
          health_kelp: '#228b22',
          speed_plankton: '#00ffff'
        };
        
        // Main collection effect based on food type
        const baseColor = colors[obj.type] || '#ffffff';
        if (obj.type === 'pearl' || obj.type === 'golden_fish') {
          // Special collection effect for rare items
          createParticles(obj.position, 'glow', 12, baseColor);
          createParticles(obj.position, 'star', 6, '#ffff00');
          createParticles(obj.position, 'flash', 3, '#ffffff');
        } else if (obj.type === 'mystery_box') {
          // Mystery box special effect
          createParticles(obj.position, 'sparkle', 15, baseColor);
          createParticles(obj.position, 'glow', 10, baseColor);
          addScreenShake(8, 400);
        } else {
          // Regular food collection effect
          createParticles(obj.position, 'sparkle', 8, baseColor);
          createParticles(obj.position, 'glow', 4, baseColor);
          createParticles(obj.position, 'bubble', 6, '#87CEEB');
        }
        
        setGameState(prevState => {
          const newState = { ...prevState };
          if (obj.value && obj.value > 0) {
            const baseScore = obj.value * newState.combo;
            const modeConfig = GAME_MODES[newState.currentGameMode];
            const scoreGain = baseScore * (modeConfig.settings.scoringMultiplier || 1);
            newState.score += scoreGain;
            newState.combo = Math.min(5, newState.combo + 1);
            newState.comboTimer = 4000;
            newState.streak += 1;
            
            // Challenge mode objective tracking
            if (newState.currentGameMode === 'challenge') {
              // Check "Collect 100 food items" objective
              if (newState.streak >= 100 && !completedObjectives.includes('Collect 100 food items')) {
                setCompletedObjectives(prev => [...prev, 'Collect 100 food items']);
                createScorePopup(player.position, 'OBJECTIVE COMPLETE!', '#00ff00');
              }
              
              // Check "Reach combo x10" objective  
              if (newState.combo >= 10 && !completedObjectives.includes('Reach combo x10')) {
                setCompletedObjectives(prev => [...prev, 'Reach combo x10']);
                createScorePopup(player.position, 'COMBO MASTER!', '#00ff00');
              }
            }
            
            // Play collect sound with pitch based on combo
            audio.playSound('collect', Math.min(1.5, 1 + (newState.combo - 1) * 0.1));
            
            // Create score popup
            createScorePopup(
              obj.position, 
              `+${scoreGain}${newState.combo > 1 ? ` x${newState.combo}` : ''}`, 
              colors[obj.type as keyof typeof colors] || '#ffffff'
            );
            
            // Bonus effects for streaks
            if (newState.streak % 5 === 0) {
              createScorePopup(obj.position, `STREAK x${newState.streak}!`, '#ffff00');
              addScreenShake(5);
              // Play combo sound for streak bonus
              audio.playSound('combo');
            }
          } else if (obj.type === 'pearl') {
            newState.comboTimer += 3000;
            createScorePopup(obj.position, '+3s COMBO!', '#ffffff');
            // Play special sound for pearls
            audio.playSound('collect', 1.2);
          }
          return newState;
        });
        
        // Track food collection for social features
        setGameStats(prev => ({
          ...prev,
          totalFoodCollected: prev.totalFoodCollected + 1
        }));
        
        // Update bonus goal for food collection
        updateBonusGoal('collect_food', 1);
        
        // Puzzle Mode: Track food collection
        if (gameState.currentGameMode === 'puzzle' && currentPuzzle) {
          setPuzzleStats(prev => {
            const newStats = {
              ...prev,
              foodCollected: prev.foodCollected + 1,
              colorsCollected: new Set(prev.colorsCollected)
            };
            
            // Track color if it's a food item with color
            if (obj.type === 'red' || obj.type === 'blue' || obj.type === 'green' || obj.type === 'yellow') {
              newStats.colorsCollected.add(obj.type);
            }
            
            return newStats;
          });
          
          // Check if puzzle is complete
          checkPuzzleCompletion();
        }
        
        return { ...obj, active: false };
      }
      
      return obj;
    }));

    setSonarPulses(prev => prev.filter(pulse => {
      const elapsed = Date.now() - pulse.startTime;
      if (elapsed > 2000) return false;
      
      pulse.radius = (elapsed / 2000) * pulse.maxRadius;
      return true;
    }));

    // Update particles
    setParticles(prev => prev.filter(particle => {
      particle.life -= deltaTime;
      if (particle.life <= 0) return false;
      
      particle.position.x += particle.velocity.x * deltaTime / 1000;
      particle.position.y += particle.velocity.y * deltaTime / 1000;
      
      // Update rotation
      if (particle.rotationSpeed) {
        particle.rotation = (particle.rotation || 0) + particle.rotationSpeed * deltaTime / 1000;
      }
      
      // Update pulse phase for pulsing effects
      if (particle.pulsePhase !== undefined) {
        particle.pulsePhase += deltaTime / 300;
      }
      
      // Apply different physics based on particle type
      switch (particle.type) {
        case 'smoke':
          // Smoke rises slowly and disperses
          particle.velocity.y -= 30 * deltaTime / 1000;
          particle.velocity.x *= 0.98;
          particle.velocity.y *= 0.98;
          break;
        case 'wave':
          // Wave particles follow sine wave motion
          particle.position.y += Math.sin(particle.pulsePhase || 0) * 10 * deltaTime / 1000;
          particle.velocity.x *= 0.995;
          break;
        case 'electric':
          // Electric particles have erratic movement
          particle.velocity.x += (Math.random() - 0.5) * 200 * deltaTime / 1000;
          particle.velocity.y += (Math.random() - 0.5) * 200 * deltaTime / 1000;
          particle.velocity.x *= 0.95;
          particle.velocity.y *= 0.95;
          break;
        case 'glow':
          // Glow particles float gently
          particle.velocity.y -= 20 * deltaTime / 1000;
          particle.velocity.x *= 0.99;
          particle.velocity.y *= 0.99;
          break;
        default:
          // Apply standard gravity and drag
          particle.velocity.y += 50 * deltaTime / 1000;
          particle.velocity.x *= 0.99;
          particle.velocity.y *= 0.99;
          break;
      }
      
      return true;
    }));

    // Update transitions
    setTransitions(prev => prev.filter(transition => {
      const elapsed = Date.now() - transition.startTime;
      const progress = Math.min(1, elapsed / transition.duration);
      
      if (progress >= 1) {
        // Transition complete
        const finalValue = transition.endValue;
        transition.onUpdate?.(finalValue);
        transition.onComplete?.();
        return false; // Remove completed transition
      }
      
      // Calculate eased value
      const easingFunc = easingFunctions[transition.easing || 'ease-out'];
      const easedProgress = easingFunc(progress);
      const currentValue = transition.startValue + (transition.endValue - transition.startValue) * easedProgress;
      
      transition.onUpdate?.(currentValue);
      return true;
    }));

    // Update score popups
    setScorePopups(prev => prev.filter(popup => {
      const elapsed = Date.now() - popup.startTime;
      return elapsed < popup.duration;
    }));

    // Update power-ups
    setPowerUps(prev => prev.map(powerUp => {
      powerUp.duration -= deltaTime;
      return powerUp;
    }).filter(powerUp => powerUp.duration > 0));

    // Check power-up collisions
    setPowerUps(prev => prev.filter(powerUp => {
      const dx = player.position.x - powerUp.position.x;
      const dy = player.position.y - powerUp.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < PLAYER_SIZE / 2 + powerUp.size / 2) {
        triggerHaptic('medium');
        
        // NEW: Apply power-up effect using PowerUpManager
        const result = PowerUpManager.applyPowerUpEffect(powerUp.type, player, gameState);
        setPlayer(result.player);
        setGameState(result.gameState);
        
        // Enhanced power-up collection effects
        const config = PowerUpManager.getPowerUpConfig(powerUp.type);
        createParticles(powerUp.position, 'explosion', 12, config.color);
        createParticles(powerUp.position, 'star', 8, '#ffffff');
        createParticles(powerUp.position, 'glow', 15, config.color);
        createParticles(powerUp.position, 'flash', 4, '#ffffff');
        createScorePopup(powerUp.position, result.message, config.color, true);
        addScreenShake(8, 400);
        
        // Play power-up sound effect
        audio.playSound('powerup');
        
        // Track power-up usage for social features
        setGameStats(prev => ({
          ...prev,
          powerUpsUsed: prev.powerUpsUsed + 1
        }));
        
        // Update bonus goal for power-up collection
        updateBonusGoal('collect_powerups', 1);
        
        // NEW: Set timer to remove effect after duration
        if (config.effectDuration > 0) {
          setActivePowerUpEffects(prev => {
            const newMap = new Map(prev);
            newMap.set(powerUp.type, Date.now() + config.effectDuration);
            return newMap;
          });
          
          setTimeout(() => {
            const removeResult = PowerUpManager.removePowerUpEffect(powerUp.type, player, gameState);
            setPlayer(removeResult.player);
            setGameState(removeResult.gameState);
            setActivePowerUpEffects(prev => {
              const newMap = new Map(prev);
              newMap.delete(powerUp.type);
              return newMap;
            });
          }, config.effectDuration);
        }
        
        return false;
      }
      return true;
    }));

    // Update environmental effects
    setEnvironmentalEffects(prev => prev.map(effect => {
      const updatedEffect = { ...effect };
      updatedEffect.lifetime += deltaTime;
      
      // Move the effect based on its velocity
      updatedEffect.position.x += updatedEffect.velocity.x * deltaTime / 1000;
      updatedEffect.position.y += updatedEffect.velocity.y * deltaTime / 1000;
      
      // Keep effects within world bounds
      if (updatedEffect.position.x < 0 || updatedEffect.position.x > WORLD_WIDTH ||
          updatedEffect.position.y < 0 || updatedEffect.position.y > WORLD_HEIGHT) {
        updatedEffect.active = false;
      }
      
      // Apply effect-specific behavior
      switch (updatedEffect.type) {
        case 'current':
          // Ocean currents can affect the player if they're close enough
          const distanceToPlayer = Math.sqrt(
            Math.pow(player.position.x - updatedEffect.position.x, 2) +
            Math.pow(player.position.y - updatedEffect.position.y, 2)
          );
          if (distanceToPlayer < updatedEffect.size) {
            // Apply gentle force to player (would be implemented in player update)
            createParticles(
              { x: updatedEffect.position.x + Math.random() * 40 - 20, y: updatedEffect.position.y + Math.random() * 40 - 20 },
              'bubble',
              2,
              '#4682b4'
            );
          }
          break;
        case 'school_fish':
          // Fish schools change direction occasionally
          if (Math.random() < 0.01) {
            const newDirection = updatedEffect.direction! + (Math.random() - 0.5) * 0.5;
            updatedEffect.direction = newDirection;
            updatedEffect.velocity = {
              x: Math.cos(newDirection) * 60,
              y: Math.sin(newDirection) * 60
            };
          }
          break;
        case 'jellyfish_swarm':
          // Jellyfish drift and pulse
          updatedEffect.position.x += Math.sin(updatedEffect.lifetime * updatedEffect.frequency!) * updatedEffect.amplitude! * deltaTime / 1000;
          updatedEffect.position.y += Math.cos(updatedEffect.lifetime * updatedEffect.frequency!) * updatedEffect.amplitude! * deltaTime / 1000;
          break;
        case 'seaweed':
          // Seaweed sways gently
          const swayOffset = Math.sin(updatedEffect.lifetime * updatedEffect.frequency!) * updatedEffect.amplitude!;
          // This would be used in rendering for visual sway effect
          break;
        case 'thermal_vent':
          // Create rising bubble particles
          if (Math.random() < 0.1) {
            createParticles(
              { x: updatedEffect.position.x, y: updatedEffect.position.y },
              'bubble',
              3,
              '#ff6600'
            );
          }
          break;
      }
      
      return updatedEffect;
    }).filter(effect => effect.active && effect.lifetime < effect.maxLifetime));

    // Update weather effects
    setWeatherEffect(prev => {
      if (prev.duration > 0) {
        const updatedWeather = { ...prev };
        updatedWeather.duration -= deltaTime;
        
        // Add weather particles to main particle system
        if (updatedWeather.particles.length > 0) {
          setParticles(prevParticles => [...prevParticles, ...updatedWeather.particles.slice(0, 5)]);
          updatedWeather.particles = updatedWeather.particles.slice(5);
        }
        
        if (updatedWeather.duration <= 0) {
          setLightingIntensity(0.8); // Return to normal lighting
          return { type: 'calm', intensity: 0, duration: 0, particles: [] };
        }
        
        return updatedWeather;
      }
      return prev;
    });

    updateNextFoodPosition();
  }, [gameState.isPaused, gameState.isPlaying, gameState.playerEffects, joystickActive, joystickPosition, player, predators, hazards, powerUps, currentLevelConfig, levelProgress, updateNextFoodPosition, environmentalEffects, weatherEffect, createEnvironmentalEffect, createWeatherEffect, getActiveSkillEffects]);

  const draw = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
      });
      if (!canvas || !ctx) {
        console.warn('Canvas or context not available');
        return;
      }
      
      // Mobile optimization: reduce quality for better performance
      if (isMobile) {
        ctx.imageSmoothingEnabled = false;
      }

      // Safety check - ensure we have valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        console.warn('Canvas has invalid dimensions');
        return;
      }

      // Clear the entire canvas first to prevent residual rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reset transform to identity before starting
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // If game isn't playing, just show a blank ocean background
      if (!gameState.isPlaying && !gameState.showResults) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(0.5, '#001122');
        gradient.addColorStop(1, '#000611');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Apply camera transform and screen shake
      ctx.save();
    
    // Apply screen shake first
    let shakeX = 0, shakeY = 0;
    if (gameState.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * gameState.screenShake;
      shakeY = (Math.random() - 0.5) * gameState.screenShake;
    }
    
    // Apply camera transform (translate world to show correct view)
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    const biomeColors = currentLevelConfig ? 
      LevelManager.getBiomeColors(currentLevelConfig.biome) : 
      { background: '#001122', accent: '#003366', particles: '#66ccff' };
    
    // Use customized environment colors
    const envCustomization = customization.environment;
    const backgroundColor = envCustomization.backgroundColor || biomeColors.background;
    
    // Create ocean depth gradient background with customization
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    if (envCustomization.backgroundGradient && envCustomization.backgroundGradient.length > 1) {
      envCustomization.backgroundGradient.forEach((color, index) => {
        gradient.addColorStop(index / (envCustomization.backgroundGradient!.length - 1), color);
      });
    } else {
      gradient.addColorStop(0, '#001a33');
      gradient.addColorStop(0.5, backgroundColor);
      gradient.addColorStop(1, '#000611');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Enhanced dynamic god rays with varying sizes and colors (reduced on mobile)
    const rayCount = isLowPerformance ? 4 : 8;
    for (let i = 0; i < rayCount; i++) {
      const x = (WORLD_WIDTH / (rayCount + 1)) * (i + 1) + Math.sin(gameState.gameTime / 2000 + i) * 30;
      const rayWidth = 30 + Math.sin(gameState.gameTime / 4000 + i) * 20;
      const rayGradient = ctx.createLinearGradient(x - rayWidth, 0, x + rayWidth, 0);
      const baseIntensity = lightingIntensity * (0.15 + Math.sin(gameState.gameTime / 3000 + i) * 0.05);
      
      // Simplified color on mobile devices
      if (isLowPerformance) {
        const color = `rgba(100, 150, 200, ${baseIntensity})`;
        rayGradient.addColorStop(0, 'rgba(100, 150, 200, 0)');
        rayGradient.addColorStop(0.5, color);
        rayGradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
      } else {
        // Add color variation to rays
        const hue = 190 + Math.sin(gameState.gameTime / 5000 + i) * 30; // Blue-green spectrum
        const color = `hsla(${hue}, 70%, 70%, ${baseIntensity})`;
        
        rayGradient.addColorStop(0, `hsla(${hue}, 70%, 70%, 0)`);
        rayGradient.addColorStop(0.5, color);
        rayGradient.addColorStop(1, `hsla(${hue}, 70%, 70%, 0)`);
      }
      
      ctx.fillStyle = rayGradient;
      ctx.fillRect(x - rayWidth, 0, rayWidth * 2, WORLD_HEIGHT);
      
      // Add sparkles in the rays (reduced frequency on mobile)
      const sparkleChance = isLowPerformance ? 0.1 : 0.3;
      if (Math.random() < sparkleChance) {
        const sparkleX = x + (Math.random() - 0.5) * rayWidth;
        const sparkleY = Math.random() * WORLD_HEIGHT * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Add floating particles with movement (reduced count on mobile)
    ctx.fillStyle = biomeColors.particles;
    const particleCount = isLowPerformance ? 20 : 50;
    for (let i = 0; i < particleCount; i++) {
      const x = (i * 24 + Math.sin(gameState.gameTime / 1000 + i * 0.5) * 15) % WORLD_WIDTH;
      const y = (i * 18 + Math.cos(gameState.gameTime / 1500 + i * 0.3) * 10) % WORLD_HEIGHT;
      ctx.globalAlpha = 0.3 + Math.sin(gameState.gameTime / 800 + i) * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Add kelp and coral background elements
    for (let i = 0; i < 12; i++) {
      const x = (WORLD_WIDTH / 13) * (i + 1);
      const height = 80 + Math.sin(gameState.gameTime / 3000 + i) * 20;
      
      // Kelp strands
      ctx.strokeStyle = '#1a4d3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, WORLD_HEIGHT);
      for (let j = 0; j < height; j += 10) {
        const waveX = x + Math.sin((gameState.gameTime / 2000) + (j * 0.1)) * 8;
        ctx.lineTo(waveX, WORLD_HEIGHT - j);
      }
      ctx.stroke();
    }

    // Draw environmental effects
    environmentalEffects.forEach(effect => {
      if (!effect.active) return;
      
      ctx.save();
      ctx.translate(effect.position.x, effect.position.y);
      
      switch (effect.type) {
        case 'current':
          // Draw water current with animated flow lines
          ctx.strokeStyle = `rgba(70, 130, 180, ${0.6 * effect.strength})`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 8; i++) {
            const offset = (gameState.gameTime / 100 + i * 10) % 40 - 20;
            ctx.beginPath();
            ctx.moveTo(-effect.size/2, -effect.size/2 + i * (effect.size/8));
            ctx.lineTo(-effect.size/2 + offset, -effect.size/2 + i * (effect.size/8));
            ctx.stroke();
          }
          break;
        case 'debris':
          // Draw floating debris
          ctx.fillStyle = '#8B4513';
          ctx.rotate(effect.lifetime * 0.001);
          ctx.fillRect(-effect.size/4, -effect.size/4, effect.size/2, effect.size/2);
          ctx.fillStyle = '#654321';
          ctx.fillRect(-effect.size/6, -effect.size/6, effect.size/3, effect.size/3);
          break;
        case 'school_fish':
          // Draw school of small fish
          ctx.fillStyle = '#C0C0C0';
          for (let i = 0; i < 12; i++) {
            const fishAngle = effect.direction! + (Math.random() - 0.5) * 0.5;
            const fishX = (i % 4) * 15 - 22.5 + Math.sin(gameState.gameTime / 200 + i) * 5;
            const fishY = Math.floor(i / 4) * 10 - 15 + Math.cos(gameState.gameTime / 300 + i) * 3;
            
            ctx.save();
            ctx.translate(fishX, fishY);
            ctx.rotate(fishAngle);
            
            // Fish body
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 3, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Fish tail
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(-10, -2);
            ctx.lineTo(-10, 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
          break;
        case 'jellyfish_swarm':
          // Draw jellyfish swarm
          ctx.globalAlpha = 0.7;
          for (let i = 0; i < 6; i++) {
            const jellyfishX = (i % 3) * 20 - 20 + Math.sin(gameState.gameTime / 400 + i) * 8;
            const jellyfishY = Math.floor(i / 3) * 15 - 7.5 + Math.cos(gameState.gameTime / 500 + i) * 6;
            
            ctx.save();
            ctx.translate(jellyfishX, jellyfishY);
            
            // Jellyfish bell
            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI);
            ctx.fill();
            
            // Tentacles
            ctx.strokeStyle = '#FF69B4';
            ctx.lineWidth = 1;
            for (let j = 0; j < 4; j++) {
              ctx.beginPath();
              ctx.moveTo(-6 + j * 4, 8);
              for (let k = 1; k < 4; k++) {
                const tentacleY = 8 + k * 6;
                const tentacleX = -6 + j * 4 + Math.sin(gameState.gameTime / 200 + i + j + k) * 3;
                ctx.lineTo(tentacleX, tentacleY);
              }
              ctx.stroke();
            }
            
            ctx.restore();
          }
          break;
        case 'seaweed':
          // Draw animated seaweed
          const swayOffset = Math.sin(effect.lifetime * effect.frequency!) * effect.amplitude!;
          ctx.strokeStyle = '#228B22';
          ctx.lineWidth = 4;
          
          for (let strand = 0; strand < 3; strand++) {
            ctx.beginPath();
            ctx.moveTo(-15 + strand * 15, effect.size/2);
            
            for (let segment = 0; segment < effect.size/10; segment++) {
              const segmentY = effect.size/2 - segment * 10;
              const segmentX = -15 + strand * 15 + Math.sin(gameState.gameTime / 1000 + segment * 0.2 + strand) * (swayOffset * 0.1);
              ctx.lineTo(segmentX, segmentY);
            }
            ctx.stroke();
          }
          break;
        case 'thermal_vent':
          // Draw thermal vent with heat distortion effect
          ctx.fillStyle = '#8B0000';
          ctx.beginPath();
          ctx.ellipse(0, effect.size/2, effect.size/3, effect.size/6, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Heat waves
          ctx.strokeStyle = `rgba(255, 69, 0, 0.6)`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-10 + i * 5, effect.size/2);
            for (let j = 1; j < 8; j++) {
              const waveY = effect.size/2 - j * 8;
              const waveX = -10 + i * 5 + Math.sin(gameState.gameTime / 100 + i + j) * 4;
              ctx.lineTo(waveX, waveY);
            }
            ctx.stroke();
          }
          break;
        case 'whale':
          // Draw whale
          ctx.fillStyle = '#4169E1';
          ctx.globalAlpha = 0.8;
          const whalePhase = (effect.animationPhase || 0) + gameState.gameTime / 2000;
          const whaleTailMove = Math.sin(whalePhase) * 10;
          
          // Whale body
          ctx.beginPath();
          ctx.ellipse(0, 0, effect.size/2, effect.size/4, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Whale tail
          ctx.beginPath();
          ctx.moveTo(-effect.size/2, whaleTailMove);
          ctx.lineTo(-effect.size/2 - 30, whaleTailMove - 20);
          ctx.lineTo(-effect.size/2 - 30, whaleTailMove + 20);
          ctx.closePath();
          ctx.fill();
          
          // Eye
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(effect.size/4, -effect.size/8, 4, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'turtle':
          // Draw sea turtle
          ctx.fillStyle = '#2F4F2F';
          const turtlePhase = (effect.animationPhase || 0) + gameState.gameTime / 1500;
          const flipperMove = Math.sin(turtlePhase) * 8;
          
          // Shell
          ctx.beginPath();
          ctx.ellipse(0, 0, effect.size/2, effect.size/3, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Shell pattern
          ctx.strokeStyle = '#556B2F';
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, effect.size/6 + i * 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
          
          // Flippers
          ctx.fillStyle = '#3CB371';
          ctx.beginPath();
          ctx.ellipse(-effect.size/3, flipperMove, effect.size/6, effect.size/10, -0.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(effect.size/3, -flipperMove, effect.size/6, effect.size/10, 0.5, 0, 2 * Math.PI);
          ctx.fill();
          
          // Head
          ctx.fillStyle = '#2F4F2F';
          ctx.beginPath();
          ctx.arc(effect.size/2, 0, effect.size/6, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'manta_ray':
          // Draw manta ray
          ctx.fillStyle = '#696969';
          const rayPhase = (effect.animationPhase || 0) + gameState.gameTime / 1000;
          const wingFlap = Math.sin(rayPhase) * 15;
          
          // Body
          ctx.beginPath();
          ctx.ellipse(0, 0, effect.size/4, effect.size/6, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Wings
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-effect.size/2, wingFlap, -effect.size, 0);
          ctx.quadraticCurveTo(-effect.size/2, -wingFlap/2, 0, 0);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(effect.size/2, -wingFlap, effect.size, 0);
          ctx.quadraticCurveTo(effect.size/2, wingFlap/2, 0, 0);
          ctx.fill();
          
          // Tail
          ctx.strokeStyle = '#696969';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-effect.size/4, effect.size/2);
          ctx.stroke();
          break;
        case 'dolphin_pod':
          // Draw dolphin pod (3 dolphins)
          ctx.fillStyle = '#87CEEB';
          for (let d = 0; d < 3; d++) {
            ctx.save();
            const dolphinPhase = (effect.animationPhase || 0) + gameState.gameTime / 1200 + d;
            const jumpY = Math.sin(dolphinPhase) * 20;
            ctx.translate(d * 30 - 30, jumpY);
            
            // Dolphin body
            ctx.beginPath();
            ctx.ellipse(0, 0, effect.size/3, effect.size/6, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Dorsal fin
            ctx.beginPath();
            ctx.moveTo(0, -effect.size/6);
            ctx.lineTo(-5, -effect.size/4);
            ctx.lineTo(5, -effect.size/6);
            ctx.closePath();
            ctx.fill();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(-effect.size/3, 0);
            ctx.lineTo(-effect.size/2, -8);
            ctx.lineTo(-effect.size/2, 8);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
          break;
        case 'coral':
          // Draw coral
          ctx.fillStyle = '#FF6347';
          ctx.globalAlpha = 0.9;
          for (let branch = 0; branch < 5; branch++) {
            const branchAngle = (branch / 5) * Math.PI * 2;
            ctx.save();
            ctx.rotate(branchAngle);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 1; i < 6; i++) {
              const branchX = Math.sin(i * 0.3) * 10;
              const branchY = -i * (effect.size / 10);
              ctx.lineTo(branchX, branchY);
            }
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#FF6347';
            ctx.stroke();
            
            ctx.restore();
          }
          break;
        case 'anemone':
          // Draw sea anemone
          const anemonePhase = (effect.animationPhase || 0) + gameState.gameTime / 2000;
          ctx.globalAlpha = 0.8;
          
          // Tentacles
          for (let t = 0; t < 12; t++) {
            const tentacleAngle = (t / 12) * Math.PI * 2;
            const tentacleWave = Math.sin(anemonePhase + t * 0.5) * 10;
            
            ctx.save();
            ctx.rotate(tentacleAngle);
            
            ctx.strokeStyle = '#FF1493';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(tentacleWave, -effect.size/3, tentacleWave * 1.5, -effect.size/2);
            ctx.stroke();
            
            // Tip
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.arc(tentacleWave * 1.5, -effect.size/2, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.restore();
          }
          break;
        case 'starfish':
          // Draw starfish
          ctx.fillStyle = '#FFA500';
          ctx.globalAlpha = 0.9;
          
          ctx.beginPath();
          for (let arm = 0; arm < 5; arm++) {
            const angle = (arm / 5) * Math.PI * 2 - Math.PI / 2;
            const outerX = Math.cos(angle) * effect.size/2;
            const outerY = Math.sin(angle) * effect.size/2;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * effect.size/4;
            const innerY = Math.sin(innerAngle) * effect.size/4;
            
            if (arm === 0) {
              ctx.moveTo(outerX, outerY);
            } else {
              ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.fill();
          
          // Center
          ctx.fillStyle = '#FF8C00';
          ctx.beginPath();
          ctx.arc(0, 0, effect.size/8, 0, 2 * Math.PI);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });

    if (currentLevelConfig) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#00ff00';
      if (!levelProgress.checkpointReached) {
        ctx.beginPath();
        ctx.arc(currentLevelConfig.checkpointPosition.x, currentLevelConfig.checkpointPosition.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CP', currentLevelConfig.checkpointPosition.x, currentLevelConfig.checkpointPosition.y + 4);
      }
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(currentLevelConfig.endGatePosition.x, currentLevelConfig.endGatePosition.y, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', currentLevelConfig.endGatePosition.x, currentLevelConfig.endGatePosition.y + 4);
      ctx.restore();
    }

    if (nextFoodPosition && gameObjects.some(obj => obj.active)) {
      ctx.save();
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(player.position.x, player.position.y);
      ctx.lineTo(nextFoodPosition.x, nextFoodPosition.y);
      ctx.stroke();
      ctx.restore();
    }

    gameObjects.forEach(obj => {
      if (!obj.active) return;
      
      // Draw object shadow first
      ctx.save();
      ctx.translate(obj.position.x + 2, obj.position.y + 3); // Shadow offset
      ctx.scale(1, 0.5); // Flatten shadow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, obj.size / 2, obj.size / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      ctx.translate(obj.position.x, obj.position.y);
      
      switch (obj.type) {
        case 'crab':
          // Draw detailed crab
          ctx.fillStyle = '#ff6b35';
          ctx.fillRect(-8, -6, 16, 10);
          ctx.fillStyle = '#ff4500';
          // Claws
          ctx.fillRect(-12, -4, 6, 3);
          ctx.fillRect(6, -4, 6, 3);
          // Eyes
          ctx.fillStyle = '#000';
          ctx.fillRect(-4, -8, 2, 3);
          ctx.fillRect(2, -8, 2, 3);
          break;
        case 'shrimp':
          // Draw curved shrimp
          ctx.fillStyle = '#ff9999';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ff6666';
          ctx.lineWidth = 1;
          // Tail segments
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-6 - i * 3, 2, 2, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        case 'clam':
          // Draw clam shell
          ctx.fillStyle = '#4a5568';
          ctx.beginPath();
          ctx.arc(0, -2, 9, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = '#99ccff';
          ctx.beginPath();
          ctx.arc(0, 2, 9, Math.PI, 2 * Math.PI);
          ctx.fill();
          // Pearl hint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(2, 0, 2, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'pearl':
          // Draw glowing pearl
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.7, '#f0f8ff');
          gradient.addColorStop(1, 'rgba(240, 248, 255, 0.3)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, 2 * Math.PI);
          ctx.fill();
          // Sparkle effect
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.stroke();
          break;
        default:
          ctx.fillStyle = '#666666';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, 2 * Math.PI);
          ctx.fill();
      }
      
      ctx.restore();
    });

    hazards.forEach(hazard => {
      if (!hazard.active) return;
      
      ctx.save();
      ctx.translate(hazard.position.x, hazard.position.y);
      
      switch (hazard.hazardType) {
        case 'net':
          ctx.strokeStyle = '#8b4513';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < hazard.size; i += 12) {
            ctx.moveTo(-hazard.size/2 + i, -hazard.size/2);
            ctx.lineTo(-hazard.size/2 + i, hazard.size/2);
            ctx.moveTo(-hazard.size/2, -hazard.size/2 + i);
            ctx.lineTo(hazard.size/2, -hazard.size/2 + i);
          }
          ctx.stroke();
          // Add floating effect
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'jellyfish': {
          // Draw jellyfish body
          ctx.fillStyle = '#ff99cc';
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(0, -5, hazard.size/2, 0, Math.PI);
          ctx.fill();
          // Draw tentacles
          ctx.strokeStyle = '#ff66aa';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          for (let i = 0; i < 6; i++) {
            const x = -hazard.size/3 + (i * hazard.size/8);
            ctx.beginPath();
            ctx.moveTo(x, 5);
            for (let j = 0; j < 4; j++) {
              const y = 5 + j * 8 + Math.sin(gameState.gameTime / 500 + i + j) * 3;
              ctx.lineTo(x + Math.sin(gameState.gameTime / 300 + i + j) * 4, y);
            }
            ctx.stroke();
          }
          break;
        }
        case 'urchin':
          // Draw urchin body
          ctx.fillStyle = '#2d1b4e';
          ctx.beginPath();
          ctx.arc(0, 0, hazard.size/3, 0, 2 * Math.PI);
          ctx.fill();
          // Draw spines
          ctx.strokeStyle = '#1a0d2e';
          ctx.lineWidth = 2;
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * hazard.size/3, Math.sin(angle) * hazard.size/3);
            ctx.lineTo(Math.cos(angle) * hazard.size/2, Math.sin(angle) * hazard.size/2);
          }
          ctx.stroke();
          break;
        case 'current': {
          // Draw water current with moving particles
          ctx.strokeStyle = '#4fa8d8';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.4;
          for (let i = 0; i < 5; i++) {
            const offset = (gameState.gameTime / 200 + i * 20) % 40 - 20;
            ctx.beginPath();
            ctx.moveTo(-hazard.size/2, -10 + i * 5);
            ctx.lineTo(-hazard.size/2 + offset, -10 + i * 5);
            ctx.lineTo(hazard.size/2, -10 + i * 5);
          }
          ctx.stroke();
          break;
        }
        case 'floodlight':
          // Draw light cone
          ctx.fillStyle = '#ffff99';
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(0, 0, hazard.size/2, -Math.PI/4, Math.PI/4);
          ctx.lineTo(0, 0);
          ctx.fill();
          // Draw light source
          ctx.fillStyle = '#ffff00';
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(0, -hazard.size/3, 8, 0, 2 * Math.PI);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });

    predators.forEach(predator => {
      if (!predator.active) return;
      
      ctx.save();
      ctx.translate(predator.position.x, predator.position.y);
      
      const angle = Math.atan2(predator.velocity.y, predator.velocity.x);
      ctx.rotate(angle);
      
      switch (predator.type) {
        case 'moray':
          // Draw moray eel with segmented body
          const morayColor = predator.state === 'chase' ? '#cc2222' : '#557755';
          ctx.fillStyle = morayColor;
          // Main body
          ctx.beginPath();
          ctx.ellipse(0, 0, predator.size/2, predator.size/4, 0, 0, 2 * Math.PI);
          ctx.fill();
          // Head
          ctx.fillStyle = predator.state === 'chase' ? '#aa1111' : '#446644';
          ctx.beginPath();
          ctx.ellipse(predator.size/3, 0, predator.size/4, predator.size/6, 0, 0, 2 * Math.PI);
          ctx.fill();
          // Eyes
          ctx.fillStyle = predator.state === 'chase' ? '#ffff00' : '#ffffff';
          ctx.beginPath();
          ctx.arc(predator.size/2 - 8, -4, 3, 0, 2 * Math.PI);
          ctx.arc(predator.size/2 - 8, 4, 3, 0, 2 * Math.PI);
          ctx.fill();
          // Teeth
          if (predator.state === 'chase') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(predator.size/2 - 4, -2, 3, 1);
            ctx.fillRect(predator.size/2 - 4, 1, 3, 1);
          }
          break;
        case 'shark':
          // Draw detailed shark
          ctx.fillStyle = predator.state === 'chase' ? '#555' : '#777';
          ctx.beginPath();
          ctx.moveTo(predator.size/2, 0);
          ctx.lineTo(-predator.size/2, -predator.size/4);
          ctx.lineTo(-predator.size/3, 0);
          ctx.lineTo(-predator.size/2, predator.size/4);
          ctx.closePath();
          ctx.fill();
          // Dorsal fin
          ctx.fillStyle = predator.state === 'chase' ? '#444' : '#666';
          ctx.beginPath();
          ctx.moveTo(0, -predator.size/4);
          ctx.lineTo(-predator.size/4, -predator.size/2);
          ctx.lineTo(predator.size/6, -predator.size/4);
          ctx.closePath();
          ctx.fill();
          // Eye
          ctx.fillStyle = predator.state === 'chase' ? '#ff0000' : '#000000';
          ctx.beginPath();
          ctx.arc(predator.size/4, -predator.size/8, 4, 0, 2 * Math.PI);
          ctx.fill();
          // Gills
          ctx.strokeStyle = predator.state === 'chase' ? '#333' : '#555';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-predator.size/6 + i * 4, -predator.size/6);
            ctx.lineTo(-predator.size/6 + i * 4, predator.size/6);
            ctx.stroke();
          }
          break;
        case 'dolphin':
          // Draw detailed dolphin
          ctx.fillStyle = predator.state === 'chase' ? '#4455cc' : '#6699ff';
          // Body
          ctx.beginPath();
          ctx.ellipse(0, 0, predator.size/2, predator.size/4, 0, 0, 2 * Math.PI);
          ctx.fill();
          // Rostrum (beak)
          ctx.fillStyle = predator.state === 'chase' ? '#3344bb' : '#5588ee';
          ctx.beginPath();
          ctx.ellipse(predator.size/3, 0, predator.size/6, predator.size/8, 0, 0, 2 * Math.PI);
          ctx.fill();
          // Dorsal fin
          ctx.fillStyle = predator.state === 'chase' ? '#3344aa' : '#4477dd';
          ctx.beginPath();
          ctx.arc(0, -predator.size/4, predator.size/8, 0, Math.PI);
          ctx.fill();
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(predator.size/4, -predator.size/8, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(predator.size/4, -predator.size/8, 2, 0, 2 * Math.PI);
          ctx.fill();
          break;
      }
      
      if (predator.state !== 'patrol') {
        ctx.strokeStyle = predator.state === 'chase' ? '#ff0000' : '#ffaa00';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, predator.detectionRange, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    });

    sonarPulses.forEach(pulse => {
      ctx.save();
      ctx.globalAlpha = 0.3 * (1 - pulse.radius / pulse.maxRadius);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pulse.position.x, pulse.position.y, pulse.radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.translate(particle.position.x, particle.position.y);
      
      // Apply rotation if specified
      if (particle.rotation) {
        ctx.rotate(particle.rotation);
      }
      
      switch (particle.type) {
        case 'bubble':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'sparkle':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.moveTo(-particle.size, 0);
          ctx.lineTo(particle.size, 0);
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(0, particle.size);
          ctx.lineWidth = 2;
          ctx.strokeStyle = particle.color;
          ctx.stroke();
          break;
        case 'explosion': {
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'trail':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size * 0.8, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'splash':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'glow': {
          const pulseSize = particle.size * (1 + Math.sin(particle.pulsePhase || 0) * 0.2);
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
          const alpha = (particle.intensity || 1) * (particle.life / particle.maxLife);
          const color = particle.color.replace(/rgb\(([^)]+)\)/, (match, p1) => {
            return `rgba(${p1}, ${alpha})`;
          });
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.7, color.replace(/[\d.]+\)$/, '0.3)'));
          gradient.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, pulseSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'star': {
          ctx.fillStyle = particle.color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          const spikes = 5;
          const outerRadius = particle.size;
          const innerRadius = particle.size * 0.4;
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case 'wave': {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size * 0.5;
          ctx.lineCap = 'round';
          const waveLength = particle.size * 2;
          ctx.beginPath();
          for (let x = -waveLength; x <= waveLength; x += 2) {
            const y = Math.sin((x + (particle.pulsePhase || 0) * 10) / 8) * particle.size * 0.5;
            if (x === -waveLength) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
        }
        case 'flash': {
          const flashIntensity = (particle.intensity || 1.5) * (particle.life / particle.maxLife);
          ctx.globalAlpha *= flashIntensity;
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, particle.color);
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'smoke': {
          const smokeAlpha = (particle.life / particle.maxLife) * 0.6;
          ctx.globalAlpha *= smokeAlpha;
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'rgba(100,100,100,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'electric': {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          // Draw electric arc
          const segments = 6;
          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const progress = i / segments;
            const baseX = (progress - 0.5) * particle.size * 2;
            const baseY = 0;
            const offsetX = (Math.random() - 0.5) * particle.size * 0.5;
            const offsetY = (Math.random() - 0.5) * particle.size * 0.5;
            const x = baseX + offsetX;
            const y = baseY + offsetY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
        }
      }
      
      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      if (!powerUp.active) return;
      
      ctx.save();
      ctx.translate(powerUp.position.x, powerUp.position.y);
      ctx.rotate(gameState.gameTime / 1000 * powerUp.rotationSpeed);
      
      // Pulsing glow effect
      const pulseIntensity = 0.8 + Math.sin(gameState.gameTime / 300) * 0.2;
      ctx.globalAlpha = pulseIntensity;
      
      // Get color from PowerUpManager for all 10 types
      const config = PowerUpManager.getPowerUpConfig(powerUp.type);
      if (!config || !config.color) {
        console.warn(`Unknown power-up type: ${powerUp.type}`);
        ctx.restore();
        return;
      }
      const powerUpColor = config.color;
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.size + 8);
      glowGradient.addColorStop(0, powerUpColor);
      glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, powerUp.size + 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Main power-up
      ctx.globalAlpha = 1;
      ctx.fillStyle = powerUpColor;
      ctx.beginPath();
      ctx.moveTo(0, -powerUp.size);
      for (let i = 1; i <= 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? powerUp.size : powerUp.size * 0.6;
        ctx.lineTo(Math.sin(angle) * radius, -Math.cos(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icon - use icon from config
      ctx.fillStyle = '#000000';
      ctx.font = `${powerUp.size/2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.icon, 0, 0);
      
      ctx.restore();
    });

    if (player.inkCloudActive) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, 60, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Draw invulnerability effect
    if (player.invulnerable) {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.02); // Flashing effect
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, PLAYER_SIZE / 2 + 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Draw octopus shadow first
    ctx.save();
    ctx.translate(player.position.x + 3, player.position.y + 5); // Offset shadow
    ctx.scale(1, 0.6); // Flatten shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw invulnerability shield if active
    if (player.invulnerable) {
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      
      // Pulsing shield effect
      const shieldPulse = 0.7 + Math.sin(gameState.gameTime / 100) * 0.3;
      ctx.globalAlpha = shieldPulse * 0.5;
      
      // Outer shield glow
      const shieldGradient = ctx.createRadialGradient(0, 0, PLAYER_SIZE / 2, 0, 0, PLAYER_SIZE);
      shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
      shieldGradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.2)');
      shieldGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = shieldGradient;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_SIZE, 0, 2 * Math.PI);
      ctx.fill();
      
      // Shield ring
      ctx.globalAlpha = shieldPulse;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_SIZE * 0.8, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw customized octopus using the renderer
    OctopusRenderer.drawCustomizedOctopus(
      {
        ctx,
        position: player.position,
        size: PLAYER_SIZE,
        rotation: player.rotation,
        alpha: player.isDashing ? 0.8 : 1.0,
      },
      customization.octopus,
      gameState.gameTime
    );

    // Draw trail effects if enabled
    if (customization.octopus.trailEffect !== 'none') {
      OctopusRenderer.drawTrailEffect(
        ctx,
        player.position,
        customization.octopus.trailEffect,
        particles.filter(p => p.type === customization.octopus.trailEffect)
      );
    }

    // Draw dash trail effect
    if (player.isDashing) {
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      ctx.rotate(player.rotation);
      ctx.strokeStyle = customization.octopus.glowEffect ? customization.octopus.bodyColor : '#ff44ff';
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(-PLAYER_SIZE, 0);
      ctx.lineTo(-PLAYER_SIZE * 1.5, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Mobile joystick controls - show on mobile devices or touch-enabled devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile || isTouchDevice) {
      // Reset transforms for UI elements (joystick should be fixed to screen)
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity matrix

      // Show large touch area indicator - much bigger for better visibility
      ctx.globalAlpha = joystickActive ? 0.4 : 0.2;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(80, GAME_HEIGHT - 80, 150, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add visual guide text
      if (!joystickActive) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TAP HERE', 80, GAME_HEIGHT - 120);
        ctx.font = '12px Arial';
        ctx.fillText('TO MOVE', 80, GAME_HEIGHT - 105);
      }

      // Always show joystick for better visibility
      const joystickX = 80;
      const joystickY = GAME_HEIGHT - 80;
      
      ctx.save();
      ctx.globalAlpha = joystickActive ? 0.9 : 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(joystickX, joystickY, JOYSTICK_SIZE / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Inner circle
      ctx.globalAlpha = joystickActive ? 0.7 : 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(joystickX, joystickY, JOYSTICK_SIZE / 2 - 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Joystick knob
      ctx.globalAlpha = 1;
      ctx.fillStyle = joystickActive ? '#00ff00' : '#dddddd';
      ctx.beginPath();
      ctx.arc(joystickX + joystickPosition.x, joystickY + joystickPosition.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add "MOVE" text when not active
      if (!joystickActive) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MOVE', joystickX, joystickY + 4);
      }

      ctx.restore(); // End joystick rendering
      ctx.restore(); // End UI transform
    }

    // Draw edge warning indicators if octopus is near world bounds
    const warningMargin = PLAYER_SIZE * 3;
    
    // Check if octopus is near world edges and draw warning
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    if (player.position.x < warningMargin) {
      // Left edge warning
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, GAME_HEIGHT);
      ctx.stroke();
    }
    if (player.position.x > WORLD_WIDTH - warningMargin) {
      // Right edge warning  
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH, 0);
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
      ctx.stroke();
    }
    if (player.position.y < warningMargin) {
      // Top edge warning
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(GAME_WIDTH, 0);
      ctx.stroke();
    }
    if (player.position.y > WORLD_HEIGHT - warningMargin) {
      // Bottom edge warning
      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT);
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
      ctx.stroke();
    }
    
    ctx.restore();

    // Draw score popups (need camera transform for world positioning)
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    scorePopups.forEach(popup => {
      const elapsed = Date.now() - popup.startTime;
      const progress = elapsed / popup.duration;
      
      if (progress < 1) {
        ctx.save();
        
        // Enhanced scaling effect - start big, shrink, then grow slightly
        const scale = progress < 0.2 ? 1 + (1 - progress * 5) * 0.5 : 1 - progress * 0.2;
        
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 2));
        ctx.translate(popup.position.x, popup.position.y - progress * 60);
        ctx.scale(scale, scale);
        
        // Add glow effect for special popups
        if (popup.text.includes('COMBO') || popup.text.includes('STREAK') || popup.text.includes('MASTER')) {
          ctx.shadowColor = popup.color;
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Dynamic font size based on importance
        let fontSize = 16;
        if (popup.text.includes('MASTER') || popup.text.includes('COMPLETE')) fontSize = 20;
        else if (popup.text.includes('COMBO') || popup.text.includes('STREAK')) fontSize = 18;
        
        ctx.fillStyle = popup.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outline
        ctx.strokeText(popup.text, 0, 0);
        // Fill
        ctx.fillText(popup.text, 0, 0);
        
        ctx.restore();
      }
    });
    
    ctx.restore(); // End camera transform for score popups

    // Add weather overlay effects
    if (weatherEffect.type !== 'calm' && weatherEffect.duration > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 * weatherEffect.intensity;
      
      if (weatherEffect.type === 'storm') {
        // Storm overlay - darker, more chaotic
        const stormGradient = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, 0, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH);
        stormGradient.addColorStop(0, 'rgba(25, 25, 112, 0.3)');
        stormGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = stormGradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      } else if (weatherEffect.type === 'turbulent') {
        // Turbulent overlay - blue-green with movement
        ctx.fillStyle = `rgba(0, 100, 100, ${0.2 * weatherEffect.intensity})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }
      
      ctx.restore();
    }
    } catch (error) {
      console.error('Draw error:', error);
      // Continue game loop even if draw fails
    }
  }, [gameObjects, predators, hazards, sonarPulses, particles, scorePopups, powerUps, player, joystickActive, joystickPosition, currentLevelConfig, levelProgress, nextFoodPosition, camera, environmentalEffects, weatherEffect, lightingIntensity, gameState.gameTime, gameState.isPlaying, gameState.showResults, isLowPerformance, gameState.screenShake]);

  useEffect(() => {
    let lastTime = Date.now();
    let frameCount = 0;
    const targetFPS = isLowPerformance ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        frameCount++;
        
        updateGame(deltaTime);
        
        if (!isLowPerformance || frameCount % 2 === 0) {
          draw();
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    if (gameState.isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, updateGame, draw, isLowPerformance]);

  const nextLevel = () => {
    const nextLevelId = levelProgress.currentLevel + 1;
    let levelConfig = LevelManager.getLevel(nextLevelId);
    
    // Endless mode - generate infinite levels
    if (!levelConfig && gameState.currentGameMode === 'endless') {
      // Create a procedurally generated level for endless mode
      const biomes: Array<'reef' | 'kelp' | 'wreck'> = ['reef', 'kelp', 'wreck'];
      levelConfig = {
        id: nextLevelId,
        name: `Endless Level ${nextLevelId}`,
        biome: biomes[nextLevelId % biomes.length],
        duration: 60000 + (nextLevelId * 5000), // Gradually longer levels
        checkpointTime: (60000 + (nextLevelId * 5000)) / 2,
        startPosition: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
        checkpointPosition: { x: WORLD_WIDTH * 0.7, y: WORLD_HEIGHT / 2 },
        endGatePosition: { x: WORLD_WIDTH * 0.9, y: WORLD_HEIGHT / 2 },
        bronzeThreshold: 50 + (nextLevelId * 10),
        silverThreshold: 100 + (nextLevelId * 15),
        goldThreshold: 150 + (nextLevelId * 20),
        predatorConfigs: Array.from({ length: Math.min(nextLevelId, 5) }, (_, i) => ({
          type: (i % 3 === 0 ? 'shark' : i % 3 === 1 ? 'moray' : 'dolphin') as 'moray' | 'shark' | 'dolphin',
          position: { x: 200 + (i * 150), y: 150 + (i * 100) },
          patrolPath: [
            { x: 200 + (i * 150), y: 150 + (i * 100) },
            { x: 300 + (i * 150), y: 250 + (i * 100) },
            { x: 200 + (i * 150), y: 350 + (i * 100) }
          ]
        })),
        hazardConfigs: Array.from({ length: Math.min(nextLevelId, 4) }, (_, i) => ({
          type: (['net', 'hook', 'jellyfish', 'current', 'urchin', 'floodlight'] as const)[i % 6],
          position: { x: 400 + (i * 100), y: 200 + (i * 75) }
        })),
        foodDensity: Math.min(0.8 + (nextLevelId * 0.1), 2.0)
      };
    }
    
    if (levelConfig) {
      setCurrentLevelConfig(levelConfig);
      setPlayer(prev => ({ ...prev, position: { ...levelConfig.startPosition } }));
      setLevelProgress({
        currentLevel: nextLevelId,
        levelStartTime: Date.now(),
        checkpointReached: false,
        levelComplete: false,
        survivalBonus: 0,
      });
      setGameState(prev => ({ 
        ...prev, 
        showResults: false,
        medal: null,
        lives: 3,
        combo: 1,
        comboTimer: 0,
        screenShake: 0,
        streak: 0
      }));
      
      const { predators, hazards } = LevelManager.initializeLevel(levelConfig);
      setPredators(predators);
      setHazards(hazards);
      spawnInitialFood(levelConfig.foodDensity);
      setSonarPulses([]);
      setEnvironmentalEffects([]);
      
      // Reinitialize environmental effects
      createEnvironmentalEffect('seaweed', { x: 100, y: WORLD_HEIGHT - 50 });
      createEnvironmentalEffect('seaweed', { x: 300, y: WORLD_HEIGHT - 50 });
      createEnvironmentalEffect('current', { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 3 });
    }
  };

  const restartLevel = () => {
    if (currentLevelConfig) {
      setPlayer(prev => ({ ...prev, position: { ...currentLevelConfig.startPosition } }));
      setLevelProgress(prev => ({
        ...prev,
        levelStartTime: Date.now(),
        checkpointReached: false,
        levelComplete: false,
        survivalBonus: 0,
      }));
      setGameState(prev => ({ 
        ...prev, 
        showResults: false,
        medal: null,
        lives: 3,
        combo: 1,
        comboTimer: 0,
        score: 0,
        screenShake: 0,
        streak: 0
      }));
      
      const { predators, hazards } = LevelManager.initializeLevel(currentLevelConfig);
      setPredators(predators);
      setHazards(hazards);
      spawnInitialFood(currentLevelConfig.foodDensity);
      setSonarPulses([]);
      setEnvironmentalEffects([]);
      
      // Reinitialize environmental effects
      createEnvironmentalEffect('seaweed', { x: 100, y: WORLD_HEIGHT - 50 });
      createEnvironmentalEffect('seaweed', { x: 300, y: WORLD_HEIGHT - 50 });
      createEnvironmentalEffect('current', { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 3 });
    }
  };

  if (!gameState.isPlaying) {
    return (
      <div className={`flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white relative ${isMobile ? 'px-4 py-8 overflow-y-auto' : 'justify-center'}`}>
        {/* User Profile Section */}
        <div className={`absolute top-4 ${isMobile ? 'left-4 right-4' : 'right-4'} flex items-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
          {user && authPlayer ? (
            <div className="flex items-center gap-3 bg-black bg-opacity-40 rounded-lg p-3 border border-purple-400">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold">{authPlayer.display_name || authPlayer.username}</p>
                  <p className="text-xs text-purple-300">Total: {authPlayer.total_score.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-yellow-300">{authPlayer.games_played}</span>
              </div>
            </div>
          ) : (
            <AuthDialog>
              <Button variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </AuthDialog>
          )}
        </div>
        
        <h1 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-bold ${isMobile ? 'mb-4' : 'mb-8'} text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 ${isMobile ? 'mt-16' : ''}`}>
          🐙 Octo Sprint
        </h1>
        <p className={`${isMobile ? 'text-lg' : 'text-xl'} ${isMobile ? 'mb-4' : 'mb-6'} text-center max-w-md ${isMobile ? 'px-4' : ''}`}>
          Swim through the ocean depths, collect food, and avoid predators in this thrilling underwater adventure!
        </p>
        {!isMobile && (
          <div className="text-sm mb-8 text-center max-w-lg bg-black bg-opacity-40 rounded-lg p-4 border border-purple-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-purple-300 mb-2">📱 Touch Controls</h3>
              <p>• Tap & drag LARGE bottom-left area</p>
              <p>• Yellow button: Jet Dash (⚡)</p>
              <p>• Purple button: Ink Cloud (💨)</p>
              <p className="text-yellow-300 text-xs mt-2">Tip: Touch anywhere in bottom-left corner!</p>
            </div>
            <div>
              <h3 className="font-bold text-blue-300 mb-2">⌨️ Keyboard Controls</h3>
              <p>• WASD or Arrow Keys: Move</p>
              <p>• Spacebar: Jet Dash</p>
              <p>• C: Ink Cloud</p>
              <p className="text-green-300 text-xs mt-2">Both control methods work!</p>
            </div>
          </div>
          </div>
        )}
        
        {/* Game Mode Selection */}
        <div className={`${isMobile ? 'mb-4' : 'mb-6'} bg-black bg-opacity-40 rounded-lg ${isMobile ? 'p-4' : 'p-6'} border border-purple-400 ${isMobile ? 'w-full max-w-sm' : 'max-w-4xl'}`}>
          <h3 className={`font-bold text-purple-300 ${isMobile ? 'mb-2' : 'mb-4'} text-center ${isMobile ? 'text-sm' : ''}`}>🎮 Choose Your Adventure</h3>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}>
            {Object.entries(GAME_MODES).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => setSelectedGameMode(mode as GameMode)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedGameMode === mode
                    ? 'border-purple-400 bg-purple-500 bg-opacity-30'
                    : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-purple-400'
                }`}
              >
                <div className="text-2xl mb-2">{config.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{config.name}</div>
                <div className="text-xs text-gray-300">{config.description}</div>
                {config.settings.specialRules && (
                  <div className="text-xs text-yellow-300 mt-1">
                    {config.settings.specialRules[0]}
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Selected Mode Details */}
          <div className="mt-4 p-4 bg-black bg-opacity-30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">
              {GAME_MODES[selectedGameMode].icon} {GAME_MODES[selectedGameMode].name}
            </h4>
            <p className="text-sm text-gray-300 mb-3">{GAME_MODES[selectedGameMode].description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="text-green-300">Lives</div>
                <div>{GAME_MODES[selectedGameMode].settings.hasLives ? 
                  GAME_MODES[selectedGameMode].settings.startingLives || 3 : '∞'}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-300">Scoring</div>
                <div>{GAME_MODES[selectedGameMode].settings.scoringMultiplier || 1}x</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-300">Time Limit</div>
                <div>{GAME_MODES[selectedGameMode].settings.hasTimeLimit ? 
                  `${GAME_MODES[selectedGameMode].settings.timeLimit}s` : 'None'}</div>
              </div>
              <div className="text-center">
                <div className="text-purple-300">Difficulty</div>
                <div>{GAME_MODES[selectedGameMode].settings.difficultyProgression ? 'Progressive' : 'Fixed'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={() => startGame(selectedGameMode)}
            className="px-8 py-4 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Start Swimming
          </Button>
          <Button
            onClick={() => setShowCustomizationMenu(true)}
            variant="outline"
            className="px-6 py-4 text-lg border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
          >
            <Palette className="h-5 w-5 mr-2" />
            Customize
          </Button>
          <Button
            onClick={() => setShowAudioSettings(true)}
            variant="outline"
            className="px-6 py-4 text-lg border-green-400 text-green-300 hover:bg-green-400 hover:text-white"
          >
            <Music className="h-5 w-5 mr-2" />
            Audio
          </Button>
          {user && (
            <Button
              onClick={() => setShowProgressionPanel(true)}
              variant="outline"
              className="px-6 py-4 text-lg border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-white"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Progress
            </Button>
          )}
        </div>
        
        <CustomizationMenu 
          isOpen={showCustomizationMenu} 
          onClose={() => setShowCustomizationMenu(false)} 
        />

        <AudioSettings
          isOpen={showAudioSettings}
          onClose={() => setShowAudioSettings(false)}
          settings={audio.settings}
          onUpdateSettings={audio.updateSettings}
          onChangeMusicTrack={audio.changeMusicTrack}
          onChangeSoundEffectStyle={audio.changeSoundEffectStyle}
          onToggleMute={audio.toggleMute}
        />
        
        {/* Progression Panel */}
        {showProgressionPanel && (
          <ProgressionPanel onClose={() => setShowProgressionPanel(false)} />
        )}
        
        {/* Level Up Notification */}
        {showLevelUpNotification && levelUpData && (
          <LevelUpNotification
            visible={showLevelUpNotification}
            newLevel={levelUpData.newLevel}
            skillPointsGained={levelUpData.skillPointsGained}
            xpGained={levelUpData.xpGained}
            onDismiss={() => {
              setShowLevelUpNotification(false);
              setLevelUpData(null);
            }}
          />
        )}
        
        {/* Achievement Notifications */}
        {newAchievements.length > 0 && (
          <AchievementNotification
            achievements={newAchievements}
            onDismiss={() => setNewAchievements([])}
          />
        )}
        
        {/* XP Gain Display */}
        <XpGainDisplay xpGained={xpGained} visible={xpGainVisible} />
      </div>
    );
  }

  return (
    <div className={`relative bg-blue-950 min-h-screen min-h-[100dvh] overflow-hidden ${isMobile ? 'pb-safe' : ''}`} style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0 }}>
      <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-4'} z-10 bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'p-2' : 'p-4'} text-white`} style={{ top: isMobile ? 'max(0.5rem, env(safe-area-inset-top))' : undefined }}>
        <div className={`flex ${isMobile ? 'flex-wrap' : ''} items-center ${isMobile ? 'gap-2' : 'gap-4'} mb-2 ${isMobile ? 'text-xs' : ''}`}>
          <span>❤️ {gameState.lives}</span>
          <span>🎯 {gameState.score}</span>
          <span>🔥 {gameState.combo}x</span>
          <span>⚡ {gameState.streak}</span>
          <span>🎮 {GAME_MODES[gameState.currentGameMode].icon} {GAME_MODES[gameState.currentGameMode].name}</span>
          {timeRemaining !== null && (
            <span className={`${timeRemaining < 30 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
              ⏱️ {Math.ceil(timeRemaining)}s
            </span>
          )}
          {movesRemaining !== null && (
            <span className="text-blue-300">
              🎯 {movesRemaining} moves
            </span>
          )}
          {currentLevelConfig && <span>📍 Level {levelProgress.currentLevel}</span>}
          {weatherEffect.type !== 'calm' && (
            <span className="text-yellow-300">
              {weatherEffect.type === 'storm' ? '⛈️' : weatherEffect.type === 'turbulent' ? '🌊' : ''} 
              {weatherEffect.type.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Challenge Mode Objectives */}
        {gameState.currentGameMode === 'challenge' && challengeObjectives.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-900 bg-opacity-50 rounded border border-yellow-400">
            <div className="text-xs font-semibold text-yellow-300 mb-1">🎯 Objectives:</div>
            {challengeObjectives.map((objective, index) => (
              <div 
                key={index}
                className={`text-xs ${
                  completedObjectives.includes(objective) 
                    ? 'text-green-300 line-through' 
                    : 'text-yellow-200'
                }`}
              >
                {completedObjectives.includes(objective) ? '✅' : '⭕'} {objective}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Combo:</span>
            <Progress value={(gameState.comboTimer / 4000) * 100} className="w-20 h-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Ink:</span>
            <Progress value={player.inkMeter} className="w-20 h-2" />
          </div>
          {currentLevelConfig && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Time:</span>
              <Progress 
                value={Math.min(100, ((Date.now() - levelProgress.levelStartTime) / currentLevelConfig.duration) * 100)} 
                className="w-20 h-2" 
              />
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={audio.toggleMute} variant="outline" className="bg-black bg-opacity-50">
          {audio.settings.muted ? '🔇' : '🔊'}
        </Button>
        <Button onClick={pauseGame} variant="outline" className="bg-black bg-opacity-50">
          {gameState.isPaused ? '▶️' : '⏸️'}
        </Button>
      </div>

      {/* Bonus Goals Display */}
      {!isMobile && bonusGoals.length > 0 && (
        <BonusGoalsDisplay goals={bonusGoals} />
      )}

      {/* Puzzle Mode Display */}
      {gameState.currentGameMode === 'puzzle' && currentPuzzle && movesRemaining !== null && (
        <PuzzleObjectiveDisplay
          puzzle={currentPuzzle}
          movesRemaining={movesRemaining}
          stats={puzzleStats}
        />
      )}

      {/* Treasure Hunt Display */}
      {gameState.currentGameMode === 'treasure_hunt' && treasureRadar.active && (
        <TreasureRadarDisplay
          radar={treasureRadar}
          treasuresCollected={treasuresCollected}
          totalTreasures={treasures.length}
        />
      )}

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className={`mx-auto ${isMobile ? 'mt-2' : 'mt-8'} border-2 border-blue-400 rounded-lg shadow-lg shadow-blue-500/20`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: 'none',
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          maxWidth: '100%',
          objectFit: 'contain',
          imageRendering: 'crisp-edges'
        }}
      />

      {!isMobile && gameState.isPlaying && (
        <div className="absolute bottom-4 right-4 flex gap-4 z-10">
        <Button
          onClick={jetDash}
          disabled={player.dashCooldown > 0}
          className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-2xl"
          title={`Jet Dash (Spacebar) ${player.dashCooldown > 0 ? `- ${(player.dashCooldown / 1000).toFixed(1)}s` : ''}`}
        >
          ⚡
        </Button>
        <Button
          onClick={useInkCloud}
          disabled={player.inkCooldown > 0 || player.inkMeter < 30}
          className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-2xl"
          title={`Ink Cloud (C) ${player.inkCooldown > 0 ? `- ${(player.inkCooldown / 1000).toFixed(1)}s` : player.inkMeter < 30 ? '- Need 30 ink' : ''}`}
        >
          💨
        </Button>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileControls
        onMove={handleMobileMove}
        onJump={handleMobileJump}
        onPause={handleMobilePause}
        onInkCloud={handleMobileInkCloud}
        isGameActive={gameState.isPlaying && !gameState.isPaused}
      />

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
          <div className="bg-white text-black p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
            <Button onClick={pauseGame} className="px-6 py-2">
              Resume
            </Button>
          </div>
        </div>
      )}

      <GameResults
        isOpen={gameState.showResults}
        gameStats={{
          score: gameState.score,
          level: levelProgress.currentLevel,
          combo: gameState.combo,
          gameTime: gameState.gameTime,
          medal: gameState.medal,
          survivalBonus: levelProgress.survivalBonus,
          lives: gameState.lives
        }}
        levelName={currentLevelConfig?.name || `${GAME_MODES[gameState.currentGameMode].name} Mode`}
        unlockedAchievements={unlockedAchievements}
        onRetry={restartLevel}
        onNextLevel={nextLevel}
        onMainMenu={() => {
          audio.stopBackgroundMusic();
          setGameState(prev => ({ ...prev, isPlaying: false }));
        }}
        canContinue={gameState.lives > 0 && (gameState.currentGameMode === 'endless' || levelProgress.currentLevel < LevelManager.getTotalLevels())}
        showSubmitError={submitError}
        onClearError={clearError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
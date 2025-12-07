export interface OctopusCustomization {
  bodyColor: string;
  tentacleColor: string;
  eyeColor: string;
  pattern: 'solid' | 'stripes' | 'spots' | 'gradient' | 'galaxy';
  patternColor?: string;
  size: 'small' | 'medium' | 'large';
  accessory: 'none' | 'hat' | 'crown' | 'sunglasses' | 'bowtie' | 'cape';
  accessoryColor?: string;
  glowEffect: boolean;
  trailEffect: 'none' | 'bubbles' | 'sparkles' | 'rainbow' | 'ink';
}

export interface EnvironmentCustomization {
  theme: 'ocean' | 'deep_sea' | 'coral_reef' | 'arctic' | 'tropical' | 'void' | 'neon';
  backgroundColor: string;
  backgroundGradient?: string[];
  lighting: 'bright' | 'dim' | 'dramatic' | 'colorful';
  particleEffects: boolean;
  backgroundElements: 'minimal' | 'moderate' | 'rich';
  weatherEffects: boolean;
}

export interface UICustomization {
  hudColor: string;
  hudOpacity: number;
  scoreStyle: 'classic' | 'modern' | 'neon' | 'minimal';
  buttonStyle: 'default' | 'rounded' | 'square' | 'glass';
  animations: boolean;
}

export interface CustomizationPreset {
  id: string;
  name: string;
  description: string;
  octopus: OctopusCustomization;
  environment: EnvironmentCustomization;
  ui: UICustomization;
  isPremium?: boolean;
}

export interface UserCustomization {
  userId?: string;
  octopus: OctopusCustomization;
  environment: EnvironmentCustomization;
  ui: UICustomization;
  selectedPresetId?: string;
  lastModified: string;
}

export interface UserCustomizationUpdate {
  userId?: string;
  octopus?: Partial<OctopusCustomization>;
  environment?: Partial<EnvironmentCustomization>;
  ui?: Partial<UICustomization>;
  selectedPresetId?: string;
  lastModified?: string;
}

export const DEFAULT_OCTOPUS_CUSTOMIZATION: OctopusCustomization = {
  bodyColor: '#ff6b6b',
  tentacleColor: '#ff4757',
  eyeColor: '#ffffff',
  pattern: 'solid',
  patternColor: '#ff3742',
  size: 'medium',
  accessory: 'none',
  accessoryColor: '#ffffff',
  glowEffect: false,
  trailEffect: 'none',
};

export const DEFAULT_ENVIRONMENT_CUSTOMIZATION: EnvironmentCustomization = {
  theme: 'ocean',
  backgroundColor: '#4a90e2',
  backgroundGradient: ['#4a90e2', '#2171b5'],
  lighting: 'bright',
  particleEffects: true,
  backgroundElements: 'moderate',
  weatherEffects: true,
};

export const DEFAULT_UI_CUSTOMIZATION: UICustomization = {
  hudColor: '#ffffff',
  hudOpacity: 0.9,
  scoreStyle: 'classic',
  buttonStyle: 'default',
  animations: true,
};

export const CUSTOMIZATION_PRESETS: CustomizationPreset[] = [
  {
    id: 'classic',
    name: 'Classic Ocean',
    description: 'The original OctoSprint experience',
    octopus: DEFAULT_OCTOPUS_CUSTOMIZATION,
    environment: DEFAULT_ENVIRONMENT_CUSTOMIZATION,
    ui: DEFAULT_UI_CUSTOMIZATION,
  },
  {
    id: 'deep_sea',
    name: 'Deep Sea Explorer',
    description: 'Dark depths with glowing effects',
    octopus: {
      ...DEFAULT_OCTOPUS_CUSTOMIZATION,
      bodyColor: '#1a1a2e',
      tentacleColor: '#16213e',
      pattern: 'spots',
      patternColor: '#0f3460',
      glowEffect: true,
      trailEffect: 'sparkles',
    },
    environment: {
      theme: 'deep_sea',
      backgroundColor: '#0a0a0a',
      backgroundGradient: ['#0a0a0a', '#1a1a2e'],
      lighting: 'dim',
      particleEffects: true,
      backgroundElements: 'minimal',
      weatherEffects: false,
    },
    ui: {
      hudColor: '#00ffff',
      hudOpacity: 0.8,
      scoreStyle: 'neon',
      buttonStyle: 'glass',
      animations: true,
    },
  },
  {
    id: 'tropical',
    name: 'Tropical Paradise',
    description: 'Bright coral reef adventure',
    octopus: {
      ...DEFAULT_OCTOPUS_CUSTOMIZATION,
      bodyColor: '#ff9500',
      tentacleColor: '#ff6b35',
      eyeColor: '#ffffff',
      pattern: 'stripes',
      patternColor: '#ff4500',
      trailEffect: 'bubbles',
    },
    environment: {
      theme: 'tropical',
      backgroundColor: '#00bcd4',
      backgroundGradient: ['#00bcd4', '#4dd0e1'],
      lighting: 'bright',
      particleEffects: true,
      backgroundElements: 'rich',
      weatherEffects: true,
    },
    ui: {
      hudColor: '#ffffff',
      hudOpacity: 0.9,
      scoreStyle: 'modern',
      buttonStyle: 'rounded',
      animations: true,
    },
  },
  {
    id: 'neon_night',
    name: 'Neon Night',
    description: 'Cyberpunk underwater world',
    octopus: {
      ...DEFAULT_OCTOPUS_CUSTOMIZATION,
      bodyColor: '#ff00ff',
      tentacleColor: '#00ffff',
      pattern: 'galaxy',
      patternColor: '#ffff00',
      glowEffect: true,
      trailEffect: 'rainbow',
    },
    environment: {
      theme: 'neon',
      backgroundColor: '#0d0d0d',
      backgroundGradient: ['#0d0d0d', '#1a0d1a'],
      lighting: 'colorful',
      particleEffects: true,
      backgroundElements: 'moderate',
      weatherEffects: false,
    },
    ui: {
      hudColor: '#00ff00',
      hudOpacity: 0.85,
      scoreStyle: 'neon',
      buttonStyle: 'glass',
      animations: true,
    },
    isPremium: true,
  },
];
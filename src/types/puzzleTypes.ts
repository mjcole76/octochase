export interface PuzzleObjective {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'collection' | 'avoidance' | 'navigation' | 'restriction' | 'perfect';
  targetMoves: number;
  
  // Objective-specific requirements
  requirements: {
    collectFood?: number;
    collectColor?: string[];
    avoidPredators?: boolean;
    reachPosition?: { x: number; y: number; radius: number };
    noDash?: boolean;
    noInk?: boolean;
    useInkExactly?: number;
    stayInArea?: { x: number; y: number; width: number; height: number };
    noDamage?: boolean;
    collectAll?: boolean;
  };
  
  // Star rating thresholds (moves used)
  starThresholds: {
    threeStar: number; // Complete in this many moves or less for 3 stars
    twoStar: number;   // Complete in this many moves or less for 2 stars
    oneStar: number;   // Complete in this many moves or less for 1 star
  };
}

export interface PuzzleProgress {
  levelId: number;
  completed: boolean;
  stars: number;
  bestMoves: number;
  attempts: number;
}

export const PUZZLE_LEVELS: PuzzleObjective[] = [
  {
    id: 1,
    name: 'Color Picker',
    description: 'Collect 10 red food only',
    difficulty: 'easy',
    type: 'collection',
    targetMoves: 30,
    requirements: {
      collectFood: 10,
      collectColor: ['red']
    },
    starThresholds: {
      threeStar: 15,
      twoStar: 22,
      oneStar: 30
    }
  },
  {
    id: 2,
    name: 'Corner Dash',
    description: 'Reach the top-right corner in 25 moves',
    difficulty: 'easy',
    type: 'navigation',
    targetMoves: 25,
    requirements: {
      reachPosition: { x: 1100, y: 100, radius: 100 }
    },
    starThresholds: {
      threeStar: 15,
      twoStar: 20,
      oneStar: 25
    }
  },
  {
    id: 3,
    name: 'No Boost',
    description: 'Collect 15 food without using dash',
    difficulty: 'medium',
    type: 'restriction',
    targetMoves: 40,
    requirements: {
      collectFood: 15,
      noDash: true
    },
    starThresholds: {
      threeStar: 25,
      twoStar: 32,
      oneStar: 40
    }
  },
  {
    id: 4,
    name: 'Stealth Mode',
    description: 'Avoid all predators for 30 moves',
    difficulty: 'medium',
    type: 'avoidance',
    targetMoves: 30,
    requirements: {
      avoidPredators: true,
      collectFood: 10
    },
    starThresholds: {
      threeStar: 20,
      twoStar: 25,
      oneStar: 30
    }
  },
  {
    id: 5,
    name: 'Rainbow Feast',
    description: 'Collect food of all colors',
    difficulty: 'medium',
    type: 'collection',
    targetMoves: 35,
    requirements: {
      collectColor: ['red', 'blue', 'green', 'yellow'],
      collectFood: 20
    },
    starThresholds: {
      threeStar: 25,
      twoStar: 30,
      oneStar: 35
    }
  },
  {
    id: 6,
    name: 'Speed Collector',
    description: 'Collect 20 food in under 20 moves',
    difficulty: 'hard',
    type: 'collection',
    targetMoves: 20,
    requirements: {
      collectFood: 20
    },
    starThresholds: {
      threeStar: 15,
      twoStar: 18,
      oneStar: 20
    }
  },
  {
    id: 7,
    name: 'Ink Master',
    description: 'Use ink cloud exactly 3 times and collect 15 food',
    difficulty: 'medium',
    type: 'restriction',
    targetMoves: 35,
    requirements: {
      useInkExactly: 3,
      collectFood: 15
    },
    starThresholds: {
      threeStar: 25,
      twoStar: 30,
      oneStar: 35
    }
  },
  {
    id: 8,
    name: 'Blue & Green',
    description: 'Collect only blue and green food (20 total)',
    difficulty: 'medium',
    type: 'collection',
    targetMoves: 35,
    requirements: {
      collectColor: ['blue', 'green'],
      collectFood: 20
    },
    starThresholds: {
      threeStar: 25,
      twoStar: 30,
      oneStar: 35
    }
  },
  {
    id: 9,
    name: 'Center Stage',
    description: 'Stay in the center area and collect 15 food',
    difficulty: 'hard',
    type: 'restriction',
    targetMoves: 40,
    requirements: {
      stayInArea: { x: 400, y: 300, width: 400, height: 200 },
      collectFood: 15
    },
    starThresholds: {
      threeStar: 28,
      twoStar: 34,
      oneStar: 40
    }
  },
  {
    id: 10,
    name: 'Perfect Run',
    description: 'Collect all food, take no damage, use no power-ups',
    difficulty: 'hard',
    type: 'perfect',
    targetMoves: 50,
    requirements: {
      noDamage: true,
      noDash: true,
      noInk: true,
      collectAll: true
    },
    starThresholds: {
      threeStar: 35,
      twoStar: 42,
      oneStar: 50
    }
  }
];

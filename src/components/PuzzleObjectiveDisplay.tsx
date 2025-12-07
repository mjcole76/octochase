import React from 'react';
import type { PuzzleObjective } from '../types/puzzleTypes';

interface PuzzleObjectiveDisplayProps {
  puzzle: PuzzleObjective;
  movesRemaining: number;
  stats: {
    foodCollected: number;
    colorsCollected: Set<string>;
    dashUsed: number;
    inkUsed: number;
    damageTaken: number;
    stayedInArea: boolean;
  };
}

export function PuzzleObjectiveDisplay({ puzzle, movesRemaining, stats }: PuzzleObjectiveDisplayProps) {
  const getProgress = () => {
    const req = puzzle.requirements;
    
    if (req.collectFood) {
      return `${stats.foodCollected}/${req.collectFood}`;
    }
    if (req.collectColor) {
      const collected = req.collectColor.filter(c => stats.colorsCollected.has(c)).length;
      return `${collected}/${req.collectColor.length} colors`;
    }
    if (req.noDamage) {
      return stats.damageTaken === 0 ? '✓ No damage' : '✗ Damaged';
    }
    if (req.noDash) {
      return stats.dashUsed === 0 ? '✓ No dash' : '✗ Dash used';
    }
    if (req.useInkExactly !== undefined) {
      return `${stats.inkUsed}/${req.useInkExactly} ink`;
    }
    
    return 'In progress...';
  };

  const getStarRating = () => {
    const movesUsed = puzzle.targetMoves - movesRemaining;
    if (movesUsed <= puzzle.starThresholds.threeStar) return 3;
    if (movesUsed <= puzzle.starThresholds.twoStar) return 2;
    if (movesUsed <= puzzle.starThresholds.oneStar) return 1;
    return 0;
  };

  const stars = getStarRating();
  const difficultyColor = 
    puzzle.difficulty === 'easy' ? 'text-green-400' :
    puzzle.difficulty === 'medium' ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[300px] border-2 border-blue-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">🧩 {puzzle.name}</h3>
          <p className={`text-xs ${difficultyColor} font-semibold`}>
            {puzzle.difficulty.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <span key={i} className={`text-2xl ${i <= stars ? 'opacity-100' : 'opacity-30'}`}>
              ⭐
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-gray-300 mb-3">{puzzle.description}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Progress:</span>
          <span className="text-sm font-semibold text-blue-300">{getProgress()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Moves Left:</span>
          <span className={`text-sm font-bold ${
            movesRemaining <= 5 ? 'text-red-400' :
            movesRemaining <= 10 ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {movesRemaining}
          </span>
        </div>
        
        {puzzle.requirements.collectColor && (
          <div className="flex gap-1 mt-2">
            {puzzle.requirements.collectColor.map(color => (
              <div
                key={color}
                className={`w-6 h-6 rounded-full border-2 ${
                  stats.colorsCollected.has(color) ? 'border-green-400' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div>⭐⭐⭐ {puzzle.starThresholds.threeStar} moves or less</div>
          <div>⭐⭐ {puzzle.starThresholds.twoStar} moves or less</div>
          <div>⭐ {puzzle.starThresholds.oneStar} moves or less</div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import type { BonusGoal } from '../types/gameEnhancements';
import { Check } from 'lucide-react';

interface BonusGoalsDisplayProps {
  goals: BonusGoal[];
}

export const BonusGoalsDisplay: React.FC<BonusGoalsDisplayProps> = ({ goals }) => {
  if (goals.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 z-10 space-y-2 max-w-xs">
      <div className="text-white text-sm font-bold mb-2 text-shadow">
        🎯 BONUS GOALS
      </div>
      {goals.map(goal => {
        const progress = Math.min(100, (goal.current / goal.target) * 100);
        const isCompleted = goal.completed;

        return (
          <div
            key={goal.id}
            className={`bg-black/70 backdrop-blur-sm rounded-lg p-3 border-2 transition-all ${
              isCompleted
                ? 'border-yellow-400 bg-yellow-900/30'
                : 'border-cyan-500/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xl">{goal.icon}</span>
                <div className="flex-1">
                  <div className="text-white text-xs font-semibold flex items-center gap-1">
                    {goal.title}
                    {isCompleted && (
                      <Check className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-gray-300 text-[10px]">
                    {goal.description}
                  </div>
                </div>
              </div>
              <div className="text-yellow-400 text-xs font-bold whitespace-nowrap">
                +{goal.reward.points}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress Text */}
            <div className="text-gray-400 text-[10px] mt-1 text-center">
              {goal.current} / {goal.target}
              {isCompleted && ' ✓ COMPLETE!'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import type { TreasureRadar } from '../types/treasureTypes';

interface TreasureRadarDisplayProps {
  radar: TreasureRadar;
  treasuresCollected: number;
  totalTreasures: number;
}

export const TreasureRadarDisplay = React.memo(({ radar, treasuresCollected, totalTreasures }: TreasureRadarDisplayProps) => {
  if (!radar.active) return null;

  const getDirectionColor = () => {
    switch (radar.direction) {
      case 'hot': return 'text-red-500';
      case 'warmer': return 'text-orange-400';
      case 'colder': return 'text-blue-400';
      case 'cold': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const getDirectionText = () => {
    switch (radar.direction) {
      case 'hot': return '🔥 HOT! Very close!';
      case 'warmer': return '🌡️ Getting warmer...';
      case 'colder': return '❄️ Getting colder...';
      case 'cold': return '🧊 Cold. Far away.';
      default: return '🧭 Searching...';
    }
  };

  const getDistanceBar = () => {
    const maxDistance = 1000;
    const percentage = Math.max(0, Math.min(100, ((maxDistance - radar.distance) / maxDistance) * 100));
    return percentage;
  };

  return (
    <div className="absolute top-20 right-2 sm:right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 w-[45vw] sm:min-w-[250px] sm:w-auto max-w-[280px] border-2 border-yellow-500 z-20">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-lg font-bold text-yellow-400 truncate">🏴‍☠️ Radar</h3>
        <span className="text-xs sm:text-sm text-gray-300 ml-2">
          {treasuresCollected}/{totalTreasures}
        </span>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <div>
          <div className={`text-xs sm:text-sm font-semibold ${getDirectionColor()} mb-1`}>
            {getDirectionText()}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                radar.direction === 'hot' ? 'bg-red-500' :
                radar.direction === 'warmer' ? 'bg-orange-400' :
                radar.direction === 'colder' ? 'bg-blue-400' :
                'bg-blue-600'
              }`}
              style={{ width: `${getDistanceBar()}%` }}
            />
          </div>
        </div>
        
        <div className="text-[10px] sm:text-xs text-gray-400 space-y-0.5 sm:space-y-1">
          <div>📍 {Math.round(radar.distance)}m</div>
          <div className="text-yellow-300 hidden sm:block">💡 Move to find treasures!</div>
        </div>
      </div>
    </div>
  );
});

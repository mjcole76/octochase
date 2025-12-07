import React from 'react';
import type { TreasureRadar } from '../types/treasureTypes';

interface TreasureRadarDisplayProps {
  radar: TreasureRadar;
  treasuresCollected: number;
  totalTreasures: number;
}

export function TreasureRadarDisplay({ radar, treasuresCollected, totalTreasures }: TreasureRadarDisplayProps) {
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
    <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[250px] border-2 border-yellow-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-yellow-400">🏴‍☠️ Treasure Radar</h3>
        <span className="text-sm text-gray-300">
          {treasuresCollected}/{totalTreasures}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className={`text-sm font-semibold ${getDirectionColor()} mb-1`}>
            {getDirectionText()}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                radar.direction === 'hot' ? 'bg-red-500' :
                radar.direction === 'warmer' ? 'bg-orange-400' :
                radar.direction === 'colder' ? 'bg-blue-400' :
                'bg-blue-600'
              }`}
              style={{ width: `${getDistanceBar()}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-400 space-y-1">
          <div>📍 Distance: {Math.round(radar.distance)}m</div>
          <div className="text-yellow-300">💡 Move around to find treasures!</div>
        </div>
      </div>
    </div>
  );
}

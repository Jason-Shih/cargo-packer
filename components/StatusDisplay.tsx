
import React from 'react';
import { type Space } from '../types';

interface StatusDisplayProps {
  remainingWeight: number;
  remainingSpaces: Space[];
  totalVolume: number;
  usedVolume: number;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ remainingWeight, remainingSpaces, totalVolume, usedVolume }) => {
  const volumeUtilization = totalVolume > 0 ? ((usedVolume / totalVolume) * 100).toFixed(1) : 0;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">裝載狀態</h3>
      
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-600">剩餘載重:</span>
        <span className="text-xl font-bold text-blue-600">{remainingWeight.toLocaleString()} kg</span>
      </div>

      <div className="space-y-2">
         <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-600">容積使用率:</span>
            <span className="text-xl font-bold text-green-600">{volumeUtilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${volumeUtilization}%` }}></div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-600 mb-2">剩餘空間:</h4>
        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
          {remainingSpaces.length > 0 ? remainingSpaces.slice(0, 10).map((space, index) => (
            <div key={index} className="bg-gray-100 p-2 rounded-md text-sm text-gray-700">
              {`空間 ${index + 1}: ${space.length.toFixed(0)} x ${space.width.toFixed(0)} x ${space.height.toFixed(0)} cm`}
            </div>
          )) : (
            <p className="text-gray-500 text-sm">沒有剩餘空間</p>
          )}
          {remainingSpaces.length > 10 && <p className="text-gray-500 text-xs text-center mt-2">... 以及其他 {remainingSpaces.length - 10} 個空間</p>}
        </div>
      </div>
    </div>
  );
};

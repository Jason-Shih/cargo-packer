
import { type Container } from './types';

export const SEA_CONTAINERS: Record<string, Omit<Container, 'id'>> = {
  '20ft': { length: 589, width: 235, height: 239, maxWeight: 28200 },
  '40ft': { length: 1203, width: 235, height: 239, maxWeight: 28800 },
  '40ft HC': { length: 1203, width: 235, height: 269, maxWeight: 28600 },
};

export const AIR_ULDS: Record<string, Omit<Container, 'id'>> = {
  'LD3 (AKE/AVE)': { length: 156, width: 153, height: 163, maxWeight: 1588 },
  'LD6 (ALF/ALP)': { length: 318, width: 153, height: 163, maxWeight: 3175 },
  'LD9 (AAP)': { length: 318, width: 224, height: 163, maxWeight: 4626 },
};

export const ITEM_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

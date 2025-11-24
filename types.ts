export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface Container extends Dimensions {
  maxWeight: number;
}

export type Orientation = 'any' | 'l_w' | 'l_h' | 'w_h';

export interface CargoItem extends Dimensions {
  id: string;
  weight: number;
  quantity: number;
  orientation: Orientation;
}

export interface PlacedItem extends Dimensions {
  id: string;
  originalId: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface Space extends Dimensions {
  x: number;
  y: number;
  z: number;
}

export type TransportMode = 'sea' | 'air';
import { type Container, type CargoItem, type PlacedItem, type Space, type Dimensions, type Orientation } from '../types';

interface ItemToPack extends Dimensions {
  id: string;
  originalId: string;
  weight: number;
  volume: number;
  orientation: Orientation;
}

export const packItems = (container: Container, cargoItems: CargoItem[]) => {
  let availableSpaces: Space[] = [{ ...container, x: 0, y: 0, z: 0 }];
  const placedItems: PlacedItem[] = [];
  const unplacedItems: ItemToPack[] = [];

  const itemsToPack: ItemToPack[] = cargoItems.flatMap(item =>
    Array.from({ length: item.quantity }, (_, i) => ({
      id: `${item.id}-${i}`,
      originalId: item.id,
      length: item.length,
      width: item.width,
      height: item.height,
      weight: item.weight,
      volume: item.length * item.width * item.height,
      orientation: item.orientation,
    }))
  ).sort((a, b) => b.volume - a.volume);

  let remainingWeight = container.maxWeight;

  for (const item of itemsToPack) {
    if (item.weight > remainingWeight) {
      unplacedItems.push(item);
      continue;
    }

    let bestFit: { spaceIndex: number, rotation: Dimensions, space: Space, score: number } | null = null;

    // Find the best fit for the current item (Best Short Side Fit heuristic)
    availableSpaces.sort((a, b) => Math.min(a.length, a.width, a.height) - Math.min(b.length, b.width, b.height));

    for (let i = 0; i < availableSpaces.length; i++) {
      const space = availableSpaces[i];
      const rotations = getRotations(item);

      for (const rotation of rotations) {
        if (rotation.length <= space.length && rotation.width <= space.width && rotation.height <= space.height) {
          const remainingL = space.length - rotation.length;
          const remainingW = space.width - rotation.width;
          const remainingH = space.height - rotation.height;
          const score = Math.min(remainingL, remainingW, remainingH);

          if (bestFit === null || score < bestFit.score) {
            bestFit = { spaceIndex: i, rotation, space, score };
          }
        }
      }
    }

    if (bestFit) {
      const { spaceIndex, rotation, space } = bestFit;
      placedItems.push({
        ...rotation,
        id: item.id,
        originalId: item.originalId,
        x: space.x,
        y: space.y,
        z: space.z,
        color: '', // Color will be assigned in the component
      });
      remainingWeight -= item.weight;

      const newSpaces = splitSpace(space, rotation);
      availableSpaces.splice(spaceIndex, 1, ...newSpaces);
      availableSpaces = mergeSpaces(availableSpaces);

    } else {
      unplacedItems.push(item);
    }
  }

  return {
    placedItems,
    unplacedItems: unplacedItems.map(item => ({...item, quantity: 1, orientation: item.orientation})),
    remainingSpaces: availableSpaces,
    remainingWeight,
  };
};

const getRotations = (item: {length: number, width: number, height: number, orientation: Orientation}): Dimensions[] => {
  const { length: l, width: w, height: h, orientation } = item;
  const allRotations = [
    { length: l, width: w, height: h }, // Base L x W
    { length: w, width: l, height: h }, // Base W x L
    { length: l, width: h, height: w }, // Base L x H
    { length: h, width: l, height: w }, // Base H x L
    { length: w, width: h, height: l }, // Base W x H
    { length: h, width: w, height: l }, // Base H x W
  ];

  if (orientation === 'any') {
    // Return unique rotations
    const unique = new Map<string, Dimensions>();
    allRotations.forEach(r => {
        const key = [r.length, r.width, r.height].sort((a,b) => a-b).join(',');
        if(!unique.has(key)) {
            unique.set(key, r);
        }
    });
    return Array.from(unique.values());
  }

  switch (orientation) {
    case 'l_w':
      return [
        { length: l, width: w, height: h },
        ...(l !== w ? [{ length: w, width: l, height: h }] : []),
      ];
    case 'l_h':
      return [
        { length: l, width: h, height: w },
        ...(l !== h ? [{ length: h, width: l, height: w }] : []),
      ];
    case 'w_h':
        return [
        { length: w, width: h, height: l },
        ...(w !== h ? [{ length: h, width: w, height: l }] : []),
      ];
    default:
      return [];
  }
};

const splitSpace = (space: Space, item: Dimensions): Space[] => {
  const spaces: Space[] = [];

  // This is a robust guillotine-cut implementation.
  // It splits the remaining volume into 3 non-overlapping new spaces.

  // 1. Space on top of the item
  if (space.height > item.height) {
    spaces.push({
      x: space.x,
      y: space.y,
      z: space.z + item.height,
      length: space.length,
      width: space.width,
      height: space.height - item.height,
    });
  }

  // 2. Space to the right of the item (within the item's height)
  if (space.width > item.width) {
    spaces.push({
      x: space.x,
      y: space.y + item.width,
      z: space.z,
      length: space.length,
      width: space.width - item.width,
      height: item.height, // Constrained to item height to prevent overlap
    });
  }
  
  // 3. Space in front of the item (within the item's height and width)
  if (space.length > item.length) {
    spaces.push({
      x: space.x + item.length,
      y: space.y,
      z: space.z,
      length: space.length - item.length,
      width: item.width, // Constrained to item width to prevent overlap
      height: item.height, // Constrained to item height to prevent overlap
    });
  }

  return spaces;
};


// A very basic merge. A full implementation is complex. This is a placeholder.
const mergeSpaces = (spaces: Space[]): Space[] => {
    // For simplicity, we just sort by volume to prioritize larger spaces.
    // A real implementation would check for adjacent spaces to merge them.
    return spaces.sort((a,b) => (b.length*b.width*b.height) - (a.length*a.width*a.height));
}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { type Container, type CargoItem, type PlacedItem, type Space, type TransportMode } from './types';
import { SEA_CONTAINERS, AIR_ULDS, ITEM_COLORS } from './constants';
import { CargoInputForm } from './components/CargoInputForm';
import { Visualization3D } from './components/Visualization3D';
import { StatusDisplay } from './components/StatusDisplay';
import { packItems } from './services/packingAlgorithm';

function App() {
  const [transportMode, setTransportMode] = useState<TransportMode>('sea');
  const [container, setContainer] = useState<Container>(SEA_CONTAINERS['20ft']);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([
    { id: '1', length: 120, width: 80, height: 100, weight: 500, quantity: 1, orientation: 'any' },
  ]);

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [remainingSpaces, setRemainingSpaces] = useState<Space[]>([]);
  const [remainingWeight, setRemainingWeight] = useState<number>(0);
  const [isContainerFull, setIsContainerFull] = useState(false);
  
  const itemColorMap = useMemo(() => {
    const map = new Map<string, string>();
    cargoItems.forEach((item, index) => {
      map.set(item.id, ITEM_COLORS[index % ITEM_COLORS.length]);
    });
    return map;
  }, [cargoItems]);

  useEffect(() => {
    if (transportMode === 'sea') {
      setContainer(SEA_CONTAINERS['20ft']);
    } else {
      setContainer(AIR_ULDS['LD3 (AKE/AVE)']);
    }
  }, [transportMode]);
  
  const runPackingAlgorithm = useCallback(() => {
      if (
          !container ||
          container.length <= 0 ||
          container.width <= 0 ||
          container.height <= 0 ||
          container.maxWeight <= 0
      ) {
          setPlacedItems([]);
          setRemainingSpaces([]);
          setRemainingWeight(container?.maxWeight || 0);
          setIsContainerFull(false);
          return;
      }
      
      const validCargoItems = cargoItems.filter(
          item =>
              item.length > 0 &&
              item.width > 0 &&
              item.height > 0 &&
              item.weight > 0 &&
              item.quantity > 0
      );

      const result = packItems(container, validCargoItems);
      
      const coloredPlacedItems = result.placedItems.map(item => ({
        ...item,
        color: itemColorMap.get(item.originalId) || '#cccccc',
      }));

      setPlacedItems(coloredPlacedItems);
      setRemainingSpaces(result.remainingSpaces);
      setRemainingWeight(result.remainingWeight);
      
      const unplacedOriginals = new Set(result.unplacedItems.map(i => i.originalId));
      if (unplacedOriginals.size > 0) {
          // If any item type failed to place, we consider the container "full" for adding new items of that type
          setIsContainerFull(true);
      } else {
          setIsContainerFull(false);
      }

  }, [container, cargoItems, itemColorMap]);

  useEffect(() => {
    runPackingAlgorithm();
  }, [runPackingAlgorithm]);

  const { totalVolume, usedVolume } = useMemo(() => {
    const total = container.length * container.width * container.height;
    const used = placedItems.reduce((acc, item) => acc + (item.length * item.width * item.height), 0);
    return { totalVolume: total, usedVolume: used };
  }, [container, placedItems]);

  return (
    <div className="flex flex-col lg:flex-row h-screen font-sans bg-gray-100 text-gray-800 p-2 md:p-4 gap-4">
      <CargoInputForm
        transportMode={transportMode}
        setTransportMode={setTransportMode}
        container={container}
        setContainer={setContainer}
        cargoItems={cargoItems}
        setCargoItems={setCargoItems}
        isContainerFull={isContainerFull}
      />
      <div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col gap-4">
        <div className="flex-grow relative bg-gray-800 rounded-lg overflow-hidden">
             <Visualization3D container={container} placedItems={placedItems} />
        </div>
        <div className="flex-shrink-0">
          <StatusDisplay 
            remainingWeight={remainingWeight} 
            remainingSpaces={remainingSpaces}
            totalVolume={totalVolume}
            usedVolume={usedVolume}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useMemo } from 'react';
import { type Container, type CargoItem, type TransportMode, type Orientation } from '../types';
import { SEA_CONTAINERS, AIR_ULDS } from '../constants';
import { PlusIcon, TrashIcon } from './Icons';

interface CargoInputFormProps {
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  container: Container;
  setContainer: (container: Container) => void;
  cargoItems: CargoItem[];
  setCargoItems: (items: CargoItem[]) => void;
  isContainerFull: boolean;
}

export const CargoInputForm: React.FC<CargoInputFormProps> = ({
  transportMode,
  setTransportMode,
  container,
  setContainer,
  cargoItems,
  setCargoItems,
  isContainerFull,
}) => {

  const handleContainerPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const presets = transportMode === 'sea' ? SEA_CONTAINERS : AIR_ULDS;
    if (value in presets) {
      setContainer(presets[value]);
    } else if (value === 'custom') {
      // Keep current values for custom
    }
  };

  const handleContainerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContainer({
      ...container,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newItems = [...cargoItems];
    const { name, value } = e.target;
    
    if (name === 'orientation') {
        newItems[index] = { ...newItems[index], orientation: value as Orientation };
    } else {
        newItems[index] = { ...newItems[index], [name]: parseFloat(value) || 0 };
    }
    setCargoItems(newItems);
  };


  const addNewItem = () => {
    setCargoItems([
      ...cargoItems,
      { id: Date.now().toString(), length: 0, width: 0, height: 0, weight: 0, quantity: 1, orientation: 'any' },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = cargoItems.filter((_, i) => i !== index);
    setCargoItems(newItems);
  };
  
  const presets = transportMode === 'sea' ? SEA_CONTAINERS : AIR_ULDS;
  const isCustom = !Object.values(presets).some(p => 
    p.length === container.length && 
    p.width === container.width && 
    p.height === container.height &&
    p.maxWeight === container.maxWeight
  );

  const getOrientationOptions = (item: CargoItem) => {
    const options = [
        { value: 'any', label: '任意' },
        { value: 'l_w', label: `長x寬 (${item.length || 0}x${item.width || 0})`},
        { value: 'l_h', label: `長x高 (${item.length || 0}x${item.height || 0})` },
        { value: 'w_h', label: `寬x高 (${item.width || 0}x${item.height || 0})` },
    ];
    
    const uniqueOptions = [options[0]];
    const addedLabels = new Set<string>();

    for(let i = 1; i < options.length; i++) {
        // FIX: The original logic to get dimension values was incorrect, causing a type error in the sort function.
        // This was because `dim` was 'l', 'w', or 'h', which are not valid keys on the `CargoItem` type.
        // The corrected line maps these short keys to the actual dimension values.
        const dims = options[i].value.split('_').map(dim => ({'l': item.length, 'w': item.width, 'h': item.height}[dim as 'l'|'w'|'h']));
        const sortedDims = dims.sort((a,b) => a - b).join('x');
        if (!addedLabels.has(sortedDims)) {
            addedLabels.add(sortedDims);
            uniqueOptions.push(options[i]);
        }
    }
    return uniqueOptions;
  }

  return (
    <div className="w-full lg:w-2/5 xl:w-1/3 bg-white p-4 md:p-6 overflow-y-auto h-full shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">裝載設定</h2>

      {/* Transport Mode */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">1. 選擇運輸方式</label>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setTransportMode('sea')}
            className={`flex-1 px-4 py-2 rounded-l-md transition-colors ${transportMode === 'sea' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            海運
          </button>
          <button
            onClick={() => setTransportMode('air')}
            className={`flex-1 px-4 py-2 rounded-r-md transition-colors ${transportMode === 'air' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            空運
          </button>
        </div>
      </div>

      {/* Container Selection */}
      <div className="mb-6">
        <label htmlFor="container-preset" className="block text-gray-700 font-semibold mb-2">2. 選擇櫃型 / ULD</label>
        <select
          id="container-preset"
          value={isCustom ? 'custom' : Object.keys(presets).find(key => presets[key].length === container.length && presets[key].width === container.width)}
          onChange={handleContainerPresetChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          {Object.keys(presets).map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
          <option value="custom">其他 (自訂)</option>
        </select>
      </div>

      {/* Container Dimensions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">長 (cm)</label>
          <input type="number" name="length" value={container.length} onChange={handleContainerInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">寬 (cm)</label>
          <input type="number" name="width" value={container.width} onChange={handleContainerInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">高 (cm)</label>
          <input type="number" name="height" value={container.height} onChange={handleContainerInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">載重 (kg)</label>
          <input type="number" name="maxWeight" value={container.maxWeight} onChange={handleContainerInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
      </div>

      {/* Cargo Items */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">3. 輸入貨物資訊</h3>
        <div className="space-y-4 max-h-[calc(100vh-550px)] overflow-y-auto pr-2">
          {cargoItems.map((item, index) => {
            const orientationOptions = getOrientationOptions(item);
            return (
              <div key={item.id} className={`p-4 border rounded-lg relative ${isContainerFull && index === cargoItems.length - 1 ? 'bg-red-100 border-red-400' : 'bg-gray-50 border-gray-200'}`}>
                <button onClick={() => removeItem(index)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100">
                  <TrashIcon />
                </button>
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500">長 (cm)</label>
                    <input type="number" name="length" value={item.length || ''} onChange={e => handleItemChange(index, e)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">寬 (cm)</label>
                    <input type="number" name="width" value={item.width || ''} onChange={e => handleItemChange(index, e)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">高 (cm)</label>
                    <input type="number" name="height" value={item.height || ''} onChange={e => handleItemChange(index, e)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  
                  {/* Row 2 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500">重量 (kg)</label>
                    <input type="number" name="weight" value={item.weight || ''} onChange={e => handleItemChange(index, e)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">數量</label>
                    <input type="number" name="quantity" min="1" value={item.quantity || ''} onChange={e => handleItemChange(index, e)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">底面方向</label>
                     <select
                      name="orientation"
                      value={item.orientation}
                      onChange={e => handleItemChange(index, e)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md text-xs"
                    >
                      {orientationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={addNewItem} 
        disabled={isContainerFull}
        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <PlusIcon />
        新增貨物項目
      </button>
       {isContainerFull && <p className="text-red-600 text-sm mt-2 text-center">貨物無法裝入或超出重量，無法新增。</p>}
    </div>
  );
};
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type Container, type PlacedItem } from '../types';

interface Visualization3DProps {
  container: Container;
  placedItems: PlacedItem[];
}

const VIEW_SIZE = 600;

// A reusable component to draw a colored dot at a 3D position
const PointMarker: React.FC<{
  position: { x: number; y: number; z: number };
  color: string;
  size?: number;
}> = ({ position, color, size = 10 }) => {
  const { x, y, z } = position;
  return (
    <div
      className="absolute"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        transformStyle: 'preserve-3d',
        // This transform first moves the object to the correct 3D spot,
        // then translates it back by half its size to center it on the point.
        transform: `translateX(${x}px) translateY(${y}px) translateZ(${z}px) translateX(-50%) translateY(-50%)`,
      }}
    />
  );
};

// New component to draw center axes (lines) for the container
const CenterLines: React.FC<{
  dimensions: { length: number; width: number; height: number };
  position: { x: number; y: number; z: number };
}> = ({ dimensions, position }) => {
  const { length, width, height } = dimensions;
  const { x, y, z } = position;
  
  const lineStyle = {
    position: 'absolute' as const,
    backgroundColor: '#FFFF00', // Yellow color for the axes
    opacity: 0.8,
  };

  return (
    <div
      className="absolute"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transformStyle: 'preserve-3d',
        // Center alignment fix: align the center of this container div to the coordinate
        transform: `translateX(${x}px) translateY(${y}px) translateZ(${z}px) translateX(-50%) translateY(-50%)`,
        pointerEvents: 'none',
      }}
    >
        {/* X Axis (Width) - Horizontal line */}
        <div style={{ ...lineStyle, width: '100%', height: '2px', top: '50%', left: 0, transform: 'translateY(-50%)' }} />
        
        {/* Y Axis (Height) - Vertical line */}
        <div style={{ ...lineStyle, width: '2px', height: '100%', top: 0, left: '50%', transform: 'translateX(-50%)' }} />
        
        {/* Z Axis (Length) - Depth line (simulated by rotating a div) */}
        <div 
            style={{ 
                ...lineStyle, 
                width: '2px', 
                height: `${length}px`, 
                top: '50%', 
                left: '50%', 
                // Move to center, rotate to face Z, and offset Z to center it
                transform: 'translate(-50%, -50%) rotateX(90deg)' 
            }} 
        />
    </div>
  );
};


// A reusable component to create a 6-sided 3D object
const Cube: React.FC<{
  dimensions: { length: number; width: number; height: number };
  position: { x: number; y: number; z: number }; // center of the cube in scene coordinates
  color: string;
  isContainer?: boolean;
}> = ({ dimensions, position, color, isContainer = false }) => {
  const { length, width, height } = dimensions;
  const { x, y, z } = position;

  const faces = [
    // front, back
    { name: 'front', transform: `translateZ(${length / 2}px)`, width: width, height: height },
    { name: 'back', transform: `rotateY(180deg) translateZ(${length / 2}px)`, width: width, height: height },
    // right, left
    { name: 'right', transform: `rotateY(90deg) translateZ(${width / 2}px)`, width: length, height: height },
    { name: 'left', transform: `rotateY(-90deg) translateZ(${width / 2}px)`, width: length, height: height },
    // top, bottom
    { name: 'top', transform: `rotateX(90deg) translateZ(${height / 2}px)`, width: width, height: length },
    { name: 'bottom', transform: `rotateX(-90deg) translateZ(${height / 2}px)`, width: width, height: length },
  ];

  const containerFaceStyle = {
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
    border: '1px solid rgba(209, 213, 219, 0.4)',
  };

  const itemFaceStyle = {
    backgroundColor: color,
    border: '1px solid rgba(0, 0, 0, 0.3)',
  };

  return (
    <div
      className="absolute"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transformStyle: 'preserve-3d',
        // [修正關鍵]
        // position 是中心點。
        // 原本: translate(x, y, z) 會把這個 div 的「左上角」放到 x, y, z。
        // 修正: 加上 translateX(-50%) translateY(-50%) 把 div 的中心對齊到 x, y, z。
        transform: `translateX(${x}px) translateY(${y}px) translateZ(${z}px) translateX(-50%) translateY(-50%)`,
      }}
    >
      {faces.map(face => (
        <div
          key={face.name}
          className="absolute"
          style={{
            width: `${face.width}px`,
            height: `${face.height}px`,
            left: `calc(50% - ${face.width}px / 2)`,
            top: `calc(50% - ${face.height}px / 2)`,
            ...(isContainer ? containerFaceStyle : itemFaceStyle),
            transform: face.transform,
          }}
        />
      ))}
    </div>
  );
};

/**
 * 統一的座標轉換：
 *
 * 演算法座標系 (algo):
 *  - 原點: container 的 back-bottom-left（後下左，地板裡面那個角）
 *  - +x: 往 length 方向（深度，朝螢幕）
 *  - +y: 往 width 方向（向右）
 *  - +z: 往 height 方向（向上）
 *
 * Scene / CSS 座標系:
 *  - +X: 向右
 *  - +Y: 向下（所以要自己加負號來做「往上」）
 *  - +Z: 朝觀眾（螢幕外）
 *
 * 我們這個函式做兩件事：
 *  1. 把「演算法的 back-bottom-left」轉成 Scene 的 back-bottom-left
 *  2. 再加上一半尺寸，算出「中心點」，給 Cube 使用
 */
function algoToSceneCenter(
  algoPos: { x: number; y: number; z: number },
  algoDims: { length: number; width: number; height: number },
  scale: number
) {
  const scaled = {
    length: algoDims.length * scale,
    width: algoDims.width * scale,
    height: algoDims.height * scale,
  };

  // 1. back-bottom-left in scene coordinates
  const backBottomLeftScene = {
    x: algoPos.y * scale,          // algo y -> scene X (右)
    y: -(algoPos.z * scale),       // algo z (往上) -> scene Y (往下) 要加負號
    z: algoPos.x * scale,          // algo x -> scene Z (朝螢幕)
  };

  // 2. convert to center
  const center = {
    x: backBottomLeftScene.x + scaled.width / 2,
    y: backBottomLeftScene.y - scaled.height / 2,
    z: backBottomLeftScene.z + scaled.length / 2,
  };

  return { center, scaled };
}

export const Visualization3D: React.FC<Visualization3DProps> = ({ container, placedItems }) => {
  const [rotation, setRotation] = useState({ x: -25, y: -45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const scale = useMemo(() => {
    const maxDim = Math.max(container.length, container.width, container.height);
    return maxDim > 0 ? VIEW_SIZE / maxDim : 1;
  }, [container]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotation(prev => ({
      y: prev.y + dx * 0.5,
      x: Math.max(-90, Math.min(90, prev.x - dy * 0.5)), // Clamp X rotation
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag event
    setZoom(prev => Math.min(prev + 0.1, 2.0)); // Limit max zoom to 2.0x
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag event
    setZoom(prev => Math.max(prev - 0.1, 0.5)); // Limit min zoom to 0.5x
  };

  // Reset view on container change
  useEffect(() => {
    setRotation({ x: -25, y: -45 });
    setZoom(1);
  }, [container.length, container.width, container.height]);

  // 先把 container 的中心 / 尺寸算出來（也走同一套轉換，只是座標是 0,0,0）
  const { center: containerCenter, scaled: scaledContainer } = useMemo(
    () =>
      algoToSceneCenter(
        { x: 0, y: 0, z: 0 }, // container 的 back-bottom-left 就是演算法原點
        {
          length: container.length,
          width: container.width,
          height: container.height,
        },
        scale
      ),
    [container, scale]
  );
  
  useEffect(() => {
    if (containerCenter) {
      console.log("Container Center:", containerCenter);
    }
  }, [containerCenter]);

  return (
    <div
      className="w-full h-full flex items-center justify-center p-4 bg-gray-800 rounded-lg cursor-grab active:cursor-grabbing touch-none relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      style={{ perspective: '2000px' }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-bold p-2 rounded shadow transition-all duration-200 w-10 h-10 flex items-center justify-center"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-bold p-2 rounded shadow transition-all duration-200 w-10 h-10 flex items-center justify-center"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
      </div>

      <div
        className="transition-transform duration-100"
        style={{
          transformStyle: 'preserve-3d',
          // Move down by 25% (150px) AND apply zoom scale
          transform: `translateY(150px) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Scene 容器：這裡就當作一個「包住全部東西」的盒子 */}
        <div
          className="relative"
          style={{
            width: `${scaledContainer.width}px`,
            height: `${scaledContainer.height}px`,
            transformStyle: 'preserve-3d',
            // 把整個 box roughly 放到畫面中心，這不影響 container 和 items 的「相對位置」
            transform: `translateX(${-scaledContainer.width / 2}px) translateY(${scaledContainer.height / 2}px) translateZ(${-scaledContainer.length / 2}px)`,
          }}
        >
          {/* 起始點 (0,0,0) */}
          <PointMarker position={{ x: 0, y: 0, z: 0 }} color="#FFFFFF" size={15} />
          
          {/* Container */}
          <Cube
            dimensions={scaledContainer}
            position={containerCenter}
            color=""
            isContainer={true}
          />
          {/* Container 中心軸線 (取代原本的 PointMarker) */}
          <CenterLines dimensions={scaledContainer} position={containerCenter} />


          {/* Items */}
          {placedItems.map(item => {
            const { center, scaled } = algoToSceneCenter(
              { x: item.x, y: item.y, z: item.z },
              { length: item.length, width: item.width, height: item.height },
              scale
            );
            
            console.log(`Item ${item.originalId} (Instance: ${item.id}) Cube Center:`, center);

            return (
              <React.Fragment key={item.id}>
                <Cube
                  dimensions={scaled}
                  position={center}
                  color={item.color}
                />
                {/* 每個 Cube 的中心點 (保持為圓點) */}
                <PointMarker position={center} color="#FF00FF" />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
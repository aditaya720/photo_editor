import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';
import { Canvas } from 'fabric';

interface LayersPanelProps {
  canvas: Canvas | null;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ canvas }) => {
  const [objects, setObjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      setObjects([...canvas.getObjects()].reverse());
    };

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    
    updateLayers();

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const toggleVisibility = (obj: any) => {
    obj.visible = !obj.visible;
    canvas?.renderAll();
    setObjects([...objects]);
  };

  const toggleLock = (obj: any) => {
    obj.selectable = !obj.selectable;
    obj.evented = obj.selectable;
    canvas?.renderAll();
    setObjects([...objects]);
  };

  return (
    <div className="flex flex-col gap-2">
      {objects.map((obj, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all group"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
          <div className="flex-1 text-xs font-medium text-gray-300 truncate">
            {obj.type === 'i-text' ? obj.text : obj.type || 'Object'}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => toggleVisibility(obj)}
              className={`p-1.5 rounded-md hover:bg-gray-700 transition-colors ${!obj.visible ? 'text-red-500' : 'text-gray-500'}`}
            >
              {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={() => toggleLock(obj)}
              className={`p-1.5 rounded-md hover:bg-gray-700 transition-colors ${!obj.selectable ? 'text-orange-500' : 'text-gray-500'}`}
            >
              {obj.selectable ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ))}
      {objects.length === 0 && (
        <p className="text-center text-xs text-gray-500 py-4">No layers yet</p>
      )}
    </div>
  );
};

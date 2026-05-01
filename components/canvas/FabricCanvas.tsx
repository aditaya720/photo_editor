import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas, Rect, Circle, IText, Image, PencilBrush, ActiveSelection, filters, Point } from 'fabric';
import { useEditor } from '../../CanvasContext';
import { ToolType } from '../../types/editor';

interface FabricCanvasProps {
  onReady?: (canvas: Canvas) => void;
}

export const FabricCanvas = forwardRef<{ getCanvas: () => Canvas | null }, FabricCanvasProps>(({ onReady }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const { state, properties, setSelectedObjects, setCanUndo, setCanRedo, setIsPropertiesOpen } = useEditor();

  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricCanvas.current,
    undo: () => {
      if (historyIndex.current > 0 && fabricCanvas.current && !fabricCanvas.current.disposed) {
        historyIndex.current--;
        const json = history.current[historyIndex.current];
        fabricCanvas.current.loadFromJSON(json).then(() => {
          if (!isMounted.current || !fabricCanvas.current || fabricCanvas.current.disposed) return;
          fabricCanvas.current.renderAll();
          setCanUndo(historyIndex.current > 0);
          setCanRedo(true);
        }).catch(err => console.warn("Undo load failed:", err));
      }
    },
    redo: () => {
      if (historyIndex.current < history.current.length - 1 && fabricCanvas.current && !fabricCanvas.current.disposed) {
        historyIndex.current++;
        const json = history.current[historyIndex.current];
        fabricCanvas.current.loadFromJSON(json).then(() => {
          if (!isMounted.current || !fabricCanvas.current || fabricCanvas.current.disposed) return;
          fabricCanvas.current.renderAll();
          setCanUndo(true);
          setCanRedo(historyIndex.current < history.current.length - 1);
        }).catch(err => console.warn("Redo load failed:", err));
      }
    },
    duplicate: () => {
      const canvas = fabricCanvas.current;
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      
      activeObject.clone().then((cloned: any) => {
        if (!isMounted.current || !fabricCanvas.current) return;
        canvas.discardActiveObject();
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
          evented: true,
        });
        if (cloned.type === 'activeSelection') {
          cloned.canvas = fabricCanvas.current;
          cloned.forEachObject((obj: any) => {
            fabricCanvas.current?.add(obj);
          });
          cloned.setCoords();
        } else {
          fabricCanvas.current.add(cloned);
        }
        fabricCanvas.current.setActiveObject(cloned);
        fabricCanvas.current.renderAll();
        saveHistory();
      });
    },
    bringToFront: () => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && canvas && !canvas.disposed) {
        canvas.bringObjectToFront(active);
        canvas.renderAll();
        saveHistory();
      }
    },
    sendToBack: () => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && canvas && !canvas.disposed) {
        canvas.sendObjectToBack(active);
        canvas.renderAll();
        saveHistory();
      }
    },
    flipX: () => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && canvas && !canvas.disposed) {
        active.set('flipX', !active.flipX);
        canvas.renderAll();
        saveHistory();
      }
    },
    flipY: () => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && canvas && !canvas.disposed) {
        active.set('flipY', !active.flipY);
        canvas.renderAll();
        saveHistory();
      }
    },
    centerObject: () => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && canvas && !canvas.disposed) {
        canvas.centerObject(active);
        active.setCoords();
        canvas.renderAll();
        saveHistory();
      }
    },
    zoomToPoint: (point: { x: number, y: number }, zoom: number) => {
      fabricCanvas.current?.zoomToPoint(point, zoom);
    },
    getZoom: () => fabricCanvas.current?.getZoom() || 1,
    setZoom: (zoom: number) => {
      const canvas = fabricCanvas.current;
      if (canvas && !canvas.disposed) {
        canvas.setZoom(zoom);
        canvas.renderAll();
      }
    },
    applyFilter: (type: string, value: number) => {
      const canvas = fabricCanvas.current;
      const active = canvas?.getActiveObject();
      if (active && active.type === 'image') {
        const img = active as any;
        let filter;
        
        if (type === 'Brightness') {
          filter = new filters.Brightness({ brightness: value });
        } else if (type === 'Contrast') {
          filter = new filters.Contrast({ contrast: value });
        } else if (type === 'Saturation') {
          filter = new filters.Saturation({ saturation: value });
        }

        if (filter && fabricCanvas.current) {
          // Find if filter of same type already exists
          const existingIndex = img.filters.findIndex((f: any) => f.type === type);
          if (existingIndex > -1) {
            img.filters[existingIndex] = filter;
          } else {
            img.filters.push(filter);
          }
          img.applyFilters();
          fabricCanvas.current.renderAll();
          saveHistory();
        }
      }
    }
  }));

  const clipboard = useRef<any>(null);

  const saveHistory = () => {
    if (!fabricCanvas.current || !isMounted.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    
    // Remove future states if we've undo-ed and then made a change
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }
    
    history.current.push(json);
    historyIndex.current++;
    
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    if (state.activeTool === 'draw') {
      canvas.isDrawingMode = true;
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = '#3b82f6';
    } else {
      canvas.isDrawingMode = false;
    }
  }, [state.activeTool]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || fabricCanvas.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#1f2937',
      preserveObjectStacking: true,
    });

    fabricCanvas.current = canvas;

    // Events
    canvas.on('selection:created', (e) => setSelectedObjects(e.selected || []));
    canvas.on('selection:updated', (e) => setSelectedObjects(e.selected || []));
    canvas.on('selection:cleared', () => setSelectedObjects([]));
    canvas.on('mouse:dblclick', (e) => {
      if (e.target) {
        setIsPropertiesOpen(true);
      }
    });
    canvas.on('object:modified', saveHistory);
    canvas.on('object:added', saveHistory);

    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** (-delta); // Reversed delta sign for more natural feel
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint(new Point((opt.e as any).offsetX, (opt.e as any).offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObjects = canvas.getActiveObjects();
      const isEditingText = activeObjects.some((obj: any) => obj.isEditing);

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isEditingText) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.clone().then((cloned: any) => {
            if (!isMounted.current) return;
            clipboard.current = cloned;
          });
        }
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isEditingText) {
        if (clipboard.current) {
          clipboard.current.clone().then((clonedObj: any) => {
            if (!isMounted.current || !fabricCanvas.current) return;
            const currentCanvas = fabricCanvas.current;
            currentCanvas.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = currentCanvas;
              clonedObj.forEachObject((obj: any) => {
                currentCanvas.add(obj);
              });
              clonedObj.setCoords();
            } else {
              currentCanvas.add(clonedObj);
            }
            // Update clipboard for next paste
            clipboard.current.top += 20;
            clipboard.current.left += 20;
            currentCanvas.setActiveObject(clonedObj);
            currentCanvas.requestRenderAll();
            saveHistory();
          });
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObjects.length > 0 && !canvas.isDrawingMode && !isEditingText) {
          canvas.remove(...activeObjects);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!isMounted.current || !fabricCanvas.current || fabricCanvas.current.disposed || !containerRef.current) return;
      
      try {
        const canvas = fabricCanvas.current;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        if (width > 0 && height > 0) {
          canvas.setDimensions({ width, height });
          canvas.renderAll();
        }
      } catch (err) {
        console.warn("Resize error caught:", err);
      }
    });

    resizeObserver.observe(containerRef.current);

    if (onReady) onReady(canvas);

    // Initial Load from State if exists
    if (state.initialCanvasData && fabricCanvas.current && !fabricCanvas.current.disposed) {
      console.log("Loading initial canvas data...");
      try {
        const data = typeof state.initialCanvasData === 'string' && state.initialCanvasData.trim() === '' 
          ? {} 
          : state.initialCanvasData;
        
        fabricCanvas.current.loadFromJSON(data).then(() => {
          if (!isMounted.current || !fabricCanvas.current || fabricCanvas.current.disposed) return;
          fabricCanvas.current.renderAll();
          saveHistory();
        }).catch(err => {
          console.error("Failed to load initial canvas data promise:", err);
          saveHistory();
        });
      } catch (err) {
        console.error("Failed to parse/setup initial canvas load:", err);
        saveHistory();
      }
    } else {
      // Initial history
      saveHistory();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, []);

  // Update tool settings
  useEffect(() => {
    if (!fabricCanvas.current) return;
    const canvas = fabricCanvas.current;

    canvas.isDrawingMode = state.activeTool === 'draw';
    
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = properties.fill;
      canvas.freeDrawingBrush.width = properties.strokeWidth;
    }

    // Update cursor
    canvas.defaultCursor = state.activeTool === 'select' ? 'default' : 'crosshair';
  }, [state.activeTool, properties.fill, properties.strokeWidth]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#111827] relative overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
});

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToolType, EditorState, ElementProperties, INITIAL_PROPERTIES } from './types/editor';

interface CanvasContextType {
  state: EditorState;
  properties: ElementProperties;
  setTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  updateProperties: (props: Partial<ElementProperties>) => void;
  setCanUndo: (val: boolean) => void;
  setCanRedo: (val: boolean) => void;
  setSelectedObjects: (objects: any[]) => void;
  setIsPropertiesOpen: (val: boolean) => void;
  setInitialState: (data: { currentDesignId: string, canvasData: string }) => void;
  setCurrentDesignId: (id: string) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EditorState>({
    activeTool: 'select',
    selectedObjects: [],
    canUndo: false,
    canRedo: false,
    zoom: 1,
    isPropertiesOpen: false,
    currentDesignId: '',
    initialCanvasData: '',
  });

  const [properties, setProperties] = useState<ElementProperties>(INITIAL_PROPERTIES);

  const setTool = useCallback((activeTool: ToolType) => {
    setState(prev => ({ ...prev, activeTool }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom }));
  }, []);

  const updateProperties = useCallback((props: Partial<ElementProperties>) => {
    setProperties(prev => ({ ...prev, ...props }));
  }, []);

  const setCanUndo = useCallback((canUndo: boolean) => {
    setState(prev => ({ ...prev, canUndo }));
  }, []);

  const setCanRedo = useCallback((canRedo: boolean) => {
    setState(prev => ({ ...prev, canRedo }));
  }, []);

  const setIsPropertiesOpen = useCallback((isPropertiesOpen: boolean) => {
    setState(prev => ({ ...prev, isPropertiesOpen }));
  }, []);

  const setInitialState = useCallback(({ currentDesignId, canvasData }: { currentDesignId: string, canvasData: string }) => {
    setState(prev => ({ 
      ...prev, 
      currentDesignId, 
      initialCanvasData: canvasData,
      activeTool: 'select'
    }));
  }, []);

  const setCurrentDesignId = useCallback((currentDesignId: string) => {
    setState(prev => ({ ...prev, currentDesignId }));
  }, []);

  const setSelectedObjects = useCallback((selectedObjects: any[]) => {
    setState(prev => ({ 
      ...prev, 
      selectedObjects, 
      isPropertiesOpen: selectedObjects.length === 0 ? false : prev.isPropertiesOpen 
    }));
    
    // Update local properties if an object is selected
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      setProperties(prev => ({
        ...prev,
        fill: obj.fill || prev.fill,
        stroke: obj.stroke || prev.stroke,
        strokeWidth: obj.strokeWidth || prev.strokeWidth,
        opacity: obj.opacity || prev.opacity,
        fontSize: obj.fontSize || prev.fontSize,
        fontFamily: obj.fontFamily || prev.fontFamily,
        fontWeight: obj.fontWeight || prev.fontWeight,
        fontStyle: obj.fontStyle || prev.fontStyle,
        textAlign: obj.textAlign || prev.textAlign,
        brightness: (obj as any).filters?.find((f: any) => f.type === 'Brightness')?.brightness || 0,
        contrast: (obj as any).filters?.find((f: any) => f.type === 'Contrast')?.contrast || 0,
        saturation: (obj as any).filters?.find((f: any) => f.type === 'Saturation')?.saturation || 0,
      }));
    }
  }, []);

  return (
    <CanvasContext.Provider value={{
      state,
      properties,
      setTool,
      setZoom,
      updateProperties,
      setCanUndo,
      setCanRedo,
      setSelectedObjects,
      setIsPropertiesOpen,
      setInitialState,
      setCurrentDesignId
    }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(CanvasContext);
  if (!context) throw new Error('useEditor must be used within CanvasProvider');
  return context;
};

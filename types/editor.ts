export type ToolType = 'select' | 'text' | 'rect' | 'circle' | 'image' | 'draw' | 'eraser';

export interface EditorState {
  activeTool: ToolType;
  selectedObjects: any[];
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  isPropertiesOpen: boolean;
  currentDesignId: string;
  initialCanvasData: string;
}

export interface Design {
  id: string;
  userId: string;
  name: string;
  canvasData: string;
  thumbnail: string;
  createdAt: any;
  updatedAt: any;
}

export interface ElementProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  brightness: number;
  contrast: number;
  saturation: number;
}

export const INITIAL_PROPERTIES: ElementProperties = {
  fill: '#3b82f6',
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 40,
  fontFamily: 'Inter',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

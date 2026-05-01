import React, { useState } from 'react';
import { 
  Type, Square, Circle, Image as ImageIcon, MousePointer2, 
  Pencil, Trash2, Layers, History, Settings, Sparkles, 
  Download, Undo2, Redo2, Maximize, Grid, Layers2,
  Palette, Settings2, HelpCircle, Share2, Plus,
  Scissors, Layout, Shapes, Sticker, Wand2, Upload,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Copy,
  ArrowUp, ArrowDown, MoveUp, MoveDown, FlipHorizontal, FlipVertical,
  Minus, MousePointer, Triangle, Star, ZoomIn, ZoomOut
} from 'lucide-react';
import { useEditor } from './CanvasContext';
import { FabricCanvas } from './components/canvas/FabricCanvas';
import { Canvas } from 'fabric';
import { motion, AnimatePresence } from 'motion/react';
import { ToolType } from './types/editor';
import { addRect, addCircle, addText, addImage, addTriangle, addStar } from './utils/canvasHelpers';
import { LayersPanel } from './components/panels/LayersPanel';
import { ExportModal } from './components/panels/ExportModal';
import { UserInfo } from './components/auth/UserInfo';
import { db } from './services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './services/AuthContext';
import { Save } from 'lucide-react';

export const EditorWorkspace: React.FC = () => {
  const { state, properties, setTool, updateProperties, setIsPropertiesOpen, setCurrentDesignId } = useEditor();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('elements');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [designName, setDesignName] = useState('Untitled Design');

  const handleExportClick = async () => {
    setIsExportOpen(true);
  };

  const handleSave = async () => {
    const canvas = getCanvas();
    if (!canvas || !user) return;

    setIsSaving(true);
    try {
      const designId = state.currentDesignId || `design_${Date.now()}`;
      const designRef = doc(db, 'users', user.uid, 'designs', designId);
      
      const canvasJson = JSON.stringify(canvas.toJSON());
      const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.1 });

      await setDoc(designRef, {
        userId: user.uid,
        name: designName,
        canvasData: canvasJson,
        thumbnail: thumbnail,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(), // In real app, check if existing first
      }, { merge: true });

      setCurrentDesignId(designId);
      alert('Design saved successfully!');
    } catch (error) {
      console.error("Save error:", error);
      alert('Failed to save design.');
    } finally {
      setIsSaving(false);
    }
  };
  const canvasRef = React.useRef<{ 
    getCanvas: () => Canvas | null;
    undo: () => void;
    redo: () => void;
    duplicate: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    flipX: () => void;
    flipY: () => void;
    centerObject: () => void;
    getZoom: () => number;
    setZoom: (zoom: number) => void;
    applyFilter: (type: string, value: number) => void;
  }>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getCanvas = () => canvasRef.current?.getCanvas();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (f) => {
         const canvas = getCanvas();
         if (canvas && f.target?.result) {
            await addImage(canvas, f.target.result as string);
         }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();
  const handleDuplicate = () => canvasRef.current?.duplicate();
  const handleBringToFront = () => canvasRef.current?.bringToFront();
  const handleSendToBack = () => canvasRef.current?.sendToBack();
  const handleFlipX = () => canvasRef.current?.flipX();
  const handleFlipY = () => canvasRef.current?.flipY();
  const handleCenter = () => canvasRef.current?.centerObject();
  const handleApplyFilter = (type: string, value: number) => canvasRef.current?.applyFilter(type, value);

  const handlePropertyChange = (newProps: any) => {
    updateProperties(newProps);
    const canvas = getCanvas();
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
       activeObject.set(newProps);
       canvas?.renderAll();
    }
  };

  const sidebarTabs = [
    { id: 'uploads', icon: Upload, label: 'Uploads' },
    { id: 'elements', icon: Shapes, label: 'Elements' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'ai', icon: Wand2, label: 'AI Magic' },
    { id: 'layers', icon: Layers2, label: 'Layers' },
    { id: 'settings', icon: Settings2, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-gray-200 flex-col md:flex-row">
      {/* Left Icon Bar - Desktop Only */}
      <div className="hidden md:flex w-20 border-r border-gray-800 flex-col items-center py-6 gap-6 bg-[#0f0f0f] z-30">
        <div className="p-2 mb-4">
           <Wand2 className="w-8 h-8 text-blue-500 fill-blue-500/10" />
        </div>
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'settings' && state.selectedObjects.length > 0) {
                setIsPropertiesOpen(!state.isPropertiesOpen);
                setActiveTab('');
              } else {
                setActiveTab(tab.id);
                setIsPropertiesOpen(false);
              }
            }}
            className={`flex flex-col items-center gap-1 group transition-all ${
              activeTab === tab.id ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-blue-500/10' : 'group-hover:bg-gray-800'
            }`}>
              <tab.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Primary Sidebar Content - Drawer on Mobile */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          className="hidden md:flex w-72 border-r border-gray-800 bg-[#0f0f0f] p-4 flex-col gap-4 z-20"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              {activeTab}
            </h2>
            <button className="text-gray-500 hover:text-gray-300">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Conditional Modules Content */}
            {activeTab === 'uploads' && (
               <div className="flex flex-col gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-gray-800 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group bg-gray-900/50">
                     <div className="p-3 bg-gray-800 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-all"><Upload className="w-5 h-5" /></div>
                     <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300">Upload Image</span>
                  </button>
               </div>
            )}
            {activeTab === 'elements' && (
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => { const c = getCanvas(); if(c) addRect(c, properties); }} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 flex flex-col items-center justify-center gap-2 group transition-all">
                     <Square className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                     <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Square</span>
                  </button>
                  <button onClick={() => { const c = getCanvas(); if(c) addCircle(c, properties); }} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 flex flex-col items-center justify-center gap-2 group transition-all">
                     <Circle className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                     <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Circle</span>
                  </button>
                  <button onClick={() => { const c = getCanvas(); if(c) addTriangle(c, properties); }} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 flex flex-col items-center justify-center gap-2 group transition-all">
                     <Triangle className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                     <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Triangle</span>
                  </button>
                  <button onClick={() => { const c = getCanvas(); if(c) addStar(c, properties); }} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 flex flex-col items-center justify-center gap-2 group transition-all">
                     <Star className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
                     <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Star</span>
                  </button>
               </div>
            )}
            {activeTab === 'text' && (
               <div className="flex flex-col gap-3">
                  <button onClick={() => { const c = getCanvas(); if(c) addText(c, 'Heading', { ...properties, fontSize: 60, fontWeight: 'bold' }); }} className="w-full p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 text-left transition-all"><span className="text-2xl font-bold">Heading</span></button>
                  <button onClick={() => { const c = getCanvas(); if(c) addText(c, 'Subheading', { ...properties, fontSize: 40 }); }} className="w-full p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 text-left transition-all"><span className="text-lg font-semibold">Subheading</span></button>
               </div>
            )}
            {activeTab === 'layers' && <LayersPanel canvas={getCanvas()} />}
         </div>
        </motion.div>
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-gray-800 bg-[#0f0f0f] flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-1 border-r border-gray-800 pr-2 md:pr-6 shrink-0">
                <button onClick={handleUndo} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-20" disabled={!state.canUndo}><Undo2 className="w-4 md:w-5 h-4 md:h-5" /></button>
                <button onClick={handleRedo} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 disabled:opacity-20" disabled={!state.canRedo}><Redo2 className="w-4 md:w-5 h-4 md:h-5" /></button>
             </div>
             
             {/* Dynamic Toolbar */}
             {state.selectedObjects.length > 0 && (
                <div className="flex items-center gap-1 md:gap-2 border-r border-gray-800 pr-2 md:pr-6 mr-1 md:mr-2 shrink-0">
                   {state.selectedObjects.length > 1 && (
                     <button onClick={() => { const c = getCanvas(); if (c) { const active = c.getActiveObject(); if (active?.type === 'activeSelection') { (active as any).toGroup(); c.renderAll(); } } }} className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Group"><Layers className="w-4 md:w-5 h-4 md:h-5" /></button>
                   )}
                   <button onClick={handleDuplicate} className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Duplicate"><Copy className="w-4 md:w-5 h-4 md:h-5" /></button>
                   <button onClick={handleBringToFront} className="hidden sm:block p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Bring to Front"><ArrowUp className="w-4 md:w-5 h-4 md:h-5" /></button>
                   <button onClick={handleFlipX} className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Flip Horizontal"><FlipHorizontal className="w-4 md:w-5 h-4 md:h-5" /></button>
                   <button onClick={() => { const c = getCanvas(); const active = c?.getActiveObject(); if (active) { c?.remove(active); c?.discardActiveObject(); c?.renderAll(); } }} className="p-1.5 md:p-2 hover:bg-red-950/30 hover:text-red-500 rounded-lg text-gray-400" title="Delete"><Trash2 className="w-4 md:w-5 h-4 md:h-5" /></button>
                </div>
             )}

             <div className="flex items-center gap-2 bg-gray-800/30 p-1 rounded-lg shrink-0 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-none">
                {[
                  { id: 'select', icon: MousePointer2, label: 'Select' },
                  { id: 'text', icon: Type, label: 'Text' },
                  { id: 'rect', icon: Square, label: 'Shape' },
                  { id: 'draw', icon: Pencil, label: 'Draw' },
                  { id: 'image', icon: ImageIcon, label: 'Image' },
                ].map(t => (
                  <button key={t.id} onClick={() => {
                    setTool(t.id as ToolType);
                    setIsPropertiesOpen(false);
                  }} className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${state.activeTool === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>{t.label}</button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 px-2">
             <button 
               onClick={handleSave} 
               disabled={isSaving || !user}
               className="p-2 md:p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-all border border-gray-700 disabled:opacity-50 flex items-center gap-2"
               title="Save to Cloud"
             >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse text-blue-500' : ''}`} />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Save</span>
             </button>
             
             <button onClick={handleExportClick} className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95">
                <Download className="w-3 md:w-4 h-3 md:h-4" />
                <span className="hidden sm:inline">Export</span>
             </button>

             <div className="h-8 w-px bg-gray-800 mx-1 hidden sm:block" />
             <UserInfo />
          </div>
        </header>

        {/* Canvas Engine */}
        <div className="flex-1 relative bg-[#050505] overflow-hidden">
          <FabricCanvas ref={canvasRef} />
          
          {/* Zoom Controls Optimized */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 flex items-center gap-2 md:gap-4 bg-[#0f0f0f]/90 backdrop-blur-md border border-gray-800 px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-2xl shadow-2xl z-10 transition-all">
             <button className="hidden md:block text-gray-400 hover:text-white"><Grid className="w-4 h-4" /></button>
             <div className="flex items-center gap-1">
               <button onClick={() => canvasRef.current?.setZoom((canvasRef.current?.getZoom() || 1) * 0.9)} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ZoomOut className="w-4 h-4" /></button>
               <span className="text-[9px] md:text-[10px] font-mono text-gray-400 w-8 md:w-10 text-center uppercase tracking-tighter">{Math.round((canvasRef.current?.getZoom() || 1) * 100)}%</span>
               <button onClick={() => canvasRef.current?.setZoom((canvasRef.current?.getZoom() || 1) * 1.1)} className="p-1 hover:bg-gray-800 rounded text-gray-400"><ZoomIn className="w-4 h-4" /></button>
             </div>
             <button onClick={() => canvasRef.current?.setZoom(1)} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-blue-500 transition-colors ml-1">Reset</button>
          </div>
        </div>

        {/* Mobile Toolbar (Visible only on small screens) */}
        <div className="md:hidden h-16 border-t border-gray-800 bg-[#0f0f0f] flex items-center justify-around px-2 z-10 shrink-0">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'settings' && state.selectedObjects.length > 0) {
                  setIsPropertiesOpen(!state.isPropertiesOpen);
                  setActiveTab('');
                } else {
                  setActiveTab(activeTab === tab.id ? '' : tab.id);
                  setIsPropertiesOpen(false);
                }
              }}
              className={`flex flex-col items-center gap-0.5 transition-all ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-500/10' : ''}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-medium uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Overlay for activeTab */}
        <AnimatePresence>
          {activeTab && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="md:hidden absolute inset-x-0 bottom-16 top-0 bg-[#0f0f0f]/95 backdrop-blur-xl z-20 overflow-y-auto p-4 flex flex-col pt-12"
            >
              <button onClick={() => setActiveTab('')} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full"><Plus className="w-5 h-5 rotate-45 text-gray-400" /></button>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 px-2">{activeTab}</h2>
              {/* Reuse Desktop Sidebar Modules here or mobile specific ones */}
              {activeTab === 'uploads' && (
                 <div className="flex flex-col gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gray-900/50">
                       <Upload className="w-6 h-6 text-blue-500" />
                       <span className="text-sm font-medium text-gray-400">Upload Image</span>
                    </button>
                 </div>
              )}
              {activeTab === 'elements' && (
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Square, label: 'Square', action: () => addRect(getCanvas()!, properties) },
                      { icon: Circle, label: 'Circle', action: () => addCircle(getCanvas()!, properties) },
                      { icon: Triangle, label: 'Triangle', action: () => addTriangle(getCanvas()!, properties) },
                      { icon: Star, label: 'Star', action: () => addStar(getCanvas()!, properties) },
                    ].map(item => (
                      <button key={item.label} onClick={() => { item.action(); setActiveTab(''); }} className="bg-gray-800/50 border border-gray-800 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all">
                        <item.icon className="w-8 h-8 text-blue-500" />
                        <span className="text-xs text-gray-400">{item.label}</span>
                      </button>
                    ))}
                 </div>
              )}
              {activeTab === 'text' && (
                 <div className="flex flex-col gap-4">
                    <button onClick={() => { addText(getCanvas()!, 'Heading', { ...properties, fontSize: 60, fontWeight: 'bold' }); setActiveTab(''); }} className="p-6 bg-gray-800/50 border border-gray-800 rounded-2xl text-xl font-bold">Add Heading</button>
                    <button onClick={() => { addText(getCanvas()!, 'Subheading', { ...properties, fontSize: 40 }); setActiveTab(''); }} className="p-6 bg-gray-800/50 border border-gray-800 rounded-2xl text-lg">Add Subheading</button>
                 </div>
              )}
              {activeTab === 'layers' && <LayersPanel canvas={getCanvas()} />}
              {activeTab === 'ai' && (
                 <div className="flex flex-col gap-4">
                    <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl mb-4">
                       <p className="text-xs text-blue-400 leading-relaxed">Transform your designs with Gemini AI Power.</p>
                    </div>
                    <button onClick={() => { setIsExportOpen(true); setActiveTab(''); }} className="w-full p-4 bg-white text-black rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                       <Sparkles className="w-5 h-5 text-blue-500" /> AI Magic Edit
                    </button>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Properties Panel - Desktop Only Sidebar, Absolute Overlay on Mobile */}
      <AnimatePresence>
        {(state.isPropertiesOpen && state.selectedObjects.length > 0) && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="md:w-72 md:border-l border-gray-800 bg-[#0f0f0f] md:p-6 p-4 flex flex-col gap-6 z-40 fixed md:relative bottom-0 inset-x-0 md:inset-auto max-h-[70vh] md:max-h-full overflow-y-auto rounded-t-3xl md:rounded-none shadow-2xl md:shadow-none"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
               <div className="flex items-center gap-3">
                 <Settings className="w-5 h-5 text-blue-500" />
                 <h3 className="text-sm font-bold uppercase tracking-widest tracking-tighter sm:tracking-widest">Properties</h3>
               </div>
               <button 
                onClick={() => {
                  const c = getCanvas();
                  c?.discardActiveObject();
                  c?.renderAll();
                }}
                className="md:hidden p-2 hover:bg-gray-800 rounded-full"
               >
                 <Plus className="w-5 h-5 rotate-45 text-gray-400" />
               </button>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* Properties content moved here... */}
               <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Appearance</label>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-gray-400">
                           {state.selectedObjects[0]?.type === 'i-text' ? 'Text Color' : 'Fill Color'}
                        </span>
                        <div className="flex flex-col gap-3">
                           <div className="h-10 w-full rounded-xl border border-gray-700 bg-gray-800 overflow-hidden relative cursor-pointer group">
                              <div className="absolute inset-0" style={{ backgroundColor: properties.fill }} />
                              <input 
                                 type="color" 
                                 className="absolute inset-0 opacity-0 cursor-pointer" 
                                 value={properties.fill}
                                 onChange={(e) => handlePropertyChange({ fill: e.target.value })}
                              />
                           </div>
                           
                           {/* Quick Palette */}
                           <div className="grid grid-cols-8 gap-1.5">
                              {['#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'].map(color => (
                                 <button
                                    key={color}
                                    onClick={() => handlePropertyChange({ fill: color })}
                                    className="w-full aspect-square rounded-md border border-gray-800 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: color }}
                                 />
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-gray-400">Opacity</span>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.1" 
                          className="w-full accent-blue-500"
                          value={properties.opacity}
                          onChange={(e) => handlePropertyChange({ opacity: parseFloat(e.target.value) })}
                        />
                     </div>
                  </div>
               </div>

               {state.selectedObjects[0].type === 'image' && (
                 <div className="flex flex-col gap-6 pt-6 border-t border-gray-800">
                    <div className="flex flex-col gap-4">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Adjustments</label>
                       
                       <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[11px] text-gray-400">
                            <span>Brightness</span>
                            <span className="font-mono">{Math.round(properties.brightness * 100)}%</span>
                          </div>
                          <input 
                             type="range" 
                             min="-1" max="1" step="0.01" 
                             className="w-full accent-blue-500"
                             value={properties.brightness}
                             onChange={(e) => {
                               const val = parseFloat(e.target.value);
                               handlePropertyChange({ brightness: val });
                               handleApplyFilter('Brightness', val);
                             }}
                          />
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[11px] text-gray-400">
                            <span>Contrast</span>
                            <span className="font-mono">{Math.round(properties.contrast * 100)}%</span>
                          </div>
                          <input 
                             type="range" 
                             min="-1" max="1" step="0.01" 
                             className="w-full accent-blue-500"
                             value={properties.contrast}
                             onChange={(e) => {
                               const val = parseFloat(e.target.value);
                               handlePropertyChange({ contrast: val });
                               handleApplyFilter('Contrast', val);
                             }}
                          />
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[11px] text-gray-400">
                            <span>Saturation</span>
                            <span className="font-mono">{Math.round(properties.saturation * 100)}%</span>
                          </div>
                          <input 
                             type="range" 
                             min="-1" max="1" step="0.01" 
                             className="w-full accent-blue-500"
                             value={properties.saturation}
                             onChange={(e) => {
                               const val = parseFloat(e.target.value);
                               handlePropertyChange({ saturation: val });
                               handleApplyFilter('Saturation', val);
                             }}
                          />
                       </div>
                    </div>
                 </div>
               )}

               {state.selectedObjects[0].type === 'i-text' && (
                 <div className="flex flex-col gap-6 pt-6 border-t border-gray-800">
                    <div className="flex flex-col gap-3">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Typography</label>
                       
                       <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-gray-400">Font Family</span>
                          <select 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-colors"
                            value={properties.fontFamily}
                            onChange={(e) => handlePropertyChange({ fontFamily: e.target.value })}
                          >
                             <option value="Inter">Inter (Sans)</option>
                             <option value="Georgia">Georgia (Serif)</option>
                             <option value="Courier New">Courier (Mono)</option>
                             <option value="Arial">Arial</option>
                          </select>
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-gray-400">Font Size ({properties.fontSize}px)</span>
                          <input 
                             type="range" 
                             min="10" max="200" step="1" 
                             className="w-full accent-blue-500"
                             value={properties.fontSize}
                             onChange={(e) => handlePropertyChange({ fontSize: parseInt(e.target.value) })}
                          />
                       </div>

                       <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => handlePropertyChange({ fontWeight: properties.fontWeight === 'bold' ? 'normal' : 'bold' })}
                            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${properties.fontWeight === 'bold' ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'}`}
                            title="Bold"
                          >
                             <Bold className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePropertyChange({ fontStyle: properties.fontStyle === 'italic' ? 'normal' : 'italic' })}
                            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${properties.fontStyle === 'italic' ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'}`}
                            title="Italic"
                          >
                             <Italic className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePropertyChange({ textAlign: 'left' })}
                            className="p-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-600 flex items-center justify-center"
                            title="Align Left"
                          >
                             <AlignLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePropertyChange({ textAlign: 'center' })}
                            className="p-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-600 flex items-center justify-center"
                            title="Align Center"
                          >
                             <AlignCenter className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 </div>
               )}
               {state.selectedObjects.length > 0 && (
                 <div className="flex flex-col gap-3 pt-6 border-t border-gray-800">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Selection Actions</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                          onClick={handleDuplicate}
                          className="flex items-center justify-center gap-2 p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-[11px] font-medium transition-all"
                       >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                       </button>
                       <button 
                          onClick={() => {
                            const c = getCanvas();
                            const active = c?.getActiveObject();
                            if (active) {
                              c?.remove(active);
                              c?.discardActiveObject();
                              c?.renderAll();
                            }
                          }}
                          className="flex items-center justify-center gap-2 p-2.5 bg-red-950/20 hover:bg-red-500 hover:text-white rounded-xl text-[11px] font-medium text-red-500 transition-all"
                       >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                       </button>
                    </div>

                    {state.selectedObjects.length > 1 && (
                       <button 
                          onClick={() => {
                            const c = getCanvas();
                            if (!c) return;
                            const active = c.getActiveObject();
                            if (active && active.type === 'activeSelection') {
                              (active as any).toGroup();
                              c.renderAll();
                            }
                          }}
                          className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold transition-all mt-1 shadow-lg shadow-blue-900/40"
                       >
                          <Layers2 className="w-5 h-5" /> Lock & Move Together
                       </button>
                    )}
                    
                    {state.selectedObjects.length === 1 && state.selectedObjects[0].type === 'group' && (
                       <button 
                          onClick={() => {
                            const c = getCanvas();
                            if (!c) return;
                            const active = c.getActiveObject();
                            if (active && active.type === 'group') {
                              (active as any).toActiveSelection();
                              c.renderAll();
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-[11px] font-bold transition-all mt-1 border border-gray-700"
                       >
                          <Layout className="w-4 h-4" /> Ungroup Elements
                       </button>
                    )}
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportOpen && (
          <ExportModal canvas={getCanvas()} onClose={() => setIsExportOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

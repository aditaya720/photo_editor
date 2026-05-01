import React from 'react';
import { Download, X, FileImage, FileType, Check, Sparkles } from 'lucide-react';
import { Canvas } from 'fabric';
import { motion, AnimatePresence } from 'motion/react';

interface ExportModalProps {
  canvas: Canvas | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ canvas, onClose }) => {
  const [format, setFormat] = React.useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = React.useState(0.92);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isPremium, setIsPremium] = React.useState(false);

  const handleExport = async (premium = false) => {
    if (!canvas) return;
    
    setIsExporting(true);
    
    // Simulate some "processing" for UX
    setTimeout(() => {
      const dataURL = canvas.toDataURL({
        format: format,
        quality: quality,
      });

      const link = document.createElement('a');
      link.download = `lumina-design-${Date.now()}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0f0f0f] border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        {/* Subtle Background Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full" />
        
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-bold tracking-tight">Export Design</h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="space-y-8">
           <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">File Format</label>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setFormat('png')}
                   className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${format === 'png' ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                 >
                    <FileImage className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                       <span className="text-sm font-bold">PNG</span>
                       <span className="text-[10px] opacity-60">Best for quality</span>
                    </div>
                    {format === 'png' && <Check className="w-4 h-4 ml-auto" />}
                 </button>
                 <button 
                   onClick={() => setFormat('jpeg')}
                   className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${format === 'jpeg' ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                 >
                    <FileType className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                       <span className="text-sm font-bold">JPG</span>
                       <span className="text-[10px] opacity-60">Best for web</span>
                    </div>
                    {format === 'jpeg' && <Check className="w-4 h-4 ml-auto" />}
                 </button>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quality</label>
                 <span className="text-xs font-mono text-blue-500">{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="1" step="0.01" 
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
           </div>

           <div className="flex flex-col gap-3">
             <button 
               onClick={() => handleExport(false)}
               disabled={isExporting}
               className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
             >
                {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5 opacity-60" />}
                Standard Export
             </button>

             <button 
               onClick={() => handleExport(true)}
               disabled={isExporting}
               className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] border border-blue-400/30"
             >
                <Sparkles className="w-5 h-5 text-yellow-400" />
                HD Export (Ultra Quality)
             </button>

           </div>
        </div>
      </motion.div>
    </div>
  );
};

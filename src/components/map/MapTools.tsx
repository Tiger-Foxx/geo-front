import { Plus, Minus, Home, Locate, Maximize } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface MapToolsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onLocate: () => void;
  onFullscreen: () => void;
  activeTool?: string;
}

export const MapTools = ({ onZoomIn, onZoomOut, onResetView, onLocate, onFullscreen, activeTool }: MapToolsProps) => {
  const tools = [
    { id: 'reset', icon: Home, action: onResetView, label: 'Vue Globale' },
    { id: 'locate', icon: Locate, action: onLocate, label: 'Ma Position' },
    { id: 'fullscreen', icon: Maximize, action: onFullscreen, label: 'Plein Écran' },
    { id: 'divider' },
    { id: 'zoom-in', icon: Plus, action: onZoomIn, label: 'Zoom +' },
    { id: 'zoom-out', icon: Minus, action: onZoomOut, label: 'Zoom -' },
  ];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-500 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-1.5 p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
        {tools.map((tool, idx) => {
          if (tool.id === 'divider') {
            return <div key={idx} className="h-px w-full bg-slate-200 dark:bg-white/10 my-0.5" />;
          }
          
          const Icon = tool.icon as any;
          
          return (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={tool.action}
              className={clsx(
                "p-2.5 rounded-xl transition-all duration-200 relative group",
                activeTool === tool.id 
                  ? "bg-cameroon-green text-white shadow-lg shadow-cameroon-green/30" 
                  : "text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              
              {/* Tooltip Left */}
              <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                {tool.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

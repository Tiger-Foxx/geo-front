import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Map, Table, Settings, ChevronLeft, Wheat, Beef, Fish, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

type ViewMode = 'map' | 'table';
export type ThemeMode = 'agriculture' | 'elevage' | 'peche' | 'overview';

import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  activeTheme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  activePanel: boolean;
  onTogglePanel: () => void;
  onSettingsClick?: () => void;
  children?: React.ReactNode;
}

export const Sidebar = ({ view, onViewChange, activeTheme, onThemeChange, activePanel, onTogglePanel, onSettingsClick, children }: SidebarProps) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    // Strict priority: 1. LocalStorage. Default: Light.
    const saved = localStorage.getItem('fox_theme');
    return saved === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Reset basemap override when user manually toggles theme
    localStorage.removeItem('fox_basemap_user_override');
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fox_theme', 'dark');
      // Dispatch event for other components (like Map) to react
      window.dispatchEvent(new Event('theme-change'));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fox_theme', 'light');
      window.dispatchEvent(new Event('theme-change'));
    }
  }, [isDark]);

  const mainNav = [
    { id: 'overview', icon: LayoutGrid, label: 'Vue Globale', type: 'theme' },
    { id: 'agriculture', icon: Wheat, label: 'Agriculture', type: 'theme' },
    { id: 'elevage', icon: Beef, label: 'Élevage', type: 'theme' },
    { id: 'peche', icon: Fish, label: 'Pêche', type: 'theme' },
  ];

  return (
    <div className="fixed inset-y-4 left-4 z-[3000] flex gap-4 pointer-events-none">
      {/* 1. Thin Utility Dock (The "Apple" Dock) */}
      <motion.div 
         initial={{ x: -20, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         className="w-16 h-full flex flex-col items-center py-4 gap-4 glass rounded-3xl pointer-events-auto shadow-2xl relative z-20"
      >
        {/* Brand - Coat of Arms */}
        <div 
           className="w-12 h-12 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-slate-900/10 dark:shadow-black/50 bg-white dark:bg-neutral-900 p-1.5 hover:scale-105 transition-transform cursor-pointer group border border-slate-100 dark:border-white/5"
           onClick={() => navigate('/')}
        >
           <img 
             src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Coat_of_arms_of_Cameroon.svg" 
             alt="Cameroun" 
             className="w-full h-full object-contain drop-shadow-sm group-hover:rotate-3 transition-transform duration-500"
           />
        </div>
        
        {/* Core View Switcher (Map vs Table) */}
        <div className="p-1.5 bg-slate-100/50 dark:bg-neutral-900/50 rounded-2xl flex flex-col gap-2 mb-4 backdrop-blur-sm border border-slate-200/50 dark:border-white/5">
            <button 
                onClick={() => onViewChange('map')}
                className={clsx(
                    "p-2 rounded-xl transition-all duration-300",
                    view === 'map' ? "bg-white dark:bg-neutral-800 text-cameroon-green shadow-md dark:shadow-black/50" : "text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300"
                )}
                title="Vue Carte"
            >
                <Map size={20} />
            </button>
             <button 
                onClick={() => onViewChange('table')}
                 className={clsx(
                    "p-2 rounded-xl transition-all duration-300",
                    view === 'table' ? "bg-white dark:bg-neutral-800 text-cameroon-green shadow-md dark:shadow-black/50" : "text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300"
                )}
                title="Vue Tabulaire"
            >
                <Table size={20} />
            </button>
        </div>

        <div className="w-8 h-[1px] bg-slate-200 dark:bg-neutral-800" />

        {/* Thematic Navigation */}
        <div className="flex flex-col gap-3 w-full px-2">
             {mainNav.map((item) => (
                <button
                    key={item.id}
                    onClick={() => {
                        if (activeTheme === item.id) {
                            onTogglePanel();
                        } else {
                            onThemeChange(item.id as ThemeMode);
                            if (!activePanel) onTogglePanel();
                        }
                    }}
                    className={clsx(
                    "group relative p-3 rounded-xl transition-all duration-300 flex justify-center items-center",
                    activeTheme === item.id 
                        ? "bg-cameroon-green text-white shadow-lg shadow-cameroon-green/25" 
                        : "text-slate-400 dark:text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 hover:text-cameroon-green dark:hover:text-cameroon-green hover:shadow-sm"
                    )}
                >
                    <item.icon size={22} strokeWidth={1.5} />
                    
                    {/* Tooltip - z-index boosted and absolute positioning tweaked */}
                    <span className="absolute left-16 px-3 py-1.5 bg-slate-900 dark:bg-neutral-800 text-white dark:text-neutral-200 text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 whitespace-nowrap pointer-events-none z-[9999] shadow-xl border border-white/10">
                        {item.label}
                    </span>

                    {activeTheme === item.id && (
                        <motion.div layoutId="active-indicator" className="absolute -right-2 w-1 h-3 bg-cameroon-green rounded-full" />
                    )}
                </button>
            ))}
        </div>
        
        <div className="mt-auto flex flex-col gap-4">
             <button 
                onClick={toggleTheme}
                className="p-3 text-slate-400 dark:text-neutral-500 hover:text-cameroon-green dark:hover:text-yellow-400 transition-colors bg-white/0 hover:bg-white/50 dark:hover:bg-neutral-800 rounded-xl"
            >
                {isDark ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
            </button>
             <button 
                onClick={onSettingsClick}
                className="p-3 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-white/0 hover:bg-white/50 dark:hover:bg-neutral-800 rounded-xl"
            >
                <Settings size={22} strokeWidth={1.5} />
            </button>
        </div>
      </motion.div>

      {/* 2. Floating Content Panel (The "Sheet") */}
      <AnimatePresence mode="wait">
        {activePanel && (
          <motion.div
            initial={{ x: -20, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-80 h-full glass-panel rounded-3xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className={clsx("p-2 rounded-lg bg-green-50 dark:bg-cameroon-green/10 text-cameroon-green")}>
                    {activeTheme === 'agriculture' && <Wheat size={18} />}
                    {activeTheme === 'elevage' && <Beef size={18} />}
                    {activeTheme === 'peche' && <Fish size={18} />}
                    {activeTheme === 'overview' && <LayoutGrid size={18} />}
                 </div>
                 <h2 className="font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                    {activeTheme === 'overview' ? 'Vue Globale' : activeTheme}
                 </h2>
              </div>
              <button 
                onClick={onTogglePanel} 
                className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <div className="h-full">
                  {children}
                  {/* Fallback internal nav if children not provided */}
                  {!children && (
                      <div className="p-4 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                          Sélectionnez une catégorie
                      </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



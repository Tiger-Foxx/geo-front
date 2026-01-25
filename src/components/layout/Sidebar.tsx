import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Map, Table, Settings, ChevronLeft, Wheat, Beef, Fish, Moon, Sun, Menu, X, Command } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'map' | 'table';
export type ThemeMode = 'agriculture' | 'elevage' | 'peche' | 'overview';

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

export const Sidebar = ({ 
    view, 
    onViewChange, 
    activeTheme, 
    onThemeChange, 
    activePanel, 
    onTogglePanel, 
    onSettingsClick, 
    children 
}: SidebarProps) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fox_theme');
    return saved === 'dark';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.removeItem('fox_basemap_user_override'); // Reset basemap on theme toggle
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('fox_theme', 'dark');
      window.dispatchEvent(new Event('theme-change'));
    } else {
      root.classList.remove('dark');
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
    <>
      {/* --- MOBILE NAVIGATION TOGGLE --- */}
      <div className="md:hidden fixed z-[3010] top-2 left-2">
         <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
             className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-lg text-slate-900 dark:text-white"
         >
           {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
         </motion.button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3005] md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-y-0 left-0 z-[3000] flex items-start pointer-events-none p-2 md:p-4 gap-4">
        
        {/* --- 1. THE DOCK (SIDEBAR STRIP) - NOW ADAPTIVE HEIGHT --- */}
        <motion.div 
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           className={clsx(
             "pointer-events-auto w-12 md:w-14 rounded-2xl flex flex-col items-center py-3 md:py-4 gap-3 glass",
             "transition-transform duration-300 ease-in-out border border-white/20 dark:border-white/5 shadow-xl shadow-slate-900/5",
             isMobileSidebarOpen ? "translate-x-0" : "-translate-x-[200%] md:translate-x-0"
           )}
        >
          {/* BRAND */}
          <div 
             className="w-8 h-8 md:w-9 md:h-9 relative cursor-pointer group"
             onClick={() => navigate('/')}
          >
             <div className="absolute inset-0 bg-cameroon-green/20 dark:bg-white/10 rounded-lg rotate-0 group-hover:rotate-12 transition-transform duration-500 blur-md" />
             <div className="relative w-full h-full bg-white dark:bg-neutral-900 rounded-lg p-1 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Coat_of_arms_of_Cameroon.svg" 
                  alt="Republic of Cameroon" 
                  className="w-full h-full object-contain"
                />
             </div>
          </div>

          <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10" />

          {/* VIEW SWITCHER (Map vs Table) */}
          <div className="flex flex-col gap-1.5 w-full px-1.5">
              <ViewButton 
                active={view === 'map'} 
                icon={Map} 
                onClick={() => onViewChange('map')} 
                label="Carte Interactive" 
              />
              <ViewButton 
                active={view === 'table'} 
                icon={Table} 
                onClick={() => onViewChange('table')} 
                label="Données Tabulaires" 
              />
          </div>

          <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10" />

          {/* THEMATIC NAVIGATION */}
          <div className="flex flex-col gap-1.5 w-full px-1.5">
             {mainNav.map((item) => (
                <NavButton
                   key={item.id}
                   item={item}
                   isActive={activeTheme === item.id}
                   onClick={() => {
                        if (activeTheme === item.id) {
                            onTogglePanel();
                        } else {
                            onThemeChange(item.id as ThemeMode);
                            if (!activePanel) onTogglePanel();
                        }
                   }}
                   isPanelOpen={activePanel}
                   onVerify={() => setHoveredNav(item.id)}
                   onLeave={() => setHoveredNav(null)}
                />
             ))}
          </div>
          
          <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10" />

          {/* BOTTOM CONTROLS - NO MORE mt-auto, dock is now adaptive */}
          <div className="flex flex-col gap-1.5 w-full px-1.5">
             <ViewButton 
                active={false}
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                label={isDark ? 'Mode Clair' : 'Mode Sombre'}
                variant="utility"
             />
             <ViewButton 
                 active={false}
                 icon={Settings}
                 onClick={onSettingsClick || (() => {})}
                 label="Paramètres"
                 variant="utility"
             />
          </div>
        </motion.div>

        {/* --- 2. THE CONTROL PANEL (FLOATING SHEET) - ADAPTIVE HEIGHT --- */}
        <AnimatePresence mode="wait">
          {activePanel && (
            <motion.div
              initial={{ x: -20, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -20, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="pointer-events-auto w-[85vw] sm:w-[320px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl rounded-2xl glass-panel relative z-[2900] overflow-hidden border border-white/60 dark:border-white/10"
            >
              {/* DECORATIVE HEADER GLOW */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-cameroon-green/5 to-transparent pointer-events-none" />

              {/* PANEL HEADER - More compact */}
              <div className="flex-none p-4 pb-2 relative z-10">
                 <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-white dark:from-neutral-800 dark:to-neutral-900 border border-slate-200/50 dark:border-white/10 shadow-sm">
                          {activeTheme === 'agriculture' && <Wheat size={20} className="text-cameroon-green" />}
                          {activeTheme === 'elevage' && <Beef size={20} className="text-amber-600" />}
                          {activeTheme === 'peche' && <Fish size={20} className="text-blue-500" />}
                          {activeTheme === 'overview' && <LayoutGrid size={20} className="text-slate-600 dark:text-neutral-300" />}
                       </div>
                       <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight capitalize leading-tight">
                             {activeTheme === 'overview' ? 'Référentiel' : activeTheme}
                          </h2>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                             {activeTheme === 'overview' ? 'Admin.' : 'Analyse'}
                          </p>
                       </div>
                    </div>
                    <button 
                        onClick={onTogglePanel}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-neutral-500 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                 </div>
              </div>

              {/* SCROLLABLE CONTENT AREA */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 relative z-10">
                  <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                     className="flex flex-col gap-6"
                  >
                     {children}
                  </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};


// --- SUB-COMPONENTS FOR CLEANER CODE ---

const ViewButton = ({ active, icon: Icon, onClick, label, variant = 'primary' }: any) => (
  <div className="relative group w-full flex justify-center">
      <button 
        onClick={onClick}
        className={clsx(
            "p-2.5 rounded-xl transition-all duration-300 relative z-10",
            active 
              ? "text-white shadow-lg shadow-cameroon-green/20" 
              : "text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200"
        )}
      >
        <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      </button>
      
      {/* Active Background Pill */}
      {active && (
         <motion.div 
            layoutId="activeViewParams"
            className="absolute inset-0 bg-cameroon-green rounded-xl z-0"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
         />
      )}

      {/* Tooltip */}
      <span className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[4000] pointer-events-none shadow-xl">
         {label}
         <svg className="absolute text-slate-900 h-2 w-full left-0 top-1/2 -translate-x-[4px] -translate-y-1/2 rotate-90" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
      </span>
  </div>
);

const NavButton = ({ item, isActive, onClick, isPanelOpen, onVerify, onLeave }: any) => (
  <div className="relative group w-full flex justify-center" onMouseEnter={onVerify} onMouseLeave={onLeave}>
     <button
        onClick={onClick}
        className={clsx(
            "p-2.5 rounded-xl transition-all duration-300 relative z-10 w-full flex items-center justify-center",
            isActive 
                 ? "text-white" 
                 : "text-slate-400 dark:text-neutral-500 hover:text-cameroon-green dark:hover:text-cameroon-green"
        )}
     >
        <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
     </button>

     {/* Active Background */}
     {isActive && (
        <motion.div 
            layoutId="activeThemeBg"
            className="absolute inset-0 bg-cameroon-green shadow-lg shadow-cameroon-green/20 rounded-xl z-0"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
         />
     )}
     
     {/* Panel Connection Indicator (Small pip when panel is open) */}
     {isActive && isPanelOpen && (
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cameroon-green shadow-[0_0_10px_rgba(5,107,50,0.5)] z-[3005]"
        />
     )}

     {/* Tooltip */}
      <span className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[4000] pointer-events-none shadow-xl">
         {item.label}
         <svg className="absolute text-slate-900 h-2 w-full left-0 top-1/2 -translate-x-[4px] -translate-y-1/2 rotate-90" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
      </span>
  </div>
);



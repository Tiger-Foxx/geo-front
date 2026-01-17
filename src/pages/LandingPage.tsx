import { motion } from 'framer-motion';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

/* Topographic contour lines component */
const ContourLines = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-slate-800 dark:text-neutral-400" viewBox="0 0 100 100" preserveAspectRatio="none">
    <motion.path
      d="M0 50 Q 25 30, 50 50 T 100 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.1"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 3, ease: "easeInOut" }}
    />
    <motion.path
      d="M0 60 Q 25 40, 50 60 T 100 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.1"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 3.5, ease: "easeInOut", delay: 0.5 }}
    />
  </svg>
);

export const LandingPage = () => {
  const [isDark, setIsDark] = useState(() => {
    // Priority: LocalStorage -> Default Light
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
      window.dispatchEvent(new Event('theme-change'));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fox_theme', 'light');
      window.dispatchEvent(new Event('theme-change'));
    }
  }, [isDark]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50 dark:bg-black flex flex-col font-sans transition-colors duration-500">
      
      {/* 1. Flag Stripe Top Line */}
      <div className="w-full h-1 flex z-50 fixed top-0 left-0">
          <div className="h-full w-1/3 bg-cameroon-green" />
          <div className="h-full w-1/3 bg-cameroon-red" />
          <div className="h-full w-1/3 bg-cameroon-yellow" />
      </div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-50/50 via-white to-white dark:from-green-900/5 dark:via-black dark:to-black z-0" />
      <div className="absolute inset-0 z-0">
         <ContourLines />
      </div>

      <nav className="relative z-50 w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Coat_of_arms_of_Cameroon.svg" alt="Cameroun" className="h-12 w-auto drop-shadow-sm" />
              <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 dark:text-neutral-500">République du Cameroun</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">MINADER / MINEPIA</span>
              </div>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600 dark:text-neutral-400 items-center">
             <span className="cursor-pointer hover:text-cameroon-green transition-colors">Documentation</span>
             <span className="cursor-pointer hover:text-cameroon-green transition-colors">Open Data</span>
             
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-white/50 dark:bg-neutral-900/80 backdrop-blur-md border border-white dark:border-white/10 shadow-sm hover:scale-110 transition-all text-slate-600 dark:text-yellow-400"
             >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
      </nav>

      {/* Hero Content */}
      <main className="z-10 relative flex-1 w-full max-w-7xl px-6 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text & CTA */}
        <div className="space-y-10 text-left pt-10 md:pt-0">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
         
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6">
              L'Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cameroon-green via-green-700 to-slate-800 dark:to-slate-100">
                Territoriale.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 dark:text-neutral-400 font-light max-w-xl leading-relaxed border-l-2 border-cameroon-red pl-6">
              Analysez les dynamiques agropastorales et halieutiques du Cameroun grâce à la puissance du Big Data spatial.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <Link to="/geoportal" className="group">
              <button className="flex items-center gap-4 bg-gradient-to-r from-cameroon-green to-green-800 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-green-900/20 hover:shadow-2xl hover:shadow-green-900/30 transition-all hover:-translate-y-1">
                Accéder au Géoportail
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                    <ChevronRight size={18} />
                </div>
              </button>
            </Link>
            <div className="flex items-center gap-4 pl-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 border border-slate-100 dark:border-white/10 flex items-center justify-center p-2 shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Coat_of_arms_of_Cameroon.svg" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 w-24 leading-snug">Données officielles certifiées</span>
            </div>
          </motion.div>

          {/* Metrics / Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-12 grid grid-cols-3 gap-8 py-8"
          >
              <div className="relative pl-4">
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-cameroon-green rounded-full" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">National</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Couverture</div>
              </div>
              <div className="relative pl-4">
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-cameroon-red rounded-full" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">Certifiées</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Données</div>
              </div>
               <div className="relative pl-4">
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-cameroon-yellow rounded-full" />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">Public</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Accès</div>
              </div>
          </motion.div>
        </div>

        {/* Right: Visual */}
        <motion.div
             initial={{ opacity: 0, scale: 0.8, x: 50 }}
             animate={{ opacity: 1, scale: 1, x: 0 }}
             transition={{ duration: 1.2, ease: "easeOut" }}
             className="relative hidden lg:flex h-[600px] w-full items-center justify-center"
        >
             <div className="relative w-full h-full flex items-center justify-center">
                {/* Glow effect */}
                <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-green-100/50 via-yellow-100/30 to-red-100/30 dark:from-green-500/10 dark:via-yellow-500/5 dark:to-red-500/5 rounded-full blur-[80px] opacity-60" />
                
                <img 
                    src="/—Pngtree—cameroon watercolor brush flag_8835971.png" 
                    alt="Cameroun" 
                    className="w-[140%] h-auto object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-1000 ease-in-out dark:brightness-110"
                />
             </div>
        </motion.div>
      </main>
    </div>
  );
};


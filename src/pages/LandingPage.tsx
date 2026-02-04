import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Globe, Layers, Activity, ArrowRight, Sun, Moon, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

/**
 * COMPOSANT: TOPOGRAPHIC FIELD
 * Un fond vivant qui simule des courbes de niveau en mouvement lent.
 * Crée une profondeur subtile sans distraire.
 */
const TopographicField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {[1, 2, 3, 4].map((i) => (
        <motion.path
          key={i}
          d={`M-10 ${20 * i} Q 30 ${10 * i}, 50 ${25 * i} T 110 ${20 * i}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.15"
          className="text-slate-900 dark:text-white"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            d: [
               `M-10 ${20 * i} Q 30 ${10 * i}, 50 ${25 * i} T 110 ${20 * i}`,
               `M-10 ${22 * i} Q 30 ${12 * i}, 50 ${23 * i} T 110 ${22 * i}`,
               `M-10 ${20 * i} Q 30 ${10 * i}, 50 ${25 * i} T 110 ${20 * i}`
            ]
          }}
          transition={{ 
            duration: 10 + i * 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 0.5 
          }}
        />
      ))}
    </svg>
  </div>
);

/**
 * COMPOSANT: STAT TICKET
 * Affiche une métrique clé avec une animation de comptage ou d'apparition.
 */
const StatTicket = ({ label, value, icon: Icon, delay }: { label: string, value: string, icon: any, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    className="flex flex-col gap-1 p-4 rounded-xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-sm"
  >
    <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 mb-1">
      <Icon size={14} />
      <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
    </div>
    <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">{value}</span>
  </motion.div>
);

export const LandingPage = () => {
  const [isDark, setIsDark] = useState(() => {
    // Priority: LocalStorage -> Default Light
    const saved = localStorage.getItem('fox_theme');
    return saved === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
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

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-[#Fdfdfd] dark:bg-[#050505] text-slate-900 dark:text-white font-sans selection:bg-cameroon-green/30 transition-colors duration-500">
      
      {/* --- DECORATIVE ELEMENTS --- */}
      <TopographicField />
      
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-cameroon-green/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-cameroon-red/5 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Flag Stripe (Minimalist) */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 flex opacity-80">
        <div className="flex-1 bg-cameroon-green" />
        <div className="flex-1 bg-cameroon-red" />
        <div className="flex-1 bg-cameroon-yellow" />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="relative z-40 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Coat_of_arms_of_Cameroon.svg" alt="Emblème" className="h-10 w-auto" />
          <div className="hidden md:flex flex-col border-l border-slate-200 dark:border-white/10 pl-4">
            <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 dark:text-neutral-500 uppercase">République du Cameroun</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">MINADER / MINEPIA</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-yellow-400"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <Link to="/geoportal" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white hover:text-cameroon-green transition-colors">
            <span>Accès Portail</span>
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 w-full px-6 pt-12 md:pt-20 lg:pt-32 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* TEXT CONTENT (Left - Spans 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-20">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cameroon-green/10 text-cameroon-green dark:text-green-400 text-xs font-bold tracking-wider mb-6 border border-cameroon-green/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            SYSTEME D'INFORMATION GEOGRAPHIQUE
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 text-slate-900 dark:text-white"
          >
            Vision <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cameroon-green via-green-600 to-slate-800 dark:to-slate-400">
              Territoriale.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-slate-600 dark:text-neutral-400 max-w-xl leading-relaxed mb-10 border-l-2 border-slate-200 dark:border-white/10 pl-6"
          >
            Une infrastructure nationale unifiée pour l'analyse agropastorale. 
            Découvrez le Cameroun à travers la puissance des données spatiales certifiées.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/geoportal" className="group relative w-full sm:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cameroon-green to-teal-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
              <button className="relative w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl text-lg font-bold hover:translate-y-[-2px] transition-all duration-300">
                <span>Explorer la Carte</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl text-slate-600 dark:text-neutral-400 font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-lg flex items-center justify-center gap-2">
              <Layers size={20} />
              <span>Catalogue</span>
            </button>
          </motion.div>

          {/* METRICS ROW */}
          <div className="mt-16 grid grid-cols-3 gap-3 md:gap-6 w-full max-w-2xl">
             <StatTicket label="Couches GIS" value="120+" icon={Layers} delay={0.6} />
             <StatTicket label="Régions" value="10" icon={Globe} delay={0.7} />
             <StatTicket label="Mise à jour" value="24h" icon={Activity} delay={0.8} />
          </div>
        </div>

        {/* VISUAL CONTENT (Right - Spans 5 cols) */}
        <div className="lg:col-span-5 relative h-[500px] lg:h-[700px] w-full flex items-center justify-center lg:justify-end">
           
           {/* Abstract Map Representation */}
           <motion.div 
             style={{ y }}
             className="relative w-full h-full flex items-center justify-center"
           >
              {/* Blur Backdrops */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-green-500/10 via-yellow-500/5 to-red-500/5 rounded-full blur-[100px]" />
              
              {/* Main Image Container */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md lg:max-w-full"
              >
                  <img 
                    src="/—Pngtree—cameroon watercolor brush flag_8835971.png" 
                    alt="Cameroun Map Visualization" 
                    className="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  
                  {/* Floating Certified Badge */}
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="absolute -bottom-4 -left-4 md:bottom-10 md:left-0 bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-white/5"
                  >
                     <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-cameroon-green">
                        <ShieldCheck size={24} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Données</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Certifiées État</span>
                     </div>
                  </motion.div>
              </motion.div>
           </motion.div>
        </div>

      </main>

    </div>
  );
};


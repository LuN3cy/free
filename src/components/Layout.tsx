import { Link, useLocation } from 'react-router-dom';
import { Home, Dices, TrendingUp, Sun, Moon } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Initial theme check
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    
    // Set dark as default if no class is present
    if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/generator', label: '生成', icon: Dices },
    { path: '/history', label: '走势', icon: TrendingUp },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
      {/* Ambient Background - Dark Mode Only */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block"></div>
      
      {/* Ambient Background - Light Mode Only */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none z-0 dark:hidden block"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-yellow/20 rounded-full blur-[120px] pointer-events-none z-0 dark:hidden block"></div>

      {/* Top Header Mobile/Desktop - Transparent */}
      <header className="w-full px-6 py-5 flex items-center justify-between gap-3 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-3xl">
            🤩
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            财富自由
          </h1>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full z-10 pb-28 md:pb-32 px-4 md:px-8 pt-2">
        <div className="max-w-5xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Floating Bottom Dock Navigation */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <nav className="glass-effect rounded-2xl md:rounded-full p-2 flex items-center gap-1 md:gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto max-w-full overflow-x-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-full transition-all duration-300 min-w-[64px] md:min-w-0 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


import React, { ReactNode } from 'react';
import { View, UserProfile, Language } from '../types';
import { LayoutDashboard, History, Dumbbell, TrendingUp, Utensils, User, Sun, Moon, BookOpen, Languages } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  userProfile?: UserProfile | null;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, isDarkMode, toggleTheme, userProfile, language, setLanguage }) => {
  
  const labels = {
    zh: {
      dashboard: '儀錶板',
      workout: '訓練',
      tutorials: '教學',
      history: '記錄',
      progress: '進度',
      nutrition: '營養',
    },
    en: {
      dashboard: 'Dashboard',
      workout: 'Workout',
      tutorials: 'Tutorials',
      history: 'History',
      progress: 'Progress',
      nutrition: 'Nutrition',
    }
  };

  const t = labels[language];

  const navItems = [
    { view: View.DASHBOARD, label: t.dashboard, icon: LayoutDashboard },
    { view: View.WORKOUT, label: t.workout, icon: Dumbbell },
    { view: View.TUTORIALS, label: t.tutorials, icon: BookOpen },
    { view: View.HISTORY, label: t.history, icon: History },
    { view: View.PROGRESS, label: t.progress, icon: TrendingUp },
    { view: View.NUTRITION, label: t.nutrition, icon: Utensils },
  ];

  const renderAvatar = () => {
    if (userProfile?.avatar) {
      return <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />;
    }
    
    // Default avatar based on gender
    const isFemale = userProfile?.gender === 'female';
    return (
      <div className={`w-full h-full flex items-center justify-center ${isFemale ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
         <User size={18} strokeWidth={2.5} />
      </div>
    );
  };

  const toggleLanguage = () => {
      setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2" onClick={() => setCurrentView(View.DASHBOARD)}>
           <Dumbbell className="w-6 h-6 text-cta-orange" />
           <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">Gohopro</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal-800 text-gray-500 transition-colors flex items-center gap-1"
          >
             <Languages size={20} />
             <span className="text-xs font-bold">{language === 'zh' ? '中' : 'EN'}</span>
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal-800 text-gray-500 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setCurrentView(View.SETTINGS)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 active:border-cta-orange transition-colors"
          >
             {renderAvatar()}
          </button>
        </div>
      </header>

      {/* Desktop Top Navbar */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 justify-between items-center shadow-sm transition-colors duration-300">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView(View.DASHBOARD)}>
           <Dumbbell className="w-8 h-8 text-cta-orange" />
           <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">Gohopro</h1>
        </div>
        
        <nav className="flex space-x-4">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                currentView === item.view 
                ? 'text-cta-orange bg-orange-50 dark:bg-orange-900/10 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-neon-blue hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1 font-bold text-sm"
          >
             <Languages size={18} />
             {language === 'zh' ? '中' : 'EN'}
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setCurrentView(View.SETTINGS)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-cta-orange transition-colors"
          >
            {renderAvatar()}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-20 md:mb-0 transition-all">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-between items-center px-4 py-1 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 min-w-[50px] flex-1 ${
                currentView === item.view 
                ? 'text-cta-orange' 
                : 'text-gray-500 dark:text-gray-500 hover:text-neon-blue'
              }`}
            >
              <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

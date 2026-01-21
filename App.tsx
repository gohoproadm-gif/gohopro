
import React, { useState, useEffect } from 'react';
import { View, NutritionLog, UserProfile, WorkoutRecord } from './types';
import { NUTRITION_LOGS, MOCK_HISTORY } from './constants';
import { apiGetUserProfile, apiSaveUserProfile, apiGetWorkoutHistory, apiSaveWorkoutRecord, apiGetNutritionLogs, apiSyncNutritionState, apiDeleteWorkoutRecord, apiDeleteNutritionLog } from './lib/db';
import { auth, onAuthStateChanged, signOut } from './lib/firebase'; // Updated import to include signOut

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Workout from './components/Workout';
import Progress from './components/Progress';
import Nutrition from './components/Nutrition';
import Tutorials from './components/Tutorials';
import Onboarding from './components/Onboarding';
import ProfileSettings from './components/ProfileSettings';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // To prevent flash of login screen

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [autoStartWorkout, setAutoStartWorkout] = useState<boolean>(false);
  
  // State for Data
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [historyLogs, setHistoryLogs] = useState<WorkoutRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Check Authentication on Mount
  useEffect(() => {
      if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
              setIsAuthenticated(!!user);
              setAuthChecked(true);
          });
          return () => unsubscribe();
      } else {
          // Fallback if auth is not initialized correctly
          setAuthChecked(true);
      }
  }, []);

  // 2. Fetch Data when Authenticated
  useEffect(() => {
      if (isAuthenticated) {
          fetchData();
      }
  }, [isAuthenticated]);

  const fetchData = async () => {
      setLoadingData(true);
      try {
          const profile = await apiGetUserProfile();
          setUserProfile(profile);

          const history = await apiGetWorkoutHistory();
          setHistoryLogs(history.length ? history : MOCK_HISTORY);

          const nutrition = await apiGetNutritionLogs();
          setNutritionLogs(nutrition.length ? nutrition : NUTRITION_LOGS);
      } catch (e) {
          console.error("Error loading data", e);
      } finally {
          setLoadingData(false);
      }
  };

  // Sync Nutrition Changes to DB/Local
  useEffect(() => {
      if (nutritionLogs.length > 0 && !loadingData) {
          apiSyncNutritionState(nutritionLogs);
      }
  }, [nutritionLogs, loadingData]);

  // Theme Toggling Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartQuickWorkout = () => {
    setAutoStartWorkout(true);
    setCurrentView(View.WORKOUT);
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    await apiSaveUserProfile(profile);
  };
  
  const handleLogout = async () => {
      if (auth) {
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Logout failed", error);
          }
      }
      setIsAuthenticated(false);
      setUserProfile(null);
      setCurrentView(View.DASHBOARD);
  };

  const handleFinishWorkout = async (record: WorkoutRecord) => {
      const newHistory = [record, ...historyLogs];
      setHistoryLogs(newHistory);
      await apiSaveWorkoutRecord(record);
      setCurrentView(View.HISTORY);
  };

  const handleDeleteRecord = async (recordId: string) => {
      // Confirmation handled in History component
      const newHistory = historyLogs.filter(h => h.id !== recordId);
      setHistoryLogs(newHistory);
      await apiDeleteWorkoutRecord(recordId);
  };

  const handleDeleteNutrition = async (logId: string) => {
      setNutritionLogs(prev => prev.filter(l => l.id !== logId));
      await apiDeleteNutritionLog(logId);
  };

  const handleGoToSettings = () => {
      setCurrentView(View.SETTINGS);
  };

  // --- RENDER FLOW ---

  // 1. Loading Auth State
  if (!authChecked) {
      return <div className="min-h-screen bg-charcoal-950 flex items-center justify-center text-white">Loading...</div>;
  }

  // 2. Login Screen (if not authenticated)
  if (!isAuthenticated) {
      return (
        <div className={isDarkMode ? 'dark' : ''}>
           <Login onLoginSuccess={() => setIsAuthenticated(true)} />
        </div>
      );
  }

  // 3. Data Loading
  if (loadingData) {
      return (
         <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-charcoal-950 text-white' : 'bg-gray-100 text-gray-800'}`}>
            <div className="animate-spin w-10 h-10 border-4 border-neon-blue border-t-transparent rounded-full"></div>
            <p className="text-sm font-bold opacity-70">同步資料中...</p>
         </div>
      );
  }

  // 4. Onboarding (if authenticated but no profile)
  if (!userProfile) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
         <Onboarding onSave={handleSaveProfile} />
      </div>
    );
  }

  // 5. Main App
  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard 
            onStartWorkout={handleStartQuickWorkout} 
            nutritionLogs={nutritionLogs}
            userProfile={userProfile!}
          />
        );
      case View.HISTORY:
        return <History logs={historyLogs} onDeleteRecord={handleDeleteRecord} />;
      case View.WORKOUT:
        return (
          <Workout 
            autoStart={autoStartWorkout} 
            onAutoStartConsumed={() => setAutoStartWorkout(false)} 
            onFinishWorkout={handleFinishWorkout}
            historyLogs={historyLogs} 
            userProfile={userProfile!} 
            onGoToSettings={handleGoToSettings}
            nutritionLogs={nutritionLogs}
            onDeleteNutrition={handleDeleteNutrition}
          />
        );
      case View.PROGRESS:
        return <Progress historyLogs={historyLogs} />;
      case View.NUTRITION:
        return (
          <Nutrition 
            logs={nutritionLogs}
            setLogs={setNutritionLogs}
            userProfile={userProfile!} 
            onGoToSettings={handleGoToSettings}
          />
        );
      case View.TUTORIALS:
        return <Tutorials userProfile={userProfile!} onGoToSettings={handleGoToSettings} />;
      case View.SETTINGS:
          return (
            <ProfileSettings 
                userProfile={userProfile!} 
                onUpdateProfile={handleSaveProfile}
                onLogout={handleLogout}
            />
          );
      default:
        return <Dashboard onStartWorkout={handleStartQuickWorkout} nutritionLogs={nutritionLogs} userProfile={userProfile!} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={setCurrentView}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      userProfile={userProfile}
    >
      {renderView()}
    </Layout>
  );
};

export default App;

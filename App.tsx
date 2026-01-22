
import React, { useState, useEffect } from 'react';
import { View, NutritionLog, UserProfile, WorkoutRecord, Language, DailyPlan } from './types';
import { NUTRITION_LOGS, MOCK_HISTORY, USER_PROFILE } from './constants';
import { apiGetUserProfile, apiSaveUserProfile, apiGetWorkoutHistory, apiSaveWorkoutRecord, apiGetNutritionLogs, apiSyncNutritionState, apiDeleteWorkoutRecord, apiDeleteNutritionLog, apiGetSystemKeys } from './lib/db';
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
  const [isAdmin, setIsAdmin] = useState(false); // New Admin State
  const [authChecked, setAuthChecked] = useState(false); 

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('zh'); // Default Language
  const [autoStartWorkout, setAutoStartWorkout] = useState<boolean>(false);
  const [planToRepeat, setPlanToRepeat] = useState<DailyPlan | null>(null);
  
  // State for Data
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [historyLogs, setHistoryLogs] = useState<WorkoutRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Check Authentication on Mount
  useEffect(() => {
      if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
              if (user) {
                  // Standard Firebase Login
                  setIsAuthenticated(true);
                  setIsAdmin(false); 
              } else {
                  // Not logged in via Firebase
                  // Check if we are in "Admin Session" (simple check for this example)
                  const adminSession = sessionStorage.getItem('gohopro_admin_session');
                  if (adminSession === 'true') {
                      setIsAuthenticated(true);
                      setIsAdmin(true);
                  } else {
                      setIsAuthenticated(false);
                      setIsAdmin(false);
                  }
              }
              setAuthChecked(true);
          });
          return () => unsubscribe();
      } else {
          setAuthChecked(true);
      }
  }, []);

  // 2. Fetch Data when Authenticated
  useEffect(() => {
      if (isAuthenticated) {
          fetchData();
      }
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
      setLoadingData(true);
      try {
          if (isAdmin) {
              // Admin Mock Data
              setUserProfile({
                  ...USER_PROFILE,
                  name: 'Admin',
                  goal: 'maintain',
                  avatar: '' // Or specific admin avatar
              });
              setHistoryLogs(MOCK_HISTORY);
              setNutritionLogs(NUTRITION_LOGS);
          } else {
              // Real User Data
              
              // 1. Fetch System Keys first (if available in cloud, sync to local)
              // This allows normal users to access keys set by admin
              const systemKeys = await apiGetSystemKeys();
              if (systemKeys) {
                  if (systemKeys.googleApiKey) localStorage.setItem('GO_SYSTEM_GOOGLE_API_KEY', systemKeys.googleApiKey);
                  if (systemKeys.openaiApiKey) localStorage.setItem('GO_SYSTEM_OPENAI_API_KEY', systemKeys.openaiApiKey);
                  if (systemKeys.openaiBaseUrl) localStorage.setItem('GO_SYSTEM_OPENAI_BASE_URL', systemKeys.openaiBaseUrl);
                  if (systemKeys.openaiModel) localStorage.setItem('GO_SYSTEM_OPENAI_MODEL', systemKeys.openaiModel);
              }

              // 2. Fetch User Data
              const profile = await apiGetUserProfile();
              setUserProfile(profile);

              const history = await apiGetWorkoutHistory();
              setHistoryLogs(history.length ? history : MOCK_HISTORY);

              const nutrition = await apiGetNutritionLogs();
              setNutritionLogs(nutrition.length ? nutrition : NUTRITION_LOGS);
          }
      } catch (e) {
          console.error("Error loading data", e);
      } finally {
          setLoadingData(false);
      }
  };

  // Sync Nutrition Changes to DB/Local (Skip for Admin)
  useEffect(() => {
      if (!isAdmin && nutritionLogs.length > 0 && !loadingData) {
          apiSyncNutritionState(nutritionLogs);
      }
  }, [nutritionLogs, loadingData, isAdmin]);

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

  // Convert Record back to Plan for repetition
  const handleRepeatWorkout = (record: WorkoutRecord) => {
      const plan: DailyPlan = {
          id: `repeat_${Date.now()}`,
          title: record.type,
          focus: 'Repeated Session',
          duration: record.duration,
          exercises: record.details ? record.details.map((d, i) => ({
              id: `ex_r_${i}`,
              name: d.exerciseName,
              sets: d.sets.length,
              reps: d.sets[0].reps.toString(), // Estimate based on first set
              weight: d.sets.some(s => s.weight > 0) ? Math.max(...d.sets.map(s => s.weight)) : 0, // Suggest max weight used
              completed: false,
              section: 'main'
          })) : []
      };
      setPlanToRepeat(plan);
      setAutoStartWorkout(true);
      setCurrentView(View.WORKOUT);
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    if (!isAdmin) {
        await apiSaveUserProfile(profile);
    }
  };
  
  const handleLoginSuccess = (adminLogin: boolean = false) => {
      if (adminLogin) {
          setIsAdmin(true);
          sessionStorage.setItem('gohopro_admin_session', 'true');
      } else {
          setIsAdmin(false);
          sessionStorage.removeItem('gohopro_admin_session');
      }
      setIsAuthenticated(true);
  };

  const handleLogout = async () => {
      if (isAdmin) {
          sessionStorage.removeItem('gohopro_admin_session');
          setIsAdmin(false);
      } else if (auth) {
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
      if (!isAdmin) await apiSaveWorkoutRecord(record);
      setCurrentView(View.HISTORY);
  };

  const handleDeleteRecord = async (recordId: string) => {
      const newHistory = historyLogs.filter(h => h.id !== recordId);
      setHistoryLogs(newHistory);
      if (!isAdmin) await apiDeleteWorkoutRecord(recordId);
  };

  const handleDeleteNutrition = async (logId: string) => {
      setNutritionLogs(prev => prev.filter(l => l.id !== logId));
      if (!isAdmin) await apiDeleteNutritionLog(logId);
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
           <Login onLoginSuccess={handleLoginSuccess} />
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
  // Admin skips onboarding
  if (!userProfile && !isAdmin) {
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
            historyLogs={historyLogs}
            userProfile={userProfile!}
            language={language}
          />
        );
      case View.HISTORY:
        return (
            <History 
                logs={historyLogs} 
                onDeleteRecord={handleDeleteRecord} 
                onRepeatWorkout={handleRepeatWorkout}
            />
        );
      case View.WORKOUT:
        return (
          <Workout 
            autoStart={autoStartWorkout} 
            onAutoStartConsumed={() => {
                setAutoStartWorkout(false);
                setPlanToRepeat(null);
            }}
            onFinishWorkout={handleFinishWorkout}
            historyLogs={historyLogs} 
            userProfile={userProfile!} 
            onGoToSettings={handleGoToSettings}
            nutritionLogs={nutritionLogs}
            onDeleteNutrition={handleDeleteNutrition}
            language={language}
            externalPlanToStart={planToRepeat} // Pass the plan to start
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
                isAdmin={isAdmin}
            />
          );
      default:
        return <Dashboard onStartWorkout={handleStartQuickWorkout} nutritionLogs={nutritionLogs} historyLogs={historyLogs} userProfile={userProfile!} language={language} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={setCurrentView}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      userProfile={userProfile}
      language={language}
      setLanguage={setLanguage}
    >
      {renderView()}
    </Layout>
  );
};

export default App;

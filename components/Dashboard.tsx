
import React, { useMemo, useState, useEffect } from 'react';
import { Activity, Flame, Clock, Trophy, User, ArrowRight, Target } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, DEFAULT_PLANS } from '../constants';
import { NutritionLog, UserProfile, ScheduledWorkout, DailyPlan } from '../types';

interface DashboardProps {
  onStartWorkout: () => void;
  nutritionLogs: NutritionLog[];
  userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, nutritionLogs, userProfile }) => {
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  // Calculate Nutrition Totals for TODAY
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = nutritionLogs.filter(log => log.date === todayStr);
  
  // Logic to find Next Workout
  const [nextWorkout, setNextWorkout] = useState<{title: string, duration: number} | null>(null);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('fitlife_schedule');
    if (savedSchedule) {
        const schedule: ScheduledWorkout[] = JSON.parse(savedSchedule);
        const todaysWorkout = schedule.find(s => s.date === todayStr && !s.completed);
        
        if (todaysWorkout) {
             const plan = DEFAULT_PLANS.find(p => p.id === todaysWorkout.planId);
             if (plan) {
                 setNextWorkout({ title: plan.title, duration: plan.duration });
             }
        }
    }
    // Fallback if no schedule found or all completed, show nothing or a generic message logic could go here
  }, [todayStr]);

  const totalNutrition = useMemo(() => {
    return todaysLogs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        p: acc.p + curr.macros.p,
        c: acc.c + curr.macros.c,
        f: acc.f + curr.macros.f
    }), { calories: 0, p: 0, c: 0, f: 0 });
  }, [todaysLogs]);

  // Calculate Targets based on Profile
  // Simple TDEE estimation (Mifflin-St Jeor)
  const calculateTargets = () => {
    if (!userProfile) return { calories: 2000, p: 150, c: 200, f: 60 };

    let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
    bmr += userProfile.gender === 'male' ? 5 : -161;
    
    let multiplier = 1.2; // Sedentary
    if (userProfile.activityLevel === 'light') multiplier = 1.375;
    if (userProfile.activityLevel === 'moderate') multiplier = 1.55;
    if (userProfile.activityLevel === 'active') multiplier = 1.725;
    if (userProfile.activityLevel === 'very_active') multiplier = 1.9;

    let tdee = Math.round(bmr * multiplier);

    // Adjust for goal
    if (userProfile.goal === 'lose_weight') tdee -= 500;
    if (userProfile.goal === 'gain_muscle') tdee += 300;

    return {
        calories: tdee,
        p: Math.round((tdee * 0.3) / 4), // 30% Protein
        c: Math.round((tdee * 0.45) / 4), // 45% Carbs
        f: Math.round((tdee * 0.25) / 9)  // 25% Fat
    };
  };

  const targets = calculateTargets();
  const remaining = {
      calories: targets.calories - totalNutrition.calories,
      p: targets.p - totalNutrition.p,
      c: targets.c - totalNutrition.c,
      f: targets.f - totalNutrition.f
  };

  const bmi = userProfile 
    ? (userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1) 
    : '0';

  // Simple SVG Progress Ring Component
  const ProgressRing = ({ radius, stroke, progress, color }: { radius: number, stroke: number, progress: number, color: string }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-200 dark:text-gray-700 opacity-20"
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
             <span className="text-3xl font-bold text-gray-800 dark:text-white">{Math.round(progress)}%</span>
             <span className="text-xs text-gray-500 dark:text-gray-400">今日進度</span>
        </div>
      </div>
    );
  };

  const percentage = Math.min((totalNutrition.calories / targets.calories) * 100, 100);
  
  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-3xl font-bold mb-1">早安，{userProfile.name}！</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">"{quote}"</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Main Activity Card */}
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-6">
            <ProgressRing radius={90} stroke={12} progress={percentage} color="#a3e635" />
            
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                <Flame className="text-cta-orange mb-1" size={20} />
                <span className="text-lg font-bold">{totalNutrition.calories}</span>
                <span className="text-[10px] text-gray-500">攝取卡路里</span>
              </div>
              <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                <Activity className="text-neon-blue mb-1" size={20} />
                <span className="text-lg font-bold">5,432</span>
                <span className="text-[10px] text-gray-500">今日步數</span>
              </div>
               <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                 <Trophy className="text-yellow-400 mb-1" size={20} />
                 <span className="text-lg font-bold">7</span>
                 <span className="text-[10px] text-gray-500">連續天數</span>
              </div>
            </div>
          </div>

          {/* Body Info & Nutrition Goals Card */}
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <User className="text-neon-blue" size={20} /> 身體數據
                  </h3>
                  <button className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      更新 <ArrowRight size={12} />
                  </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                      <span className="block text-2xl font-bold">{userProfile.height}</span>
                      <span className="text-xs text-gray-500">身高 (cm)</span>
                  </div>
                  <div className="text-center border-x border-gray-200 dark:border-gray-700">
                      <span className="block text-2xl font-bold">{userProfile.weight}</span>
                      <span className="text-xs text-gray-500">體重 (kg)</span>
                  </div>
                  <div className="text-center">
                      <span className={`block text-2xl font-bold ${Number(bmi) > 24 ? 'text-orange-400' : 'text-neon-green'}`}>{bmi}</span>
                      <span className="text-xs text-gray-500">BMI</span>
                  </div>
              </div>

              <div className="mt-auto">
                   <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-400">
                       <Target size={16} /> 剩餘營養需求
                   </h4>
                   <div className="space-y-3">
                       {/* Remaining Calories Bar */}
                       <div>
                           <div className="flex justify-between text-xs mb-1">
                               <span>能量 ({remaining.calories > 0 ? remaining.calories : 0} kcal 剩餘)</span>
                               <span className="text-gray-400">{totalNutrition.calories} / {targets.calories}</span>
                           </div>
                           <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-cta-orange rounded-full transition-all duration-1000" 
                                 style={{ width: `${Math.min((totalNutrition.calories / targets.calories) * 100, 100)}%` }}
                               />
                           </div>
                       </div>

                       {/* Macros Grid */}
                       <div className="grid grid-cols-3 gap-2">
                           <div className="bg-gray-50 dark:bg-charcoal-900 p-2 rounded-lg text-center">
                               <div className="text-[10px] text-gray-500 mb-1">蛋白質</div>
                               <div className="text-sm font-bold text-neon-green">{remaining.p > 0 ? remaining.p : 0}g</div>
                               <div className="text-[10px] text-gray-600">剩餘</div>
                           </div>
                           <div className="bg-gray-50 dark:bg-charcoal-900 p-2 rounded-lg text-center">
                               <div className="text-[10px] text-gray-500 mb-1">碳水</div>
                               <div className="text-sm font-bold text-neon-blue">{remaining.c > 0 ? remaining.c : 0}g</div>
                               <div className="text-[10px] text-gray-600">剩餘</div>
                           </div>
                           <div className="bg-gray-50 dark:bg-charcoal-900 p-2 rounded-lg text-center">
                               <div className="text-[10px] text-gray-500 mb-1">脂肪</div>
                               <div className="text-sm font-bold text-neon-purple">{remaining.f > 0 ? remaining.f : 0}g</div>
                               <div className="text-[10px] text-gray-600">剩餘</div>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      {/* Quick Actions / Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 dark:from-charcoal-800 dark:to-charcoal-900 bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <h3 className="text-xl font-bold mb-2 z-10 relative">下一個訓練</h3>
            {nextWorkout ? (
                <>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 z-10 relative">{nextWorkout.title} • {nextWorkout.duration} 分鐘</p>
                    <button 
                    onClick={onStartWorkout}
                    className="bg-cta-orange hover:bg-cta-hover text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg shadow-orange-500/30 z-10 relative active:scale-95"
                    >
                        開始訓練
                    </button>
                </>
            ) : (
                <>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 z-10 relative">今日暫無計畫</p>
                    <button 
                    onClick={onStartWorkout}
                    className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-6 py-2 rounded-full font-semibold transition-all z-10 relative"
                    >
                        安排訓練
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ChevronRight, ChevronLeft, Upload, User, Ruler, Weight, Activity, Target, Check } from 'lucide-react';

interface OnboardingProps {
  onSave: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onSave }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: 'male',
    age: 25,
    height: 170,
    weight: 65,
    activityLevel: 'moderate',
    goal: 'maintain',
    avatar: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    if (step === 1 && !profile.name.trim()) {
      alert("請輸入您的暱稱");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    if (!profile.name.trim()) {
      alert("請輸入您的暱稱");
      return;
    }
    onSave(profile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">歡迎來到 Gohopro</h2>
        <p className="text-gray-500">首先，讓我們認識一下您</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">您的暱稱 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full p-3 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange"
            placeholder="例如: Alex"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">性別</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setProfile({ ...profile, gender: 'male' })}
              className={`p-4 rounded-xl border-2 transition-all ${
                profile.gender === 'male'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-transparent bg-gray-100 dark:bg-charcoal-900 text-gray-500'
              }`}
            >
              我是男生
            </button>
            <button
              onClick={() => setProfile({ ...profile, gender: 'female' })}
              className={`p-4 rounded-xl border-2 transition-all ${
                profile.gender === 'female'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                  : 'border-transparent bg-gray-100 dark:bg-charcoal-900 text-gray-500'
              }`}
            >
              我是女生
            </button>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">年齡</label>
           <input
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
            className="w-full p-3 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">身體數據</h2>
        <p className="text-gray-500">這能幫助我們計算您的代謝率</p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Ruler size={18} className="text-neon-blue" /> 身高 (cm)
          </label>
          <input
            type="number"
            value={profile.height}
            onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
            className="w-full p-4 text-center text-2xl font-bold rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
          />
        </div>

        <div className="relative">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Weight size={18} className="text-cta-orange" /> 體重 (kg)
          </label>
          <input
            type="number"
            value={profile.weight}
            onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
            className="w-full p-4 text-center text-2xl font-bold rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">目標設定</h2>
        <p className="text-gray-500">您希望達成什麼目標？</p>
      </div>

      <div className="space-y-4">
        <div>
           <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
             <Activity size={18} className="text-neon-green" /> 活動量
           </label>
           <select 
             value={profile.activityLevel}
             onChange={(e) => setProfile({...profile, activityLevel: e.target.value as any})}
             className="w-full p-3 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-green"
           >
             <option value="sedentary">久坐少動 (辦公室工作)</option>
             <option value="light">輕度活動 (每週運動 1-3 天)</option>
             <option value="moderate">中度活動 (每週運動 3-5 天)</option>
             <option value="active">高度活動 (每週運動 6-7 天)</option>
             <option value="very_active">極高度活動 (勞力工作/運動員)</option>
           </select>
        </div>

        <div>
           <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
             <Target size={18} className="text-red-400" /> 健身目標
           </label>
           <div className="grid grid-cols-1 gap-2">
              {[
                { val: 'lose_weight', label: '減脂 / 減重' },
                { val: 'maintain', label: '維持體態' },
                { val: 'gain_muscle', label: '增肌 / 變壯' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setProfile({ ...profile, goal: opt.val as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    profile.goal === opt.val
                      ? 'border-cta-orange bg-orange-50 dark:bg-orange-900/20 text-cta-orange'
                      : 'border-transparent bg-gray-100 dark:bg-charcoal-900 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in flex flex-col items-center">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">最後一步！</h2>
        <p className="text-gray-500">上傳一張帥氣/美麗的照片吧</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-40 h-40 rounded-full bg-gray-100 dark:bg-charcoal-900 border-4 border-dashed border-gray-300 dark:border-charcoal-700 flex items-center justify-center cursor-pointer hover:border-cta-orange transition-colors relative overflow-hidden group"
      >
        {profile.avatar ? (
          <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <Upload size={32} />
            <span className="text-xs mt-2">點擊上傳</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-bold">更換照片</span>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <p className="text-xs text-gray-400 max-w-xs text-center">
        如果您不上傳，我們會根據您的性別為您生成一個預設的頭像。
      </p>

      {profile.avatar && (
         <button 
           onClick={() => setProfile({...profile, avatar: ''})}
           className="text-sm text-red-400 hover:text-red-500"
         >
           移除照片
         </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-charcoal-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-cta-orange' : 'bg-gray-200 dark:bg-gray-800'}`} />
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-charcoal-800">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-charcoal-700 transition-colors"
            >
              <ChevronLeft size={20} /> 上一步
            </button>
          ) : <div />}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                (step === 1 && !profile.name.trim()) 
                ? 'bg-gray-300 dark:bg-charcoal-700 text-gray-500 cursor-not-allowed' 
                : 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 hover:opacity-90'
              }`}
            >
              下一步 <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="flex-1 px-6 py-3 rounded-xl bg-cta-orange text-white font-bold flex items-center justify-center gap-2 hover:bg-cta-hover shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              <Check size={20} /> 完成設定
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

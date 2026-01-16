
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Upload, User, Ruler, Weight, Activity, Target, Save, LogOut, Download } from 'lucide-react';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void; // Optional reset functionality
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userProfile, onUpdateProfile, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        setDeferredPrompt(e);
        setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
      if (!deferredPrompt) return;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
      } else {
          console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
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

  const handleSave = () => {
    onUpdateProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">個人資料與設定</h2>
          {isSaved && <span className="text-neon-green font-bold text-sm animate-fade-in">已儲存變更！</span>}
      </div>

      <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-charcoal-700 cursor-pointer relative group"
            >
                {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${profile.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                        <User size={48} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="text-white mb-1" size={24} />
                    <span className="text-white text-xs font-bold">更換</span>
                </div>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />
            <p className="text-xs text-gray-500 mt-2">點擊上方圖片可更換頭像</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">暱稱</label>
                    <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">年齡</label>
                    <input 
                        type="number" 
                        value={profile.age}
                        onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">性別</label>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setProfile({...profile, gender: 'male'})}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                            profile.gender === 'male' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'border-transparent bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                        }`}
                    >
                        男生
                    </button>
                    <button 
                        onClick={() => setProfile({...profile, gender: 'female'})}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                            profile.gender === 'female' 
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' 
                            : 'border-transparent bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                        }`}
                    >
                        女生
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                        <Ruler size={16} /> 身高 (cm)
                    </label>
                    <input 
                        type="number" 
                        value={profile.height}
                        onChange={(e) => setProfile({...profile, height: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue text-center font-bold text-lg"
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                        <Weight size={16} /> 體重 (kg)
                    </label>
                    <input 
                        type="number" 
                        value={profile.weight}
                        onChange={(e) => setProfile({...profile, weight: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange text-center font-bold text-lg"
                    />
                 </div>
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    <Activity size={16} /> 活動量
                </label>
                <select 
                    value={profile.activityLevel}
                    onChange={(e) => setProfile({...profile, activityLevel: e.target.value as any})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-green"
                >
                    <option value="sedentary">久坐少動 (辦公室工作)</option>
                    <option value="light">輕度活動 (每週運動 1-3 天)</option>
                    <option value="moderate">中度活動 (每週運動 3-5 天)</option>
                    <option value="active">高度活動 (每週運動 6-7 天)</option>
                    <option value="very_active">極高度活動 (勞力工作/運動員)</option>
                </select>
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    <Target size={16} /> 健身目標
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                        { val: 'lose_weight', label: '減脂 / 減重' },
                        { val: 'maintain', label: '維持體態' },
                        { val: 'gain_muscle', label: '增肌 / 變壯' }
                    ].map(opt => (
                        <button
                        key={opt.val}
                        onClick={() => setProfile({ ...profile, goal: opt.val as any })}
                        className={`p-3 rounded-xl border text-center transition-all text-sm font-medium ${
                            profile.goal === opt.val
                            ? 'border-cta-orange bg-orange-50 dark:bg-orange-900/20 text-cta-orange'
                            : 'border-transparent bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                        }`}
                        >
                        {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Install PWA Button */}
            {isInstallable && (
                <div className="pt-4 border-t border-gray-100 dark:border-charcoal-700">
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">應用程式</label>
                    <button 
                        onClick={handleInstallClick}
                        className="w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Download size={18} /> 安裝 Gohopro 到主畫面
                    </button>
                </div>
            )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-charcoal-700 flex flex-col md:flex-row gap-4">
            <button 
                onClick={handleSave}
                className="flex-1 bg-cta-orange hover:bg-cta-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Save size={20} />
                儲存變更
            </button>
            
            {onLogout && (
                <button 
                    onClick={onLogout}
                    className="px-6 py-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="md:hidden">登出</span>
                </button>
            )}
        </div>

      </div>
      
      <div className="text-center text-xs text-gray-400">
          Gohopro v1.1.0
      </div>
    </div>
  );
};

export default ProfileSettings;

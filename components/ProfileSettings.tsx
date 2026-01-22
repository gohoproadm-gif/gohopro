
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Upload, User, Ruler, Weight, Target, Save, LogOut, Download, Bot, Key, Globe, Cpu, ShieldAlert, Check, Sparkles, Utensils } from 'lucide-react';
import { apiSaveSystemKeys } from '../lib/db';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userProfile, onUpdateProfile, onLogout, isAdmin }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin System Keys
  const [systemGoogleKey, setSystemGoogleKey] = useState('');
  const [systemOpenAIKey, setSystemOpenAIKey] = useState('');
  const [systemOpenAIBaseUrl, setSystemOpenAIBaseUrl] = useState('');
  const [systemOpenAIModel, setSystemOpenAIModel] = useState('');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (isAdmin) {
        setSystemGoogleKey(localStorage.getItem('GO_SYSTEM_GOOGLE_API_KEY') || '');
        setSystemOpenAIKey(localStorage.getItem('GO_SYSTEM_OPENAI_API_KEY') || '');
        setSystemOpenAIBaseUrl(localStorage.getItem('GO_SYSTEM_OPENAI_BASE_URL') || '');
        setSystemOpenAIModel(localStorage.getItem('GO_SYSTEM_OPENAI_MODEL') || '');
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
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
  
  const fillDeepSeekDefaults = () => {
      setSystemOpenAIBaseUrl("https://api.deepseek.com");
      setSystemOpenAIModel("deepseek-chat");
  };

  const handleSave = async () => {
    if (isAdmin) {
        // Save System Keys Locally
        localStorage.setItem('GO_SYSTEM_GOOGLE_API_KEY', systemGoogleKey);
        localStorage.setItem('GO_SYSTEM_OPENAI_API_KEY', systemOpenAIKey);
        localStorage.setItem('GO_SYSTEM_OPENAI_BASE_URL', systemOpenAIBaseUrl);
        localStorage.setItem('GO_SYSTEM_OPENAI_MODEL', systemOpenAIModel);

        // Save System Keys to Cloud (so all users get them)
        try {
            await apiSaveSystemKeys({
                googleApiKey: systemGoogleKey,
                openaiApiKey: systemOpenAIKey,
                openaiBaseUrl: systemOpenAIBaseUrl,
                openaiModel: systemOpenAIModel
            });
        } catch (e) {
            console.error("Failed to sync keys to cloud (requires auth)", e);
            alert("本地儲存成功，但雲端同步失敗。請嘗試重新登入 Admin 帳號（系統會自動進行匿名驗證以取得寫入權限）。");
        }
    } else {
        // Normal Save
        onUpdateProfile(profile);
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleCustomTargets = () => {
      if (profile.customTargets?.enabled) {
          setProfile({ ...profile, customTargets: { ...profile.customTargets, enabled: false } });
      } else {
          // Initialize with current estimate if not set
          setProfile({ 
              ...profile, 
              customTargets: { 
                  enabled: true, 
                  calories: 2000, 
                  protein: 150, 
                  carbs: 200, 
                  fat: 60 
              } 
          });
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
              {isAdmin && <ShieldAlert className="text-red-500" />}
              {isAdmin ? '系統管理設定' : '個人資料與設定'}
          </h2>
          {isSaved && <span className="text-neon-green font-bold text-sm animate-fade-in flex items-center gap-1"><Check size={16}/> 已儲存變更！</span>}
      </div>

      <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-charcoal-700 space-y-8">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
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
            {!isAdmin && <p className="text-xs text-gray-500 mt-2">點擊上方圖片可更換頭像</p>}
            {isAdmin && <p className="text-xs font-bold text-red-500 mt-2">ADMINISTRATOR</p>}
        </div>

        {/* Basic Info (Editable for User, Read-only for Admin Mock) */}
        <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-charcoal-700 pb-2">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">暱稱</label>
                    <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
                        disabled={isAdmin}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">年齡</label>
                    <input 
                        type="number" 
                        value={profile.age}
                        onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
                        disabled={isAdmin}
                    />
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
                        disabled={isAdmin}
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
                        disabled={isAdmin}
                    />
                 </div>
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
                        onClick={() => !isAdmin && setProfile({ ...profile, goal: opt.val as any })}
                        className={`p-3 rounded-xl border text-center transition-all text-sm font-medium ${
                            profile.goal === opt.val
                            ? 'border-cta-orange bg-orange-50 dark:bg-orange-900/20 text-cta-orange'
                            : 'border-transparent bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                        } ${isAdmin ? 'cursor-default' : ''}`}
                        >
                        {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Custom Nutrition Targets (New) */}
        {!isAdmin && (
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-charcoal-700 pb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Utensils size={20} className="text-neon-green" /> 自訂營養目標
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.customTargets?.enabled || false} onChange={toggleCustomTargets} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-charcoal-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                    </label>
                </div>

                {profile.customTargets?.enabled ? (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in bg-gray-50 dark:bg-charcoal-900/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal-700">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">每日目標熱量 (kcal)</label>
                            <input 
                                type="number" 
                                value={profile.customTargets.calories}
                                onChange={(e) => setProfile({ ...profile, customTargets: { ...profile.customTargets!, calories: Number(e.target.value) } })}
                                className="w-full p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 font-bold text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neon-green mb-1">蛋白質 (g)</label>
                            <input 
                                type="number" 
                                value={profile.customTargets.protein}
                                onChange={(e) => setProfile({ ...profile, customTargets: { ...profile.customTargets!, protein: Number(e.target.value) } })}
                                className="w-full p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 font-bold text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neon-blue mb-1">碳水化合物 (g)</label>
                            <input 
                                type="number" 
                                value={profile.customTargets.carbs}
                                onChange={(e) => setProfile({ ...profile, customTargets: { ...profile.customTargets!, carbs: Number(e.target.value) } })}
                                className="w-full p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 font-bold text-center"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-neon-purple mb-1">脂肪 (g)</label>
                            <input 
                                type="number" 
                                value={profile.customTargets.fat}
                                onChange={(e) => setProfile({ ...profile, customTargets: { ...profile.customTargets!, fat: Number(e.target.value) } })}
                                className="w-full p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 font-bold text-center"
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">
                        目前使用 TDEE 公式自動計算目標。開啟上方開關以手動設定您的營養需求。
                    </p>
                )}
            </div>
        )}

        {/* AI Configuration Section (ADMIN ONLY for Keys, User for Preference) */}
        <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-charcoal-700 pb-2 flex items-center gap-2">
                <Bot size={20} className="text-neon-purple" /> AI 模型設定
            </h3>
            
            <div className="space-y-4">
                {/* Regular User sees just the provider toggle (if multiple available) or just info */}
                <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">AI 供應商</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setProfile({...profile, aiProvider: 'google'})}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                (profile.aiProvider === 'google' || !profile.aiProvider) 
                                ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' 
                                : 'border-gray-200 dark:border-charcoal-600 bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                            }`}
                        >
                            Google Gemini
                        </button>
                        <button 
                            onClick={() => setProfile({...profile, aiProvider: 'openai'})}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                profile.aiProvider === 'openai' 
                                ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' 
                                : 'border-gray-200 dark:border-charcoal-600 bg-gray-50 dark:bg-charcoal-900 text-gray-500'
                            }`}
                        >
                            OpenAI / DeepSeek
                        </button>
                    </div>
                    {profile.aiProvider === 'openai' && (
                        <p className="text-[10px] text-orange-500 mt-2 flex items-center gap-1 font-bold">
                            <ShieldAlert size={12} /> 注意：DeepSeek/OpenAI 為付費 API，需確保帳戶內有餘額 (Credit) 才能使用，否則會出現餘額不足錯誤。
                        </p>
                    )}
                </div>

                {/* Only Admin can see and edit the actual Keys */}
                {isAdmin && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4 rounded-xl space-y-4 relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                <ShieldAlert size={18}/> 系統全域 API Key 設定 (僅管理員可見)
                            </div>
                            <button 
                                onClick={fillDeepSeekDefaults}
                                className="text-[10px] bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple px-2 py-1 rounded flex items-center gap-1 font-bold transition-colors"
                            >
                                <Sparkles size={10} /> 一鍵填入 DeepSeek 預設值
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Google Gemini API Key <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={systemGoogleKey}
                                    onChange={(e) => setSystemGoogleKey(e.target.value)}
                                    className="w-full p-2 rounded bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-600 text-sm font-mono"
                                    placeholder="AIza..."
                                />
                            </div>
                            <hr className="border-gray-200 dark:border-charcoal-600 my-2" />
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">OpenAI/DeepSeek API Key</label>
                                <input 
                                    type="text" 
                                    value={systemOpenAIKey}
                                    onChange={(e) => setSystemOpenAIKey(e.target.value)}
                                    className="w-full p-2 rounded bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-600 text-sm font-mono"
                                    placeholder="sk-..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">OpenAI Base URL</label>
                                <input 
                                    type="text" 
                                    value={systemOpenAIBaseUrl}
                                    onChange={(e) => setSystemOpenAIBaseUrl(e.target.value)}
                                    className="w-full p-2 rounded bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-600 text-sm font-mono"
                                    placeholder="https://api.deepseek.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Model Name</label>
                                <input 
                                    type="text" 
                                    value={systemOpenAIModel}
                                    onChange={(e) => setSystemOpenAIModel(e.target.value)}
                                    className="w-full p-2 rounded bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-600 text-sm font-mono"
                                    placeholder="deepseek-chat"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Normal users just see info text */}
                {!isAdmin && (
                     <div className="bg-gray-50 dark:bg-charcoal-900/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal-700">
                         <p className="text-xs text-gray-500">
                             本系統使用中央配置的 API 連線服務。您無需手動輸入 API Key。
                             <br/>
                             當前選擇提供商: <span className="font-bold text-gray-700 dark:text-gray-300">{profile.aiProvider === 'openai' ? 'OpenAI / DeepSeek' : 'Google Gemini'}</span>
                         </p>
                     </div>
                )}
            </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-gray-200 dark:border-charcoal-700 flex flex-col md:flex-row gap-4">
            <button 
                onClick={handleSave}
                className="flex-1 bg-cta-orange hover:bg-cta-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Save size={20} />
                {isAdmin ? '儲存系統設定 (同步至所有用戶)' : '儲存變更'}
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
        
        {/* Install PWA Button */}
        {isInstallable && (
            <div className="pt-4">
                <button 
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Download size={18} /> 安裝 Gohopro 到主畫面
                </button>
            </div>
        )}

      </div>
      
      <div className="text-center text-xs text-gray-400">
          Gohopro v1.3.2
      </div>
    </div>
  );
};

export default ProfileSettings;

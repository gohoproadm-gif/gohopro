
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Upload, User, Ruler, Weight, Target, Save, LogOut, Download, Bot, Key, Globe, Cpu } from 'lucide-react';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
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

      <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-700 space-y-8">
        
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
            <p className="text-xs text-gray-500 mt-2">點擊上方圖片可更換頭像</p>
        </div>

        {/* Basic Info */}
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
        </div>

        {/* AI Configuration Section */}
        <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-charcoal-700 pb-2 flex items-center gap-2">
                <Bot size={20} className="text-neon-purple" /> AI 模型設定
            </h3>
            
            <div className="space-y-4">
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
                </div>

                {profile.aiProvider === 'openai' && (
                    <div className="space-y-4 bg-gray-50 dark:bg-charcoal-900/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                                <Globe size={14} /> Base URL
                            </label>
                            <input 
                                type="text" 
                                value={profile.openaiBaseUrl || ''}
                                onChange={(e) => setProfile({...profile, openaiBaseUrl: e.target.value})}
                                placeholder="例如: https://api.deepseek.com"
                                className="w-full p-2.5 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 outline-none focus:border-neon-purple text-sm font-mono"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">DeepSeek 請填: https://api.deepseek.com</p>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                                <Key size={14} /> API Key
                            </label>
                            <input 
                                type="password" 
                                value={profile.openaiApiKey || ''}
                                onChange={(e) => setProfile({...profile, openaiApiKey: e.target.value})}
                                placeholder="sk-..."
                                className="w-full p-2.5 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 outline-none focus:border-neon-purple text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                                <Cpu size={14} /> Model Name
                            </label>
                            <input 
                                type="text" 
                                value={profile.openaiModel || ''}
                                onChange={(e) => setProfile({...profile, openaiModel: e.target.value})}
                                placeholder="例如: deepseek-chat 或 gpt-4o"
                                className="w-full p-2.5 rounded-lg bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 outline-none focus:border-neon-purple text-sm font-mono"
                            />
                        </div>
                    </div>
                )}
                
                {(profile.aiProvider === 'google' || !profile.aiProvider) && (
                     <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                         <p className="text-xs text-blue-600 dark:text-blue-300">
                             預設使用 Google Gemini 免費模型。若要使用高級功能，請確保系統環境變數已設定 API Key。
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
          Gohopro v1.3.0
      </div>
    </div>
  );
};

export default ProfileSettings;

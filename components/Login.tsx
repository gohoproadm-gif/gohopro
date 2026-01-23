
import React, { useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signInAnonymously } from '../lib/firebase';
import { Dumbbell, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowRight, Activity, Chrome, HelpCircle, X, CheckCircle, Send, ExternalLink, ShieldCheck, Languages, Zap, BrainCircuit, LineChart } from 'lucide-react';
import { Language } from '../types';

interface LoginProps {
  onLoginSuccess: (isAdmin?: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, language, setLanguage }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Check if Firebase is actually configured (auth object exists)
  const isFirebaseConfigured = !!auth; 

  // --- Translations ---
  const t = {
      zh: {
          title: '您的智慧健身夥伴',
          subtitle: '結合 AI 科技，打造專屬於您的訓練與飲食計畫。',
          emailLabel: 'Email / 帳號',
          passLabel: '密碼',
          forgotPass: '忘記密碼?',
          login: '登入',
          register: '註冊',
          createAccount: '建立帳號',
          welcomeBack: '歡迎回來',
          or: '或',
          demo: '試用版',
          noAccount: '還沒有帳號？',
          hasAccount: '已經有帳號了？',
          registerNow: '立即註冊',
          loginNow: '登入',
          authError: '登入錯誤',
          sending: '發送中...',
          sent: '信件已發送！',
          checkInbox: '請檢查您的收件匣 (或是垃圾郵件)。',
          resetTitle: '重設密碼',
          resetDesc: '輸入您的 Email，我們將發送重設連結給您。',
          sendReset: '發送重設信',
          ok: '好的',
          openInBrowser: '請使用 Safari 或 Chrome 開啟',
          browserTip: '偵測到您正在使用應用程式內建瀏覽器，這將導致 Google 登入失敗。請點擊右上角選單，選擇「在瀏覽器中開啟」。',
          features: {
              ai: 'AI 智慧排課',
              nutrition: '飲食熱量分析',
              tracking: '數據進度追蹤'
          }
      },
      en: {
          title: 'Your Smart Fitness Partner',
          subtitle: 'Powered by AI to craft your personalized workout and nutrition plans.',
          emailLabel: 'Email / Username',
          passLabel: 'Password',
          forgotPass: 'Forgot Password?',
          login: 'Login',
          register: 'Register',
          createAccount: 'Create Account',
          welcomeBack: 'Welcome Back',
          or: 'OR',
          demo: 'Demo Mode',
          noAccount: 'No account yet?',
          hasAccount: 'Already have an account?',
          registerNow: 'Register Now',
          loginNow: 'Login',
          authError: 'Authentication Error',
          sending: 'Sending...',
          sent: 'Email Sent!',
          checkInbox: 'Please check your inbox (or spam folder).',
          resetTitle: 'Reset Password',
          resetDesc: 'Enter your email to receive a reset link.',
          sendReset: 'Send Reset Link',
          ok: 'OK',
          openInBrowser: 'Please Open in Browser',
          browserTip: 'You are using an in-app browser (e.g., LINE/FB). Google Login will fail. Please tap the menu (top-right) and select "Open in Browser".',
          features: {
              ai: 'AI Workouts',
              nutrition: 'Food Analysis',
              tracking: 'Progress Tracking'
          }
      }
  }[language];

  // --- In-App Browser Detection ---
  useEffect(() => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Detect LINE, Facebook, Instagram, LinkedIn, etc.
      if (/Line|FBAN|FBAV|Instagram|LinkedIn/i.test(userAgent)) {
          setIsInAppBrowser(true);
      }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- SUPER ADMIN LOGIN CHECK ---
    if (email === 'admin' && password === 'gohoproadmin') {
        setLoading(true);
        try {
            if (auth) await signInAnonymously(auth);
        } catch (e) {
            console.warn("Admin login warning", e);
        }
        setTimeout(() => {
            setLoading(false);
            onLoginSuccess(true);
        }, 800);
        return;
    }

    // Demo Mode Fallback
    if (!isFirebaseConfigured) {
        if (email === 'demo@example.com' || password === 'demo') {
            onLoginSuccess(false);
            return;
        }
        setError("Firebase Not Configured. Try Demo Mode.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess(false);
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Map error codes to localized messages if needed, simplified here
      setError(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      if (isInAppBrowser) {
          alert(t.browserTip);
          return;
      }
      if (!isFirebaseConfigured) {
           setError("Firebase not configured.");
           return;
      }
      setLoading(true);
      setError('');
      try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          onLoginSuccess(false);
      } catch (err: any) {
          console.error("Google Login Error:", err);
          setError(err.message || "Google Login Failed");
      } finally {
          setLoading(false);
      }
  };

  const handleDemoLogin = () => {
      onLoginSuccess(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!forgotEmail) return;
      setResetStatus('sending');
      try {
          await sendPasswordResetEmail(auth, forgotEmail);
          setResetStatus('success');
      } catch (err: any) {
          setResetStatus('error');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden bg-charcoal-950">
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/80 via-charcoal-950/60 to-charcoal-950"></div>
      </div>

      {/* Language Toggle (Top Right) */}
      <button 
        onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
        className="absolute top-6 right-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-white/20 transition-all"
      >
          <Languages size={14} />
          {language === 'zh' ? 'English' : '中文'}
      </button>

      {/* In-App Browser Warning Overlay */}
      {isInAppBrowser && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="bg-charcoal-800 p-4 rounded-full mb-4">
                  <ExternalLink size={48} className="text-cta-orange" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{t.openInBrowser}</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                  {t.browserTip}
              </p>
              <div className="flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-charcoal-900 rounded border border-gray-700">iOS: Safari</span>
                  <span className="px-2 py-1 bg-charcoal-900 rounded border border-gray-700">Android: Chrome</span>
              </div>
          </div>
      )}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 z-10 gap-8 p-4">
        
        {/* Left Side: Brand & Value Prop (Hidden on small mobile if needed, or stacked) */}
        <div className="hidden md:flex flex-col justify-center text-white space-y-8 p-4">
            <div>
                <div className="inline-flex items-center gap-2 mb-2">
                    <Dumbbell className="text-cta-orange" size={32} />
                    <span className="text-3xl font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">Gohopro</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight mb-4">{t.title}</h1>
                <p className="text-gray-400 text-lg">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="p-3 bg-neon-blue/20 rounded-full text-neon-blue"><BrainCircuit size={24}/></div>
                    <div>
                        <h3 className="font-bold text-neon-blue">{t.features.ai}</h3>
                        <p className="text-xs text-gray-400">DeepSeek / Gemini 雙模型驅動</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="p-3 bg-neon-green/20 rounded-full text-neon-green"><Zap size={24}/></div>
                    <div>
                        <h3 className="font-bold text-neon-green">{t.features.nutrition}</h3>
                        <p className="text-xs text-gray-400">拍照或輸入文字即時計算</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="p-3 bg-neon-purple/20 rounded-full text-neon-purple"><LineChart size={24}/></div>
                    <div>
                        <h3 className="font-bold text-neon-purple">{t.features.tracking}</h3>
                        <p className="text-xs text-gray-400">視覺化圖表掌握進度</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-charcoal-700 flex flex-col">
          
          {/* Mobile Brand Header */}
          <div className="md:hidden text-center pt-8 pb-2">
             <div className="inline-flex items-center justify-center p-3 bg-charcoal-800 rounded-xl shadow-lg border border-gray-700 mb-2">
                 <Dumbbell className="text-cta-orange w-8 h-8" />
             </div>
             <h1 className="text-2xl font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">Gohopro</h1>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center">
             <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                 {isSignUp ? <UserPlus className="text-neon-blue" /> : <LogIn className="text-neon-green" />}
                 {isSignUp ? t.createAccount : t.welcomeBack}
             </h2>

             {error && (
                 <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-500 text-xs animate-fade-in">
                     <AlertCircle size={16} className="shrink-0 mt-0.5" />
                     <span className="font-bold">{error}</span>
                 </div>
             )}

             <form onSubmit={handleAuth} className="space-y-4">
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1">{t.emailLabel}</label>
                     <div className="relative group">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" size={18} />
                         <input 
                           type="text" 
                           required
                           className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl outline-none focus:border-neon-blue transition-all"
                           placeholder="name@example.com"
                           value={email}
                           onChange={e => setEmail(e.target.value)}
                         />
                     </div>
                 </div>
                 
                 <div className="space-y-1">
                     <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-500">{t.passLabel}</label>
                        {!isSignUp && (
                            <button 
                                type="button"
                                onClick={() => {
                                    setForgotEmail(email);
                                    setShowForgotModal(true);
                                    setResetStatus('idle');
                                }}
                                className="text-xs text-neon-blue hover:text-cyan-400 font-bold"
                            >
                                {t.forgotPass}
                            </button>
                        )}
                     </div>
                     <div className="relative group">
                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" size={18} />
                         <input 
                           type="password" 
                           required
                           className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl outline-none focus:border-neon-blue transition-all"
                           placeholder="••••••••"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                         />
                     </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full bg-cta-orange hover:bg-cta-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                 >
                     {loading ? (
                         <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                     ) : (
                         <>
                            {isSignUp ? t.register : t.login} <ArrowRight size={18} />
                         </>
                     )}
                 </button>
             </form>

             <div className="mt-6">
                 <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-200 dark:border-charcoal-700"></div>
                     </div>
                     <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                         <span className="px-2 bg-white dark:bg-charcoal-900 text-gray-400">{t.or}</span>
                     </div>
                 </div>

                 <div className="mt-6 grid grid-cols-2 gap-3">
                     <button 
                       type="button"
                       onClick={handleGoogleLogin}
                       className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-charcoal-700 rounded-xl hover:bg-gray-50 dark:hover:bg-charcoal-800 transition-colors bg-white dark:bg-transparent group"
                     >
                         <Chrome size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Google</span>
                     </button>
                     <button 
                       type="button"
                       onClick={handleDemoLogin}
                       className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-charcoal-700 rounded-xl hover:bg-gray-50 dark:hover:bg-charcoal-800 transition-colors bg-white dark:bg-transparent group"
                     >
                         <Activity size={18} className="text-gray-400 group-hover:text-neon-green transition-colors" />
                         <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.demo}</span>
                     </button>
                 </div>
             </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-charcoal-800/50 p-4 text-center border-t border-gray-200 dark:border-charcoal-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSignUp ? t.hasAccount : t.noAccount}
                  <button 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                    }}
                    className="ml-2 font-bold text-neon-blue hover:text-white transition-colors"
                  >
                      {isSignUp ? t.loginNow : t.registerNow}
                  </button>
              </p>
          </div>
        </div>
      </div>

      {/* Footer / Privacy (Simple) */}
      <div className="absolute bottom-2 text-center w-full z-10 opacity-50">
          <p className="text-[10px] text-gray-400">
              v1.4.0 • <span className="hover:text-white cursor-pointer">Privacy Policy</span> • <span className="hover:text-white cursor-pointer">Terms</span>
          </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-700 p-6 relative">
                  <button 
                      onClick={() => setShowForgotModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                      <X size={20} />
                  </button>

                  <div className="flex flex-col items-center mb-6">
                      <div className="p-3 bg-neon-blue/10 rounded-full mb-3">
                          <HelpCircle className="text-neon-blue" size={24} />
                      </div>
                      <h3 className="text-xl font-bold">{t.resetTitle}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t.resetDesc}</p>
                  </div>

                  {resetStatus === 'success' ? (
                      <div className="text-center py-4">
                          <CheckCircle className="text-neon-green w-12 h-12 mx-auto mb-3" />
                          <p className="text-sm font-bold">{t.sent}</p>
                          <p className="text-xs text-gray-500 mt-1">{t.checkInbox}</p>
                          <button 
                              onClick={() => setShowForgotModal(false)}
                              className="mt-6 w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-2 rounded-xl"
                          >
                              {t.ok}
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-xl outline-none focus:border-neon-blue"
                                    placeholder="name@example.com"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                  />
                              </div>
                          </div>
                          
                          {resetStatus === 'error' && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle size={12} /> {t.authError}
                              </p>
                          )}

                          <button 
                              type="submit"
                              disabled={resetStatus === 'sending'}
                              className="w-full bg-neon-blue hover:bg-cyan-400 text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                          >
                              {resetStatus === 'sending' ? (
                                  <span className="animate-spin w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full"></span>
                              ) : (
                                  <>
                                      <Send size={18} /> {t.sendReset}
                                  </>
                              )}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;

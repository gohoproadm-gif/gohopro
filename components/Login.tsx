
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from '../lib/firebase';
import { Dumbbell, Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowRight, Activity, Chrome, HelpCircle, X, CheckCircle, Send, ExternalLink, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (isAdmin?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Check if Firebase is actually configured (auth object exists)
  const isFirebaseConfigured = !!auth; 

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- SUPER ADMIN LOGIN CHECK ---
    if (email === 'admin' && password === 'gohoproadmin') {
        setLoading(true);
        // Simulate network delay for better UX
        setTimeout(() => {
            setLoading(false);
            onLoginSuccess(true); // Pass true for isAdmin
        }, 800);
        return;
    }
    // -------------------------------

    // Demo Mode Fallback if user hasn't set up Firebase keys yet
    if (!isFirebaseConfigured) {
        if (email === 'demo@example.com' || password === 'demo') {
            onLoginSuccess(false);
            return;
        }
        setError("Firebase 尚未設定。請在 lib/firebase.ts 填入您的 API Key，或點擊下方「試用版」按鈕。");
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
      if (err.code === 'auth/invalid-credential') setError("帳號或密碼錯誤");
      else if (err.code === 'auth/user-not-found') setError("找不到此用戶");
      else if (err.code === 'auth/wrong-password') setError("密碼錯誤");
      else if (err.code === 'auth/email-already-in-use') setError("此 Email 已被註冊");
      else if (err.code === 'auth/weak-password') setError("密碼強度不足 (至少6位)");
      else if (err.code === 'auth/invalid-email') setError("Email 格式不正確");
      else if (err.code === 'auth/operation-not-allowed') setError("此登入方式未啟用。請至 Firebase Console > Build > Authentication > Sign-in method 開啟 Email/Password。");
      else setError(err.message || "發生錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      if (!isFirebaseConfigured) {
           setError("Firebase 尚未設定，無法使用 Google 登入。");
           return;
      }
      setLoading(true);
      setError('');
      try {
          const provider = new GoogleAuthProvider();
          // Use popup
          await signInWithPopup(auth, provider);
          onLoginSuccess(false);
      } catch (err: any) {
          console.error("Google Login Error:", err);
          if (err.code === 'auth/popup-closed-by-user') {
              setError("登入已取消");
          } else if (err.code === 'auth/popup-blocked') {
              setError("瀏覽器擋住了登入視窗。請允許彈跳視窗，或改用一般 Email 登入。");
          } else if (err.code === 'auth/unauthorized-domain') {
              const currentDomain = window.location.hostname;
              setError(`網域未授權 (${currentDomain})。請至 Firebase Console > Authentication > Settings > Authorized Domains 新增此網域。`);
          } else if (err.code === 'auth/operation-not-allowed') {
              setError("Google 登入未啟用。請至 Firebase Console > Authentication > Sign-in method 開啟 Google。");
          } else {
              setError("Google 登入失敗: " + (err.message || err.code));
          }
      } finally {
          setLoading(false);
      }
  };

  const handleDemoLogin = () => {
      // Allow bypass for demo purposes
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
          console.error(err);
          setResetStatus('error');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-charcoal-950 p-4 font-sans relative">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-charcoal-800 to-black rounded-2xl shadow-xl border border-gray-800 mb-4">
             <Dumbbell className="text-cta-orange w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent mb-2">
            Gohopro
          </h1>
          <p className="text-gray-500 dark:text-gray-400">您的智慧健身夥伴</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-charcoal-700 animate-fade-in delay-75">
          <div className="p-8">
             <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                 {isSignUp ? <UserPlus className="text-neon-blue" /> : <LogIn className="text-neon-green" />}
                 {isSignUp ? '建立帳號' : '歡迎回來'}
             </h2>

             {error && (
                 <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-500 text-sm animate-fade-in">
                     <AlertCircle size={20} className="shrink-0 mt-0.5" />
                     <div className="flex flex-col gap-1">
                        <span className="font-bold">登入錯誤</span>
                        <span className="break-words leading-relaxed opacity-90">{error}</span>
                     </div>
                 </div>
             )}

             <form onSubmit={handleAuth} className="space-y-4">
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1">Email / 帳號</label>
                     <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           type="text" 
                           required
                           className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl outline-none focus:border-neon-blue transition-colors"
                           placeholder="name@example.com"
                           value={email}
                           onChange={e => setEmail(e.target.value)}
                         />
                     </div>
                 </div>
                 
                 <div className="space-y-1">
                     <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-500">密碼</label>
                        {!isSignUp && (
                            <button 
                                type="button"
                                onClick={() => {
                                    setForgotEmail(email); // Pre-fill if typed
                                    setShowForgotModal(true);
                                    setResetStatus('idle');
                                }}
                                className="text-xs text-neon-blue hover:text-cyan-400 font-bold"
                            >
                                忘記密碼?
                            </button>
                        )}
                     </div>
                     <div className="relative">
                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           type="password" 
                           required
                           className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl outline-none focus:border-neon-blue transition-colors"
                           placeholder="••••••••"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                         />
                     </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full bg-cta-orange hover:bg-cta-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                 >
                     {loading ? (
                         <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                     ) : (
                         <>
                            {isSignUp ? '註冊' : '登入'} <ArrowRight size={18} />
                         </>
                     )}
                 </button>
             </form>

             <div className="mt-6">
                 <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-200 dark:border-charcoal-700"></div>
                     </div>
                     <div className="relative flex justify-center text-sm">
                         <span className="px-2 bg-white dark:bg-charcoal-900 text-gray-500">或</span>
                     </div>
                 </div>

                 <div className="mt-6 grid grid-cols-2 gap-3">
                     <button 
                       type="button"
                       onClick={handleGoogleLogin}
                       className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-charcoal-700 rounded-xl hover:bg-gray-50 dark:hover:bg-charcoal-800 transition-colors bg-white dark:bg-transparent"
                     >
                         <Chrome size={18} className="text-red-500" />
                         <span className="text-sm font-bold">Google</span>
                     </button>
                     <button 
                       type="button"
                       onClick={handleDemoLogin}
                       className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-charcoal-700 rounded-xl hover:bg-gray-50 dark:hover:bg-charcoal-800 transition-colors bg-white dark:bg-transparent"
                     >
                         <Activity size={18} className="text-neon-green" />
                         <span className="text-sm font-bold">試用版</span>
                     </button>
                 </div>
                 
                 {/* Tip for external browsers */}
                 <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400">
                        若使用 LINE 或 FB 內建瀏覽器無法登入，請點擊右上角選擇「使用 Safari/Chrome 開啟」。
                    </p>
                 </div>
             </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-charcoal-800 p-4 text-center border-t border-gray-200 dark:border-charcoal-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSignUp ? "已經有帳號了？" : "還沒有帳號？"}
                  <button 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                    }}
                    className="ml-2 font-bold text-neon-blue hover:underline"
                  >
                      {isSignUp ? "登入" : "立即註冊"}
                  </button>
              </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
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
                      <h3 className="text-xl font-bold">重設密碼</h3>
                      <p className="text-xs text-gray-500 mt-1">輸入您的 Email，我們將發送重設連結給您。</p>
                  </div>

                  {resetStatus === 'success' ? (
                      <div className="text-center py-4">
                          <CheckCircle className="text-neon-green w-12 h-12 mx-auto mb-3" />
                          <p className="text-sm font-bold">信件已發送！</p>
                          <p className="text-xs text-gray-500 mt-1">請檢查您的收件匣 (或是垃圾郵件)。</p>
                          <button 
                              onClick={() => setShowForgotModal(false)}
                              className="mt-6 w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-2 rounded-xl"
                          >
                              好的
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
                                  <AlertCircle size={12} /> 發送失敗，請確認 Email 是否正確。
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
                                      <Send size={18} /> 發送重設信
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

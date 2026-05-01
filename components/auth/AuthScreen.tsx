import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { motion } from 'motion/react';
import { Wand2, User, Lock, Mail, Globe } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../services/firebase';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginAnonymously } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6">
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="max-w-md w-full bg-[#0f0f0f] border border-gray-800 rounded-3xl p-8 shadow-2xl"
       >
          <div className="flex justify-center mb-8">
             <Wand2 className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-center mb-8">
            {authMode === 'login' ? 'Sign in to your creative workstation' : 'Start your creative journey with Lumina'}
          </p>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleEmailAuth} className="space-y-4">
             {authMode === 'register' && (
               <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" placeholder="Full Name" className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all" />
               </div>
             )}
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                  className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all" 
                  required
                />
             </div>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" 
                  className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all" 
                  required
                />
             </div>

             <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f0f0f] px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
            >
               <Globe className="w-4 h-4 text-blue-500" />
              Google
            </button>
            <button 
              onClick={loginAnonymously}
              className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all active:scale-95"
            >
              Guest
            </button>
          </div>
          
          <p className="text-gray-500 text-center text-sm mt-6">
            {authMode === 'login' ? (
              <>Don't have an account? <span onClick={() => setAuthMode('register')} className="text-blue-500 cursor-pointer font-medium hover:underline">Register</span></>
            ) : (
              <>Already have an account? <span onClick={() => setAuthMode('login')} className="text-blue-500 cursor-pointer font-medium hover:underline">Sign In</span></>
            )}
          </p>
       </motion.div>
    </div>
  );
};

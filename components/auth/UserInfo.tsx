import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { LogOut, User as UserIcon, ChevronDown, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 pr-1 md:pr-4 py-1 bg-gray-800/50 border border-gray-800 rounded-full hover:bg-gray-800 transition-all cursor-pointer group"
      >
        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-blue-600 border border-blue-500/30 flex items-center justify-center overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-4 md:w-5 h-4 md:h-5 text-white" />
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-[11px] font-bold text-white leading-none mb-0.5 truncate max-w-[80px]">
            {user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest User' : 'User')}
          </span>
          <span className="text-[9px] text-gray-500 font-medium">
            {user.isAnonymous ? 'Temporary Access' : 'Verified Profile'}
          </span>
        </div>
        <ChevronDown className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              key="user-dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-800 bg-[#151515]">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border-2 border-gray-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate max-w-[120px]">
                      {user.displayName || 'Lumina User'}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate max-w-[120px]">
                      {user.email || 'guest@anonymous.com'}
                    </span>
                  </div>
                </div>
                {user.isAnonymous && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-[10px] text-yellow-500 leading-tight">
                      Guest accounts are temporary. Link Google to save permanently.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2">
                <button 
                  onClick={() => {/* Navigate to Profile */}}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  View Profile
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

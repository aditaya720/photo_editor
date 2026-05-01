import React, { useState, useEffect } from 'react';
import { EditorWorkspace } from './EditorWorkspace';
import { CanvasProvider } from './CanvasContext';
import { collection, query, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import { db, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Layout, Image as LucideImage, Palette, Sparkles, ChevronRight, User, Lock, Mail, Plus, LogOut } from 'lucide-react';
import { useEditor } from './CanvasContext';
import { AuthProvider, useAuth } from './services/AuthContext';
import { UserInfo } from './components/auth/UserInfo';
import { AuthScreen } from './components/auth/AuthScreen';
import { Design } from './types/editor';

type AppScreen = 'splash' | 'onboarding' | 'auth' | 'dashboard' | 'editor';

const SplashScreen: React.FC = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <Wand2 className="w-20 h-20 text-blue-500 fill-blue-500/10 mb-6" />
      <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">LUMINA</h1>
      <p className="text-gray-500 text-sm tracking-[0.3em] font-medium uppercase">Professional Creative Suite</p>
    </motion.div>
  </div>
);

interface OnboardingProps {
  onNext: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onNext }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "AI-Powered Creativity", desc: "Unlock professional tools with the magic of Gemini AI.", icon: Sparkles },
    { title: "Precision Canvas", desc: "Fine-tune every pixel with our advanced multi-layer engine.", icon: Layout },
    { title: "One-Click Magic", desc: "Remove backgrounds and enhance photos instantly.", icon: LucideImage },
  ];
  const StepIcon = steps[step].icon;

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="max-w-md w-full flex flex-col items-center text-center"
        >
          <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center mb-10 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
             <StepIcon className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">{steps[step].title}</h2>
          <p className="text-gray-400 mb-12 leading-relaxed">{steps[step].desc}</p>
          <div className="flex gap-2 mb-12">
             {steps.map((_, i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-blue-500' : 'w-2 bg-gray-800'}`} />
             ))}
          </div>
          <button 
            onClick={() => step < 2 ? setStep(s => s + 1) : onNext()}
            className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
          >
            {step === 2 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

interface DashboardProps {
  designs: Design[];
  onOpenDesign: (id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ designs, onOpenDesign }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col">
       <header className="h-20 border-b border-gray-800 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Wand2 className="w-8 h-8 text-blue-500" />
             <span className="font-black text-xl tracking-tighter">LUMINA</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
             <button className="hover:text-white transition-colors">Templates</button>
             <button className="hover:text-white transition-colors">Projects</button>
             <UserInfo />
          </div>
       </header>
       
       <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
             <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold tracking-tight">Your Workspace</h2>
                <button 
                  onClick={() => onOpenDesign()}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                   <Plus className="w-5 h-5" />
                   New Design
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {designs.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl">
                     <Layout className="w-12 h-12 mb-4 opacity-20" />
                     <p>No designs yet. Create your first masterpiece!</p>
                  </div>
                )}
                {designs.map(design => (
                  <div key={design.id} onClick={() => onOpenDesign(design.id)} className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-gray-800 rounded-2xl mb-4 border border-gray-700 overflow-hidden relative transition-all group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                       {design.thumbnail ? (
                         <img src={design.thumbnail} className="w-full h-full object-cover" alt={design.name} />
                       ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                           <LucideImage className="w-12 h-12" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <button className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold">Open Editor</button>
                       </div>
                    </div>
                    <h3 className="font-semibold text-gray-300 truncate">{design.name}</h3>
                    <p className="text-xs text-gray-500">
                      Updated {design.updatedAt instanceof Timestamp ? design.updatedAt.toDate().toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                ))}
             </div>
          </div>
       </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { setInitialState } = useEditor();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    if (!user) {
      setDesigns([]);
      return;
    }

    const designsQuery = query(
      collection(db, 'users', user.uid, 'designs'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(designsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Design));
      setDesigns(docs);
    });

    return unsubscribe;
  }, [user]);

  const handleOpenDesign = (designId?: string) => {
    if (designId) {
      const design = designs.find(d => d.id === designId);
      if (design) {
        setInitialState({ 
          currentDesignId: designId, 
          canvasData: design.canvasData 
        });
      }
    } else {
      setInitialState({ currentDesignId: '', canvasData: '' });
    }
    setCurrentScreen('editor');
  };

  useEffect(() => {
    if (user && (currentScreen === 'auth' || currentScreen === 'onboarding' || currentScreen === 'splash')) {
      setCurrentScreen('dashboard');
    }
  }, [user, currentScreen]);

  useEffect(() => {
    if (currentScreen === 'splash' && !loading) {
      const timer = setTimeout(() => {
        if (user) setCurrentScreen('dashboard');
        else setCurrentScreen('onboarding');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, loading, user]);

  return (
    <div className="font-sans antialiased">
      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'onboarding' && <Onboarding onNext={() => setCurrentScreen('auth')} />}
      {currentScreen === 'auth' && <AuthScreen />}
      {currentScreen === 'dashboard' && <Dashboard designs={designs} onOpenDesign={handleOpenDesign} />}
      {currentScreen === 'editor' && <EditorWorkspace />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CanvasProvider>
        <AppContent />
      </CanvasProvider>
    </AuthProvider>
  );
};

export default App;

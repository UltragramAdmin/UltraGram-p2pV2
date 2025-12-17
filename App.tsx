
import React, { useState, useEffect } from 'react';
import { User, Chat, Language } from './types';
import { authService, networkService, initializeGlobalChat, chatService } from './services/mockService';
import { translations } from './services/translations';
import AuthScreen from './components/AuthScreen';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Logo from './components/Logo';
import ProfileModal from './components/ProfileModal';
import BackgroundEffects from './components/BackgroundEffects';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showCopied, setShowCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [globalNodes, setGlobalNodes] = useState<any[]>([]);

  const t = translations[lang] || translations.en;

  useEffect(() => {
    const initApp = async () => {
      initializeGlobalChat();
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
          setUser(currentUser);
          setLang(currentUser.lang || 'en');
          networkService.initPeer(currentUser.id, (peerId) => {
              authService.updateUser(currentUser.id, { peerId });
              setUser(prev => prev ? { ...prev, peerId } : null);
              setIsOnline(true);
          });
      }
      setTimeout(() => {
        setIsLoading(false);
        setShowSplash(false);
      }, 1500);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      const unsub = networkService.subscribeDiscovery((nodes) => {
        setGlobalNodes(nodes.filter(n => n.id !== user.peerId));
      });
      return unsub;
    }
  }, [user]);

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = await authService.updateUser(user.id, data);
    setUser(updatedUser);
    if (data.lang) setLang(data.lang as Language);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const connectToNode = async (node: any) => {
    const chat = await chatService.createChat(user!.id, node.id, node.name);
    setSelectedChat(chat);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-dark-bg flex flex-col items-center justify-center z-50 overflow-hidden drag-region">
        <div className="absolute w-[600px] h-[600px] bg-ultra-600 rounded-full blur-[150px] opacity-20 animate-pulse-slow"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
            <Logo animated className="w-40 h-40" />
            <h1 className="mt-8 text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-ultra-400 via-neon-pink to-ultra-600 text-neon tracking-wider animate-pulse">
            ULTRAGRAM
            </h1>
            <p className="text-gray-400 mt-4 text-xs uppercase tracking-[0.4em] animate-slide-up">{t.connecting}</p>
        </div>
      </div>
    );
  }

  if (isLoading) return null;
  if (!user) return <AuthScreen onAuthSuccess={(u) => { 
      setUser(u);
      networkService.initPeer(u.id, (pid) => {
          authService.updateUser(u.id, { peerId: pid });
          setIsOnline(true);
      });
  }} lang={lang} setLang={setLang} />;

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300 relative bg-dark-bg">
      <BackgroundEffects isDarkMode={isDarkMode} />
      
      {/* Copied Toast */}
      <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${showCopied ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className="bg-ultra-600 text-white px-6 py-2 rounded-full shadow-neon font-bold text-sm">
              {t.idCopied}
          </div>
      </div>

      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-2xl z-20`}>
        <div className="p-4 flex items-center justify-between border-b dark:border-white/5 drag-region pt-8 md:pt-4">
          <div className="flex items-center gap-2 no-drag" onClick={() => setSelectedChat(null)}>
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-ultra-500 to-neon-pink">UltraGram</span>
          </div>
          <div className="flex items-center gap-3 no-drag">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-white/10 transition-all">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="relative">
                <img src={user.avatar} className="w-8 h-8 rounded-full ring-2 ring-ultra-500/30 object-cover cursor-pointer" onClick={() => setIsProfileOpen(true)} />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-bg ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatList currentUser={user} onSelectChat={setSelectedChat} selectedChatId={selectedChat?.id} lang={lang} />
        </div>
      </div>

      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative`}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} currentUser={user} onBack={() => setSelectedChat(null)} lang={lang} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
                <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                </svg>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-2xl">
              <div className="w-20 h-20 bg-ultra-500/10 rounded-full flex items-center justify-center mb-6 animate-float relative">
                  <Logo className="w-10 h-10 relative z-10" />
              </div>
              
              <h2 className="text-3xl font-black mb-2 text-white">{t.selectChat}</h2>
              <p className="text-gray-500 text-sm max-w-xs text-center mb-10">{t.startMessaging}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* ID Card */}
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 backdrop-blur-xl group hover:border-ultra-500/50 transition-all cursor-pointer relative overflow-hidden" onClick={() => user.peerId && copyToClipboard(user.peerId)}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`}></div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{t.globalStatus}</span>
                    </div>
                    <code className="text-ultra-400 font-mono text-xl block mb-2">{user.peerId || '...'}</code>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">{lang === 'ru' ? 'Нажмите, чтобы скопировать ваш адрес' : 'Click to copy your address'}</p>
                </div>

                {/* Discovery Hub */}
                <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-ultra-400 uppercase font-black tracking-widest">{lang === 'ru' ? 'СЕТЬ ОНЛАЙН' : 'GLOBAL NODES'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-ultra-500/20 text-ultra-400 text-[10px] font-bold animate-pulse">{globalNodes.length} ONLINE</span>
                  </div>
                  
                  <div className="flex-1 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {globalNodes.length > 0 ? globalNodes.map(node => (
                      <div key={node.id} onClick={() => connectToNode(node)} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-ultra-500/20 transition-all cursor-pointer group">
                        <img src={node.avatar} className="w-8 h-8 rounded-full border border-white/10" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{node.name}</p>
                          <p className="text-[9px] text-gray-500 font-mono truncate">{node.id}</p>
                        </div>
                        <svg className="w-4 h-4 text-ultra-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-30 py-4">
                        <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <p className="text-[9px] uppercase tracking-tighter">Scanning Global Mesh...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} currentUser={user} onUpdate={handleUpdateProfile} isEditable={true} lang={lang} />
    </div>
  );
};

export default App;

};

export default App;

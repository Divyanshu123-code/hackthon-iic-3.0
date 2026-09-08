import React, { useState } from 'react';
import { askSathi } from '../api';

export default function SathiWidget({ activeTab, farmerData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('मेरी फसल कब बिकेगी?');
  const [reply, setReply] = useState(
    'राम लाल जी, आपका टोकन #42 है। आपके आगे केवल 4 ट्रैक्टर हैं। लगभग 25 मिनट में कांटा #3 पर आपकी तौल शुरू होगी।'
  );
  const [loading, setLoading] = useState(false);

  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'hi-IN';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleAsk = async (questionText) => {
    if (!questionText.trim()) return;
    setLastQuery(questionText);
    setReply('साथी उत्तर तैयार कर रहा है...');
    setLoading(true);

    try {
      const res = await askSathi(questionText, activeTab, farmerData?.farmerId || 'F1');
      setReply(res.reply);
      speakText(res.reply);
    } catch (err) {
      setReply('क्षमा करें, नेटवर्क समस्या है। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAsk(query);
    setQuery('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <aside className="fixed bottom-24 right-pad-md z-40 flex items-center gap-pad-xs max-w-lg mx-auto">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-secondary-fixed opacity-75 animate-ping pointer-events-none"></div>
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Voice Assistant"
            className="relative flex items-center gap-pad-xs bg-secondary hover:bg-secondary/90 text-on-secondary shadow-xl rounded-full px-pad-md h-14 min-w-[56px] transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[28px] text-secondary-fixed">mic</span>
            <span className="font-label-md text-label-md tracking-wide text-on-secondary whitespace-nowrap">बोलिए / Speak</span>
          </button>
        </div>
      </aside>

      {/* Interactive Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-lg bg-inverse-surface text-inverse-on-surface rounded-t-2xl p-pad-lg flex flex-col gap-pad-md shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-surface-container-highest/40 rounded-full mx-auto"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-pad-xs">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-fixed"></span>
                </span>
                <span className="font-label-md text-label-md text-secondary-fixed">साथी AI सहायक • Sathi Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-highest/20 flex items-center justify-center text-inverse-on-surface active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Sound Wave Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-10 py-1">
              <span className="w-1.5 h-5 bg-secondary-fixed rounded-full animate-bounce"></span>
              <span className="w-1.5 h-9 bg-primary-fixed rounded-full animate-bounce [animation-delay:0.1s]"></span>
              <span className="w-1.5 h-4 bg-secondary-fixed rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-10 bg-primary-fixed rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-1.5 h-7 bg-secondary-fixed rounded-full animate-bounce [animation-delay:0.3s]"></span>
              <span className="w-1.5 h-4 bg-secondary-fixed rounded-full animate-bounce [animation-delay:0.05s]"></span>
            </div>

            {/* Spoken Query & Reply */}
            <div className="bg-surface-container-highest/15 rounded-xl p-pad-md flex flex-col gap-2 border border-white/10">
              <div className="flex items-center justify-between text-xs text-inverse-on-surface/70">
                <span>सवाल (Question):</span>
                <span className="text-secondary-fixed uppercase text-[10px] font-bold">{activeTab.toUpperCase()} CONTEXT</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-inverse-on-surface">"{lastQuery}"</p>
              <div className="h-px bg-white/10 my-1"></div>
              <p className="font-body-md text-sm text-secondary-fixed leading-relaxed">
                {reply}
              </p>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => handleAsk('मेरी फसल कब बिकेगी?')}
                className="flex-shrink-0 py-1.5 px-3 rounded-full bg-surface-container-highest/20 hover:bg-surface-container-highest/40 font-label-sm text-xs text-inverse-on-surface text-center active:scale-95 border border-white/10"
              >
                "कब बिकेगी?"
              </button>
              <button
                onClick={() => handleAsk('मेरा टोकन नंबर और कतार स्थिति क्या है?')}
                className="flex-shrink-0 py-1.5 px-3 rounded-full bg-surface-container-highest/20 hover:bg-surface-container-highest/40 font-label-sm text-xs text-inverse-on-surface text-center active:scale-95 border border-white/10"
              >
                "टोकन स्थिति"
              </button>
              <button
                onClick={() => handleAsk('आज गेहूं का क्या भाव है?')}
                className="flex-shrink-0 py-1.5 px-3 rounded-full bg-surface-container-highest/20 hover:bg-surface-container-highest/40 font-label-sm text-xs text-inverse-on-surface text-center active:scale-95 border border-white/10"
              >
                "गेंहू का भाव"
              </button>
              <button
                onClick={() => handleAsk('पैसे कब आएंगे और क्या 80% एडवांस मिलेगा?')}
                className="flex-shrink-0 py-1.5 px-3 rounded-full bg-surface-container-highest/20 hover:bg-surface-container-highest/40 font-label-sm text-xs text-inverse-on-surface text-center active:scale-95 border border-white/10"
              >
                "80% एडवांस"
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="अपना सवाल लिखें या बोलें..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-fixed"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-label-sm text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                पूछें
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

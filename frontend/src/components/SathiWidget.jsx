import React, { useState, useEffect, useRef } from 'react';
import { askSathi } from '../api';

export default function SathiWidget({ activeTab, farmerData, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [activeModel, setActiveModel] = useState('🌾 Kisan Sathi AI');

  // User configured LLM settings saved in localStorage
  const [provider, setProvider] = useState(() => localStorage.getItem('sathi_llm_provider') || 'auto');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sathi_api_key') || '');
  const [saveStatus, setSaveStatus] = useState('');

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'sathi',
      text: `राम लाल जी, नमस्ते! 🙏 मैं आपका साथी AI सहायक हूँ। आज कोटा मंडी में गेहूं की खरीद ₹2,275/Qtl पर चालू है। आपका टोकन #42 है। मैं आपकी क्या सहायता कर सकता हूँ?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: '🌾 Kisan Sathi AI'
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const saveSettings = () => {
    localStorage.setItem('sathi_llm_provider', provider);
    localStorage.setItem('sathi_api_key', apiKey);
    setSaveStatus('✅ सेटिंग्स सुरक्षित हो गईं!');
    setTimeout(() => {
      setSaveStatus('');
      setShowSettings(false);
    }, 1200);
  };

  const speakText = (text) => {
    if (!ttsEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'hi-IN';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Build lightweight conversation history for the LLM
      const history = newMessages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await askSathi({
        message: query,
        screenContext: activeTab,
        farmerId: farmerData?.farmerId || 'F1',
        conversation: history,
        customApiKey: apiKey,
        customProvider: provider === 'auto' ? '' : provider
      });

      const botReply = res.reply || 'मैं आपकी बात समझ नहीं पाया। कृपया पुनः पूछें।';
      if (res.modelUsed) setActiveModel(res.modelUsed);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'sathi',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: res.modelUsed || 'Sathi AI',
        action: res.action
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(botReply);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'sathi',
        text: 'क्षमा करें, नेटवर्क में समस्या आ रही है। कृपया पुनः प्रयास करें।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'Offline Mode'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया लिखकर पूछें।');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const contextChips = {
    home: ['मेरी फसल कब बिकेगी?', 'आज गेहूं का क्या भाव है?', 'मेरा टोकन नंबर क्या है?', '80% एडवांस कैसे मिलेगा?'],
    schedule: ['सुबह का स्लॉट बुक करो', 'कल किस फसल की खरीद होगी?', 'मंडी खुलने का समय क्या है?'],
    queue: ['मेरे आगे कितने ट्रैक्टर हैं?', 'कांटा #3 पर कितना समय लगेगा?', 'गेट पास कब मिलेगा?'],
    payment: ['80% एडवांस तुरंत भेजो', 'मेरा कुल अनुमोदित भुगतान कितना है?', 'किस बैंक खाते में पैसे आएंगे?']
  };

  const currentChips = contextChips[activeTab] || contextChips.home;

  return (
    <>
      {/* Floating Action Voice Button */}
      <aside className="fixed bottom-24 right-4 z-40 flex items-center gap-2 max-w-lg mx-auto">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-secondary opacity-50 animate-ping pointer-events-none"></div>
          <button
            onClick={() => setIsOpen(true)}
            aria-label="साथी AI सहायक"
            className="relative flex items-center gap-2 bg-gradient-to-r from-secondary to-primary hover:opacity-95 text-white shadow-2xl rounded-full px-4 h-14 min-w-[56px] transition-transform active:scale-95 border border-white/20"
          >
            <span className="material-symbols-outlined text-[28px] animate-pulse">smart_toy</span>
            <span className="font-label-md text-sm font-bold tracking-wide whitespace-nowrap hidden sm:inline">
              साथी AI • बोलिए
            </span>
          </button>
        </div>
      </aside>

      {/* Main Full-Height Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#1a1c1e] text-white rounded-t-3xl sm:rounded-3xl flex flex-col h-[90vh] sm:h-[650px] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            {/* Header */}
            <div className="bg-[#212429] px-4 py-3.5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-[22px]">psychology</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-base font-bold text-white">साथी AI • Mandi Assistant</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <span>{activeModel}</span>
                    <span>•</span>
                    <span className="text-white/60">Live Mandi Data</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* TTS Toggle */}
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={ttsEnabled ? 'आवाज़ बंद करें' : 'आवाज़ चालू करें'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    ttsEnabled ? 'bg-secondary/30 text-secondary-fixed' : 'bg-white/10 text-white/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {ttsEnabled ? 'volume_up' : 'volume_off'}
                  </span>
                </button>

                {/* LLM Provider Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="LLM API Settings"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSettings(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Settings Drawer */}
            {showSettings && (
              <div className="bg-[#292c33] p-4 border-b border-white/10 animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">tune</span>
                    LLM Provider Configuration
                  </h4>
                  {saveStatus && <span className="text-xs text-emerald-400 font-bold">{saveStatus}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { id: 'auto', label: '🌾 Auto' },
                    { id: 'gemini', label: '✨ Gemini' },
                    { id: 'groq', label: '⚡ Groq' },
                    { id: 'openai', label: '🤖 OpenAI' },
                    { id: 'openrouter', label: '🌐 OpenRouter' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        provider === p.id
                          ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {provider !== 'auto' && (
                  <div className="mb-3">
                    <label className="text-[11px] text-white/70 block mb-1">
                      {provider.toUpperCase()} API Key (Optional if configured on server):
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter ${provider} API Key...`}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-secondary"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1 text-xs text-white/70 hover:text-white"
                  >
                    रद्द करें
                  </button>
                  <button
                    onClick={saveSettings}
                    className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow active:scale-95"
                  >
                    सेटिंग्स सहेजें
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] text-white/50">{msg.timestamp}</span>
                    {msg.sender === 'sathi' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-secondary-fixed border border-white/5 font-mono">
                        {msg.model}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-primary to-primary/90 text-on-primary rounded-tr-none'
                        : 'bg-[#262930] text-gray-100 rounded-tl-none border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Action buttons if triggered */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                        <span className="text-xs text-emerald-300 font-bold">
                          {msg.action.type === 'SLOT_BOOKED' ? `स्लॉट आरक्षित (#${msg.action.token})` : 'अग्रिम प्रोसेस हो गया'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audio Readout Icon for Bot Message */}
                  {msg.sender === 'sathi' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="mt-1 px-2 py-0.5 text-[11px] text-white/60 hover:text-secondary-fixed flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      सुनें
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px] animate-spin">refresh</span>
                  </div>
                  <div className="bg-[#262930] rounded-2xl rounded-tl-none p-3.5 border border-white/10 flex items-center gap-2">
                    <span className="text-xs text-secondary-fixed animate-pulse">साथी सोच रहा है...</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Prompt Suggestions */}
            <div className="px-3 py-2 bg-[#212429] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              <span className="text-[10px] text-white/40 uppercase font-bold flex-shrink-0 px-1">सुझाव:</span>
              {currentChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading}
                  className="flex-shrink-0 py-1 px-2.5 rounded-full bg-white/5 hover:bg-white/15 text-[11px] text-white/90 border border-white/10 active:scale-95 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Bottom Input Area with Mic */}
            <div className="p-3 bg-[#1d2024] border-t border-white/10 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={startVoiceInput}
                  title="बोलकर पूछें (Hindi Voice)"
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/30'
                      : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isListening ? 'graphic_eq' : 'mic'}
                  </span>
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? 'सुन रहा हूँ, बोलिए...' : 'अपना सवाल पूछें या बोलें...'}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-secondary transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="w-11 h-11 rounded-xl bg-secondary disabled:opacity-40 hover:bg-secondary/90 text-on-secondary flex items-center justify-center shadow active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

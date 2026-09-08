import React, { useState, useEffect, useRef, useCallback } from 'react';
import { askSathi } from '../api';

export default function SathiWidget({ activeTab, farmerData, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [activeModel, setActiveModel] = useState('🌾 Kisan Sathi AI');
  const [micStatusText, setMicStatusText] = useState('');

  // User configured LLM settings
  const [provider, setProvider] = useState(() => localStorage.getItem('sathi_llm_provider') || 'auto');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sathi_api_key') || '');
  const [saveStatus, setSaveStatus] = useState('');

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'sathi',
      text: `राम लाल जी, नमस्ते! 🙏 मैं आपका साथी AI सहायक हूँ। आज कोटा मंडी में गेहूं की खरीद ₹2,275/Qtl पर चालू है। आपका टोकन #42 है। आप बोलकर या लिखकर कुछ भी पूछ सकते हैं।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: '🌾 Kisan Sathi AI'
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices() || [];
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, interimTranscript]);

  const saveSettings = () => {
    localStorage.setItem('sathi_llm_provider', provider);
    localStorage.setItem('sathi_api_key', apiKey);
    setSaveStatus('✅ सेटिंग्स सुरक्षित!');
    setTimeout(() => {
      setSaveStatus('');
      setShowSettings(false);
    }, 1200);
  };

  // Robust Text-To-Speech with Hindi Voice Matching
  const speakText = useCallback((text) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      // Clean markdown stars/bullets for natural audio speech
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/₹\s*([0-9,]+)/g, '$1 रुपये ')
        .replace(/Qtl/gi, ' क्विंटल ')
        .replace(/ETA/gi, ' अनुमानित समय ')
        .replace(/MSP/gi, ' एम एस पी ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'hi-IN';

      // Pick best matching Hindi/Indian voice
      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('lekha')
      ) || voices.find((v) => v.lang.toLowerCase().includes('in')) || voices[0];

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Keep reference to prevent GC pausing bug in Chromium
      window._sathiCurrentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Send message and get AI response
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    stopSpeaking();
    stopVoiceInput();
    setInterimTranscript('');
    setMicStatusText('');

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

      const botReply = res.reply || 'राम लाल जी, मैं आपकी बात समझ नहीं पाया। कृपया पुनः पूछें।';
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

  // Stop active voice recognition
  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Start active voice recognition with real-time feedback
  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;

    // Stop speaking if assistant is speaking
    stopSpeaking();

    // Toggle off if already listening
    if (isListening) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatusText('⚠️ इस ब्राउज़र में माइक सपोर्ट नहीं है। कृपया लिखकर पूछें।');
      setTimeout(() => setMicStatusText(''), 4000);
      return;
    }

    try {
      stopVoiceInput();

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusText('🎙️ सुन रहा हूँ... कृपया बोलिए (Listening in Hindi)');
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          setMicStatusText(`🗣️ "${interim}"`);
        }

        if (finalTranscript.trim()) {
          setInterimTranscript('');
          setMicStatusText(`✅ प्राप्त हुआ: "${finalTranscript.trim()}"`);
          setIsListening(false);
          handleSendMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicStatusText('❌ माइक्रोफ़ोन की अनुमति (Permission) दें');
        } else if (event.error === 'no-speech') {
          setMicStatusText('⚠️ कोई आवाज़ नहीं सुनी गई। पुनः माइक दबाएं।');
        } else if (event.error === 'network') {
          setMicStatusText('⚠️ नेटवर्क समस्या। कृपया इंटरनेट जांचें।');
        } else {
          setMicStatusText(`त्रुटि: ${event.error}`);
        }
        setTimeout(() => setMicStatusText(''), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      setMicStatusText('माइक शुरू नहीं हो सका');
      setTimeout(() => setMicStatusText(''), 3000);
    }
  };

  // Open modal and optionally auto-start listening
  const handleOpenAssistant = (autoListen = false) => {
    setIsOpen(true);
    if (autoListen) {
      setTimeout(() => {
        startVoiceInput();
      }, 300);
    }
  };

  const contextChips = {
    home: ['मेरी फसल कब बिकेगी?', 'आज गेहूं का भाव क्या है?', 'मेरा टोकन नंबर क्या है?', '80% एडवांस कैसे मिलेगा?'],
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
          <div className="absolute inset-0 rounded-full bg-secondary opacity-60 animate-ping pointer-events-none"></div>
          <button
            onClick={() => handleOpenAssistant(true)}
            aria-label="साथी AI सहायक"
            className="relative flex items-center gap-2.5 bg-gradient-to-r from-secondary to-primary hover:opacity-95 text-white shadow-2xl rounded-full px-5 h-14 min-w-[56px] transition-transform active:scale-95 border border-white/20"
          >
            <span className="material-symbols-outlined text-[28px] animate-pulse">mic</span>
            <div className="flex flex-col text-left leading-tight pr-1">
              <span className="font-label-md text-sm font-extrabold tracking-wide whitespace-nowrap">
                साथी AI • बोलिए
              </span>
              <span className="text-[10px] text-secondary-fixed opacity-90">Tap to Talk (Hindi)</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Full-Height Chat & Voice Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#181a1d] text-white rounded-t-3xl sm:rounded-3xl flex flex-col h-[92vh] sm:h-[680px] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            {/* Top Bar Header */}
            <div className="bg-[#202328] px-4 py-3.5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[22px]">psychology</span>
                  </div>
                  {isSpeaking && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary items-center justify-center text-[9px]">🔊</span>
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-base font-bold text-white">साथी AI • Voice Assistant</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <span>{activeModel}</span>
                    <span>•</span>
                    <span className="text-white/60">Live Mandi Data</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio TTS Toggle / Stop */}
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 animate-pulse"
                  >
                    <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                    रोकें
                  </button>
                ) : (
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
                )}

                {/* LLM Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="LLM Settings"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    stopVoiceInput();
                    setIsOpen(false);
                    setShowSettings(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Provider Configuration Drawer */}
            {showSettings && (
              <div className="bg-[#262930] p-4 border-b border-white/10 animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">tune</span>
                    LLM Engine Configuration
                  </h4>
                  {saveStatus && <span className="text-xs text-emerald-400 font-bold">{saveStatus}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { id: 'auto', label: '🌾 Auto Mandi' },
                    { id: 'gemini', label: '✨ Gemini' },
                    { id: 'groq', label: '⚡ Groq (Fast)' },
                    { id: 'openai', label: '🤖 OpenAI' },
                    { id: 'openrouter', label: '🌐 OpenRouter' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        provider === p.id
                          ? 'bg-secondary text-on-secondary border-secondary shadow-sm font-bold'
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
                      {provider.toUpperCase()} API Key (Optional if set on server):
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
                    बंद करें
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

            {/* Live Audio Listening Wave Indicator */}
            {isListening && (
              <div className="bg-gradient-to-r from-rose-900/60 via-amber-900/40 to-rose-900/60 p-3 border-b border-rose-500/30 flex flex-col items-center justify-center gap-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-6 bg-rose-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-10 bg-amber-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                  <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-12 bg-amber-300 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-7 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  <span className="w-1.5 h-5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.05s]"></span>
                </div>
                <div className="text-xs font-bold text-rose-200 text-center flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  <span>{micStatusText || 'माइक चालू है • कृपया हिन्दी या अंग्रेज़ी में बोलें...'}</span>
                </div>
                {interimTranscript && (
                  <p className="text-sm font-semibold text-amber-200 italic bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                    "{interimTranscript}"
                  </p>
                )}
              </div>
            )}

            {/* Mic Status Hint if not listening but status exists */}
            {!isListening && micStatusText && (
              <div className="bg-amber-900/40 px-3 py-1.5 text-xs text-amber-200 text-center border-b border-amber-500/30">
                {micStatusText}
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
                        : 'bg-[#24272d] text-gray-100 rounded-tl-none border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Action Confirmation Badge */}
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
                      className="mt-1 px-2 py-0.5 text-[11px] text-white/60 hover:text-secondary-fixed flex items-center gap-1 active:scale-95 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      बोलकर सुनें
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px] animate-spin">refresh</span>
                  </div>
                  <div className="bg-[#24272d] rounded-2xl rounded-tl-none p-3.5 border border-white/10 flex items-center gap-2">
                    <span className="text-xs text-secondary-fixed animate-pulse font-medium">साथी उत्तर तैयार कर रहा है...</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Prompt Suggestions */}
            <div className="px-3 py-2 bg-[#1f2227] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
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

            {/* Bottom Input Area with Big Mic Button */}
            <div className="p-3 bg-[#181a1d] border-t border-white/10 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={startVoiceInput}
                  title={isListening ? 'सुनना बंद करें' : 'बोलकर पूछें (Hindi Voice)'}
                  className={`h-12 px-3.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/40 font-bold'
                      : 'bg-gradient-to-r from-secondary to-primary text-white shadow hover:opacity-90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {isListening ? 'graphic_eq' : 'mic'}
                  </span>
                  <span className="text-xs font-bold hidden sm:inline">
                    {isListening ? 'सुन रहा हूँ' : 'बोलिए'}
                  </span>
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? 'माइक चालू है... बोलिए' : 'सवाल लिखें या बोलें...'}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-secondary transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="w-12 h-12 rounded-xl bg-secondary disabled:opacity-40 hover:bg-secondary/90 text-on-secondary flex items-center justify-center shadow active:scale-95 transition-transform"
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

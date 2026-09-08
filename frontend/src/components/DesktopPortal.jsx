import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookSlot, requestAdvance, advanceFarmerStage, advanceFarmerPayment, sendAnnouncement, resetDemoDb } from '../api';

export default function DesktopPortal({
  farmerData,
  scheduleData,
  queueData,
  paymentData,
  onSwitchToMobile,
  onOpenAid,
  onOpenMarket,
  onOpenQr,
  onOpenAdvance
}) {
  const { currentLangObj, setIsLangModalOpen, t, currentLang, changeLanguage, LANGUAGES } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'queue', 'schedule', 'payment', 'marketplace', 'financial_aid', 'staff'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [slotCounts, setSlotCounts] = useState({ morning: 8, afternoon: 15 });
  const [bookingState, setBookingState] = useState('idle');
  const [toastMsg, setToastMsg] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleBookSlot = async () => {
    setBookingState('loading');
    try {
      const res = await bookSlot('C1', 'F1', selectedSlot);
      setBookingState('success');
      if (res.tokensLeft !== undefined) {
        setSlotCounts(prev => ({ ...prev, [selectedSlot]: res.tokensLeft }));
      }
      showToast('✓ स्लॉट सफलतापूर्वक बुक किया गया! गेट पास तैयार है।');
      setTimeout(() => setBookingState('idle'), 2000);
    } catch (e) {
      setBookingState('error');
      showToast('⚠️ स्लॉट बुकिंग विफल: ' + e.message);
      setTimeout(() => setBookingState('idle'), 2000);
    }
  };

  const handleClaimAdvance = async () => {
    try {
      await requestAdvance('F1');
      showToast('✓ 80% अग्रिम राशि (₹1,95,680) बैंक खाते में स्थानांतरित की गई!');
    } catch (e) {
      showToast('⚠️ अग्रिम दावा विफल: ' + e.message);
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-[#1E293B] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#166534] text-white px-5 py-3 rounded-xl shadow-2xl border border-green-600 flex items-center gap-3 text-sm font-semibold animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="ml-2 font-bold text-lg">×</button>
        </div>
      )}

      {/* 1. SUPER TOP GOV HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
        <div className="bg-[#0D3820] text-white text-[11px] font-medium border-b border-emerald-900">
          <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold tracking-wide">
                <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                कृषि एवं किसान कल्याण मंत्रालय | Ministry of Agriculture & Farmers Welfare
              </span>
              <span className="text-emerald-500 hidden md:inline">•</span>
              <span className="hidden md:inline text-emerald-100">राष्ट्रीय कृषि बाजार (e-NAM) अधिकृत APMC नेटवर्क</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-emerald-200">
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>टोल-फ्री: <strong className="text-white font-mono">1800-180-1551</strong></span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-emerald-700 text-[11px]">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      currentLang === lang.code ? 'bg-emerald-700 font-bold text-white' : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN DESKTOP PORTAL BRAND & SEARCH */}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              🌾
            </div>
            <div className="flex flex-col border-l border-[#E2E8F0] pl-3">
              <h1 className="font-bold text-base text-[#0F172A] tracking-tight leading-tight">
                किसान मंडी ई-उपार्जन पोर्टल • APMC कोटा
              </h1>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Digital Procurement Platform • Rajasthan Mandi Yard
              </span>
            </div>
          </div>

          {/* Desktop Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#94A3B8] text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="खोजें: टोकन सं., वाहन सं. (RJ-20-EA-4412), या किसान ID..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#166534] focus:ring-1 focus:ring-[#166534] outline-none transition"
              />
            </div>
          </div>

          {/* User & Mode Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* View Switcher Button */}
            <button
              onClick={onSwitchToMobile}
              className="px-3 py-1.5 bg-[#FAF6EE] border border-[#E5DEC9] text-[#166534] rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#F4EFE2] transition shadow-xs"
              title="मोबाइल ऐप व्यू देखें"
            >
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              <span>मोबाइल व्यू (PWA)</span>
            </button>

            {/* Yard Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></span>
              <span className="font-bold text-[#166534] uppercase">मंडी गेट: खुला है (OPEN)</span>
            </div>

            {/* Farmer Identity Badge */}
            <div className="flex items-center gap-2.5 border-l border-[#E2E8F0] pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#0F172A]">{farmerData?.name || 'राम लाल शर्मा'}</div>
                <div className="text-[10px] font-mono text-[#64748B]">ID: APMC-KOT-789</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold shadow-xs">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. OFFICIAL ENTERPRISE NAVIGATION TABS */}
        <div className="border-t border-[#E2E8F0] bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center text-xs font-semibold overflow-x-auto gap-1">
              {[
                { id: 'dashboard', label: 'डैशबोर्ड / Overview', icon: 'dashboard' },
                { id: 'queue', label: 'टोकन व कतार / Live Queue', icon: 'receipt_long' },
                { id: 'schedule', label: 'मंडी कैलेंडर व MSP / Schedule', icon: 'calendar_month' },
                { id: 'payment', label: 'भुगतान व PFMS / Payouts', icon: 'account_balance_wallet' },
                { id: 'marketplace', label: 'e-NAM नीलामी / Trade Slips', icon: 'storefront' },
                { id: 'financial_aid', label: 'क्रेडिट पासबुक / Passbook', icon: 'account_balance' },
                { id: 'staff', label: 'स्टाफ कंट्रोल डेस्क / Staff Desk', icon: 'desk' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 border-b-2 font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#166534] text-[#166534] bg-green-50/60'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 4. MAIN DESKTOP CONTENT AREA */}
      <main className="pt-[148px] pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-5">
          
          {/* Top Breadcrumb & Live Controls Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span>मुख्य पृष्ठ</span>
              <span>/</span>
              <span>APMC कोटा यार्ड</span>
              <span>/</span>
              <span className="text-[#0F172A] font-bold uppercase">{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-[11px] font-mono text-[#64748B]">
                लाइव सिंक: <strong className="text-[#0F172A] font-semibold">{currentTime}</strong>
              </div>
              <button
                onClick={handlePrintPass}
                className="h-8 px-3.5 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>दैनिक पास प्रिंट</span>
              </button>
              <button
                onClick={onOpenQr}
                className="h-8 px-3.5 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                <span>गेट QR पास</span>
              </button>
            </div>
          </div>

          {/* 5. ENTERPRISE KPI METRICS STRIP */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">आज की आवक (Daily Intake)</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#0F172A] font-mono">1,420.50</span>
                <span className="text-xs text-[#64748B] font-semibold">क्विंटल</span>
              </div>
              <div className="text-[11px] text-[#166534] mt-0.5 font-semibold">✓ 86 वाहन कोटा यार्ड में दर्ज</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">आपका टोकन स्थिति</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#166534] font-mono">#{queueData?.token || 42}</span>
                <span className="text-[11px] font-bold text-[#166534] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  कांटा लेन 3
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">आगे केवल {queueData?.aheadCount || 4} ट्रैक्टर</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">सरकारी समर्थन मूल्य (MSP)</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#B45309] font-mono">₹4,892</span>
                <span className="text-xs text-[#64748B] font-semibold">/क्विंटल</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">सोयाबीन JS-335 (Grade A)</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">स्वीकृत DBT भुगतान</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#166534] font-mono">₹2,44,600</span>
                <span className="text-xs text-[#166534] font-bold">स्वीकृत</span>
              </div>
              <div className="text-[11px] text-[#0284C7] mt-0.5 font-semibold">80% अग्रिम: ₹1,95,680 तुरंत उपलब्ध</div>
            </div>
          </section>

          {/* TAB 1: DESKTOP DASHBOARD (COMBINED OVERVIEW) */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left 2 Columns: Live Queue & Today's Lot */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                
                {/* Live Gate Entry Slip & Electronic Board */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#166534]">receipt_long</span>
                      <h2 className="font-bold text-base text-[#0F172A]">प्रवेश पर्ची व लाइव कतार बोर्ड</h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#166534] bg-green-50 px-2.5 py-1 rounded border border-green-200">
                      BATCH-24A • VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#E5DEC9] flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-[#78716C] uppercase">आपका टोकन</span>
                      <span className="text-5xl font-black text-[#166534] my-1 font-mono">#{queueData?.token || 42}</span>
                      <span className="text-xs font-semibold text-[#166534] bg-green-100 px-2 py-0.5 rounded">सक्रिय / Active</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#64748B] uppercase">दर्ज वाहन व फसल</span>
                        <div className="text-sm font-bold text-[#0F172A] mt-1 font-mono">{queueData?.vehicleNumber || 'RJ-20-EA-4412'}</div>
                        <div className="text-xs text-[#64748B]">{farmerData?.crop || 'सोयाबीन'} ({farmerData?.quintal || 50} क्विंटल)</div>
                      </div>
                      <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#B45309] font-semibold">
                        धर्मकांटा गेट क्र. 3 पर जाएं
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#64748B] uppercase">अनुमानित प्रतीक्षा समय</span>
                        <div className="text-3xl font-black text-[#B45309] mt-1 font-mono">~25 <span className="text-sm font-sans font-semibold">मिनट</span></div>
                      </div>
                      <div className="text-xs text-[#64748B]">
                        गेट पर अभी: <strong className="text-[#166534]">#38</strong> (चालू)
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Live Procurement Stepper */}
                  <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-3">
                      प्रोक्योरमेंट चरण ट्रैकिंग (4-Stage Pipeline)
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg bg-green-50 border border-green-300 text-[#166534] font-bold">
                        1. प्रवेश व तौल (Done)
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[#B45309] font-bold animate-pulse">
                        2. गुणवत्ता जांच (In Progress)
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
                        3. नीलामी आवंटन
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
                        4. DBT बैंक खाता
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advance Slot Booking Card */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#B45309]">event_available</span>
                      <h2 className="font-bold text-base text-[#0F172A]">अग्रिम गेट स्लॉट बुकिंग (Advance Slot Reservation)</h2>
                    </div>
                    <span className="text-xs text-[#166534] font-bold bg-green-50 px-2.5 py-0.5 rounded border border-green-200">
                      खुला है • Open
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div
                      onClick={() => setSelectedSlot('morning')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSlot === 'morning'
                          ? 'border-[#166534] bg-green-50/60'
                          : 'border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#0F172A]">प्रातः 09:00 - 11:00 AM</span>
                        <span className="material-symbols-outlined text-[#166534] text-[18px]">
                          {selectedSlot === 'morning' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <span className="text-xs text-[#166534] font-semibold mt-1 block">8 स्लॉट उपलब्ध (Morning Window)</span>
                    </div>

                    <div
                      onClick={() => setSelectedSlot('afternoon')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSlot === 'afternoon'
                          ? 'border-[#166534] bg-green-50/60'
                          : 'border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#0F172A]">दोपहर 01:00 - 03:00 PM</span>
                        <span className="material-symbols-outlined text-[#166534] text-[18px]">
                          {selectedSlot === 'afternoon' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <span className="text-xs text-[#B45309] font-semibold mt-1 block">15 स्लॉट उपलब्ध (Afternoon Window)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBookSlot}
                    className="mt-4 w-full py-2.5 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    {bookingState === 'loading' ? 'स्लॉट बुक हो रहा है...' : 'नया टोकन आरक्षित करें (Confirm Booking)'}
                  </button>
                </div>
              </div>

              {/* Right 1 Column: Instant Liquidity & Quick e-NAM Slips */}
              <div className="flex flex-col gap-5">
                
                {/* 80% Instant Liquidity Advance Claim */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                      <span className="material-symbols-outlined text-[#166534]">payments</span>
                      <h2 className="font-bold text-base text-[#0F172A]">80% त्वरित अग्रिम भुगतान Desk</h2>
                    </div>

                    <div className="bg-[#FAF6EE] border-2 border-dashed border-[#B45309] rounded-xl p-4 mt-4 text-center">
                      <span className="text-[11px] font-bold text-[#78716C] uppercase">स्वीकृत अग्रिम ऋण राशि</span>
                      <div className="text-3xl font-black text-[#166534] my-1 font-mono">₹1,95,680</div>
                      <p className="text-xs text-[#57534E]">तौल सत्यापन के तुरंत 15 मिनट के भीतर बैंक खाते में हस्तांतरण</p>
                    </div>

                    <div className="space-y-2 mt-4 text-xs text-[#64748B]">
                      <div className="flex justify-between">
                        <span>सकल फसल मूल्य:</span>
                        <strong className="text-[#0F172A]">₹2,44,600</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>अग्रिम पात्रता (80%):</span>
                        <strong className="text-[#166534]">₹1,95,680</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>ब्याज दर (Subsidized):</span>
                        <strong className="text-[#166534]">0.0% (Mandi Window)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>लाभार्थी खाता:</span>
                        <strong className="font-mono text-[#0F172A]">SBI •••• 8821</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimAdvance}
                    className="mt-5 w-full py-2.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    80% अग्रिम दावा करें (Disburse Now)
                  </button>
                </div>

                {/* Quick e-NAM Market Slip Snapshot */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#166534]">storefront</span>
                      <h2 className="font-bold text-base text-[#0F172A]">e-NAM लाइव बोलियां</h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('marketplace')}
                      className="text-xs font-bold text-[#166534] hover:underline"
                    >
                      सभी देखें →
                    </button>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2D9C5] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0F172A]">राजस्थान स्टेट एग्रो</span>
                        <span className="font-mono font-bold text-[#166534] text-sm">₹4,940/Qtl</span>
                      </div>
                      <div className="flex justify-between text-[#64748B] mt-1">
                        <span>सोयाबीन (लॉट #24A)</span>
                        <span className="text-[#B45309] font-semibold">+₹48 above MSP</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2D9C5] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0F172A]">ITC e-Choupal Procurement</span>
                        <span className="font-mono font-bold text-[#166534] text-sm">₹4,915/Qtl</span>
                      </div>
                      <div className="flex justify-between text-[#64748B] mt-1">
                        <span>सोयाबीन (लॉट #24A)</span>
                        <span className="text-[#B45309] font-semibold">+₹23 above MSP</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: LIVE QUEUE FULL VIEW */}
          {activeTab === 'queue' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">मंडी प्रवेश पर्ची व लाइव टोकन प्रबंधन</h2>
                  <p className="text-xs text-[#64748B]">कोटा अनाज मंडी • लाइव धर्मकांटा लेन कतार</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintPass}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#0F172A] hover:bg-slate-50 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    पर्ची प्रिंट करें
                  </button>
                  <button
                    onClick={onOpenQr}
                    className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code</span>
                    QR कोड देखें
                  </button>
                </div>
              </div>

              {/* Physical Ledger Style Card */}
              <div className="bg-[#FAF6EE] border-2 border-dashed border-[#B45309] rounded-2xl p-6 relative max-w-2xl mx-auto shadow-sm">
                <div className="flex items-start justify-between border-b border-[#CFC5B0] pb-4">
                  <div>
                    <span className="text-xs font-bold text-[#166534] uppercase tracking-wider block">
                      कृषि उपज मंडी समिति • कोटा (राज.)
                    </span>
                    <h3 className="text-xl font-bold text-[#0F172A] mt-0.5">आधिकारिक गेट प्रवेश पर्ची</h3>
                    <span className="text-xs text-[#64748B]">APMC Gate Entry & Weighbridge Slip</span>
                  </div>
                  <div className="border-2 border-[#166534] text-[#166534] px-3 py-1 rounded text-xs font-bold uppercase rotate-[-6deg] bg-green-50">
                    ✓ सत्यापित / Verified
                  </div>
                </div>

                <div className="my-6 text-center">
                  <span className="text-xs font-bold text-[#78716C] uppercase">टोकन क्रमांक</span>
                  <div className="text-7xl font-black text-[#166534] font-mono leading-none my-1">
                    #{queueData?.token || 42}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-[#E2D9C5] text-xs font-mono mt-2">
                    <span className="font-bold">{queueData?.vehicleNumber || 'RJ-20-EA-4412'}</span>
                    <span>•</span>
                    <span className="font-bold text-[#B45309]">सोयाबीन (50 क्विंटल)</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center border-t border-[#CFC5B0] pt-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">कतार स्थिति</span>
                    <span className="text-lg font-bold text-[#0F172A]">{queueData?.aheadCount || 4} ट्रैक्टर</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">गेट पर अभी</span>
                    <span className="text-lg font-bold font-mono text-[#166534]">#{queueData?.atGateNumber || 38}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">अनुमानित समय</span>
                    <span className="text-lg font-bold text-[#B45309]">~{queueData?.estWaitMins || 25} मिनट</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE & MSP */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0] mb-4">
                  <span className="material-symbols-outlined text-[#166534]">calendar_today</span>
                  <h2 className="text-base font-bold text-[#0F172A]">दैनिक मंडी संचालन स्थिति</h2>
                </div>
                
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-[#166534]">check_circle</span>
                    <div>
                      <h3 className="text-lg font-bold text-[#166534]">आज मंडी खुली है (Open Today)</h3>
                      <p className="text-xs text-[#64748B]">प्रचालन समय: {scheduleData?.timing || '06:00 AM - 05:00 PM'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#166534] text-white rounded-lg text-xs font-bold">गेट क्र. 3</span>
                </div>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[#64748B]">मुख्य अधिसूचित फसल:</span>
                    <span className="font-bold text-[#0F172A]">{scheduleData?.todayCrop || 'सोयाबीन (JS-335)'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[#64748B]">सरकारी समर्थन मूल्य (MSP):</span>
                    <span className="font-bold text-[#166534]">₹{scheduleData?.msp || 4892} / क्विंटल</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0] mb-4">
                  <span className="material-symbols-outlined text-[#B45309]">event_upcoming</span>
                  <h2 className="text-base font-bold text-[#0F172A]">आगामी मंडी तिथियां व फसलें</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DEC9] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#0F172A]">कल • शनिवार (15 अप्रैल)</div>
                      <div className="text-[#64748B] mt-0.5">सरसों (Mustard 42% Oil) • MSP ₹5,650</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-[#166534] font-bold">खुला है</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#0F172A]">परसों • रविवार (16 अप्रैल)</div>
                      <div className="text-[#64748B] mt-0.5">साप्ताहिक मंडी सफाई व रखरखाव</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold">अवकाश • Closed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENTS & DBT */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">PFMS / DBT प्रत्यक्ष बैंक हस्तांतरण स्थिति</h2>
                  <p className="text-xs text-[#64748B]">खाता सं.: SBI •••• 8821 • IFSC: SBIN0001234</p>
                </div>
                <button
                  onClick={handleClaimAdvance}
                  className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  80% अग्रिम दावा (₹1,95,680)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {paymentData?.timeline?.map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      st.status === 'done'
                        ? 'bg-green-50 border-green-300 text-[#166534]'
                        : st.status === 'in_progress'
                        ? 'bg-amber-50 border-amber-300 text-[#B45309]'
                        : 'bg-slate-50 border-slate-200 text-[#64748B]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm">Step {idx + 1}</span>
                      <span className="font-bold uppercase text-[10px]">{st.status}</span>
                    </div>
                    <div className="font-bold text-sm text-[#0F172A] mt-1">{st.label}</div>
                    <div className="text-[11px] text-[#64748B] mt-1">{st.timestamp || 'प्रतीक्षारत'}</div>
                  </div>
                )) || (
                  <div className="col-span-4 p-4 text-center text-[#64748B]">भुगतान डेटा लोड हो रहा है...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">e-NAM मंडी नीलामी पर्चियां (Live Trade Slips)</h2>
                  <p className="text-xs text-[#64748B]">42 सक्रिय पंजीकृत खरीदार • सीधा बोली स्वीकार करें</p>
                </div>
                <button
                  onClick={onOpenMarket}
                  className="px-4 py-2 bg-[#166534] text-white rounded-lg text-xs font-bold hover:bg-[#14532d]"
                >
                  फुल मार्केट लेजर खोलें
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#166534]">सत्यापित खरीदार</span>
                        <h3 className="font-bold text-base text-[#0F172A] mt-1">राजस्थान स्टेट एग्रो इंडस्ट्रीज</h3>
                        <p className="text-xs text-[#64748B]">लॉट: #APMC-24A • 50 क्विंटल सोयाबीन</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#166534] font-mono">₹4,940</span>
                        <span className="text-[10px] text-[#64748B] block">प्रति क्विंटल</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('✓ राजस्थान स्टेट एग्रो की बोली स्वीकार की गई!')}
                    className="mt-4 w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    बोली स्वीकार करें (₹2,47,000)
                  </button>
                </div>

                <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#166534]">सत्यापित खरीदार</span>
                        <h3 className="font-bold text-base text-[#0F172A] mt-1">ITC e-Choupal Procurement</h3>
                        <p className="text-xs text-[#64748B]">लॉट: #APMC-24A • 50 क्विंटल सोयाबीन</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#166534] font-mono">₹4,915</span>
                        <span className="text-[10px] text-[#64748B] block">प्रति क्विंटल</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('✓ ITC e-Choupal की बोली स्वीकार की गई!')}
                    className="mt-4 w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    बोली स्वीकार करें (₹2,45,750)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCIAL AID & PASSBOOK */}
          {activeTab === 'financial_aid' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">NABARD-APMC किसान क्रेडिट पासबुक</h2>
                  <p className="text-xs text-[#64748B]">स्वीकृत साख सीमा: ₹1,50,000 @ 4.0% p.a. ब्याज दर</p>
                </div>
                <button
                  onClick={onOpenAid}
                  className="px-4 py-2 bg-[#C2410C] text-white rounded-lg text-xs font-bold hover:bg-[#9a3412]"
                >
                  पासबुक लेजर देखें
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <span className="text-[10px] font-bold text-orange-800 uppercase">KCC फसल साख वाउचर</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">₹50,000 आहरण योग्य</div>
                  <p className="text-[#64748B] mt-1">मंडी तौल टोकन पर तुरंत 0% प्रोसेसिंग शुल्क पर उपलब्ध।</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">e-NWR भंडार गृह बंधक</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">75% बाजार मूल्य अग्रिम</div>
                  <p className="text-[#64748B] mt-1">APMC गोदाम रसीद पर तुरंत बैंक क्रेडिट सुविधा।</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase">PMFBY फसल बीमा डेस्क</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">शून्य प्रीमियम कटौती</div>
                  <p className="text-[#64748B] mt-1">स्वचालित मंडी गेट क्षतिपूर्ति सुरक्षा एवं क्लेम सहायता।</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STAFF DESK */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">APMC मंडी कंट्रोल व ऑपरेटर डेस्क</h2>
                  <p className="text-xs text-[#64748B]">मंडी गेट स्थिति, लाइव कांटा कतार, और लाउडस्पीकर प्रसारण</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-sm text-[#0F172A] block mb-2">1. गेट स्थिति टॉगल</span>
                  <p className="text-[#64748B] mb-3">मंडी यार्ड गेट की स्थिति को लाइव ओपन/क्लोज करें।</p>
                  <button
                    onClick={() => showToast('✓ मंडी गेट स्थिति अपडेट की गई!')}
                    className="w-full py-2 bg-[#166534] text-white rounded-lg font-bold"
                  >
                    गेट स्थिति बदलें (Open/Close)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-sm text-[#0F172A] block mb-2">2. किसान चरण आगे बढ़ाएं</span>
                  <p className="text-[#64748B] mb-3">किसान राम लाल (टोकन #42) को अगले चरण पर भेजें।</p>
                  <button
                    onClick={() => {
                      advanceFarmerStage('F1');
                      showToast('✓ किसान राम लाल अगले चरण (Quality Check) पर बढ़ा!');
                    }}
                    className="w-full py-2 bg-[#166534] text-white rounded-lg font-bold"
                  >
                    अगला चरण (Advance Stage)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-sm text-[#0F172A] block mb-2">3. लाउडस्पीकर घोषणा (PA)</span>
                  <p className="text-[#64748B] mb-3">टोकन #42 को कांटा नंबर 3 पर आने की घोषणा करें।</p>
                  <button
                    onClick={() => {
                      sendAnnouncement(42, 3);
                      showToast('📢 लाउडस्पीकर प्रसारण: टोकन #42 को कांटा #3 पर बुलाया गया!');
                    }}
                    className="w-full py-2 bg-[#B45309] text-white rounded-lg font-bold"
                  >
                    लाउडस्पीकर प्रसारण करें
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 6. OFFICIAL FOOTER */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
            <span>किसान मंडी (Kisan Mandi) • राष्ट्रीय ई-उपार्जन नेटवर्क • APMC कोटा अधिकृत</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">गोपनीयता नीति (Privacy)</a>
            <span>•</span>
            <a href="#" className="hover:underline">उपयोग की शर्तें (Terms)</a>
            <span>•</span>
            <button onClick={onSwitchToMobile} className="text-[#166534] font-bold hover:underline">
              📱 मोबाइल ऐप व्यू में स्विच करें
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

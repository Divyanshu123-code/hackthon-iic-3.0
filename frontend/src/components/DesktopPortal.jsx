import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bookSlot, requestAdvance, advanceFarmerStage, advanceFarmerPayment, sendAnnouncement, resetDemoDb, updateStaffSchedule } from '../api';

export default function DesktopPortal({
  farmerData,
  scheduleData,
  queueData,
  paymentData,
  onSwitchToMobile,
  onOpenAid,
  onOpenMarket,
  onOpenQr,
  onOpenAdvance,
  onRefresh
}) {
  const { currentLangObj, setIsLangModalOpen, t, currentLang, changeLanguage, LANGUAGES } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'queue', 'schedule', 'payment', 'marketplace', 'financial_aid', 'staff'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [bookingState, setBookingState] = useState('idle');
  const [toastMsg, setToastMsg] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Live Backend Data Variables
  const totalInflow = scheduleData?.totalProcuredTodayQtl || 185;
  const isGateOpen = scheduleData?.gateOpen ?? scheduleData?.open ?? true;
  const currentToken = queueData?.token || farmerData?.token || 42;
  const weighbridgeNo = queueData?.weighbridgeNo || farmerData?.weighbridgeNo || 3;
  const aheadCount = queueData?.aheadCount !== undefined ? queueData.aheadCount : 4;
  const estWaitMins = queueData?.estWaitMins !== undefined ? queueData.estWaitMins : 25;
  const atGateNumber = queueData?.atGateNumber !== undefined ? queueData.atGateNumber : 38;
  const currentMsp = scheduleData?.msp || 2275;
  const todayCrop = scheduleData?.todayCrop || farmerData?.commodity || 'गेहूं (Wheat)';
  const cropGrade = scheduleData?.cropGrade || 'Grade A Verified';
  const totalApproved = paymentData?.totalApproved || farmerData?.payment?.totalApproved || 113750;
  const advanceAmount = paymentData?.advance?.amount || farmerData?.payment?.advance?.amount || Math.round(totalApproved * 0.8);
  const isAdvanceTaken = paymentData?.advance?.taken || farmerData?.payment?.advance?.taken || false;
  const bankName = paymentData?.bank?.name || farmerData?.payment?.bank?.name || 'SBI Bank';
  const bankLast4 = paymentData?.bank?.last4 || farmerData?.payment?.bank?.last4 || '4912';
  const bankIfsc = paymentData?.bank?.ifsc || farmerData?.payment?.bank?.ifsc || 'SBIN000210';
  const vehicleNumber = queueData?.vehicleNumber || farmerData?.vehicleNumber || 'RJ-20-EA-4412';
  const commodityQty = queueData?.commodityQty || farmerData?.commodityQty || '50 क्विंटल';

  // Slot Availability from Backend
  const morningSlots = scheduleData?.slots?.find(s => s.id === 'morning')?.tokensLeft ?? 8;
  const afternoonSlots = scheduleData?.slots?.find(s => s.id === 'afternoon')?.tokensLeft ?? 15;

  // 4-Stage Procurement Pipeline State
  const STAGE_STEPS = ['arrived', 'weighing', 'grade', 'pass'];
  const currentFarmerStage = queueData?.stage || farmerData?.stage || 'weighing';
  const currentStageIdx = STAGE_STEPS.indexOf(currentFarmerStage);

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
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleBookSlot = async () => {
    setBookingState('loading');
    try {
      const res = await bookSlot('C1', farmerData?.farmerId || 'F1', selectedSlot);
      setBookingState('success');
      showToast(`✓ ${res.message || 'स्लॉट सफलतापूर्वक आरक्षित किया गया!'}`);
      if (onRefresh) onRefresh();
      setTimeout(() => setBookingState('idle'), 2000);
    } catch (e) {
      setBookingState('error');
      showToast('⚠️ स्लॉट बुकिंग विफल: ' + e.message);
      setTimeout(() => setBookingState('idle'), 2000);
    }
  };

  const handleClaimAdvance = async () => {
    if (isAdvanceTaken) {
      showToast('ℹ️ 80% अग्रिम राशि पहले ही आपके बैंक खाते में भेजी जा चुकी है।');
      return;
    }
    try {
      const res = await requestAdvance(farmerData?.farmerId || 'F1');
      showToast(`✓ ₹${advanceAmount.toLocaleString('en-IN')} (80% अग्रिम) ${bankName} (•••• ${bankLast4}) में स्थानांतरित!`);
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast('⚠️ अग्रिम दावा विफल: ' + e.message);
    }
  };

  const handleToggleGate = async () => {
    try {
      await updateStaffSchedule({
        centerId: 'C1',
        open: !isGateOpen,
        gateOpen: !isGateOpen
      });
      showToast(`✓ मंडी गेट स्थिति अपडेट: ${!isGateOpen ? 'खुला है (OPEN)' : 'बंद है (CLOSED)'}`);
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast('⚠️ गेट स्थिति अपडेट विफल: ' + e.message);
    }
  };

  const handleAdvanceStage = async () => {
    try {
      const res = await advanceFarmerStage(farmerData?.farmerId || 'F1');
      showToast(`✓ किसान ${farmerData?.name || 'राम लाल'} का चरण आगे बढ़ा: ${res.farmer?.stage || 'Next Stage'}`);
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast('⚠️ चरण परिवर्तन विफल: ' + e.message);
    }
  };

  const handleBroadcastAnnouncement = async () => {
    try {
      const res = await sendAnnouncement(currentToken, weighbridgeNo);
      showToast(`📢 लाउडस्पीकर प्रसारण: "टोकन #${currentToken} कांटा #${weighbridgeNo} पर पहुंचे"`);
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast('⚠️ प्रसारण विफल: ' + e.message);
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoDb();
      showToast('✓ डेमो डेटाबेस को रीसेट कर दिया गया!');
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast('⚠️ रीसेट विफल: ' + e.message);
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
                {t('ministryBar', 'कृषि एवं किसान कल्याण मंत्रालय | Ministry of Agriculture & Farmers Welfare')}
              </span>
              <span className="text-emerald-500 hidden md:inline">•</span>
              <span className="hidden md:inline text-emerald-100">{t('nationalNetwork', 'राष्ट्रीय कृषि बाजार (e-NAM) अधिकृत APMC नेटवर्क')}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-emerald-200">
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>{t('tollFree', 'टोल-फ्री')}: <strong className="text-white font-mono">1800-180-1551</strong></span>
              </div>
              
              {/* Multilingual Switcher in Super Top Bar */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-emerald-700 text-[11px]">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      currentLang === lang.code
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                    }`}
                  >
                    <span>{lang.flag} {lang.label}</span>
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
                {t('portalTitle', 'किसान मंडी ई-उपार्जन पोर्टल • APMC कोटा')}
              </h1>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {t('portalSub', 'Digital Procurement Platform • Rajasthan Mandi Yard')}
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
                placeholder={t('searchPlaceholder', 'खोजें: टोकन सं., वाहन सं. (RJ-20-EA-4412), या किसान ID...')}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#166534] focus:ring-1 focus:ring-[#166534] outline-none transition"
              />
            </div>
          </div>

          {/* User & Mode Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Selector Dropdown Pill */}
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="px-3 py-1.5 bg-[#FAF6EE] hover:bg-[#F4EFE2] border border-[#E5DEC9] text-[#166534] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
              title="भाषा चुनें • Select Language"
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span>{currentLangObj.label}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {/* View Switcher Button */}
            <button
              onClick={onSwitchToMobile}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#0F172A] rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="मोबाइल ऐप व्यू देखें"
            >
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              <span>{t('switchToMobile', 'मोबाइल व्यू (PWA)')}</span>
            </button>

            {/* Yard Status Pill */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border text-xs ${
              isGateOpen ? 'bg-green-50 border-green-200 text-[#166534]' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isGateOpen ? 'bg-[#166534] animate-pulse' : 'bg-red-600'}`}></span>
              <span className="font-bold uppercase">
                {isGateOpen ? t('gateOpen', 'मंडी गेट: खुला है (OPEN)') : t('gateClosed', 'मंडी गेट: बंद है (CLOSED)')}
              </span>
            </div>

            {/* Farmer Identity Badge */}
            <div className="flex items-center gap-2.5 border-l border-[#E2E8F0] pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#0F172A]">{farmerData?.name || 'राम लाल शर्मा'}</div>
                <div className="text-[10px] font-mono text-[#64748B]">ID: {farmerData?.farmerId || 'APMC-KOT-789'}</div>
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
                { id: 'dashboard', label: t('dashboardOverview', 'डैशबोर्ड / Overview'), icon: 'dashboard' },
                { id: 'queue', label: t('liveYardQueue', 'टोकन व कतार / Live Queue'), icon: 'receipt_long' },
                { id: 'schedule', label: t('scheduleRates', 'मंडी कैलेंडर व MSP / Schedule'), icon: 'calendar_month' },
                { id: 'payment', label: t('payoutsPassbook', 'भुगतान व PFMS / Payouts'), icon: 'account_balance_wallet' },
                { id: 'marketplace', label: t('enamMarket', 'e-NAM नीलामी / Trade Slips'), icon: 'storefront' },
                { id: 'financial_aid', label: t('creditPassbook', 'क्रेडिट पासबुक / Passbook'), icon: 'account_balance' },
                { id: 'staff', label: t('staffControlDesk', 'स्टाफ कंट्रोल डेस्क / Staff Desk'), icon: 'desk' }
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
              <span>{t('home', 'Home')}</span>
              <span>/</span>
              <span>{t('apmcKotaYard', 'APMC कोटा यार्ड')}</span>
              <span>/</span>
              <span className="text-[#0F172A] font-bold uppercase">{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-[11px] font-mono text-[#64748B]">
                {t('liveMandiData', 'लाइव सिंक')}: <strong className="text-[#0F172A] font-semibold">{currentTime}</strong>
              </div>
              <button
                onClick={handlePrintPass}
                className="h-8 px-3.5 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{t('printPass', 'दैनिक पास प्रिंट')}</span>
              </button>
              <button
                onClick={onOpenQr}
                className="h-8 px-3.5 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                <span>{t('getQrPass', 'गेट QR पास')}</span>
              </button>
            </div>
          </div>

          {/* 5. ENTERPRISE KPI METRICS STRIP */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t('dailyIntake', 'आज की कुल आवक')}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#0F172A] font-mono">{totalInflow.toLocaleString('en-IN')}</span>
                <span className="text-xs text-[#64748B] font-semibold">{t('quintalUnit', 'क्विंटल')}</span>
              </div>
              <div className="text-[11px] text-[#166534] mt-0.5 font-semibold">{t('inflowDesc', '✓ लाइव कोटा यार्ड आवक')}</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t('yourTokenStatus', 'आपका टोकन')}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#166534] font-mono">#{currentToken}</span>
                <span className="text-[11px] font-bold text-[#166534] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  {t('weighbridgeLane3', `कांटा लेन ${weighbridgeNo}`)}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">आगे केवल {aheadCount} ट्रैक्टर</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t('govtMsp', 'सरकारी समर्थन मूल्य (MSP)')}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#B45309] font-mono">₹{currentMsp.toLocaleString('en-IN')}</span>
                <span className="text-xs text-[#64748B] font-semibold">/{t('quintalUnit', 'क्विंटल')}</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">{todayCrop} ({cropGrade})</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t('approvedDbt', 'स्वीकृत DBT भुगतान')}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#166534] font-mono">₹{totalApproved.toLocaleString('en-IN')}</span>
                <span className="text-xs text-[#166534] font-bold">{t('verified', 'स्वीकृत')}</span>
              </div>
              <div className="text-[11px] text-[#0284C7] mt-0.5 font-semibold">
                80% अग्रिम: ₹{advanceAmount.toLocaleString('en-IN')} {isAdvanceTaken ? 'हस्तांतरित ✓' : 'तुरंत उपलब्ध'}
              </div>
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
                      <h2 className="font-bold text-base text-[#0F172A]">{t('entrySlipTitle', 'प्रवेश पर्ची व लाइव कतार बोर्ड')}</h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#166534] bg-green-50 px-2.5 py-1 rounded border border-green-200">
                      {t('verifiedBatch', 'BATCH-24A • VERIFIED')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#E5DEC9] flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-[#78716C] uppercase">{t('yourToken', 'आपका टोकन')}</span>
                      <span className="text-5xl font-black text-[#166534] my-1 font-mono">#{currentToken}</span>
                      <span className="text-xs font-semibold text-[#166534] bg-green-100 px-2 py-0.5 rounded">{t('active', 'सक्रिय / Active')}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#64748B] uppercase">{t('registeredVehicleCrop', 'दर्ज वाहन व फसल')}</span>
                        <div className="text-sm font-bold text-[#0F172A] mt-1 font-mono">{vehicleNumber}</div>
                        <div className="text-xs text-[#64748B]">{todayCrop} ({commodityQty})</div>
                      </div>
                      <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#B45309] font-semibold">
                        धर्मकांटा गेट क्र. {weighbridgeNo} पर जाएं
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#64748B] uppercase">{t('estWaitTime', 'अनुमानित प्रतीक्षा समय')}</span>
                        <div className="text-3xl font-black text-[#B45309] mt-1 font-mono">~{estWaitMins} <span className="text-sm font-sans font-semibold">{t('minutes', 'मिनट')}</span></div>
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {t('atGateNow', 'गेट पर अभी')}: <strong className="text-[#166534]">#{atGateNumber}</strong> ({t('running', 'चालू')})
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Live Procurement Stepper */}
                  <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-3">
                      {t('procurementPipeline', 'प्रोक्योरमेंट चरण ट्रैकिंग (4-Stage Pipeline)')}
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className={`p-2.5 rounded-lg font-bold ${
                        currentStageIdx > 0
                          ? 'bg-green-50 border border-green-300 text-[#166534]'
                          : currentStageIdx === 0
                          ? 'bg-amber-50 border border-amber-300 text-[#B45309] animate-pulse'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                      }`}>
                        1. प्रवेश व तौल ({currentStageIdx > 0 ? 'Done' : currentStageIdx === 0 ? 'Active' : 'Pending'})
                      </div>
                      <div className={`p-2.5 rounded-lg font-bold ${
                        currentStageIdx > 1
                          ? 'bg-green-50 border border-green-300 text-[#166534]'
                          : currentStageIdx === 1
                          ? 'bg-amber-50 border border-amber-300 text-[#B45309] animate-pulse'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                      }`}>
                        2. गुणवत्ता जांच ({currentStageIdx > 1 ? 'Done' : currentStageIdx === 1 ? 'Active' : 'Pending'})
                      </div>
                      <div className={`p-2.5 rounded-lg font-bold ${
                        currentStageIdx > 2
                          ? 'bg-green-50 border border-green-300 text-[#166534]'
                          : currentStageIdx === 2
                          ? 'bg-amber-50 border border-amber-300 text-[#B45309] animate-pulse'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                      }`}>
                        3. नीलामी आवंटन ({currentStageIdx > 2 ? 'Done' : currentStageIdx === 2 ? 'Active' : 'Pending'})
                      </div>
                      <div className={`p-2.5 rounded-lg font-bold ${
                        currentStageIdx >= 3
                          ? 'bg-green-50 border border-green-300 text-[#166534]'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                      }`}>
                        4. DBT बैंक खाता ({currentStageIdx >= 3 ? 'Done' : 'Pending'})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advance Slot Booking Card */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#B45309]">event_available</span>
                      <h2 className="font-bold text-base text-[#0F172A]">{t('advanceSlotTitle', 'अग्रिम गेट स्लॉट बुकिंग (Advance Slot Reservation)')}</h2>
                    </div>
                    <span className="text-xs text-[#166534] font-bold bg-green-50 px-2.5 py-0.5 rounded border border-green-200">
                      {isGateOpen ? t('openStatus', 'खुला है • Open') : t('closedStatus', 'बंद है • Closed')}
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
                        <span className="font-bold text-sm text-[#0F172A]">{t('morningWindow', 'प्रातः 09:00 - 11:00 AM')}</span>
                        <span className="material-symbols-outlined text-[#166534] text-[18px]">
                          {selectedSlot === 'morning' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <span className="text-xs text-[#166534] font-semibold mt-1 block">{morningSlots} स्लॉट उपलब्ध (Morning Window)</span>
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
                        <span className="font-bold text-sm text-[#0F172A]">{t('afternoonWindow', 'दोपहर 01:00 - 03:00 PM')}</span>
                        <span className="material-symbols-outlined text-[#166534] text-[18px]">
                          {selectedSlot === 'afternoon' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <span className="text-xs text-[#B45309] font-semibold mt-1 block">{afternoonSlots} स्लॉट उपलब्ध (Afternoon Window)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBookSlot}
                    className="mt-4 w-full py-2.5 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    {bookingState === 'loading' ? t('bookingLoading', 'स्लॉट बुक हो रहा है...') : t('confirmBookingBtn', 'नया टोकन आरक्षित करें (Confirm Booking)')}
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
                      <h2 className="font-bold text-base text-[#0F172A]">{t('instantAdvanceDesk', '80% त्वरित अग्रिम भुगतान Desk')}</h2>
                    </div>

                    <div className="bg-[#FAF6EE] border-2 border-dashed border-[#B45309] rounded-xl p-4 mt-4 text-center">
                      <span className="text-[11px] font-bold text-[#78716C] uppercase">{t('approvedAdvanceAmount', 'स्वीकृत अग्रिम ऋण राशि')}</span>
                      <div className="text-3xl font-black text-[#166534] my-1 font-mono">₹{advanceAmount.toLocaleString('en-IN')}</div>
                      <p className="text-xs text-[#57534E]">{t('advanceSubDesc', 'तौल सत्यापन के तुरंत 15 मिनट के भीतर बैंक खाते में हस्तांतरण')}</p>
                    </div>

                    <div className="space-y-2 mt-4 text-xs text-[#64748B]">
                      <div className="flex justify-between">
                        <span>{t('grossCropVal', 'सकल फसल मूल्य:')}</span>
                        <strong className="text-[#0F172A]">₹{totalApproved.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('advanceEligibility', 'अग्रिम पात्रता (80%):')}</span>
                        <strong className="text-[#166534]">₹{advanceAmount.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('interestRate', 'ब्याज दर (Subsidized):')}</span>
                        <strong className="text-[#166534]">0.0% (Mandi Window)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('beneficiaryAcc', 'लाभार्थी खाता:')}</span>
                        <strong className="font-mono text-[#0F172A]">{bankName} •••• {bankLast4}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimAdvance}
                    disabled={isAdvanceTaken}
                    className={`mt-5 w-full py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition ${
                      isAdvanceTaken
                        ? 'bg-green-700 text-white cursor-default'
                        : 'bg-[#B45309] hover:bg-[#92400E] text-white cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isAdvanceTaken ? 'verified' : 'account_balance'}
                    </span>
                    {isAdvanceTaken ? '✓ 80% अग्रिम राशि अंतरित (Credited)' : t('disburseNow', '80% अग्रिम दावा करें (Disburse Now)')}
                  </button>
                </div>

                {/* Quick e-NAM Market Slip Snapshot */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#166534]">storefront</span>
                      <h2 className="font-bold text-base text-[#0F172A]">{t('enamLiveBids', 'e-NAM लाइव बोलियां')}</h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('marketplace')}
                      className="text-xs font-bold text-[#166534] hover:underline"
                    >
                      {t('viewAll', 'सभी देखें →')}
                    </button>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2D9C5] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0F172A]">राजस्थान स्टेट एग्रो</span>
                        <span className="font-mono font-bold text-[#166534] text-sm">₹4,940/{t('quintalUnit', 'Qtl')}</span>
                      </div>
                      <div className="flex justify-between text-[#64748B] mt-1">
                        <span>{todayCrop} (लॉट #24A)</span>
                        <span className="text-[#B45309] font-semibold">+₹48 above MSP</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2D9C5] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0F172A]">ITC e-Choupal Procurement</span>
                        <span className="font-mono font-bold text-[#166534] text-sm">₹4,915/{t('quintalUnit', 'Qtl')}</span>
                      </div>
                      <div className="flex justify-between text-[#64748B] mt-1">
                        <span>{todayCrop} (लॉट #24A)</span>
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
                  <h2 className="text-lg font-bold text-[#0F172A]">{t('mandiEntrySlip', 'मंडी प्रवेश पर्ची व लाइव टोकन प्रबंधन')}</h2>
                  <p className="text-xs text-[#64748B]">{t('yardSubTitle', 'कोटा अनाज मंडी • लाइव धर्मकांटा लेन कतार')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintPass}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#0F172A] hover:bg-slate-50 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    {t('printSlip', 'पर्ची प्रिंट करें')}
                  </button>
                  <button
                    onClick={onOpenQr}
                    className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code</span>
                    {t('viewQr', 'QR कोड देखें')}
                  </button>
                </div>
              </div>

              {/* Physical Ledger Style Card */}
              <div className="bg-[#FAF6EE] border-2 border-dashed border-[#B45309] rounded-2xl p-6 relative max-w-2xl mx-auto shadow-sm">
                <div className="flex items-start justify-between border-b border-[#CFC5B0] pb-4">
                  <div>
                    <span className="text-xs font-bold text-[#166534] uppercase tracking-wider block">
                      {t('apmcKotaRaj', 'कृषि उपज मंडी समिति • कोटा (राज.)')}
                    </span>
                    <h3 className="text-xl font-bold text-[#0F172A] mt-0.5">{t('officialGateSlip', 'आधिकारिक गेट प्रवेश पर्ची')}</h3>
                    <span className="text-xs text-[#64748B]">{t('apmcSubSlip', 'APMC Gate Entry & Weighbridge Slip')}</span>
                  </div>
                  <div className="border-2 border-[#166534] text-[#166534] px-3 py-1 rounded text-xs font-bold uppercase rotate-[-6deg] bg-green-50">
                    {t('verifiedStamp', '✓ सत्यापित / Verified')}
                  </div>
                </div>

                <div className="my-6 text-center">
                  <span className="text-xs font-bold text-[#78716C] uppercase">{t('yourToken', 'टोकन क्रमांक')}</span>
                  <div className="text-7xl font-black text-[#166534] font-mono leading-none my-1">
                    #{currentToken}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-[#E2D9C5] text-xs font-mono mt-2">
                    <span className="font-bold">{vehicleNumber}</span>
                    <span>•</span>
                    <span className="font-bold text-[#B45309]">{todayCrop} ({commodityQty})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center border-t border-[#CFC5B0] pt-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">{t('queueStatus', 'कतार स्थिति')}</span>
                    <span className="text-lg font-bold text-[#0F172A]">{aheadCount} {t('tractorsAhead', 'ट्रैक्टर')}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">{t('atGateNow', 'गेट पर अभी')}</span>
                    <span className="text-lg font-bold font-mono text-[#166534]">#{atGateNumber}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E2D9C5]">
                    <span className="text-[#64748B] block">{t('estTime', 'अनुमानित समय')}</span>
                    <span className="text-lg font-bold text-[#B45309]">~{estWaitMins} {t('minutes', 'मिनट')}</span>
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
                  <h2 className="text-base font-bold text-[#0F172A]">{t('dailyMandiStatus', 'दैनिक मंडी संचालन स्थिति')}</h2>
                </div>
                
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isGateOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-4xl ${isGateOpen ? 'text-[#166534]' : 'text-red-600'}`}>
                      {isGateOpen ? 'check_circle' : 'cancel'}
                    </span>
                    <div>
                      <h3 className={`text-lg font-bold ${isGateOpen ? 'text-[#166534]' : 'text-red-700'}`}>
                        {isGateOpen ? t('mandiOpenToday', 'आज मंडी खुली है (Open Today)') : t('mandiClosedToday', 'आज मंडी बंद है (Closed Today)')}
                      </h3>
                      <p className="text-xs text-[#64748B]">{t('operatingHours', 'प्रचालन समय')}: {scheduleData?.timing || '06:00 AM - 05:00 PM'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#166534] text-white rounded-lg text-xs font-bold">गेट क्र. {weighbridgeNo}</span>
                </div>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[#64748B]">{t('mainCrop', 'मुख्य अधिसूचित फसल:')}</span>
                    <span className="font-bold text-[#0F172A]">{todayCrop} ({cropGrade})</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[#64748B]">{t('govtMsp', 'सरकारी समर्थन मूल्य (MSP):')}</span>
                    <span className="font-bold text-[#166534]">₹{currentMsp.toLocaleString('en-IN')} / {t('quintalUnit', 'क्विंटल')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0] mb-4">
                  <span className="material-symbols-outlined text-[#B45309]">event_upcoming</span>
                  <h2 className="text-base font-bold text-[#0F172A]">{t('upcomingDates', 'आगामी मंडी तिथियां व फसलें')}</h2>
                </div>

                <div className="space-y-3 text-xs">
                  {scheduleData?.upcomingDays?.map((day, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DEC9] flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#0F172A]">{day.date} • {day.day}</div>
                        <div className="text-[#64748B] mt-0.5">{day.crop} {day.msp ? `• MSP ₹${day.msp}` : ''}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        day.open ? 'bg-green-100 text-[#166534]' : 'bg-red-100 text-red-700'
                      }`}>
                        {day.open ? t('openToday', 'खुला है') : t('holidayClosed', 'अवकाश • Closed')}
                      </span>
                    </div>
                  )) || (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-[#64748B]">
                      आगामी तिथियां लोड हो रही हैं...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENTS & DBT */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">{t('pfmsDbtTitle', 'PFMS / DBT प्रत्यक्ष बैंक हस्तांतरण स्थिति')}</h2>
                  <p className="text-xs text-[#64748B]">खाता सं.: {bankName} •••• {bankLast4} • IFSC: {bankIfsc}</p>
                </div>
                <button
                  onClick={handleClaimAdvance}
                  disabled={isAdvanceTaken}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm ${
                    isAdvanceTaken ? 'bg-green-700 cursor-default' : 'bg-[#B45309] hover:bg-[#92400E]'
                  }`}
                >
                  {isAdvanceTaken ? '✓ 80% अग्रिम राशि अंतरित' : `80% अग्रिम दावा (₹${advanceAmount.toLocaleString('en-IN')})`}
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
                    <div className="text-[11px] text-[#64748B] mt-1">{st.timestamp || t('awaiting', 'प्रतीक्षारत')}</div>
                  </div>
                )) || (
                  <div className="col-span-4 p-4 text-center text-[#64748B]">{t('loadingPayment', 'भुगतान डेटा लोड हो रहा है...')}</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">{t('tradeSlipsTitle', 'e-NAM मंडी नीलामी पर्चियां (Live Trade Slips)')}</h2>
                  <p className="text-xs text-[#64748B]">{t('activeBuyers', '42 सक्रिय पंजीकृत खरीदार • सीधा बोली स्वीकार करें')}</p>
                </div>
                <button
                  onClick={onOpenMarket}
                  className="px-4 py-2 bg-[#166534] text-white rounded-lg text-xs font-bold hover:bg-[#14532d]"
                >
                  {t('openFullMarket', 'फुल मार्केट लेजर खोलें')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#166534]">{t('verifiedBuyer', 'सत्यापित खरीदार')}</span>
                        <h3 className="font-bold text-base text-[#0F172A] mt-1">राजस्थान स्टेट एग्रो इंडस्ट्रीज</h3>
                        <p className="text-xs text-[#64748B]">लॉट: #{farmerData?.farmerId || 'APMC-24A'} • {commodityQty} {todayCrop}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#166534] font-mono">₹4,940</span>
                        <span className="text-[10px] text-[#64748B] block">{t('perQuintal', 'प्रति क्विंटल')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('✓ राजस्थान स्टेट एग्रो की बोली स्वीकार की गई!')}
                    className="mt-4 w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    {t('acceptBid', 'बोली स्वीकार करें')} (₹2,47,000)
                  </button>
                </div>

                <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#166534]">{t('verifiedBuyer', 'सत्यापित खरीदार')}</span>
                        <h3 className="font-bold text-base text-[#0F172A] mt-1">ITC e-Choupal Procurement</h3>
                        <p className="text-xs text-[#64748B]">लॉट: #{farmerData?.farmerId || 'APMC-24A'} • {commodityQty} {todayCrop}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#166534] font-mono">₹4,915</span>
                        <span className="text-[10px] text-[#64748B] block">{t('perQuintal', 'प्रति क्विंटल')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('✓ ITC e-Choupal की बोली स्वीकार की गई!')}
                    className="mt-4 w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    {t('acceptBid', 'बोली स्वीकार करें')} (₹2,45,750)
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
                  <h2 className="text-lg font-bold text-[#0F172A]">{t('nabardTitle', 'NABARD-APMC किसान क्रेडिट पासबुक')}</h2>
                  <p className="text-xs text-[#64748B]">{t('approvedCreditLimit', 'स्वीकृत साख सीमा: ₹1,50,000 @ 4.0% p.a. ब्याज दर')}</p>
                </div>
                <button
                  onClick={onOpenAid}
                  className="px-4 py-2 bg-[#C2410C] text-white rounded-lg text-xs font-bold hover:bg-[#9a3412]"
                >
                  {t('viewPassbook', 'पासबुक लेजर देखें')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <span className="text-[10px] font-bold text-orange-800 uppercase">{t('kccVoucher', 'KCC फसल साख वाउचर')}</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">{t('kccWithdrawable', '₹50,000 आहरण योग्य')}</div>
                  <p className="text-[#64748B] mt-1">{t('kccSub', 'मंडी तौल टोकन पर तुरंत 0% प्रोसेसिंग शुल्क पर उपलब्ध।')}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">{t('enwrTitle', 'e-NWR भंडार गृह बंधक')}</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">{t('enwrValue', '75% बाजार मूल्य अग्रिम')}</div>
                  <p className="text-[#64748B] mt-1">{t('enwrSub', 'APMC गोदाम रसीद पर तुरंत बैंक क्रेडिट सुविधा।')}</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase">{t('pmfbyTitle', 'PMFBY फसल बीमा डेस्क')}</span>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">{t('pmfbyZero', 'शून्य प्रीमियम कटौती')}</div>
                  <p className="text-[#64748B] mt-1">{t('pmfbySub', 'स्वचालित मंडी गेट क्षतिपूर्ति सुरक्षा एवं क्लेम सहायता।')}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STAFF DESK */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">{t('staffControlTitle', 'APMC मंडी कंट्रोल व ऑपरेटर डेस्क')}</h2>
                  <p className="text-xs text-[#64748B]">{t('staffControlSub', 'मंडी गेट स्थिति, लाइव कांटा कतार, और लाउडस्पीकर प्रसारण')}</p>
                </div>
                <button
                  onClick={handleResetDemo}
                  className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>डेमो रीसेट (Reset Database)</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block mb-1">{t('staffAction1Title', '1. गेट स्थिति टॉगल')}</span>
                    <p className="text-[#64748B] mb-3">वर्तमान स्थिति: <strong>{isGateOpen ? 'खुला है (OPEN)' : 'बंद है (CLOSED)'}</strong></p>
                  </div>
                  <button
                    onClick={handleToggleGate}
                    className={`w-full py-2.5 text-white rounded-lg font-bold shadow-xs transition ${
                      isGateOpen ? 'bg-red-700 hover:bg-red-800' : 'bg-[#166534] hover:bg-[#14532d]'
                    }`}
                  >
                    {isGateOpen ? 'गेट बंद करें (Close Gate)' : 'गेट खोलें (Open Gate)'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block mb-1">{t('staffAction2Title', '2. किसान चरण आगे बढ़ाएं')}</span>
                    <p className="text-[#64748B] mb-3">किसान {farmerData?.name || 'राम लाल'} (टोकन #{currentToken}) वर्तमान चरण: <strong className="text-[#166534] uppercase">{currentFarmerStage}</strong></p>
                  </div>
                  <button
                    onClick={handleAdvanceStage}
                    className="w-full py-2.5 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg font-bold shadow-xs transition"
                  >
                    {t('staffAction2Btn', 'अगला चरण (Advance Stage)')}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#0F172A] block mb-1">{t('staffAction3Title', '3. लाउडस्पीकर घोषणा (PA)')}</span>
                    <p className="text-[#64748B] mb-3">टोकन #{currentToken} को कांटा नंबर #{weighbridgeNo} पर आने की घोषणा प्रसारित करें।</p>
                  </div>
                  <button
                    onClick={handleBroadcastAnnouncement}
                    className="w-full py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg font-bold shadow-xs transition"
                  >
                    {t('staffAction3Btn', 'लाउडस्पीकर प्रसारण करें')}
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
            <span>{t('footerRights', 'किसान मंडी (Kisan Mandi) • राष्ट्रीय ई-उपार्जन नेटवर्क • APMC कोटा अधिकृत')}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">{t('privacy', 'गोपनीयता नीति (Privacy)')}</a>
            <span>•</span>
            <a href="#" className="hover:underline">{t('terms', 'उपयोग की शर्तें (Terms)')}</a>
            <span>•</span>
            <button onClick={onSwitchToMobile} className="text-[#166534] font-bold hover:underline">
              {t('footerMobileSwitch', '📱 मोबाइल ऐप व्यू में स्विच करें')}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}


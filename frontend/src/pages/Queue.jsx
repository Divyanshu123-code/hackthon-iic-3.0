import React, { useState } from 'react';
import { bookSlot } from '../api';

export default function Queue({ queueData, onNavigate, onOpenQr }) {
  const [selectedSlot, setSelectedSlot] = useState('morning');
  const [slotCounts, setSlotCounts] = useState({ morning: 8, afternoon: 15 });
  const [bookingState, setBookingState] = useState('idle');

  const speakQueueStatus = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = `आपका टोकन नंबर ${queueData?.token || 42} है। आपके आगे ${queueData?.aheadCount || 4} ट्रैक्टर हैं। कांटा नंबर ${queueData?.weighbridgeNo || 3} पर जाएं।`;
      const utter = new SpeechSynthesisUtterance(msg);
      utter.lang = 'hi-IN';
      window.speechSynthesis.speak(utter);
    }
  };

  const handleBlockToken = async () => {
    setBookingState('loading');
    try {
      const res = await bookSlot('C1', queueData?.farmerId || 'F1', selectedSlot);
      setBookingState('success');
      if (res.tokensLeft !== undefined) {
        setSlotCounts(prev => ({ ...prev, [selectedSlot]: res.tokensLeft }));
      }
      setTimeout(() => {
        setBookingState('idle');
        if (onOpenQr) onOpenQr();
      }, 1200);
    } catch (e) {
      setBookingState('error');
      setTimeout(() => setBookingState('idle'), 2000);
    }
  };

  const currentStage = queueData?.stage || 'weighing';
  const stepNames = ['arrived', 'weighing', 'grade', 'pass'];
  const currentIndex = stepNames.indexOf(currentStage);
  const fillWidths = ['0%', '36%', '68%', '100%'];

  return (
    <div className="flex flex-col w-full px-margin-screen gap-pad-md animate-in fade-in duration-200">
      
      {/* Top Nav Strip */}
      <div className="flex items-center justify-between pt-pad-xs">
        <button
          onClick={() => onNavigate('home')}
          aria-label="Go Back"
          className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-sm"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <div className="flex items-center gap-pad-xs bg-secondary-container/60 px-pad-sm py-1.5 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
          <span className="font-label-sm text-label-sm text-on-secondary-container font-bold">लाइव मंडी कतार • Live Queue</span>
        </div>
        <button
          onClick={speakQueueStatus}
          aria-label="Listen Announcement"
          className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary active:scale-95 transition-transform shadow-sm"
        >
          <span className="material-symbols-outlined text-[28px]">volume_up</span>
        </button>
      </div>

      {/* Giant Live Token Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md flex flex-col items-center text-center p-pad-lg border border-slate-100">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary-fixed/40 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none"></div>
        
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-pad-xs font-bold">
          आपका टोकन नंबर • YOUR TOKEN
        </span>

        {/* Giant Token Circle with High Contrast Glow Accent */}
        <div className="relative my-pad-xs flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-primary-container/10 flex items-center justify-center shadow-inner">
            <div className="w-40 h-40 rounded-full bg-primary-container flex flex-col items-center justify-center text-on-primary-container shadow-lg select-none">
              <span className="font-display-lg-mobile text-[76px] leading-none tracking-tight font-extrabold text-on-primary">
                {queueData?.token || 42}
              </span>
              <span className="font-label-sm text-label-sm tracking-widest text-primary-fixed mt-1 uppercase font-bold">
                RJ LOT
              </span>
            </div>
          </div>
          {/* Position Indicator Ribbon */}
          <div className="absolute -bottom-2 bg-secondary text-on-secondary px-pad-md py-1 rounded-full shadow-md flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">agriculture</span>
            <span className="font-label-sm text-label-sm font-bold">
              {queueData?.aheadCount > 0 ? `आगे केवल ${queueData.aheadCount} ट्रैक्टर` : 'आपकी बारी आ गई है!'}
            </span>
          </div>
        </div>

        {/* Live Gate Counter & ETA Grid */}
        <div className="w-full grid grid-cols-2 gap-pad-xs mt-pad-md pt-pad-xs">
          <div className="bg-surface-container-low rounded-lg p-pad-sm flex flex-col items-center justify-center text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">गेट पर अभी • At Gate</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline-md text-headline-md text-secondary font-bold">#{queueData?.atGateNumber || 38}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-pad-sm flex flex-col items-center justify-center text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">अनुमानित समय • Est. Wait</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline-md text-headline-md text-primary font-bold">~{queueData?.estWaitMins || 25}</span>
              <span className="font-label-md text-label-md text-on-surface">मिनट</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCE TOKEN BOOKING SECTION (MATCHING STITCH PROTOTYPE) */}
      <section className="rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="bg-primary-fixed/40 px-pad-md py-pad-sm flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-pad-xs">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">book_online</span>
            </div>
            <div>
              <h2 className="font-label-md text-label-md text-on-surface font-bold leading-tight">टोकन ब्लॉक करें • Advance Booking</h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant leading-none mt-0.5">लाइन से बचें, समय पर मंडी पहुंचे</p>
            </div>
          </div>
          <span className="bg-secondary text-on-secondary text-[11px] font-label-sm font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-surface animate-ping"></span>
            स्लॉट चालू
          </span>
        </div>

        <div className="p-pad-md flex flex-col gap-pad-sm">
          {/* Slot Selection Options */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              समय स्लॉट चुनें • Select Time Slot
            </label>
            <div className="grid grid-cols-2 gap-pad-xs">
              <div
                onClick={() => setSelectedSlot('morning')}
                className={`rounded-lg p-2.5 flex flex-col cursor-pointer transition-all ${
                  selectedSlot === 'morning'
                    ? 'border-2 border-secondary bg-secondary-fixed/30'
                    : 'border border-outline-variant/50 bg-surface-container-low hover:border-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">सुबह 09 - 11 AM</span>
                  <span className={`material-symbols-outlined text-[18px] ${selectedSlot === 'morning' ? 'text-secondary' : 'text-outline-variant'}`}>
                    {selectedSlot === 'morning' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="font-body-sm text-[12px] text-secondary font-bold mt-1">{slotCounts.morning} टोकन बाकी</span>
                <span className="text-[11px] text-on-surface-variant">Morning Slot</span>
              </div>

              <div
                onClick={() => setSelectedSlot('afternoon')}
                className={`rounded-lg p-2.5 flex flex-col cursor-pointer transition-all ${
                  selectedSlot === 'afternoon'
                    ? 'border-2 border-secondary bg-secondary-fixed/30'
                    : 'border border-outline-variant/50 bg-surface-container-low hover:border-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">दोपहर 01 - 03 PM</span>
                  <span className={`material-symbols-outlined text-[18px] ${selectedSlot === 'afternoon' ? 'text-secondary' : 'text-outline-variant'}`}>
                    {selectedSlot === 'afternoon' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="font-body-sm text-[12px] text-primary font-bold mt-1">{slotCounts.afternoon} टोकन बाकी</span>
                <span className="text-[11px] text-on-surface-variant">Afternoon Slot</span>
              </div>
            </div>
          </div>

          {/* Vehicle Load Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
              वाहन व उपज भार • Load Size
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-container-high rounded-lg px-pad-sm py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">agriculture</span>
                  <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                    ट्रॉली / {queueData?.commodityQty || '50 क्विंटल'}
                  </span>
                </div>
                <span className="font-label-sm text-[12px] text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-bold">
                  {queueData?.commodity?.split(' ')[0] || 'सोयाबीन'}
                </span>
              </div>
            </div>
          </div>

          {/* Block Token Button */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleBlockToken}
              disabled={bookingState === 'loading'}
              className={`w-full h-14 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 px-pad-md font-bold ${
                bookingState === 'success' ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/90 text-on-secondary'
              }`}
            >
              {bookingState === 'loading' ? (
                <>
                  <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
                  <span className="font-bold text-sm">टोकन आरक्षित हो रहा है...</span>
                </>
              ) : bookingState === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span className="font-bold text-sm">🔒 टोकन #{queueData?.token || 42} आरक्षित हुआ!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px] text-secondary-fixed">lock_open</span>
                  <div className="flex flex-col text-left">
                    <span className="font-label-md text-label-md font-bold leading-tight">🔒 टोकन अभी ब्लॉक करें • Block Token Now</span>
                    <span className="font-body-sm text-[11px] text-secondary-fixed leading-none">15 मिनट के लिए आरक्षित • Free Slot Reserve</span>
                  </div>
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
              <span className="font-body-sm text-[12px]">QR पास व SMS तुरंत प्राप्त होगा • Gate Priority Pass</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Mandi Action Alert Banner */}
      <div className="bg-primary-fixed/40 rounded-xl p-pad-md flex items-center gap-pad-sm shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0">
          <span className="material-symbols-outlined text-[26px]">notifications_active</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="font-label-md text-label-md text-on-primary-fixed leading-snug font-bold">
            तौल कांटे #{queueData?.weighbridgeNo || 3} की ओर बढ़ें
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
            Move toward Weighbridge {queueData?.weighbridgeNo || 3} lane now
          </p>
        </div>
      </div>

      {/* 4-Dot Physical Process Visualizer */}
      <div className="bg-surface-container-lowest rounded-xl p-pad-md shadow-sm flex flex-col border border-slate-100">
        <div className="flex items-center justify-between mb-pad-md">
          <span className="font-label-md text-label-md text-on-surface font-bold">मंडी प्रक्रिया • Mandi Steps</span>
          <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/50 px-pad-xs py-0.5 rounded font-bold">
            कदम {currentIndex + 1} / 4 चालू
          </span>
        </div>
        
        {/* Connected Step Indicator */}
        <div className="relative flex items-start justify-between w-full px-2">
          <div className="absolute top-6 left-6 right-6 h-1.5 bg-surface-container-highest rounded-full -z-0"></div>
          <div
            style={{ width: fillWidths[currentIndex] || '0%' }}
            className="absolute top-6 left-6 h-1.5 bg-secondary rounded-full -z-0 transition-all duration-500"
          ></div>

          {/* Step 1: Arrived */}
          <div className={`flex flex-col items-center z-10 w-16 ${currentIndex < 0 ? 'opacity-60' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
              currentIndex > 0 ? 'bg-secondary text-on-secondary' : 'bg-primary-container text-on-primary-container'
            }`}>
              <span className="material-symbols-outlined text-[26px]">
                {currentIndex > 0 ? 'check' : 'how_to_reg'}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary mt-2 text-center leading-none font-bold">पहुंचे</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant text-center">Arrived</span>
          </div>

          {/* Step 2: Weighing */}
          <div className={`flex flex-col items-center z-10 w-16 ${currentIndex < 1 ? 'opacity-60' : ''}`}>
            <div className="relative flex items-center justify-center">
              {currentIndex === 1 && (
                <div className="absolute -inset-1 rounded-full bg-primary-fixed-dim animate-ping opacity-75"></div>
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md relative ${
                currentIndex > 1 ? 'bg-secondary text-on-secondary' : (currentIndex === 1 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant')
              }`}>
                <span className="material-symbols-outlined text-[24px]">
                  {currentIndex > 1 ? 'check' : 'scale'}
                </span>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-primary mt-2 text-center font-extrabold leading-none">तौल</span>
            <span className="font-body-sm text-[11px] text-primary text-center font-bold">Weighing</span>
          </div>

          {/* Step 3: Grade */}
          <div className={`flex flex-col items-center z-10 w-16 ${currentIndex < 2 ? 'opacity-60' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentIndex > 2 ? 'bg-secondary text-on-secondary' : (currentIndex === 2 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant')
            }`}>
              <span className="material-symbols-outlined text-[22px]">
                {currentIndex > 2 ? 'check' : 'manage_search'}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 text-center leading-none">गुणवत्ता</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant text-center">Grade</span>
          </div>

          {/* Step 4: Pass */}
          <div className={`flex flex-col items-center z-10 w-16 ${currentIndex < 3 ? 'opacity-60' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentIndex === 3 ? 'bg-secondary text-on-secondary shadow-md' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 text-center leading-none">पास</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant text-center">Pass</span>
          </div>
        </div>
      </div>

      {/* Vehicle & Commodity Details Card */}
      <div className="bg-surface-container-lowest rounded-xl p-pad-md shadow-sm flex flex-col gap-pad-sm border border-slate-100">
        <div className="flex items-center justify-between pb-pad-xs bg-surface-container-low/50 -mx-pad-md -mt-pad-md p-pad-md rounded-t-xl">
          <div className="flex items-center gap-pad-xs">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant block">ट्रैक्टर विवरण • Vehicle</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                {queueData?.vehicleNumber || 'RJ-20-EA-4412'}
              </span>
            </div>
          </div>
          <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold">
            {queueData?.vehicleType || 'सोनालिका DI 745'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-pad-sm pt-1">
          <div className="flex flex-col bg-surface-container-low rounded-lg p-pad-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant">निर्धारित कांटा • Location</span>
            <span className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
              कांटा #{queueData?.weighbridgeNo || 3}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Weighbridge No. {queueData?.weighbridgeNo || 3}</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-lg p-pad-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant">फसल • Commodity</span>
            <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold">
              {queueData?.commodity?.split(' ')[0] || 'सोयाबीन'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{queueData?.commodityQty || '68 बोरी'}</span>
          </div>
        </div>
      </div>

      {/* Show Entry QR Pass Button */}
      <div className="pt-pad-xs pb-pad-sm">
        <button
          onClick={onOpenQr}
          className="w-full h-16 rounded-xl bg-primary hover:bg-primary-container text-on-primary shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-pad-sm px-pad-md font-bold"
        >
          <span className="material-symbols-outlined text-[32px] text-primary-fixed">qr_code_scanner</span>
          <div className="flex flex-col text-left">
            <span className="font-label-lg text-label-lg leading-tight">सुरक्षा गार्ड को पास दिखाएं</span>
            <span className="font-body-sm text-[13px] text-primary-fixed leading-tight">Show Entry QR Pass to Guard</span>
          </div>
        </button>
      </div>

    </div>
  );
}

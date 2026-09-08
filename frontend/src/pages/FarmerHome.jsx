import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerHome({ farmerData, onNavigate, onOpenAid, onOpenMarket }) {
  const { currentLang, changeLanguage, LANGUAGES, speechCode, t } = useLanguage();

  const speakGreeting = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(
        `नमस्ते ${farmerData?.name || 'राम लाल शर्मा जी'}! आपका टोकन क्रमांक #${farmerData?.token || 42} है। आज मंडी में सोयाबीन का सरकारी MSP 4892 रुपये और गेहूं का भाव 2275 रुपये है।`
      );
      utter.lang = speechCode || 'hi-IN';
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 gap-3.5 mt-1 animate-in fade-in duration-200">
      
      {/* UNDERSTATED TACTILE LANGUAGE SELECTOR (KHADI CHIPS) */}
      <section aria-label="Select Language" className="w-full flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-[#78716C] flex items-center gap-1 pl-0.5 pr-1">
          <span className="material-symbols-outlined text-[16px] text-[#166534]">translate</span>
        </span>
        {LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs whitespace-nowrap ${
                isSelected
                  ? 'bg-[#166534] text-white border border-[#166534] font-bold'
                  : 'bg-white border border-[#E5DEC9] text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
            </button>
          );
        })}
      </section>

      {/* FARMER IDENTITY & MANDI PASS CARD (GROUNDED PHYSICAL VOUCHER) */}
      <section className="relative bg-white rounded-xl border border-[#E5DEC9] p-4 shadow-sm overflow-hidden">
        {/* Top Perforated Receipt Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#B45309]/90"></div>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            {/* Portrait Badge with Physical Border */}
            <div className="relative w-12 h-14 bg-[#F4EFE2] rounded-lg border border-[#D9D0BE] flex flex-col items-center justify-center flex-shrink-0 text-[#166534]">
              <span className="material-symbols-outlined text-[28px]">person</span>
              <span className="text-[8px] font-bold tracking-tighter text-[#78716C] uppercase mt-0.5">APMC ID</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-bold text-base text-[#1C1917] leading-tight">
                  {farmerData?.name || 'राम लाल शर्मा'}
                </h2>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  प्रमाणित किसान
                </span>
              </div>
              <p className="text-xs text-[#57534E] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#B45309]">location_on</span>
                {farmerData?.village || 'गांव कंडाघाट, कोटा'} • गेट पास: #APMC-789
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-[#78716C] font-medium">
                <span>फसल: <strong className="text-[#1C1917]">{farmerData?.crop || 'सोयाबीन (JS-335)'}</strong></span>
                <span>•</span>
                <span>वजन: <strong className="text-[#1C1917]">{farmerData?.quintal || 50} क्विंटल</strong></span>
              </div>
            </div>
          </div>

          {/* Token Tag Physical Voucher Style */}
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#FAF6EE] border-2 border-dashed border-[#B45309] min-w-[70px] text-center flex-shrink-0">
            <span className="text-[9px] font-bold tracking-wider text-[#B45309] uppercase">मंडी टोकन</span>
            <span className="font-extrabold text-2xl text-[#1C1917] leading-none my-0.5 font-mono">
              #{farmerData?.token || 42}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#166534]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
              सक्रिय
            </span>
          </div>
        </div>

        {/* Quick Audio Announcement Bar inside pass */}
        <div className="mt-3 pt-2.5 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#57534E]">
            <span className="material-symbols-outlined text-[17px] text-[#166534]">schedule</span>
            <span className="text-xs">नीलामी समय: <strong>आज पूर्वाह्न 11:30 बजे</strong> (शेड नं. 3)</span>
          </div>
          <button
            onClick={speakGreeting}
            className="flex items-center gap-1 text-[11px] font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-1 rounded-md border border-green-200 active:scale-95 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">volume_up</span>
            सुनें
          </button>
        </div>
      </section>

      {/* SECTION TITLE: SERVICES */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-4 rounded-full bg-[#B45309]"></span>
          <h3 className="font-bold text-sm text-[#1C1917]">मंडी मुख्य सेवाएं (Mandi Core Services)</h3>
        </div>
        <span className="text-[11px] font-semibold text-[#78716C]">कोटा मुख्य यार्ड</span>
      </div>

      {/* 5 GROUNDED, TACTILE SERVICE TOKENS */}
      <section aria-label="Mandi Core Services" className="grid grid-cols-2 gap-2.5 w-full">
        {/* 1. MANDI SCHEDULE (समय) */}
        <div
          onClick={() => onNavigate('schedule')}
          className="group flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#E5DEC9] hover:border-[#B45309] transition-all shadow-xs active:bg-[#FAF6EE] min-h-[148px] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] shadow-xs">
              <span className="material-symbols-outlined text-[28px]">calendar_clock</span>
            </div>
            <span className="text-[10px] font-bold text-[#78716C] tracking-wider uppercase">01 / समय</span>
          </div>
          <div>
            <span className="font-bold text-lg text-[#1C1917] leading-tight block">{t('schedule', 'मंडी समय')}</span>
            <p className="text-[11px] text-[#57534E] font-medium">Daily Auction Hours</p>
            <span className="inline-block mt-1 text-[11px] font-bold text-[#B45309]">गेट खुला: प्रातः 6 बजे से</span>
          </div>
        </div>

        {/* 2. QUEUE / TOKEN LIVE (कतार) */}
        <div
          onClick={() => onNavigate('queue')}
          className="group flex flex-col justify-between p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] hover:border-[#166534] transition-all shadow-xs active:bg-green-100 min-h-[148px] cursor-pointer relative"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#166534] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-green-300 text-[#166534]">
              टोकन #{farmerData?.token || 42}
            </span>
          </div>
          <div>
            <span className="font-bold text-lg text-[#166534] leading-tight block">{t('queue', 'लाइव कतार')}</span>
            <p className="text-[11px] text-[#57534E] font-medium">Live Token Position</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#166534]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
              04 ट्रैक्टर आगे • ~25 मिनट
            </span>
          </div>
        </div>

        {/* 3. PAYMENT & ADVANCE (भुगतान) */}
        <div
          onClick={() => onNavigate('payment')}
          className="group flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#E5DEC9] hover:border-[#166534] transition-all shadow-xs active:bg-[#FAF6EE] min-h-[148px] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-xs">
              <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold text-[#78716C] tracking-wider uppercase">03 / भुगतान</span>
          </div>
          <div>
            <span className="font-bold text-lg text-[#1C1917] leading-tight block">{t('payment', 'भुगतान स्थिति')}</span>
            <p className="text-[11px] text-[#57534E] font-medium">PFMS / DBT Transfer</p>
            <span className="inline-block mt-1 text-[11px] font-bold text-[#0284C7]">80% अग्रिम उपलब्ध</span>
          </div>
        </div>

        {/* 4. FINANCIAL AID & PASSBOOK (ऋण व सहायता) */}
        <div
          onClick={onOpenAid}
          className="group flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#E5DEC9] hover:border-[#B45309] transition-all shadow-xs active:bg-[#FAF6EE] min-h-[148px] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#FFEDD5] border border-[#FED7AA] flex items-center justify-center text-[#C2410C] shadow-xs">
              <span className="material-symbols-outlined text-[28px]">account_balance</span>
            </div>
            <span className="text-[10px] font-bold text-[#78716C] tracking-wider uppercase">04 / सहायता</span>
          </div>
          <div>
            <span className="font-bold text-lg text-[#1C1917] leading-tight block">क्रेडिट पासबुक</span>
            <p className="text-[11px] text-[#57534E] font-medium">KCC & Warehouse Aid</p>
            <span className="inline-block mt-1 text-[11px] font-bold text-[#C2410C]">₹1.50L सीमा स्वीकृत</span>
          </div>
        </div>
      </section>

      {/* 5. E-NAM AUCTION TRADE SLIPS (FULL WIDTH TACTILE CARD) */}
      <div
        onClick={onOpenMarket}
        className="group flex items-center justify-between p-3.5 rounded-xl bg-[#FAF6EE] border-2 border-dashed border-[#B45309] hover:bg-[#F4EFE2] transition-all shadow-xs active:scale-98 w-full cursor-pointer mt-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#B45309] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">storefront</span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#1C1917] leading-tight">e-NAM मंडी नीलामी पर्चियां</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#166534] text-white uppercase">Live</span>
            </div>
            <span className="text-xs text-[#57534E]">42 खरीदार सक्रिय • सीधे बोली स्वीकार करें</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white border border-[#E5DEC9] flex items-center justify-center text-[#B45309] shadow-xs">
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </div>
      </div>

    </div>
  );
}


import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerHome({ farmerData, onNavigate, onOpenAid, onOpenMarket }) {
  const { currentLang, changeLanguage, LANGUAGES, speechCode, t } = useLanguage();

  const speakGreeting = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(
        `नमस्ते ${farmerData?.name || 'राम लाल जी'}! आपका टोकन नंबर ${farmerData?.token || 42} है। आज मंडी में गेहूं का भाव 2275 रुपये है।`
      );
      utter.lang = speechCode || 'hi-IN';
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="flex flex-col w-full px-pad-md gap-pad-md animate-in fade-in duration-200">
      
      {/* INTERACTIVE LANGUAGE SELECTOR BAR */}
      <section aria-label="Select Language" className="w-full overflow-x-auto py-pad-xs no-scrollbar flex items-center gap-pad-xs">
        {LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center gap-1.5 px-pad-md py-1.5 rounded-full font-label-md text-xs font-bold flex-shrink-0 transition-all active:scale-95 shadow-xs ${
                isSelected
                  ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {isSelected && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
            </button>
          );
        })}
      </section>

      {/* CHEERFUL WELCOME BANNER */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container p-pad-md shadow-sm">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-fixed/40 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between gap-pad-sm">
          <div className="flex items-center gap-pad-sm min-w-0">
            <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-primary text-[32px]">face_6</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-pad-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                  {farmerData?.name || 'राम लाल जी'}
                </span>
                <span className="px-pad-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                  टोकन #{farmerData?.token || 42}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                <span>आज, {farmerData?.date || '8 सितंबर 2026'} • {farmerData?.mandi || 'कोटा मंडी'}</span>
              </span>
            </div>
          </div>
          <button
            onClick={speakGreeting}
            aria-label="Listen audio greeting"
            className="w-11 h-11 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm active:scale-90 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
          </button>
        </div>
      </section>

      {/* MAIN 5 GIANT COLORFUL ICON TILES */}
      <section aria-label="Mandi Services" className="flex flex-col gap-pad-sm w-full">
        {/* ROW 1: SCHEDULE & QUEUE */}
        <div className="grid grid-cols-2 gap-pad-sm w-full">
          {/* 1. SCHEDULE */}
          <div
            onClick={() => onNavigate('schedule')}
            className="group relative flex flex-col items-center justify-between p-pad-md rounded-xl bg-surface-container-high shadow-md transition-all active:scale-95 text-center min-h-[160px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-pad-xs shadow-inner">
              <span className="material-symbols-outlined text-[40px]">calendar_clock</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-md text-headline-md text-on-surface">{t('schedule', 'समय')}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Schedule</span>
            </div>
          </div>

          {/* 2. QUEUE */}
          <div
            onClick={() => onNavigate('queue')}
            className="group relative flex flex-col items-center justify-between p-pad-md rounded-xl bg-secondary-container shadow-md transition-all active:scale-95 text-center min-h-[160px] cursor-pointer"
          >
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-surface-container-lowest/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
              <span className="font-label-sm text-label-sm text-on-secondary-container font-bold">
                #{farmerData?.token || 42}
              </span>
            </div>
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-on-secondary mb-pad-xs shadow-inner">
              <span className="material-symbols-outlined text-[40px]">confirmation_number</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-md text-headline-md text-on-secondary-container">{t('queue', 'कतार')}</span>
              <span className="font-label-sm text-label-sm text-on-secondary-container">Queue Live</span>
            </div>
          </div>
        </div>

        {/* ROW 2: PAYMENT & MONEY HELP */}
        <div className="grid grid-cols-2 gap-pad-sm w-full">
          {/* 3. PAYMENT */}
          <div
            onClick={() => onNavigate('payment')}
            className="group relative flex flex-col items-center justify-between p-pad-md rounded-xl bg-surface-container-lowest shadow-md transition-all active:scale-95 text-center min-h-[160px] cursor-pointer border border-slate-100"
          >
            <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-tertiary mb-pad-xs shadow-inner">
              <span className="material-symbols-outlined text-[40px]">payments</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-md text-headline-md text-on-surface">{t('payment', 'पैसे')}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Payments</span>
            </div>
          </div>

          {/* 4. MONEY HELP (LOAN / INSURANCE) */}
          <div
            onClick={onOpenAid}
            className="group relative flex flex-col items-center justify-between p-pad-md rounded-xl bg-surface-container-high shadow-md transition-all active:scale-95 text-center min-h-[160px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary mb-pad-xs shadow-inner">
              <span className="material-symbols-outlined text-[40px]">handshake</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-md text-headline-md text-on-surface">मदद</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Loans & Help</span>
            </div>
          </div>
        </div>

        {/* ROW 3: BUY SEEDS (FULL WIDTH TILE) */}
        <div
          onClick={onOpenMarket}
          className="group flex items-center justify-between p-pad-md rounded-xl bg-secondary-fixed shadow-md transition-all active:scale-98 w-full min-h-[110px] cursor-pointer"
        >
          <div className="flex items-center gap-pad-md">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-inner flex-shrink-0">
              <span className="material-symbols-outlined text-[40px]">eco</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline-md text-headline-md text-on-secondary-fixed leading-tight">बीज और खाद</span>
              <span className="font-body-md text-body-md text-on-secondary-fixed-variant">Buy Quality Seeds</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest/60 flex items-center justify-center text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[28px]">arrow_forward</span>
          </div>
        </div>
      </section>

    </div>
  );
}

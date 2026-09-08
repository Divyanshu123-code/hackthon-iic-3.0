import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ activeTab, onNavigate }) {
  const { currentLangObj, setIsLangModalOpen, t } = useLanguage();

  const titleMap = {
    home: t('home', 'Home'),
    schedule: t('schedule', 'Schedule'),
    queue: t('queue', 'Queue'),
    payment: t('payment', 'Payment'),
    aid: 'Financial Aid',
    market: 'Marketplace'
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-pad-md flex items-center justify-between gap-pad-sm max-w-lg mx-auto">
        
        {/* Brand & Active Tab */}
        <div className="flex items-center gap-pad-sm min-w-0 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
            🌾
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider leading-none">
              {t('appTitle', 'किसान मंडी')}
            </span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
              {titleMap[activeTab] || 'Kisan Mandi'}
            </h1>
          </div>
        </div>

        {/* Action Buttons: Language Selector, Staff Desk, Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Language Switcher Pill */}
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 rounded-full font-label-sm text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="भाषा बदलें • Change Language"
          >
            <span className="text-sm">{currentLangObj.flag}</span>
            <span>{currentLangObj.label}</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
          </button>

          {/* Staff Desk Link */}
          <a
            href="/staff"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-full font-label-sm text-[11px] font-bold flex items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            <span className="hidden sm:inline">Staff</span>
          </a>

          {/* User Icon */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>

        </div>
      </div>
    </header>
  );
}

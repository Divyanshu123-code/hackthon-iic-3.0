import React from 'react';

const titleMap = {
  'home': 'Home',
  'schedule': 'Mandi Schedule',
  'queue': 'Token And Queue',
  'payment': 'Payments',
  'aid': 'Financial Aid',
  'market': 'Marketplace'
};

export default function Header({ activeTab, onNavigate }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-pad-md flex items-center justify-between gap-pad-sm max-w-lg mx-auto">
        <div className="flex items-center gap-pad-sm min-w-0 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
            🌾
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider leading-none">किसान मंडी</span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
              {titleMap[activeTab] || 'Kisan Mandi'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-pad-xs flex-shrink-0">
          <a 
            href="/staff" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-full font-label-sm text-xs font-bold flex items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            Staff Desk
          </a>
          <button aria-label="Notifications" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

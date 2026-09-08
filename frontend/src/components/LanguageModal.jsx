import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageModal() {
  const { isLangModalOpen, setIsLangModalOpen, currentLang, changeLanguage, LANGUAGES, t } = useLanguage();

  if (!isLangModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl p-pad-lg flex flex-col gap-pad-md shadow-2xl border border-outline-variant/30 animate-in slide-in-from-bottom duration-200">
        
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto sm:hidden"></div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">translate</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">भाषा चुनें</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">Select Your Language</p>
            </div>
          </div>
          <button
            onClick={() => setIsLangModalOpen(false)}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Language Options List */}
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-secondary-container/40 border-secondary shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/30 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className={`font-label-lg text-base font-bold ${isSelected ? 'text-secondary' : 'text-on-surface'}`}>
                      {lang.label}
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant">{lang.sublabel}</span>
                  </div>
                </div>

                {isSelected ? (
                  <span className="material-symbols-outlined text-secondary text-[24px]">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[24px]">radio_button_unchecked</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsLangModalOpen(false)}
          className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-sm font-bold shadow-md active:scale-95 transition-transform"
        >
          पुष्टि करें • Confirm
        </button>

      </div>
    </div>
  );
}

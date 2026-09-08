import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function QrModal({ isOpen, onClose, farmerData }) {
  const { currentLang, t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-sm flex items-center justify-center p-margin-screen">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-pad-lg flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mt-1 font-bold">
          {t('gateQrPassTitle', 'Gate Entry QR Pass')}
        </span>
        <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface mt-1 font-extrabold">
          {t('yourToken', 'Token')} #{farmerData?.token || 42}
        </span>

        {/* High Contrast Simulated Mandi QR Code Box */}
        <div className="w-56 h-56 my-pad-md bg-surface-container-lowest p-pad-sm rounded-xl shadow-inner flex items-center justify-center border-2 border-slate-200">
          <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 100 100">
            <rect fill="currentColor" height="28" rx="2" width="28" x="5" y="5"></rect>
            <rect fill="#ffffff" height="20" rx="1" width="20" x="9" y="9"></rect>
            <rect fill="currentColor" height="12" width="12" x="13" y="13"></rect>
            <rect fill="currentColor" height="28" rx="2" width="28" x="67" y="5"></rect>
            <rect fill="#ffffff" height="20" rx="1" width="20" x="71" y="9"></rect>
            <rect fill="currentColor" height="12" width="12" x="75" y="13"></rect>
            <rect fill="currentColor" height="28" rx="2" width="28" x="5" y="67"></rect>
            <rect fill="#ffffff" height="20" rx="1" width="20" x="9" y="71"></rect>
            <rect fill="currentColor" height="12" width="12" x="13" y="75"></rect>
            <rect height="8" width="8" x="38" y="8"></rect>
            <rect height="6" width="10" x="50" y="8"></rect>
            <rect height="14" width="6" x="38" y="20"></rect>
            <rect height="6" width="12" x="48" y="18"></rect>
            <rect height="10" width="8" x="48" y="28"></rect>
            <rect height="8" width="10" x="8" y="38"></rect>
            <rect height="12" width="6" x="8" y="50"></rect>
            <rect height="18" width="8" x="22" y="40"></rect>
            <rect height="10" width="10" x="38" y="42"></rect>
            <rect height="6" width="14" x="52" y="42"></rect>
            <rect height="16" width="8" x="70" y="42"></rect>
            <rect height="8" width="12" x="82" y="42"></rect>
            <rect height="14" width="6" x="38" y="56"></rect>
            <rect height="8" width="14" x="48" y="52"></rect>
            <rect height="12" width="8" x="48" y="64"></rect>
            <rect height="12" width="14" x="60" y="62"></rect>
            <rect height="8" width="16" x="78" y="62"></rect>
            <rect height="8" width="18" x="38" y="74"></rect>
            <rect height="16" width="10" x="60" y="78"></rect>
            <rect height="12" width="8" x="74" y="74"></rect>
            <rect height="20" width="8" x="86" y="74"></rect>
            <rect height="8" width="18" x="38" y="86"></rect>
          </svg>
        </div>

        <div className="bg-surface-container-low w-full rounded-lg p-pad-sm flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
            {farmerData?.vehicleNumber || 'RJ-20-EA-4412'}
          </span>
          <span className="font-label-sm text-label-sm text-secondary font-bold">
            {currentLang === 'en' ? `Lane #${farmerData?.weighbridgeNo || 3} Valid` : `कांटा #${farmerData?.weighbridgeNo || 3} मान्य`}
          </span>
        </div>
        <p className="font-body-sm text-[12px] text-on-surface-variant mt-pad-sm">
          {t('scanAtWeighbridgeNote', 'Present this QR pass before the scanner when arriving at the weighbridge.')}
        </p>
      </div>
    </div>
  );
}

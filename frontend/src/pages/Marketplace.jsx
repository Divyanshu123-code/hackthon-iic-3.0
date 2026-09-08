import React from 'react';

export default function Marketplace({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center p-0">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl p-pad-lg flex flex-col gap-pad-md shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-[28px]">eco</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">प्रमाणित बीज व खाद मंडी</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="p-3 bg-surface-container-low rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm block text-slate-900">IFFCO नैनो यूरिया (Liquid)</span>
              <span className="text-xs text-slate-500">500ml बोतल • सरकारी सब्सिडी प्राप्त</span>
            </div>
            <span className="font-bold text-emerald-700 text-sm">₹225</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm block text-slate-900">सरसों प्रमाणित बीज (Pusa Bold)</span>
              <span className="text-xs text-slate-500">10 Kg बैग • 99% अंकुरण गारंटी</span>
            </div>
            <span className="font-bold text-emerald-700 text-sm">₹850</span>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
          बंद करें / Close
        </button>
      </div>
    </div>
  );
}

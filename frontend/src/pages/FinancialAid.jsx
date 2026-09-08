import React from 'react';

export default function FinancialAid({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center p-0">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl p-pad-lg flex flex-col gap-pad-md shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700 text-[28px]">handshake</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">वित्तीय सहायता • Financial Aid</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="font-bold text-amber-900 text-sm">किसान क्रेडिट कार्ड (KCC) ऋण सुविधा</span>
          <p className="text-xs text-amber-800">
            आपकी स्वीकृत फसल पर्ची के आधार पर आप ₹1,00,000 तक का अल्पकालिक ऋण 4% ब्याज पर प्राप्त कर सकते हैं।
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="font-bold text-emerald-900 text-sm">प्रधानमंत्री फसल बीमा योजना (PMFBY)</span>
          <p className="text-xs text-emerald-800">
            रबी सत्र के लिए बीमा दावा पंजीयन खुला है। अंतिम तिथि: 30 सितंबर 2026।
          </p>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
          समझ गया / Got it
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function FinancialAid({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [sanctionClaimed, setSanctionClaimed] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const handleClaim = (schemeId, title, amount) => {
    setSanctionClaimed(prev => ({ ...prev, [schemeId]: true }));
    setToastMsg(`✅ ${title} (${amount}) प्रपत्र सफलतापूर्वक संस्वीकृत!`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#fdfaf5] text-[#1f1b17] rounded-t-3xl sm:rounded-3xl flex flex-col h-[92vh] sm:h-[680px] shadow-2xl border border-[#d6c2ab] overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="bg-[#166534] text-white px-4 py-3.5 border-b border-[#0e4623] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold leading-tight">नाबार्ड - एपीएमसी किसान ऋण बहीखाता</h3>
              <p className="text-[11px] text-emerald-200">Kisan Credit Desk • कोटा संभाग शाखा</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold text-center animate-in slide-in-from-top duration-150">
            {toastMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          
          {/* Hero Card: KCC Limit Passbook Ledger */}
          <div className="relative overflow-hidden bg-[#fdfaf5] border-2 border-[#d6c2ab] rounded-2xl shadow-sm">
            
            {/* Passbook Header Strip */}
            <div className="bg-[#166534] text-white px-4 py-2 flex items-center justify-between border-b-2 border-[#0e4623]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#95f8a7]">menu_book</span>
                <span className="text-xs font-bold tracking-wide">किसान क्रेडिट खाता • KCC PASSBOOK</span>
              </div>
              <span className="font-mono text-[11px] bg-[#0e4623] text-[#95f8a7] px-2 py-0.5 rounded font-bold">
                KCC-8824-KT
              </span>
            </div>

            <div className="p-4 flex flex-col gap-2.5 relative">
              {/* Stamp Badge */}
              <div className="absolute right-3 top-3 rotate-[-6deg] border-2 border-amber-700 bg-amber-50 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shadow-xs pointer-events-none">
                APMC स्वीकृत • SANCTIONED
              </div>

              {/* Pre-Approved Amount */}
              <div>
                <span className="text-[11px] text-[#7c6853] block uppercase tracking-wider font-bold">
                  कुल पूर्व-स्वीकृत ऋण सीमा (Credit Limit)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-[#166534]">₹1,50,000</span>
                  <span className="text-xs font-bold text-[#166534] bg-[#eaf7ee] px-2 py-0.5 rounded border border-[#b2e5c1]">
                    उपलब्ध शेष
                  </span>
                </div>
              </div>

              {/* Ruled Passbook Specs Table */}
              <div className="border-t border-b border-[#e5d5c2] divide-y divide-[#ebdccb] text-xs py-1">
                <div className="py-1 flex justify-between items-center">
                  <span className="text-[#7c6853]">प्रभावी ब्याज दर</span>
                  <span className="text-[#2c1d11] font-bold font-mono">4.00% वार्षिक (3% अनुदान सहित)</span>
                </div>
                <div className="py-1 flex justify-between items-center">
                  <span className="text-[#7c6853]">भुगतान माध्यम</span>
                  <span className="text-[#166534] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    डायरेक्ट बैंक ट्रांसफर (DBT)
                  </span>
                </div>
              </div>

              {/* Two Feature Badges */}
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 bg-[#fef3c7] text-[#92400e] border border-[#fde68a] px-2.5 py-1 rounded text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">percent</span>
                  0% रियायती ब्याज योजना
                </span>
                <span className="inline-flex items-center gap-1 bg-[#eaf7ee] text-[#166534] border border-[#b2e5c1] px-2.5 py-1 rounded text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  DBT सीधे खाते में
                </span>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-[#166534] rounded-full"></span>
              <h4 className="font-bold text-sm text-[#1f1b17]">संस्वीकृति प्रपत्र एवं योजनाएं</h4>
            </div>
            <span className="text-xs text-[#7c6853] font-bold">3 बहीखाता वाउचर</span>
          </div>

          {/* Voucher 1: KCC Crop Loan */}
          <div className="bg-[#fffdfa] border-2 border-[#dfceba] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#fbf5ee] px-4 py-2.5 border-b-2 border-double border-[#cfbba6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] text-[#166534] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">agriculture</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#2c1d11] leading-tight">केसीसी मौसमी फसल ऋण प्रपत्र</h5>
                  <span className="text-[11px] text-[#7c6853]">KCC Crop Sanction Voucher</span>
                </div>
              </div>
              <span className="border border-[#15803d] text-[#15803d] text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#f0faf2]">
                अनुदानित
              </span>
            </div>

            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 divide-x divide-[#ebdccb] bg-[#f8f1e7] p-2 rounded-xl border border-[#ebdccb]">
                <div className="px-2">
                  <span className="text-[11px] text-[#7c6853] block">स्वीकृत राशि</span>
                  <span className="text-lg font-bold text-[#166534] font-mono">₹1,50,000</span>
                </div>
                <div className="px-2">
                  <span className="text-[11px] text-[#7c6853] block">ब्याज दर</span>
                  <span className="text-lg font-bold text-[#2c1d11] font-mono">4% वार्षिक</span>
                </div>
              </div>

              <div className="border-t border-b border-[#ebdccb] py-1.5 flex justify-between items-center text-xs text-[#5c4a38]">
                <span>पुनर्भुगतान अवधि (Tenure)</span>
                <span className="font-bold text-[#2c1d11]">12 महीने (फसल कटाई उपरांत)</span>
              </div>

              <button
                onClick={() => handleClaim('kcc', 'केसीसी मौसमी फसल ऋण', '₹1,50,000')}
                disabled={sanctionClaimed.kcc}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                  sanctionClaimed.kcc
                    ? 'bg-emerald-800 text-white cursor-default'
                    : 'bg-[#166534] hover:bg-[#0e4623] text-white border border-[#0e4623]'
                }`}
              >
                <span>{sanctionClaimed.kcc ? '✅ ऋण प्रपत्र स्वीकृत' : 'ऋण प्रपत्र भरें • Avail Sanction'}</span>
                <span className="material-symbols-outlined text-[16px]">draw</span>
              </button>
            </div>
          </div>

          {/* Voucher 2: e-NWR Warehouse Pledge Advance */}
          <div className="bg-[#fffdfa] border-2 border-[#dfceba] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#fbf5ee] px-4 py-2.5 border-b-2 border-double border-[#cfbba6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#92400e] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#2c1d11] leading-tight">मंडी उपज बंधक अग्रिम (e-NWR)</h5>
                  <span className="text-[11px] text-[#7c6853]">Warehouse Pledge Advance Note</span>
                </div>
              </div>
              <span className="border border-amber-700 text-amber-900 text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-50">
                त्वरित
              </span>
            </div>

            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="border border-[#ebdccb] rounded-xl overflow-hidden">
                <div className="bg-[#f8f1e7] px-3 py-1.5 flex justify-between items-center text-xs font-bold border-b border-[#ebdccb]">
                  <span className="text-[#7c6853]">उपज मूल्यांकन बंधक दर</span>
                  <span className="text-amber-800 font-mono">75% मूल्य तत्काल</span>
                </div>
                <div className="p-2.5 bg-white flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7c6853]">गोदाम रसीद आधार</span>
                    <span className="font-bold text-[#2c1d11]">WDRA e-NWR रसीद</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7c6853]">ब्याज छूट</span>
                    <span className="font-bold text-[#166534]">प्रथम 30 दिन 0%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleClaim('enwr', 'उपज बंधक अग्रिम', '75% मूल्य')}
                disabled={sanctionClaimed.enwr}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                  sanctionClaimed.enwr
                    ? 'bg-amber-800 text-white cursor-default'
                    : 'bg-[#9b4500] hover:bg-[#763300] text-white border border-[#763300]'
                }`}
              >
                <span>{sanctionClaimed.enwr ? '✅ अग्रिम संस्वीकृत' : 'अग्रिम राशि संस्वीकृति लें • Avail Pledge Credit'}</span>
                <span className="material-symbols-outlined text-[16px]">payments</span>
              </button>
            </div>
          </div>

          {/* Voucher 3: PMFBY Crop Insurance */}
          <div className="bg-[#fffdfa] border-2 border-[#dfceba] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#fbf5ee] px-4 py-2.5 border-b-2 border-double border-[#cfbba6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] text-[#166534] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#2c1d11] leading-tight">फसल बीमा संस्वीकृति प्रपत्र</h5>
                  <span className="text-[11px] text-[#7c6853]">PMFBY Insurance Ledger Record</span>
                </div>
              </div>
              <span className="border border-[#15803d] text-[#15803d] text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#f0faf2]">
                पंजीकृत
              </span>
            </div>

            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="bg-[#f8f1e7] p-2.5 rounded-xl text-xs flex justify-between items-center border border-[#ebdccb]">
                <span className="text-[#7c6853]">पंजीकृत रबी रकबा</span>
                <span className="font-bold text-[#2c1d11]">4.5 हेक्टेयर (गेहूं • पॉलिसी #PMF-88210)</span>
              </div>

              <button
                onClick={() => handleClaim('pmfby', 'फसल बीमा रसीद', 'पॉलिसी #PMF-88210')}
                disabled={sanctionClaimed.pmfby}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                  sanctionClaimed.pmfby
                    ? 'bg-emerald-800 text-white cursor-default'
                    : 'bg-[#166534] hover:bg-[#0e4623] text-white'
                }`}
              >
                <span>{sanctionClaimed.pmfby ? '✅ रसीद डाउनलोड हो गई' : 'बीमा दावा प्रपत्र देखें • View PMFBY'}</span>
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

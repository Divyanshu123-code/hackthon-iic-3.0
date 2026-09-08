import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Marketplace({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [acceptedBids, setAcceptedBids] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const slips = [
    {
      id: 'KOT-204',
      cropType: 'soy',
      title: 'सोयाबीन (Soybean JS-335)',
      location: 'यार्ड A • शेड 2',
      grade: 'ग्रेड A प्रमाणित',
      quantity: '50 क्विंटल',
      moisture: '10.5% (मानक)',
      mspDiff: 'MSP से ₹88 अधिक',
      msp: '₹4,892',
      bidRate: '₹4,980',
      totalValue: '₹2,49,000',
      payoutType: 'DBT सीधा भुगतान',
      buyer: 'राजस्थान एग्रो',
      buyerId: '#TR-408',
      timeAgo: '2 मि. पहले'
    },
    {
      id: 'KOT-198',
      cropType: 'wheat',
      title: 'गेहूं (Wheat Sharbati Gr-1)',
      location: 'तौल शेड #4 • गेट #2',
      grade: 'ग्रेड-1 शरबती',
      quantity: '80 क्विंटल',
      moisture: 'चमक व दाना: उत्तम A+',
      mspDiff: '+₹175 प्रीमियम',
      msp: '₹2,275',
      bidRate: '₹2,450',
      totalValue: '₹1,96,000',
      payoutType: 'डायरेक्ट सेटलमेंट',
      buyer: 'ITC ई-चौपाल',
      buyerId: '#CORP-812',
      timeAgo: '5 मि. पहले'
    },
    {
      id: 'KOT-211',
      cropType: 'mustard',
      title: 'सरसों (Mustard Black Pusa)',
      location: 'प्लेटफ़ॉर्म #1 • शेड 3',
      grade: 'तेल मात्रा 41.5%',
      quantity: '35 क्विंटल',
      moisture: '8.2% (शुद्ध सूखा)',
      mspDiff: '+₹230 प्रीमियम',
      msp: '₹5,650',
      bidRate: '₹5,880',
      totalValue: '₹2,05,800',
      payoutType: 'RTGS भुगतान',
      buyer: 'पतंजलि एग्रो लिमिटेड',
      buyerId: '#CORP-409',
      timeAgo: '12 मि. पहले'
    }
  ];

  const filteredSlips = selectedCrop === 'all' ? slips : slips.filter(s => s.cropType === selectedCrop);

  const handleAcceptBid = (id, title, value) => {
    setAcceptedBids(prev => ({ ...prev, [id]: true }));
    setToastMsg(`✅ पर्ची जारी हुई: ${title} (${value})`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#fff8f5] text-[#1f1b17] rounded-t-3xl sm:rounded-3xl flex flex-col h-[92vh] sm:h-[680px] shadow-2xl border border-amber-900/10 overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="bg-[#fff8f5] px-4 py-3.5 border-b border-amber-900/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-md text-base font-bold text-[#1f1b17]">मंडी ई-उपज बाज़ार</h3>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-bold">e-NAM</span>
              </div>
              <p className="text-[11px] text-[#3f493f]">नीलामी पर्ची व पंजीकृत व्यापारी बहीखाता</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-900/5 hover:bg-amber-900/10 flex items-center justify-center text-[#1f1b17] active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Live Pulse Strip */}
        <div className="bg-amber-100/60 px-4 py-2 flex items-center justify-between text-xs text-[#3f493f] flex-shrink-0 border-b border-amber-200/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
            <span className="font-bold text-[#1f2937]">कोटा मंडी नीलामी प्रगति पर • 42 सक्रिय खरीदार</span>
          </div>
          <span className="text-primary font-bold">लाइव भाव</span>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0 border-b border-amber-900/5">
          {[
            { id: 'all', label: 'सभी फसलें (All)', icon: 'check' },
            { id: 'wheat', label: 'गेहूं (Wheat)', icon: 'grain' },
            { id: 'soy', label: 'सोयाबीन (Soy)', icon: 'eco' },
            { id: 'mustard', label: 'सरसों (Mustard)', icon: 'grass' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedCrop(f.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedCrop === f.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-[#f0e6e0] text-[#3f493f] hover:bg-[#eae1da]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Toast Alert if accepted */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center animate-in slide-in-from-top duration-150">
            {toastMsg}
          </div>
        )}

        {/* Slips List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {filteredSlips.map(slip => {
            const isAccepted = acceptedBids[slip.id];
            return (
              <div
                key={slip.id}
                className="rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden transition-all border border-[#dcd1c8]"
                style={{ backgroundColor: '#fdfbf7' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-dashed border-[#c4b5a5]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-[#f0e6da] px-2 py-0.5 rounded font-bold text-xs text-amber-900 border border-[#e2d6c9]">
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                      लॉट पर्ची #{slip.id}
                    </span>
                    <span className="text-xs text-[#3f493f]">{slip.location}</span>
                  </div>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold border border-primary/20">
                    {slip.grade}
                  </span>
                </div>

                {/* Commodity Specs */}
                <div className="pt-3 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-[#1f2937] leading-tight">{slip.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#3f493f]">
                      <span className="bg-[#f5ebe1] px-2 py-0.5 rounded font-semibold text-[#1f2937]">मात्रा: {slip.quantity}</span>
                      <span>•</span>
                      <span className="text-[#9f3000] font-semibold">{slip.moisture}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {slip.mspDiff}
                    </span>
                    <span className="text-[11px] text-[#3f493f] mt-1">MSP: {slip.msp}</span>
                  </div>
                </div>

                {/* Highest Bid Box */}
                <div className="mt-3 bg-white rounded-xl p-3 border border-[#e5dcce] flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-[#3f493f] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">gavel</span>
                      उच्चतम स्वीकृत बोली (Top Bid)
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-primary">{slip.bidRate}</span>
                      <span className="text-xs text-[#3f493f]">/ क्विंटल</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-[#1f2937] block">कुल मूल्य: {slip.totalValue}</span>
                    <span className="text-emerald-700 font-semibold">{slip.payoutType}</span>
                  </div>
                </div>

                {/* Perforated Line */}
                <div className="border-t-2 border-dashed border-[#d1c4b7] my-3"></div>

                {/* Trader Details & CTA */}
                <div className="flex items-center justify-between text-xs text-[#3f493f] mb-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                    <span>पंजीकृत खरीदार: <strong className="text-[#1f2937]">{slip.buyer}</strong> ({slip.buyerId})</span>
                  </div>
                  <span>{slip.timeAgo}</span>
                </div>

                <button
                  onClick={() => handleAcceptBid(slip.id, slip.title, slip.totalValue)}
                  disabled={isAccepted}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                    isAccepted
                      ? 'bg-emerald-700 text-white cursor-default'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isAccepted ? 'check_circle' : 'receipt'}
                  </span>
                  <span>{isAccepted ? '✅ बोली स्वीकृत • पर्ची जारी' : 'बोली स्वीकारें • पर्ची जारी करें'}</span>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

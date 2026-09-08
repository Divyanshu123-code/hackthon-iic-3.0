import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Payment({ paymentData, onNavigate, onOpenAdvance }) {
  const { currentLang, t, speechCode } = useLanguage();

  const speakPaymentSummary = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = currentLang === 'en'
        ? `Your total approved amount is ₹1,13,750. You are eligible for an instant 80% advance payment directly to your bank account.`
        : `आपकी कुल राशि 1 लाख 13 हजार 750 रुपये स्वीकृत है। आप 80 प्रतिशत अग्रिम ले सकते हैं।`;
      const utter = new SpeechSynthesisUtterance(msg);
      utter.lang = speechCode || 'hi-IN';
      window.speechSynthesis.speak(utter);
    }
  };

  const totalApproved = paymentData?.totalApproved || 113750;
  const quintal = paymentData?.quintal || 50;
  const crop = currentLang === 'en' ? 'Wheat Grade-A' : (paymentData?.crop || 'गेहूं Grade-A');
  const lotNumber = paymentData?.lotNumber || 'LOT-2026-8849';
  const quality = paymentData?.quality || { moisture: '10.8%', purity: '99.4%', shed: currentLang === 'en' ? 'Mandi Shed 4' : 'मंडी शेड 4' };
  const advance = paymentData?.advance || { amount: 91000, taken: false };
  const bank = paymentData?.bank || { name: 'SBI Bank', last4: '4912', ifsc: 'SBIN000210' };
  const timeline = paymentData?.timeline || [];

  return (
    <div className="flex flex-col w-full px-margin-screen gap-pad-md animate-in fade-in duration-200">
      
      {/* Top Action Navigation Strip */}
      <div className="flex items-center justify-between pt-pad-xs">
        <button
          onClick={() => onNavigate('home')}
          aria-label={t('back', 'Go Back')}
          className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
            {t('transparentLedgerTitle', 'Transparent Account Ledger')}
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t('paymentStatusHeader', 'Payment Status & Payouts')}
          </h2>
        </div>
        <button
          onClick={speakPaymentSummary}
          aria-label={t('listenGreeting', 'Listen to Audio Summary')}
          className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary active:scale-95 transition-transform shadow-sm"
        >
          <span className="material-symbols-outlined text-[26px]">volume_up</span>
        </button>
      </div>

      {/* Giant Approved Amount Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-pad-lg shadow-md flex flex-col gap-pad-sm border border-slate-100">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary-fixed/30 pointer-events-none blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-pad-xs">
            <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
            <span className="font-label-md text-label-md text-on-surface-variant font-bold">
              {t('totalApproved', 'Total Approved Amount')}
            </span>
          </div>
          <span className="bg-secondary-container text-on-secondary-container px-pad-xs py-0.5 rounded-full font-label-sm text-label-sm flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">lock</span> {t('securedBadge', 'Secured')}
          </span>
        </div>
        <div className="flex items-baseline gap-1 py-1">
          <span className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-extrabold">
            ₹ {totalApproved.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center gap-pad-sm bg-surface-container-low rounded-lg p-pad-sm">
          <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-primary flex-shrink-0 text-xl">
            🌾
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface truncate font-bold">
              {quintal} {t('quintalUnit', 'Quintals')} • {crop}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('mandiLotNo', 'Mandi Lot No.')}: #{lotNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Quality Spec Card */}
      <div className="rounded-xl bg-surface-container-lowest shadow-sm p-pad-sm flex items-center gap-pad-sm border border-slate-100">
        <div className="w-16 h-16 rounded-lg bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
          🌾
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <div className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span className="font-label-sm text-label-sm font-bold">
              {t('gradeApprovedBadge', 'Quality Certified (Grade Approved)')}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {t('qualitySpecsLabel', 'Moisture')}: {quality.moisture} • {t('purityLabel', 'Purity')}: {quality.purity} • {quality.shed || 'Shed 4'}
          </p>
        </div>
      </div>

      {/* 4-Step Payment Flow Timeline */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md shadow-sm flex flex-col gap-pad-md border border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
            {t('processLiveStatus', 'Live Stage Tracking')}
          </h3>
          <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Live Synced
          </span>
        </div>

        <div className="relative flex flex-col gap-pad-md">
          {timeline.map((item, idx) => {
            const isDone = item.status === 'done';
            const isInProgress = item.status === 'in_progress';
            const isLast = idx === timeline.length - 1;

            let iconBg = isDone ? 'bg-secondary text-on-secondary' : (isInProgress ? 'bg-tertiary text-on-tertiary shadow-md' : 'bg-surface-variant text-on-surface-variant');
            let iconName = isDone ? 'check' : (isInProgress ? 'bolt' : (item.name === 'credited' ? 'account_balance' : 'hourglass_top'));
            let lineBg = isDone ? 'bg-secondary' : 'bg-surface-variant';

            return (
              <div key={item.name || idx} className="flex items-start gap-pad-md relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shadow-sm`}>
                    <span className={`material-symbols-outlined text-[20px] ${isInProgress ? 'animate-pulse' : ''}`}>
                      {iconName}
                    </span>
                  </div>
                  {!isLast && <div className={`w-1 h-9 ${lineBg} mt-1`}></div>}
                </div>
                <div className="flex flex-col min-w-0 pt-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-label-md text-label-md ${isInProgress ? 'text-tertiary font-bold' : 'text-on-surface font-bold'}`}>
                      {item.label}
                    </span>
                    {isInProgress && (
                      <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-xs rounded-full font-bold animate-pulse">
                        {t('inProgressBadge', 'In Progress')}
                      </span>
                    )}
                  </div>
                  <span className={`font-body-sm text-body-sm ${isDone ? 'text-secondary font-medium' : 'text-on-surface-variant'}`}>
                    {item.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instant Advance CTA Box */}
      {advance.taken ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-pad-lg shadow-md flex flex-col gap-pad-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <span className="material-symbols-outlined text-[26px] text-emerald-600">check_circle</span>
            <span>{t('advanceReceivedBadge', '80% Advance Credited')}</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium">
            ₹{advance.amount.toLocaleString('en-IN')} {t('depositedInAccount', 'has been deposited into your account')} ({bank.name} • Ref: {advance.referenceNo || 'IMPS'}).
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-container-high p-pad-lg shadow-md flex flex-col gap-pad-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-pad-xs">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[22px]">bolt</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {t('needCashTitle', 'Need Cash Urgently?')}
              </span>
            </div>
            <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-pad-xs py-1 rounded-full font-bold">
              Instant
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-body-lg text-body-lg text-on-surface">
              Get <strong className="text-primary">80% Money Now (₹{advance.amount.toLocaleString('en-IN')})</strong> directly to UPI / Bank
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t('advanceSubtext', 'Get 80% within 120 seconds into your bank account. Remaining 20% processed normally.')}
            </p>
          </div>
          <button
            onClick={onOpenAdvance}
            className="w-full h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-pad-sm shadow-md active:scale-98 transition-all hover:bg-primary-container font-bold"
          >
            <span className="material-symbols-outlined text-[28px]">bolt</span>
            <span className="font-headline-sm text-headline-sm tracking-wide">
              {t('getAdvance80Btn', '⚡ Get 80% Money Now')}
            </span>
          </button>
        </div>
      )}

      {/* Linked Bank Account Indicator */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md shadow-sm flex items-center justify-between border border-slate-100">
        <div className="flex items-center gap-pad-sm min-w-0">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-pad-xs">
              <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                {bank.name} •••• {bank.last4}
              </span>
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">IFSC: {bank.ifsc} • {t('aadharLinked', 'Aadhaar Linked')}</span>
          </div>
        </div>
        <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg font-bold">
          {t('verified', 'Verified')}
        </span>
      </div>

      {/* Fee Support Footer */}
      <div className="rounded-xl bg-surface-container-lowest p-pad-md flex flex-col gap-pad-xs shadow-sm border border-slate-100">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm">{t('mandiFeeLabel', 'Govt. Mandi Fee:')}</span>
          <span className="font-label-md text-label-md text-on-surface font-bold">{t('mandiTaxFree', 'Mandi Fee: ₹0 (Farmer Exemption)')}</span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm">{t('advanceFeeLabel', 'Advance Facility Fee:')}</span>
          <span className="font-label-md text-label-md text-secondary font-bold">{t('zeroInterest', 'Advance Fee: 0% Zero Interest (Govt. Scheme)')}</span>
        </div>
        <div className="pt-pad-xs flex items-center gap-pad-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span className="font-body-sm text-body-sm">{t('helpline', 'Helpdesk: 1800-180-1551 (Toll Free)')}</span>
        </div>
      </div>

    </div>
  );
}

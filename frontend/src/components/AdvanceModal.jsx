import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { requestAdvance } from '../api';

export default function AdvanceModal({ isOpen, onClose, farmerData, paymentData, onAdvanceSuccess }) {
  const { currentLang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await requestAdvance(farmerData?.farmerId || 'F1');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onClose();
        if (onAdvanceSuccess) onAdvanceSuccess(res);
      }, 1400);
    } catch (err) {
      setLoading(false);
      alert('Advance request failed');
    }
  };

  const advanceAmount = paymentData?.advance?.amount || 91000;
  const bankName = paymentData?.bank?.name || 'SBI Bank';
  const last4 = paymentData?.bank?.last4 || '4912';

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center p-0">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl p-pad-lg flex flex-col gap-pad-md shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-pad-xs">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {t('instantPaymentConfirm', 'Instant Payment Confirmation')}
            </h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="bg-surface-container-low rounded-xl p-pad-md flex flex-col gap-pad-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            {t('instantPayoutTransfer', 'Transfer Amount (Instant 80% Payout)')}
          </span>
          <span className="font-display-lg-mobile text-display-lg-mobile text-secondary font-black">
            ₹ {advanceAmount.toLocaleString('en-IN')}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface">
            {t('directToAcc', 'Direct to Account')}: {bankName} (•••• {last4})
          </span>
        </div>

        <div className="flex items-center gap-pad-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span className="font-body-sm text-body-sm">
            {t('upiCreditTime', 'Credited within 120s via UPI / IMPS')}
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading || success}
          className={`w-full h-14 rounded-xl flex items-center justify-center gap-pad-sm shadow-md font-headline-sm text-headline-sm active:scale-98 transition-all font-bold ${
            success ? 'bg-primary text-on-primary' : 'bg-secondary hover:bg-secondary/90 text-on-secondary'
          }`}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
              <span>{t('processingPayment', 'Processing payout...')}</span>
            </>
          ) : success ? (
            <>
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
              <span>₹{advanceAmount.toLocaleString('en-IN')} {t('amountSentSuccess', 'Successfully Transferred!')}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[28px]">lock_open</span>
              <span>{currentLang === 'en' ? `Confirm & Disburse ₹${advanceAmount.toLocaleString('en-IN')}` : `खाते में भेजें (Confirm ₹${advanceAmount.toLocaleString('en-IN')})`}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

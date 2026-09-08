import React, { useState } from 'react';
import { bookSlot } from '../api';

export default function Schedule({ scheduleData, onNavigate }) {
  const [bookingStatus, setBookingStatus] = useState('idle');

  const handleBookSlot = async () => {
    setBookingStatus('loading');
    try {
      await bookSlot('C1', 'F1', 'morning');
      setBookingStatus('success');
      setTimeout(() => setBookingStatus('idle'), 2500);
    } catch (e) {
      setBookingStatus('error');
      setTimeout(() => setBookingStatus('idle'), 2500);
    }
  };

  const isOpen = scheduleData?.open ?? true;
  const timing = scheduleData?.timing || '8:00 AM – 5:00 PM';
  const gateNumber = scheduleData?.gateNumber || 2;
  const todayCrop = scheduleData?.todayCrop || 'गेहूं (Wheat)';
  const cropQuality = scheduleData?.cropQuality || 'Sharbati & Lokwan Quality';
  const msp = scheduleData?.msp || 2275;

  return (
    <div className="flex flex-col w-full px-margin-screen gap-pad-md animate-in fade-in duration-200">
      
      {/* Top Context Header Bar */}
      <div className="flex items-center justify-between pt-pad-xs pb-pad-xs">
        <div className="flex items-center gap-pad-sm">
          <button
            onClick={() => onNavigate('home')}
            aria-label="Go Back"
            className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </button>
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block leading-none">
              दैनिक स्थिति • Live Status
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
              Mandi Schedule / मंडी तारीख
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-pad-xs bg-surface-container-high px-pad-sm py-pad-xs rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
          <span className="font-label-sm text-label-sm text-secondary font-bold">LIVE</span>
        </div>
      </div>

      {/* Giant Operational Status Card */}
      <div
        className={`w-full rounded-xl p-pad-md flex flex-col gap-pad-md relative overflow-hidden shadow-sm ${
          isOpen ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
        }`}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <div className={`inline-flex items-center gap-pad-xs px-pad-sm py-pad-xs rounded-full mb-pad-xs ${
              isOpen ? 'bg-secondary text-on-secondary' : 'bg-error text-on-error'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {isOpen ? 'check_circle' : 'cancel'}
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                {isOpen ? 'गेट खुला है • Gate Open' : 'मंडी बंद है • Closed'}
              </span>
            </div>
            <h3 className="font-display-lg-mobile text-display-lg-mobile font-extrabold leading-none tracking-tight">
              {isOpen ? 'आज खुला है' : 'आज बंद है'}
            </h3>
            <p className="font-headline-sm text-headline-sm opacity-90 leading-tight mt-1">
              {isOpen ? 'OPEN TODAY' : 'CLOSED TODAY'}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
            isOpen ? 'bg-secondary text-on-secondary' : 'bg-error text-on-error'
          }`}>
            <span className="material-symbols-outlined text-[44px]">
              {isOpen ? 'verified' : 'block'}
            </span>
          </div>
        </div>

        {/* Operating Hours & Gate details */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-sm rounded-xl p-pad-sm flex flex-col gap-pad-xs z-10 text-on-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-pad-xs">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px] text-secondary">schedule</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant block">समय / Timing</span>
                <span className="font-headline-sm text-headline-sm text-on-surface leading-none">{timing}</span>
              </div>
            </div>
            <div className="bg-surface-container-high px-pad-sm py-pad-xs rounded-lg text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant block">प्रवेश द्वार</span>
              <span className="font-label-lg text-label-lg text-primary font-bold">गेट नं. {gateNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-pad-xs pt-pad-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px] text-secondary">location_on</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
              {scheduleData?.name || 'APMC अनाज मंडी (Kota Mandi)'}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Accepted Today Card */}
      <div className="w-full bg-surface-container rounded-xl p-pad-md flex flex-col gap-pad-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-pad-xs">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="font-label-md text-label-md text-on-surface uppercase font-bold">आज की मुख्य आवक • Crop Inflow</span>
          </div>
          <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-pad-xs py-0.5 rounded-full font-bold">
            Grade A Verified
          </span>
        </div>
        <div className="flex items-center gap-pad-md">
          <div className="w-20 h-20 rounded-xl bg-primary-fixed flex items-center justify-center text-primary text-3xl shadow-inner">
            🌾
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">स्वीकृत फसल / Accepted</span>
            <h4 className="font-headline-md text-headline-md text-on-surface truncate">{todayCrop}</h4>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{cropQuality}</span>
          </div>
        </div>

        {/* Government MSP Highlight Box */}
        <div className="w-full bg-secondary-container rounded-xl p-pad-sm flex items-center justify-between">
          <div className="flex items-center gap-pad-xs">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
              <span className="material-symbols-outlined text-[24px]">currency_rupee</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-secondary-container block uppercase leading-tight font-semibold">
                सरकारी समर्थन मूल्य (MSP)
              </span>
              <span className="font-headline-md text-headline-md text-on-secondary-container font-black leading-tight">
                ₹{msp.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="bg-surface-container-lowest/80 px-pad-sm py-pad-xs rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">प्रति क्विंटल</span>
          </div>
        </div>
      </div>

      {/* Upcoming Days */}
      <div className="flex flex-col gap-pad-xs">
        <h4 className="font-headline-sm text-headline-sm text-on-surface px-pad-xs">आगामी तारीखें / Upcoming Days</h4>
        <div className="w-full bg-surface-container-low rounded-xl p-pad-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-pad-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center text-on-surface">
              <span className="font-label-sm text-label-sm uppercase leading-none font-bold">कल</span>
              <span className="font-label-md text-label-md leading-none font-bold">Sat</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">सरसों / Mustard</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Gate 1 & Gate 3 • 8:00 AM – 4:30 PM</span>
            </div>
          </div>
          <div className="bg-secondary-fixed text-on-secondary-fixed px-pad-sm py-pad-xs rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm font-bold uppercase">खुला • OPEN</span>
          </div>
        </div>
        <div className="w-full bg-surface-container-low rounded-xl p-pad-sm flex items-center justify-between opacity-80 shadow-sm">
          <div className="flex items-center gap-pad-sm">
            <div className="w-12 h-12 rounded-xl bg-error-container/40 flex flex-col items-center justify-center text-on-surface">
              <span className="font-label-sm text-label-sm uppercase leading-none font-bold">परसों</span>
              <span className="font-label-md text-label-md leading-none font-bold">Sun</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">साप्ताहिक अवकाश</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Weekly APMC Cleaning</span>
            </div>
          </div>
          <div className="bg-error-container text-on-error-container px-pad-sm py-pad-xs rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">block</span>
            <span className="font-label-sm text-label-sm font-bold uppercase">बंद • CLOSED</span>
          </div>
        </div>
      </div>

      {/* Book Slot CTA */}
      <div className="w-full pt-pad-xs">
        <button
          onClick={handleBookSlot}
          className={`w-full h-16 rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-pad-sm shadow-md transition-all active:scale-[0.99] font-bold ${
            bookingStatus === 'success' ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/90 text-on-secondary'
          }`}
        >
          {bookingStatus === 'loading' ? (
            <>
              <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
              <span>स्लॉट बुक हो रहा है...</span>
            </>
          ) : bookingStatus === 'success' ? (
            <>
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
              <span>स्लॉट सफलतापूर्वक आरक्षित!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[32px] text-secondary-fixed">confirmation_number</span>
              <span>स्लॉट बुक करें • Book Today's Slot</span>
            </>
          )}
        </button>
        <p className="font-label-sm text-label-sm text-center text-on-surface-variant pt-2">
          ⚡ टोकन कटने में केवल 30 सेकंड लगेंगे
        </p>
      </div>

    </div>
  );
}

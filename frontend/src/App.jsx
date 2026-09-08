import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import NavBar from './components/NavBar';
import SathiWidget from './components/SathiWidget';
import LanguageModal from './components/LanguageModal';
import QrModal from './components/QrModal';
import AdvanceModal from './components/AdvanceModal';

import FarmerHome from './pages/FarmerHome';
import Schedule from './pages/Schedule';
import Queue from './pages/Queue';
import Payment from './pages/Payment';
import FinancialAid from './pages/FinancialAid';
import Marketplace from './pages/Marketplace';
import DesktopPortal from './components/DesktopPortal';

import { getFarmerHome, getSchedule, getQueue, getPayment, subscribeToStream } from './api';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'desktop';
    }
    return 'mobile';
  });

  const [farmerData, setFarmerData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [isAidOpen, setIsAidOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      const [f, s, q, p] = await Promise.all([
        getFarmerHome('F1').catch(() => null),
        getSchedule('C1').catch(() => null),
        getQueue('F1').catch(() => null),
        getPayment('F1').catch(() => null)
      ]);
      if (f) setFarmerData(f);
      if (s) setScheduleData(s);
      if (q) setQueueData(q);
      if (p) setPaymentData(p);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();

    const handleResize = () => {
      // Auto-adjust if user hasn't explicitly locked mode, or let them switch
    };
    window.addEventListener('resize', handleResize);

    // Subscribe to live SSE stream
    const unsubscribe = subscribeToStream(() => {
      fetchAllData();
    });

    // Backup polling
    const interval = setInterval(fetchAllData, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // 1. DESKTOP PORTAL VIEW (For Desktop Screens or Explicit Desktop Mode)
  if (viewMode === 'desktop') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] relative">
        <DesktopPortal
          farmerData={farmerData}
          scheduleData={scheduleData}
          queueData={queueData}
          paymentData={paymentData}
          onSwitchToMobile={() => setViewMode('mobile')}
          onOpenAid={() => setIsAidOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenQr={() => setIsQrOpen(true)}
          onOpenAdvance={() => setIsAdvanceOpen(true)}
          onRefresh={fetchAllData}
        />

        {/* Global Sathi Floating Widget */}
        <SathiWidget activeTab="desktop" farmerData={farmerData} />

        {/* Global Modals */}
        <LanguageModal />

        <QrModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          farmerData={farmerData || queueData}
        />

        <AdvanceModal
          isOpen={isAdvanceOpen}
          onClose={() => setIsAdvanceOpen(false)}
          farmerData={farmerData}
          paymentData={paymentData}
          onAdvanceSuccess={() => fetchAllData()}
        />

        <FinancialAid
          isOpen={isAidOpen}
          onClose={() => setIsAidOpen(false)}
        />

        <Marketplace
          isOpen={isMarketOpen}
          onClose={() => setIsMarketOpen(false)}
        />
      </div>
    );
  }

  // 2. MOBILE PWA VIEW (For Mobile Screens or Handheld Mode)
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative">
      <Header
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onSwitchToDesktop={() => setViewMode('desktop')}
      />

      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen max-w-lg mx-auto">
        {activeTab === 'home' && (
          <FarmerHome
            farmerData={farmerData}
            onNavigate={setActiveTab}
            onOpenAid={() => setIsAidOpen(true)}
            onOpenMarket={() => setIsMarketOpen(true)}
          />
        )}

        {activeTab === 'schedule' && (
          <Schedule
            scheduleData={scheduleData}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'queue' && (
          <Queue
            queueData={queueData}
            onNavigate={setActiveTab}
            onOpenQr={() => setIsQrOpen(true)}
          />
        )}

        {activeTab === 'payment' && (
          <Payment
            paymentData={paymentData}
            onNavigate={setActiveTab}
            onOpenAdvance={() => setIsAdvanceOpen(true)}
          />
        )}

        {activeTab === 'staff' && (
          <div className="w-full">
            <StaffPortal onBackToFarmer={() => setActiveTab('home')} />
          </div>
        )}
      </main>

      <SathiWidget activeTab={activeTab} farmerData={farmerData} />
      <NavBar activeTab={activeTab} onNavigate={setActiveTab} />

      {/* Global Modals */}
      <LanguageModal />

      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        farmerData={farmerData || queueData}
      />

      <AdvanceModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        farmerData={farmerData}
        paymentData={paymentData}
        onAdvanceSuccess={() => fetchAllData()}
      />

      <FinancialAid
        isOpen={isAidOpen}
        onClose={() => setIsAidOpen(false)}
      />

      <Marketplace
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

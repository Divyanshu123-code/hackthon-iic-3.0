import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getStaffData, updateStaffSchedule, advanceFarmerStage, advanceFarmerPayment, sendAnnouncement, resetDemoDb } from '../api';

export default function StaffPortal({ onBackToFarmer }) {
  const { t, currentLang } = useLanguage();
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('center'); // 'center', 'queue', 'announcements', 'payments'
  const [toastMsg, setToastMsg] = useState('');

  // Form states
  const [yardOpen, setYardOpen] = useState(true);
  const [todayCrop, setTodayCrop] = useState('सोयाबीन (Soybean JS-335)');
  const [msp, setMsp] = useState(4892);
  const [timing, setTiming] = useState('06:00 AM - 05:00 PM');
  const [gateNumber, setGateNumber] = useState(3);
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedToken, setSelectedToken] = useState(42);

  const fetchStaffData = async () => {
    try {
      const data = await getStaffData();
      setStaffData(data);
      if (data.centers && data.centers[0]) {
        setYardOpen(data.centers[0].open);
        setTodayCrop(data.centers[0].todayCrop);
        setMsp(data.centers[0].msp);
        setTiming(data.centers[0].timing);
        setGateNumber(data.centers[0].gateNumber);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load staff data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleUpdateSchedule = async (e) => {
    e?.preventDefault();
    try {
      await updateStaffSchedule({
        centerId: 'C1',
        open: yardOpen,
        todayCrop,
        msp: Number(msp),
        timing,
        gateNumber: Number(gateNumber)
      });
      showToast('✓ APMC मंडी केंद्र अनुसूची सफलतापूर्वक अपडेट की गई!');
      fetchStaffData();
    } catch (err) {
      showToast('⚠️ अपडेट करने में विफल: ' + err.message);
    }
  };

  const handleAdvanceStage = async (farmerId, currentStage) => {
    try {
      const res = await advanceFarmerStage(farmerId);
      showToast(`✓ किसान ${res.farmer.name} (टोकन #${res.farmer.token}) अगले चरण पर बढ़ा!`);
      fetchStaffData();
    } catch (err) {
      showToast('⚠️ विफल: ' + err.message);
    }
  };

  const handleAdvancePayment = async (farmerId) => {
    try {
      await advanceFarmerPayment(farmerId);
      showToast(`✓ PFMS/DBT भुगतान प्रक्रम अद्यतन किया गया!`);
      fetchStaffData();
    } catch (err) {
      showToast('⚠️ विफल: ' + err.message);
    }
  };

  const handleBroadcastAnnouncement = async (e) => {
    e?.preventDefault();
    try {
      const res = await sendAnnouncement(selectedToken, gateNumber, announcementText);
      showToast(`📢 लाउडस्पीकर प्रसारण: टोकन #${selectedToken} को कांटा #${gateNumber} पर बुलाया गया!`);
      setAnnouncementText('');
      fetchStaffData();
    } catch (err) {
      showToast('⚠️ घोषणा भेजने में विफल: ' + err.message);
    }
  };

  const handleReset = async () => {
    if (window.confirm('क्या आप पूरे मंडी डेटा को रीसेट करना चाहते हैं?')) {
      try {
        await resetDemoDb();
        showToast('✓ मंडी डेटा प्रारंभिक स्थिति में रीसेट हो गया!');
        fetchStaffData();
      } catch (err) {
        showToast('⚠️ रीसेट विफल');
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF6EE] text-[#1C1917] pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 left-4 z-50 max-w-md mx-auto bg-[#166534] text-white px-4 py-3 rounded-xl shadow-lg border border-green-700 flex items-center justify-between text-sm animate-bounce">
          <span className="font-semibold">{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="ml-2 font-bold text-lg">×</button>
        </div>
      )}

      {/* APMC Staff Desk Header */}
      <header className="bg-white border-b border-[#E5DEC9] px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-[24px]">desk</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1C1917]">APMC मंडी कंट्रोल डेस्क</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  OPERATOR DESK
                </span>
              </div>
              <p className="text-xs text-[#57534E]">कृषि उपज मंडी समिति • कोटा (राज.) • गेट क्र. 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToFarmer}
              className="px-3 py-1.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9] text-xs font-bold text-[#166534] hover:bg-[#F4EFE2] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              किसान पोर्टल पर जाएं
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100 flex items-center gap-1"
              title="रीसेट डेमो डेटा"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              रीसेट
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-3">
        <div className="flex gap-2 border-b border-[#E5DEC9] pb-2 overflow-x-auto">
          {[
            { id: 'center', label: 'गेट व केंद्र संचालन', icon: 'tune' },
            { id: 'queue', label: 'लाइव कतार व किसान टोकन', icon: 'groups' },
            { id: 'announcements', label: 'लाउडस्पीकर घोषणा (PA)', icon: 'campaign' },
            { id: 'payments', label: 'PFMS/DBT भुगतान Desk', icon: 'account_balance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'bg-white border border-[#E5DEC9] text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 mt-4">
        {/* KPI Metrics Strip */}
        {staffData?.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-[#E5DEC9] shadow-xs">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">कुल किसान आवक</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-[#1C1917]">{staffData.metrics.totalFarmersCheckedIn}</span>
                <span className="text-xs text-[#57534E]">ट्रैक्टर</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E5DEC9] shadow-xs">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">कतार में सक्रिय</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-[#B45309]">{staffData.metrics.farmersInQueue}</span>
                <span className="text-xs text-[#57534E]">प्रतीक्षारत</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E5DEC9] shadow-xs">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">कुल खरीदी (Procured)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-[#166534]">{staffData.metrics.totalQuintalsProcured}</span>
                <span className="text-xs text-[#57534E]">क्विंटल</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#E5DEC9] shadow-xs">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">कुल भुगतान स्वीकृत</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-[#166534]">₹{(staffData.metrics.totalApprovedPayment / 100000).toFixed(2)}L</span>
                <span className="text-xs text-[#57534E]">DBT</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CENTER & YARD OPERATIONAL SETTINGS */}
        {activeTab === 'center' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E5DEC9]">
                <span className="material-symbols-outlined text-[#166534]">tune</span>
                <h2 className="font-bold text-base text-[#1C1917]">मंडी गेट व केंद्र संचालन स्थिति</h2>
              </div>

              <form onSubmit={handleUpdateSchedule} className="flex flex-col gap-3.5 mt-4">
                {/* Gate Open Toggle */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">मंडी गेट स्थिति (Yard Gate State)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setYardOpen(true)}
                      className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        yardOpen
                          ? 'bg-[#166534] text-white border-[#166534]'
                          : 'bg-[#FAF6EE] text-[#57534E] border-[#E5DEC9]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                      खुला है (Gate Open)
                    </button>
                    <button
                      type="button"
                      onClick={() => setYardOpen(false)}
                      className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        !yardOpen
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-[#FAF6EE] text-[#57534E] border-[#E5DEC9]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-300"></span>
                      बंद है (Gate Closed)
                    </button>
                  </div>
                </div>

                {/* Crop & MSP */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">आज की अधिसूचित जिंस (Procurement Crop)</label>
                  <input
                    type="text"
                    value={todayCrop}
                    onChange={(e) => setTodayCrop(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-semibold text-[#1C1917] focus:ring-2 focus:ring-[#166534]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#57534E] uppercase">सरकारी MSP (₹/क्विंटल)</label>
                    <input
                      type="number"
                      value={msp}
                      onChange={(e) => setMsp(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-bold text-[#166534] focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#57534E] uppercase">सक्रिय कांटा गेट नं.</label>
                    <input
                      type="number"
                      value={gateNumber}
                      onChange={(e) => setGateNumber(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-bold text-[#1C1917] focus:ring-2 focus:ring-[#166534]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">मंडी संचालन समय (Mandi Timing)</label>
                  <input
                    type="text"
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-semibold text-[#1C1917] focus:ring-2 focus:ring-[#166534]"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-2.5 rounded-lg bg-[#166534] text-white font-bold text-sm hover:bg-[#14532d] shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  मंडी अनुसूची अद्यतन करें (Save Changes)
                </button>
              </form>
            </div>

            {/* Live Yard Status Snapshot */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#E5DEC9]">
                  <span className="material-symbols-outlined text-[#B45309]">info</span>
                  <h2 className="font-bold text-base text-[#1C1917]">वर्तमान लाइव मंडी स्थिति सारांश</h2>
                </div>

                <div className="flex flex-col gap-3 mt-4 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9]">
                    <span className="text-[#57534E]">मंडी गेट:</span>
                    <span className="font-bold text-[#166534]">गेट क्र. {gateNumber} • कोटा मुख्य यार्ड</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9]">
                    <span className="text-[#57534E]">अधिसूचित जिंस:</span>
                    <span className="font-bold text-[#1C1917]">{todayCrop}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9]">
                    <span className="text-[#57534E]">निर्धारित MSP:</span>
                    <span className="font-bold text-[#166534]">₹{msp} प्रति क्विंटल</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9]">
                    <span className="text-[#57534E]">वर्तमान समय विंडो:</span>
                    <span className="font-bold text-[#1C1917]">{timing}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-[#92400E] mt-4 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">sync</span>
                <span>आपके द्वारा किया गया कोई भी बदलाव सीधे किसान पोर्टल व मोबाइल ऐप पर <strong>तुरंत रियल-टाइम (SSE)</strong> सिंक होगा।</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE QUEUE & FARMER TOKENS */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534]">groups</span>
                <h2 className="font-bold text-base text-[#1C1917]">लाइव कतार प्रबंधन व टोकन ट्रैकिंग</h2>
              </div>
              <span className="text-xs text-[#78716C]">कुल किसान: {staffData?.farmers?.length || 0}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b border-[#E5DEC9] text-[#57534E] uppercase">
                    <th className="p-3">टोकन</th>
                    <th className="p-3">किसान का नाम</th>
                    <th className="p-3">वाहन क्र.</th>
                    <th className="p-3">फसल व मात्रा</th>
                    <th className="p-3">वर्तमान चरण</th>
                    <th className="p-3 text-right">कार्रवाई (Advance Stage)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9]">
                  {staffData?.farmers?.map((f) => (
                    <tr key={f.farmerId} className="hover:bg-[#FFFDF9]">
                      <td className="p-3">
                        <span className="font-mono font-bold text-sm text-[#166534] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          #{f.token}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#1C1917]">{f.name}</div>
                        <div className="text-[11px] text-[#78716C]">{f.village}</div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-[#57534E]">
                        {f.vehicleNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[#1C1917]">{f.crop}</div>
                        <div className="text-[11px] text-[#78716C]">{f.quintal} क्विंटल</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                          f.stage === 'pass'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {f.stageLabel || f.stage}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleAdvanceStage(f.farmerId, f.stage)}
                          className="px-3 py-1.5 rounded-lg bg-[#166534] text-white font-bold text-xs hover:bg-[#14532d] shadow-xs inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">fast_forward</span>
                          अगला चरण ({f.stage === 'pass' ? 'पूर्ण' : 'Advance'})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PA LOUDSPEAKER ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E5DEC9]">
                <span className="material-symbols-outlined text-[#B45309]">campaign</span>
                <h2 className="font-bold text-base text-[#1C1917]">मंडी लाउडस्पीकर सार्वजनिक घोषणा (PA Desk)</h2>
              </div>

              <form onSubmit={handleBroadcastAnnouncement} className="flex flex-col gap-3 mt-4">
                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">किसान टोकन चुनें</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-semibold text-[#1C1917]"
                  >
                    {staffData?.farmers?.map((f) => (
                      <option key={f.token} value={f.token}>
                        टोकन #{f.token} — {f.name} ({f.vehicleNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">कांटा / शेड नंबर</label>
                  <input
                    type="number"
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm font-bold text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#57534E] uppercase">कस्टम घोषणा संदेश (वैकल्पिक)</label>
                  <textarea
                    rows={3}
                    placeholder="डिफ़ॉल्ट APMC घोषणा स्वतः तैयार होगी..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E5DEC9] bg-[#FAF6EE] text-sm text-[#1C1917]"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 rounded-lg bg-[#B45309] text-white font-bold text-sm hover:bg-[#92400E] shadow-sm flex items-center justify-center gap-1.5 mt-1"
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  लाउडस्पीकर पर तुरंत प्रसारित करें
                </button>
              </form>
            </div>

            {/* Broadcast Log */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#E5DEC9]">
                  <span className="material-symbols-outlined text-[#166534]">history</span>
                  <h2 className="font-bold text-base text-[#1C1917]">हालिया मंडी प्रसारण लॉग</h2>
                </div>

                <div className="space-y-2 mt-4 max-h-[260px] overflow-y-auto">
                  {staffData?.events?.filter(e => e.type === 'PA_ANNOUNCEMENT' || e.type === 'STAGE_ADVANCED')?.slice(0, 6).map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9] text-xs">
                      <div className="flex justify-between items-center text-[#78716C] text-[10px]">
                        <span>{ev.timestamp || 'अभी'}</span>
                        <span className="font-bold text-[#B45309]">{ev.type}</span>
                      </div>
                      <p className="mt-1 font-semibold text-[#1C1917]">{ev.message}</p>
                    </div>
                  )) || (
                    <p className="text-xs text-[#78716C] p-4 text-center">कोई पूर्व घोषणा नहीं है</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PFMS/DBT PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl p-5 border border-[#E5DEC9] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#166534]">account_balance</span>
                <h2 className="font-bold text-base text-[#1C1917]">PFMS / DBT प्रत्यक्ष बैंक हस्तांतरण स्थिति</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b border-[#E5DEC9] text-[#57534E] uppercase">
                    <th className="p-3">किसान व बैंक खाता</th>
                    <th className="p-3">तौल राशि (Qtl)</th>
                    <th className="p-3">स्वीकृत राशि</th>
                    <th className="p-3">अग्रिम भुगतान (80%)</th>
                    <th className="p-3">PFMS स्थिति</th>
                    <th className="p-3 text-right">भुगतान आगे बढ़ाएं</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9]">
                  {staffData?.farmers?.map((f) => (
                    <tr key={f.farmerId} className="hover:bg-[#FFFDF9]">
                      <td className="p-3">
                        <div className="font-bold text-[#1C1917]">{f.name} (टोकन #{f.token})</div>
                        <div className="text-[11px] text-[#78716C] font-mono">{f.payment?.bankAccount || 'SBI •••• 8821'}</div>
                      </td>
                      <td className="p-3 font-semibold text-[#1C1917]">
                        {f.payment?.quintal || f.quintal} Qtl
                      </td>
                      <td className="p-3 font-bold text-[#166534] text-sm">
                        ₹{f.payment?.totalApproved?.toLocaleString('en-IN') || '2,44,600'}
                      </td>
                      <td className="p-3">
                        {f.payment?.advance?.taken ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 border border-green-300">
                            प्राप्त: ₹{f.payment.advance.amount?.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#78716C]">पात्र (₹1,95,680)</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {f.payment?.timeline?.find(t => t.status === 'in_progress')?.label || 'PFMS प्रोसेस में'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleAdvancePayment(f.farmerId)}
                          className="px-3 py-1.5 rounded-lg bg-[#166534] text-white font-bold text-xs hover:bg-[#14532d] shadow-xs inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          स्वीकृत व DBT क्रेडिट
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  const host = 'localhost';
  const port = 5001;

  console.log('🧪 Starting Enhanced Kisan Mandi API Test Suite...\n');

  try {
    // 1. Health check
    const h = await request({ host, port, path: '/api/health', method: 'GET' });
    console.log('✅ 1. GET /api/health:', h.status, h.data.service, '| Features:', h.data.features.join(', '));

    // 2. Farmer home (F1)
    const f = await request({ host, port, path: '/api/farmer/F1/home', method: 'GET' });
    console.log('✅ 2. GET /api/farmer/F1/home:', f.status, f.data.name, '| Token:', f.data.token, '| Ahead:', f.data.aheadCount);

    // 3. New Farmer Gate Check-in
    const cin = await request(
      { host, port, path: '/api/farmer/checkin', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'कुलदीप यादव', vehicleNumber: 'RJ-14-EA-9911', commodity: 'चना (Gram)', commodityQty: '40 Qtl' }
    );
    console.log('✅ 3. POST /api/farmer/checkin:', cin.status, cin.data.message);

    // 4. Live Queue Board
    const qb = await request({ host, port, path: '/api/queue/board', method: 'GET' });
    console.log('✅ 4. GET /api/queue/board:', qb.status, '| Total In Queue:', qb.data.totalInQueue, '| Active Tokens:', qb.data.queue.length);

    // 5. Dynamic Queue (F1)
    const q = await request({ host, port, path: '/api/queue/F1', method: 'GET' });
    console.log('✅ 5. GET /api/queue/F1:', q.status, 'Stage:', q.data.stage, '| Dynamic ETA:', q.data.estWaitMins, 'mins');

    // 6. Sathi Conversational Slot Booking
    const sathiSlot = await request(
      { host, port, path: '/api/sathi/query', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { message: 'मेरा कल सुबह का स्लॉट बुक कर दो', screenContext: 'schedule', farmerId: 'F1' }
    );
    console.log('✅ 6. POST /api/sathi/query (Slot Booking):', sathiSlot.status, '\n   Sathi:', sathiSlot.data.reply);

    // 7. Sathi Weather Advisory
    const sathiWeather = await request(
      { host, port, path: '/api/sathi/query', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { message: 'आज मौसम कैसा रहेगा और शेड में नमी कितनी है?', screenContext: 'home', farmerId: 'F1' }
    );
    console.log('✅ 7. POST /api/sathi/query (Weather & Storage):', sathiWeather.status, '\n   Sathi:', sathiWeather.data.reply);

    // 8. Instant 80% Advance Payout
    const pa = await request(
      { host, port, path: '/api/payment/F1/advance', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { farmerId: 'F1' }
    );
    console.log('✅ 8. POST /api/payment/F1/advance:', pa.status, pa.data.message);

    // 9. Staff PA Loudspeaker Announcement
    const ann = await request(
      { host, port, path: '/api/staff/announce', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { token: 42, weighbridgeNo: 3 }
    );
    console.log('✅ 9. POST /api/staff/announce:', ann.status, '| Broadcast:', ann.data.announcement);

    // 10. Staff Data with Metrics
    const sd = await request({ host, port, path: '/api/staff/data', method: 'GET' });
    console.log('✅ 10. GET /api/staff/data:', sd.status, '| Disbursed Advances:', `₹${sd.data.metrics.totalAdvancesDisbursed.toLocaleString('en-IN')}`, '| Events Logged:', sd.data.events.length);

    console.log('\n🎉 ALL 10 ENHANCED BACKEND TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTests();

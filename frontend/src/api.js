const API_BASE = '/api';

export async function getFarmerHome(farmerId = 'F1') {
  const res = await fetch(`${API_BASE}/farmer/${farmerId}/home`);
  if (!res.ok) throw new Error('Failed to fetch farmer home data');
  return res.json();
}

export async function getSchedule(centerId = 'C1') {
  const res = await fetch(`${API_BASE}/schedule/${centerId}`);
  if (!res.ok) throw new Error('Failed to fetch schedule data');
  return res.json();
}

export async function bookSlot(centerId = 'C1', farmerId = 'F1', slotId = 'morning') {
  const res = await fetch(`${API_BASE}/schedule/${centerId}/book-slot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId, slotId })
  });
  if (!res.ok) throw new Error('Failed to book slot');
  return res.json();
}

export async function getQueue(farmerId = 'F1') {
  const res = await fetch(`${API_BASE}/queue/${farmerId}`);
  if (!res.ok) throw new Error('Failed to fetch queue data');
  return res.json();
}

export async function getPayment(farmerId = 'F1') {
  const res = await fetch(`${API_BASE}/payment/${farmerId}`);
  if (!res.ok) throw new Error('Failed to fetch payment data');
  return res.json();
}

export async function requestAdvance(farmerId = 'F1') {
  const res = await fetch(`${API_BASE}/payment/${farmerId}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId })
  });
  if (!res.ok) throw new Error('Failed to request advance');
  return res.json();
}

export async function askSathi({
  message,
  screenContext = 'home',
  farmerId = 'F1',
  conversation = [],
  customApiKey = '',
  customProvider = '',
  customBaseUrl = '',
  language = 'hi'
}) {
  const res = await fetch(`${API_BASE}/sathi/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      screenContext,
      farmerId,
      conversation,
      customApiKey,
      customProvider,
      customBaseUrl,
      language
    })
  });
  if (!res.ok) throw new Error('Failed to query Sathi assistant');
  return res.json();
}

export async function getStaffData() {
  const res = await fetch(`${API_BASE}/staff/data`);
  if (!res.ok) throw new Error('Failed to fetch staff portal data');
  return res.json();
}

export async function updateStaffSchedule(schedulePayload) {
  const res = await fetch(`${API_BASE}/staff/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedulePayload)
  });
  if (!res.ok) throw new Error('Failed to update mandi schedule');
  return res.json();
}

export async function advanceFarmerStage(farmerId = 'F1', stage) {
  const res = await fetch(`${API_BASE}/staff/advance-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId, stage })
  });
  if (!res.ok) throw new Error('Failed to advance farmer stage');
  return res.json();
}

export async function advanceFarmerPayment(farmerId = 'F1', stage) {
  const res = await fetch(`${API_BASE}/staff/advance-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmerId, stage })
  });
  if (!res.ok) throw new Error('Failed to advance farmer payment');
  return res.json();
}

export async function sendAnnouncement(token, weighbridgeNo, customText) {
  const res = await fetch(`${API_BASE}/staff/announce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, weighbridgeNo, customText })
  });
  if (!res.ok) throw new Error('Failed to broadcast announcement');
  return res.json();
}

export async function resetDemoDb() {
  const res = await fetch(`${API_BASE}/staff/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset demo database');
  return res.json();
}

export function subscribeToStream(onMessage) {
  if (typeof window !== 'undefined' && !!window.EventSource) {
    const eventSource = new EventSource(`${API_BASE}/stream`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type !== 'CONNECTED') {
          onMessage(parsed);
        }
      } catch (e) {
        onMessage({ type: 'UPDATE' });
      }
    };
    return () => eventSource.close();
  }
  return () => {};
}

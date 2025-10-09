const API_URL = 'https://memorify-backend-ik4b.onrender.com/api';
console.log('🔍 Metrics API_URL:', API_URL);

async function fetchSummary() {
  const res = await fetch(`${API_URL}/metrics/summary`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch' }));
    throw new Error(err.message || 'Failed to fetch metrics');
  }
  return res.json();
}

export default { fetchSummary };



// Vercel API route to proxy auth requests to Render backend
export default async function handler(req, res) {
  const { auth } = req.query;
  const backendUrl = 'https://memorify-backend-ik4b.onrender.com/api/auth';
  
  try {
    const response = await fetch(`${backendUrl}/${auth.join('/')}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Auth proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

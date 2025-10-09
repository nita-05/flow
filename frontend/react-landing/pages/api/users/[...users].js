// Vercel API route to proxy user requests to Render backend
export default async function handler(req, res) {
  const { users } = req.query;
  const backendUrl = 'https://memorify-backend-ik4b.onrender.com/api/users';
  
  try {
    const response = await fetch(`${backendUrl}/${users.join('/')}`, {
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
    console.error('Users proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

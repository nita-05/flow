// Vercel API route to proxy story requests to Render backend
export default async function handler(req, res) {
  const { stories } = req.query;
  const backendUrl = 'https://memorify-backend-ik4b.onrender.com/api/stories';
  
  try {
    const response = await fetch(`${backendUrl}/${stories.join('/')}`, {
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
    console.error('Stories proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

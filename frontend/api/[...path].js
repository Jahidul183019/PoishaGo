// frontend/api/[...path].js

export default async function handler(req, res) {
  // BACKEND_URL lives only in Vercel server — never in browser
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return res.status(500).json({ detail: 'Backend not configured.' });
  }

  // Build the target URL — strip /api prefix since we re-add via backendUrl
  const path = req.url; // e.g. /api/contacts
  const targetUrl = `${backendUrl}${path}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward the JWT token from the original request
        ...(req.headers.authorization && {
          'Authorization': req.headers.authorization,
        }),
      },
    };

    // Attach body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // Forward status + response back to browser
    res.status(response.status).json(data);

  } catch (err) {
    res.status(502).json({ detail: 'Proxy error: ' + err.message });
  }
}

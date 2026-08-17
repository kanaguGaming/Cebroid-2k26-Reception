// api/attendance.js
// ─────────────────────────────────────────────────────────────────
// Vercel serverless proxy — forwards requests to Google Apps Script
// and returns the JSON result to the browser.
//
// This bypasses the CORS restriction that blocks direct fetch()
// calls from the browser to Google Apps Script URLs.
//
// The frontend calls:  /api/attendance?action=verify&ticket=Cebroid-004
// This function calls: GAS_URL?action=verify&ticket=Cebroid-004
// And returns the JSON response to the browser.
// ─────────────────────────────────────────────────────────────────

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyX1vneGsZgcu9_hfTHDJfZw2qsJWjFfO48Qv1Ma7OdZrsSgr85wegR7YBeB43plUwwYQ/exec';

export default async function handler(req, res) {

  // Allow cross-origin requests from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build the GAS request URL with all query parameters passed through
  const { action, ticket, row } = req.query;

  const params = new URLSearchParams();
  if (action) params.set('action', action);
  if (ticket) params.set('ticket', ticket);
  if (row)    params.set('row',    row);

  const targetUrl = GAS_URL + '?' + params.toString();

  try {

    const gasResponse = await fetch(targetUrl, { redirect: 'follow' });

    if (!gasResponse.ok) {
      return res.status(502).json({
        status:  'error',
        message: 'GAS returned HTTP ' + gasResponse.status
      });
    }

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (error) {

    return res.status(500).json({
      status:  'error',
      message: 'Proxy error: ' + error.message
    });

  }
}

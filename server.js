const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_SITE = 'https://movies.do';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to rewrite URLs in HTML content
function rewriteUrls(html) {
  let rewritten = html;
  
  // Rewrite absolute URLs
  rewritten = rewritten.replace(/https?:\/\/movies\.do(\/)?/g, '/proxy$1');
  rewritten = rewritten.replace(/https?:\/\/www\.movies\.do(\/)?/g, '/proxy$1');
  
  // Rewrite relative URLs (href, src, action, etc.)
  rewritten = rewritten.replace(/(href|src|action|data-src|data-href)=["'](\/[^"']*)["']/g, '$1="/proxy$2"');
  
  // Rewrite URLs in CSS (url())
  rewritten = rewritten.replace(/url\(["']?(\/[^"')]*)["']?\)/g, 'url("/proxy$1")');
  
  // Rewrite URLs in JavaScript fetch/XMLHttpRequest patterns
  rewritten = rewritten.replace(/(fetch|XMLHttpRequest|axios\.(get|post))\(["'](\/[^"']*)["']/g, '$1("/proxy$3"');
  
  // Add base tag if not present to help with relative URLs
  if (!rewritten.includes('<base')) {
    rewritten = rewritten.replace(/<head[^>]*>/i, '$&<base href="/proxy/">');
  }
  
  return rewritten;
}

// Main proxy endpoint
app.use('/proxy', async (req, res) => {
  try {
    const targetPath = req.path === '/' ? '' : req.path;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `${TARGET_SITE}${targetPath}${queryString}`;
    
    console.log(`Proxying: ${req.method} ${targetUrl}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': TARGET_SITE,
        'Origin': TARGET_SITE,
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {}),
      },
      data: req.body,
      responseType: 'arraybuffer',
      maxRedirects: 5,
      validateStatus: () => true, // Accept all status codes
    });

    // Set response headers
    const contentType = response.headers['content-type'] || '';
    
    // Copy relevant headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle HTML content - rewrite URLs
    if (contentType.includes('text/html')) {
      const html = Buffer.from(response.data).toString('utf-8');
      const rewrittenHtml = rewriteUrls(html);
      res.setHeader('Content-Length', Buffer.byteLength(rewrittenHtml));
      res.status(response.status).send(rewrittenHtml);
    } else if (contentType.includes('text/css') || contentType.includes('application/javascript')) {
      // Rewrite URLs in CSS and JS files too
      const content = Buffer.from(response.data).toString('utf-8');
      const rewritten = rewriteUrls(content);
      res.setHeader('Content-Length', Buffer.byteLength(rewritten));
      res.status(response.status).send(rewritten);
    } else {
      // For binary content (images, videos, etc.), stream as-is
      res.status(response.status);
      res.send(Buffer.from(response.data));
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to proxy request', message: error.message });
  }
});

// Handle OPTIONS requests for CORS
app.options('/proxy/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const https = require('https');

function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' filetype:png')}`;
  
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Got response length:', data.length);
      // extremely basic regex to find images
      const matches = data.match(/<img[^>]+src="([^">]+)"/g);
      console.log(matches ? matches.slice(0, 5) : 'No images found');
    });
  }).on('error', err => console.error(err));
}

searchDuckDuckGo('Moro chocolate bar');

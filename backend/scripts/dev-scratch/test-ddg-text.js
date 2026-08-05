const { search, SafeSearchType } = require('duck-duck-scrape');

async function test() {
  try {
    const searchResults = await search('شوكولاتة مورو', {
      safeSearch: SafeSearchType.STRICT,
      locale: 'ar-eg' // Egyptian Arabic locale
    });
    console.log(searchResults.results.slice(0, 3));
  } catch (err) {
    console.error(err);
  }
}

test();

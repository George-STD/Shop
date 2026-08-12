const asyncHandler = require('../../utils/asyncHandler');
const Product = require('../../models/Product');
const { escapeRegex, fetchWithTimeout } = require('../../utils/helpers');

/**
 * Fallback web search using native fetch
 */
async function searchWebFallback(query) {
  try {
    const res = await fetchWithTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
      5000
    );
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<a class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = html.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
      if (titleMatch) {
        let name = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        name = name.replace(query, '').replace(/\|.*/, '').replace(/-.*/, '').trim() || name;
        const description = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (name && name.length > 2) {
          return { name, description };
        }
      }
    }
  } catch (err) {
    console.error('Web search fallback error:', err.message);
  }
  return null;
}

/**
 * Fallback image search using native fetch
 */
async function searchImageFallback(query) {
  try {
    const res = await fetchWithTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' image')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
      5000
    );
    if (res.ok) {
      const html = await res.text();
      const imgMatches = [...html.matchAll(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi)];
      const urls = Array.from(new Set(imgMatches.map((m) => m[0]))).filter(
        (u) => !u.includes('duckduckgo.com') && !u.includes('yandex') && !u.includes('bing')
      );
      if (urls.length > 0) {
        return urls.slice(0, 3).map((url) => ({ url, alt: query }));
      }
    }
  } catch (err) {
    console.error('Image search fallback error:', err.message);
  }
  return [];
}

/**
 * Lookup a product by barcode/SKU.
 * 1. Search local database by SKU (exact match first, then partial).
 * 2. If not found locally, try external APIs (Open Food Facts, UPC Item DB).
 * 3. If product info is found but no images, fallback to web image search.
 * 4. Return whatever product info we find.
 */
exports.barcodeLookup = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  if (!barcode || barcode.length < 4) {
    return res.status(400).json({ success: false, message: 'رقم الباركود غير صالح' });
  }

  // 1. Search local database first (exact SKU match)
  let localProduct = await Product.findOne({ sku: barcode }).populate('category', 'name slug');
  if (localProduct) {
    return res.json({
      success: true,
      source: 'local',
      data: localProduct,
    });
  }

  // 2. Try partial SKU match
  localProduct = await Product.findOne({
    sku: { $regex: escapeRegex(barcode), $options: 'i' },
  }).populate('category', 'name slug');
  if (localProduct) {
    return res.json({
      success: true,
      source: 'local',
      data: localProduct,
    });
  }

  let foundData = null;

  // 3. Try Open Food Facts API (free, no rate limits, good coverage)
  try {
    const offRes = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_ar,product_name_en,brands,image_front_url,image_url,categories,generic_name`,
      {},
      8000
    );
    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const name = p.product_name_ar || p.product_name || p.product_name_en || '';
        const image = p.image_front_url || p.image_url || '';
        const brand = p.brands || '';
        const description = p.generic_name || p.categories || '';

        if (name) {
          foundData = {
            source: 'openfoodfacts',
            data: {
              name: brand ? `${name} - ${brand}` : name,
              description,
              images: image ? [{ url: image, alt: name }] : [],
              sku: barcode,
            },
          };
        }
      }
    }
  } catch (err) {
    console.error('Open Food Facts API error:', err.message);
  }

  // 4. Try UPC Item DB as fallback if not found in Open Food Facts
  if (!foundData) {
    try {
      const upcRes = await fetchWithTimeout(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
        {},
        8000
      );
      if (upcRes.ok) {
        const upcData = await upcRes.json();
        if (upcData.code === 'OK' && upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          const approxPrice = item.offers?.[0]?.price ? Math.round(item.offers[0].price * 50) : null;

          foundData = {
            source: 'upcitemdb',
            data: {
              name: item.title || '',
              description: item.description || '',
              price: approxPrice,
              images: item.images?.length ? item.images.map(url => ({ url, alt: item.title || '' })) : [],
              sku: barcode,
            },
          };
        }
      }
    } catch (err) {
      console.error('UPC Item DB API error:', err.message);
    }
  }

  // 5. If still not found, search Web for the barcode string
  if (!foundData) {
    const webResult = await searchWebFallback(barcode);
    if (webResult) {
      foundData = {
        source: 'web',
        data: {
          name: webResult.name,
          description: webResult.description,
          images: [],
          sku: barcode,
        },
      };
    }
  }

  // 6. If we found product info but NO images, try Image Search fallback
  if (foundData && (!foundData.data.images || foundData.data.images.length === 0)) {
    const images = await searchImageFallback(foundData.data.name);
    if (images && images.length > 0) {
      foundData.data.images = images;
    }
  }

  // 7. Generate a smart description if it's missing or very short
  if (foundData) {
    if (!foundData.data.description || foundData.data.description.length < 5) {
      const productName = foundData.data.name || 'هذا المنتج';
      foundData.data.description = `احصل على ${productName} الآن! يتميز بجودة عالية ويعتبر خياراً رائعاً كهدية مميزة تناسب جميع الأذواق في مختلف المناسبات.`;
    }
    
    return res.json({
      success: true,
      ...foundData,
    });
  }

  // 8. Nothing found anywhere
  return res.json({
    success: false,
    source: 'none',
    message: 'لم يتم العثور على المنتج',
    data: { sku: barcode },
  });
}, 'حدث خطأ أثناء البحث عن المنتج');

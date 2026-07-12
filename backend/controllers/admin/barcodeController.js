const asyncHandler = require('../../utils/asyncHandler');
const Product = require('../../models/Product');
const { escapeRegex } = require('../../utils/helpers');
const google = require('googlethis');

/**
 * Lookup a product by barcode/SKU.
 * 1. Search local database by SKU (exact match first, then partial).
 * 2. If not found locally, try external APIs (Open Food Facts, UPC Item DB).
 * 3. If product info is found but no images, fallback to Google Image Search 
 *    (prioritizing transparent backgrounds, then normal images).
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
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_ar,product_name_en,brands,image_front_url,image_url,categories,generic_name`
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
      const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`);
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

  // 5. If we found product info but NO images, try Google Image Search
  if (foundData && (!foundData.data.images || foundData.data.images.length === 0)) {
    try {
      const query = foundData.data.name;
      // First, search for transparent images
      let googleImages = await google.image(query, { 
        page: 0, 
        safe: false, 
        additional_params: { hl: 'en', tbs: 'ic:trans' } 
      });

      // If no transparent images found, search for normal images
      if (!googleImages || googleImages.length === 0) {
        googleImages = await google.image(query, { 
          page: 0, 
          safe: false, 
          additional_params: { hl: 'en' } 
        });
      }

      // If we found any images, take up to 3
      if (googleImages && googleImages.length > 0) {
        foundData.data.images = googleImages.slice(0, 3).map(img => ({
          url: img.url,
          alt: query,
        }));
      }
    } catch (err) {
      console.error('Google Image Search fallback error:', err.message);
    }
  }

  // Return the result if found
  if (foundData) {
    return res.json({
      success: true,
      ...foundData,
    });
  }

  // 6. Nothing found anywhere
  return res.json({
    success: false,
    source: 'none',
    message: 'لم يتم العثور على المنتج',
    data: { sku: barcode },
  });
}, 'حدث خطأ أثناء البحث عن المنتج');

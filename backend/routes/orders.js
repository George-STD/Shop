const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, apiLimiter } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/mailer');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (requires authentication)
router.post('/', protect, apiLimiter, [
  body('items').isArray({ min: 1 }).withMessage('يجب إضافة منتج واحد على الأقل'),
  body('shippingAddress.street').trim().notEmpty().withMessage('العنوان مطلوب'),
  body('shippingAddress.governorate').trim().notEmpty().withMessage('المحافظة مطلوبة'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
  body('paymentMethod').isIn(['cod', 'instapay']).withMessage('طريقة الدفع غير صالحة'),
  body('guestEmail').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // User is guaranteed to exist because of protect middleware
    const userId = req.user._id;

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryType,
      scheduledDate,
      scheduledTime,
      isGift,
      giftMessage,
      giftRecipient,
      hidePrice,
      customerNote,
      discountCode,
      guestEmail
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد منتجات في الطلب'
      });
    }

    // Calculate totals and validate products
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `المنتج غير موجود: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `الكمية غير متوفرة للمنتج: ${product.name}`
        });
      }

      let itemSubtotal = product.price * item.quantity;
      
      // Add addons price
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach(addon => {
          itemSubtotal += addon.price;
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url,
        price: product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedShape: item.selectedShape,
        selectedVariants: item.selectedVariants,
        addons: item.addons,
        boxSelections: item.boxSelections,
        giftWrap: item.giftWrap,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // Calculate shipping - flat rate 60 EGP
    const shippingCost = 60;

    // Calculate total
    const total = subtotal + shippingCost;


    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      billingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      deliveryType,
      scheduledDate,
      scheduledTime,
      isGift,
      giftMessage,
      giftRecipient,
      hidePrice,
      customerNote,
      statusHistory: [{
        status: 'pending',
        note: 'تم استلام الطلب'
      }]
    });

    // Send confirmation email - use email from form or user's email
    try {
      const emailTo = guestEmail || req.user.email;
      if (emailTo) {
        await sendOrderConfirmationEmail(emailTo, order);
      }
    } catch (mailErr) {
      console.error('Order email error:', mailErr);
    }

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الطلب'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user._id };
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (status && allowedStatuses.includes(String(status))) {
      query.status = String(status);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // Check if user owns this order
    if (order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by order number
// @access  Public
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const param = req.params.orderNumber;
    const query = param.match(/^[0-9a-fA-F]{24}$/) ? { _id: param } : { orderNumber: param };
    const order = await Order.findOne(query).select('orderNumber status statusHistory items.name items.quantity items.image items.price shippingAddress.firstName shippingAddress.lastName shippingAddress.governorate shippingAddress.city shippingAddress.street shippingAddress.phone estimatedDelivery deliveredAt createdAt total subtotal shippingCost');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذا الطلب'
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      note: req.body.reason || 'تم الإلغاء بواسطة العميل'
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

module.exports = router;

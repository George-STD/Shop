const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Auth middleware helper
const getUser = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

// @route   POST /api/orders
// @desc    Create new order
// @access  Public (guest checkout allowed)
router.post('/', async (req, res) => {
  try {
    const userId = await getUser(req);
    
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
      guestEmail,
      guestPhone
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
        image: product.images[0]?.url,
        price: product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        addons: item.addons,
        giftWrap: item.giftWrap,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
    }

    // Calculate shipping
    let shippingCost = 0;
    if (deliveryType === 'express') {
      shippingCost = 50;
    } else if (deliveryType === 'same_day') {
      shippingCost = 100;
    } else if (subtotal < 500) {
      shippingCost = 30;
    }

    // Calculate total
    const total = subtotal + shippingCost;

    // Create order
    const order = await Order.create({
      user: userId,
      guestEmail: !userId ? guestEmail : undefined,
      guestPhone: !userId ? guestPhone : undefined,
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
router.get('/', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: userId };
    if (status) query.status = status;

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
router.get('/:id', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // Check if user owns this order or is admin
    if (order.user && order.user.toString() !== userId) {
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
    const order = await Order.findOne({ 
      orderNumber: req.params.orderNumber 
    }).select('orderNumber status statusHistory items.name items.quantity shippingAddress.governorate shippingAddress.city estimatedDelivery deliveredAt createdAt');

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
router.put('/:id/cancel', async (req, res) => {
  try {
    const userId = await getUser(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.user.toString() !== userId) {
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

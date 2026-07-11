const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', productController.getAllProducts);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', productController.getFeaturedProducts);

// @route   GET /api/products/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', productController.getBestsellers);

// @route   GET /api/products/new
// @desc    Get new arrivals
// @access  Public
router.get('/new', productController.getNewArrivals);

// @route   GET /api/products/by-occasion/:occasion
// @desc    Get products by occasion
// @access  Public
router.get('/by-occasion/:occasion', productController.getProductsByOccasion);

// @route   GET /api/products/by-recipient/:recipient
// @desc    Get products by recipient
// @access  Public
router.get('/by-recipient/:recipient', productController.getProductsByRecipient);

// @route   GET /api/products/slug/:slug
// @desc    Get single product by slug
// @access  Public
router.get('/slug/:slug', productController.getProductBySlug);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related', productController.getRelatedProducts);

module.exports = router;

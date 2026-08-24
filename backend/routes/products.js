const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { rememberGet } = require('../middleware/cache');

const cacheProducts = rememberGet('products', 30_000);

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', cacheProducts, productController.getAllProducts);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', cacheProducts, productController.getFeaturedProducts);

// @route   GET /api/products/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', cacheProducts, productController.getBestsellers);

// @route   GET /api/products/new
// @desc    Get new arrivals
// @access  Public
router.get('/new', cacheProducts, productController.getNewArrivals);

// @route   GET /api/products/by-occasion/:occasion
// @desc    Get products by occasion
// @access  Public
router.get('/by-occasion/:occasion', cacheProducts, productController.getProductsByOccasion);

// @route   GET /api/products/by-recipient/:recipient
// @desc    Get products by recipient
// @access  Public
router.get('/by-recipient/:recipient', cacheProducts, productController.getProductsByRecipient);

// @route   GET /api/products/slug/:slug
// @desc    Get single product by slug
// @access  Public
router.get('/slug/:slug', cacheProducts, productController.getProductBySlug);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', cacheProducts, productController.getProductById);

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related', cacheProducts, productController.getRelatedProducts);

module.exports = router;

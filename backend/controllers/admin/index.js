/**
 * Admin Controllers - Central re-export
 *
 * Keeps the routes file unchanged: it still does
 *   const adminController = require('../controllers/admin');
 * and every export from the sub-controllers is available.
 */

const statsController = require('./statsController');
const usersController = require('./usersController');
const productsController = require('./productsController');
const ordersController = require('./ordersController');
const categoriesController = require('./categoriesController');
const reviewsController = require('./reviewsController');
const occasionsController = require('./occasionsController');
const emailsController = require('./emailsController');

module.exports = {
  ...statsController,
  ...usersController,
  ...productsController,
  ...ordersController,
  ...categoriesController,
  ...reviewsController,
  ...occasionsController,
  ...emailsController,
};

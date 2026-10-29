const productsRouter = require('./products.router');
const homeRouter = require('./home.router');
const categoryMiddleware = require("../../middlewares/client/category.middleware");
const cartMiddleware = require("../../middlewares/client/cart.middleware");
const cartRouter = require("../../routers/client/cart.router");
module.exports = (app) => {
  app.use(categoryMiddleware.category);
  app.use(cartMiddleware.cartId);
  
  app.use('/', homeRouter);
  app.use('/products', productsRouter);
  app.use('/cart', cartRouter)
};
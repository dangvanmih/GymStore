const productsRouter = require('./products.router');
const homeRouter = require('./home.router');
const categoryMiddleware = require("../../middlewares/client/category.middleware");
const cartMiddleware = require("../../middlewares/client/cart.middleware");
const favoriteMiddleware = require("../../middlewares/client/favorite.middleware");
const cartRouter = require("../../routers/client/cart.router");
const favoritesRouter = require("../../routers/client/favorites.router");
const checkoutRouter = require("../../routers/client/checkout.router");
const ordersRouter = require("../../routers/client/orders.router");
module.exports = (app) => {
  app.use(categoryMiddleware.category);
  app.use(cartMiddleware.cartId);
  app.use(favoriteMiddleware.favoriteIds);
  
  app.use('/', homeRouter);
  app.use('/products', productsRouter);
  app.use('/cart', cartRouter)
  app.use('/favorites', favoritesRouter)
  app.use('/checkout', checkoutRouter)
  app.use('/orders', ordersRouter)
};

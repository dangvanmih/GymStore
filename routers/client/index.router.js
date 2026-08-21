const productsRouter = require('./products.router');
const homeRouter = require('./home.router');

module.exports = (app) => {
  app.use('/', homeRouter);

  app.use('/products', productsRouter);
};
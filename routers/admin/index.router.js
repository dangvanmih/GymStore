const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../configs/system');
const productRouter = require('./product.router');
const categoryRouter = require('./category.router');
module.exports = (app) => {

  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(`${PATH_ADMIN}/dashboard`,dashboardRouter);
  app.use(`${PATH_ADMIN}/products`,productRouter);
  app.use(`${PATH_ADMIN}/categories`,categoryRouter);
};
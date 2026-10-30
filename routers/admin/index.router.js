const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../configs/system');
const productRouter = require('./product.router');
const categoryRouter = require('./category.router');
const roleRouter = require('./role.router');
const profileRouter = require('./profile.router');
const accountRouter = require('./account.router');
const authRouter = require('./auth.router');
const orderRouter = require('./order.router');
const authMiddleware = require('../../middlewares/admin/auth.middleware');
module.exports = (app) => {

  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(`${PATH_ADMIN}/dashboard`, authMiddleware.requireAuth, dashboardRouter);
  app.use(`${PATH_ADMIN}/products`, authMiddleware.requireAuth, productRouter);
  app.use(`${PATH_ADMIN}/categories`, authMiddleware.requireAuth, categoryRouter);
  app.use(`${PATH_ADMIN}/roles`, authMiddleware.requireAuth, roleRouter);
  app.use(`${PATH_ADMIN}/accounts`, authMiddleware.requireAuth, accountRouter);
  app.use(`${PATH_ADMIN}/orders`, authMiddleware.requireAuth, orderRouter);
  app.use(`${PATH_ADMIN}/profile`, authMiddleware.requireAuth, profileRouter);
  app.use(`${PATH_ADMIN}/auth`, authRouter);
};

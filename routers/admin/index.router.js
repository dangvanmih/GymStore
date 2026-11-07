const dashboardRouter = require('./dashboard.router');
const systemConfig = require('../../configs/system');
const productRouter = require('./product.router');
const categoryRouter = require('./category.router');
const roleRouter = require('./role.router');
const profileRouter = require('./profile.router');
const accountRouter = require('./account.router');
const authRouter = require('./auth.router');
const orderRouter = require('./order.router');
const inventoryRouter = require('./inventory.router');
const analyticsRouter = require('./analytics.router');
const authMiddleware = require('../../middlewares/admin/auth.middleware');
const settingRouter = require('./setting.router');
const supplierRouter = require('./supplier.router');
const requireSettingsPermission = (req, res, next) => {
  if (res.locals.role?.permissions?.includes('settings_view')) return next();
  return res.status(403).send('Bạn không có quyền truy cập cài đặt.');
};
module.exports = (app) => {

  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(`${PATH_ADMIN}/dashboard`, authMiddleware.requireAuth, dashboardRouter);
  app.use(`${PATH_ADMIN}/analytics`, authMiddleware.requireAuth, analyticsRouter);
  app.use(`${PATH_ADMIN}/products`, authMiddleware.requireAuth, productRouter);
  app.use(`${PATH_ADMIN}/categories`, authMiddleware.requireAuth, categoryRouter);
  app.use(`${PATH_ADMIN}/suppliers`, authMiddleware.requireAuth, supplierRouter);
  app.use(`${PATH_ADMIN}/roles`, authMiddleware.requireAuth, roleRouter);
  app.use(`${PATH_ADMIN}/accounts`, authMiddleware.requireAuth, accountRouter);
  app.use(`${PATH_ADMIN}/orders`, authMiddleware.requireAuth, orderRouter);
  app.use(`${PATH_ADMIN}/inventory`, authMiddleware.requireAuth, inventoryRouter);
  app.use(`${PATH_ADMIN}/profile`, authMiddleware.requireAuth, profileRouter);
  app.use(`${PATH_ADMIN}/settings`, authMiddleware.requireAuth, requireSettingsPermission, settingRouter);
  app.use(`${PATH_ADMIN}/auth`, authRouter);
};

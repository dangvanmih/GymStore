module.exports.requirePermission = permission => (req, res, next) => {
  const permissions = res.locals.role?.permissions || [];
  if (permissions.includes(permission)) return next();
  return res.status(403).send('Bạn không có quyền truy cập chức năng này.');
};

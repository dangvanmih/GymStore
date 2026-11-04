module.exports = {
  isAdministratorRole(title = '') {
    const normalizedTitle = title.trim().toLowerCase();
    return ['admin', 'administrator', 'quản trị viên'].includes(normalizedTitle);
  }
};

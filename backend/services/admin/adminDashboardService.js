const dashboardRepository = require('../../repositories/admin/dashboardRepository');

async function getDashboardStats({ currentUser, store }) {
  const isPlatformAdmin = Boolean(currentUser?.isPlatformAdmin);
  const storeId = store?._id || null;
  return dashboardRepository.getDashboardCounts({ isPlatformAdmin, storeId });
}

module.exports = {
  getDashboardStats,
};


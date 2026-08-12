import api from './api';

export const getDashboardAnalytics = async (date, comparison, comparisonDate) => {
  const response = await api.get('/analytics/dashboard', { params: { date, comparison, comparisonDate } });
  return response.data;
};

export const getBehaviorAnalytics = async ({ period, quarter, year, comparison, signal }) => {
  const response = await api.get('/analytics/analysis', {
    params: { period, quarter, year, comparison },
    signal
  });
  return response.data;
};

export const getMonthlyReport = async (date, type) => {
  // dateParam có định dạng '2026-07'
  const response = await api.get('/analytics/reports/monthly', { params: { date, type } });
  return response.data;
};

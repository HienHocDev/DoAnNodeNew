import api from './api';

export const getDashboardAnalytics = async (date) => {
  const response = await api.get('/analytics/dashboard', { params: { date } });
  return response.data;
};

export const getBehaviorAnalytics = async (date) => {
  const response = await api.get('/analytics/analysis', { params: { date } });
  return response.data;
};

export const getMonthlyReport = async (date, type) => {
  // dateParam có định dạng '2026-07'
  const response = await api.get('/analytics/reports/monthly', { params: { date, type } });
  return response.data;
};

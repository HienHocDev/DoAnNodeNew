import api from './api';

export const getDashboardAnalytics = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

export const getBehaviorAnalytics = async () => {
  const response = await api.get('/analytics/analysis');
  return response.data;
};

export const getMonthlyReport = async (dateParam) => {
  // dateParam có định dạng '2026-07'
  const response = await api.get(`/analytics/reports/monthly?date=${dateParam}`);
  return response.data;
};
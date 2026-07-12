import api from './api';

// ĐÃ SỬA: Xóa bỏ chữ /api ở đầu vì file cấu hình chung của dự án đã tự chèn rồi
export const getBudgets = async () => {
  const response = await api.get('/budgets');
  return response.data;
};

export const createBudget = async (budgetData) => {
  const response = await api.post('/budgets', budgetData);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};
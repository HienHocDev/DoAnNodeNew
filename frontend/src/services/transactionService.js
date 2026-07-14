import api from './api';

export const getTransactions = async ({ type, month, year } = {}) => {
  const response = await api.get('/transactions', {
    params: { type: type === 'all' ? undefined : type, month, year }
  });
  return response.data;
};

export const createTransaction = async (transactionData) => {
  const response = await api.post('/transactions', transactionData);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

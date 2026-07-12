import api from './api';

export const getReminders = async () => {
  const response = await api.get('/reminders');
  return response.data;
};

export const createReminder = async (reminderData) => {
  const response = await api.post('/reminders', reminderData);
  return response.data;
};

export const updateReminder = async (id, reminderData) => {
  const response = await api.put(`/reminders/${id}`, reminderData);
  return response.data;
};

export const deleteReminder = async (id) => {
  const response = await api.delete(`/reminders/${id}`);
  return response.data;
};

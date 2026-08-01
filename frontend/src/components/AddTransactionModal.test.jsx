import React, { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTransactionModal from './AddTransactionModal';
import { getWallets } from '../services/walletService';
import { createTransaction } from '../services/transactionService';

jest.mock('../services/walletService', () => ({
  getWallets: jest.fn()
}));

jest.mock('../services/transactionService', () => ({
  createTransaction: jest.fn()
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ t: (key) => key })
}));

const renderModal = async () => {
  render(
    <StrictMode>
      <AddTransactionModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />
    </StrictMode>
  );
  await screen.findByText('Ví chính');
};

describe('AddTransactionModal money input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getWallets.mockResolvedValue([{ _id: 'wallet-1', name: 'Ví chính' }]);
    createTransaction.mockResolvedValue({});
  });

  test('renders only one money input and types 53000000 correctly', async () => {
    await renderModal();
    const input = screen.getByLabelText('transactions_modal_amount');

    expect(screen.getAllByLabelText('transactions_modal_amount')).toHaveLength(1);
    userEvent.click(input);
    userEvent.type(input, '53000000');

    expect(input.value).toBe('53000000');
  });

  test('appends and removes exactly one digit', async () => {
    await renderModal();
    const input = screen.getByLabelText('transactions_modal_amount');

    userEvent.type(input, '9000');
    expect(input.value).toBe('9000');

    userEvent.type(input, '0');
    expect(input.value).toBe('90000');

    userEvent.type(input, '{backspace}');
    expect(input.value).toBe('9000');
  });

  test('normalizes pasted digits and submits a numeric amount', async () => {
    await renderModal();
    const input = screen.getByLabelText('transactions_modal_amount');

    userEvent.paste(input, '53000000');
    expect(input.value).toBe('53000000');

    await waitFor(() => expect(getWallets).toHaveBeenCalled());
    userEvent.click(screen.getByText('transactions_modal_save'));

    await waitFor(() => expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 53000000, walletId: 'wallet-1' })
    ));
  });
});

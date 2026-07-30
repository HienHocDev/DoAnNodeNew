import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoneyInput from './MoneyInput';

const ControlledMoneyInput = ({ initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);
  return <MoneyInput aria-label="Số tiền" value={value} onValueChange={setValue} />;
};

describe('MoneyInput', () => {
  test('formats each digit typed at the end without changing its order', () => {
    render(<ControlledMoneyInput />);
    const input = screen.getByLabelText('Số tiền');

    userEvent.type(input, '9000000');

    expect(input.value).toBe('9000000');
  });

  test('formats 53000000 correctly when typed quickly', () => {
    render(<ControlledMoneyInput />);
    const input = screen.getByLabelText('Số tiền');

    userEvent.type(input, '53000000');

    expect(input.value).toBe('53000000');
  });

  test('appends zero correctly to an existing formatted amount', () => {
    render(<ControlledMoneyInput initialValue="9000" />);
    const input = screen.getByLabelText('Số tiền');

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    userEvent.type(input, '0');

    expect(input.value).toBe('90000');
  });

  test('deletes digits from the end in the correct order', () => {
    render(<ControlledMoneyInput initialValue="53000000" />);
    const input = screen.getByLabelText('Số tiền');

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    const expectedValues = [
      '5300000', '530000', '53000', '5300', '530', '53', '5', ''
    ];

    expectedValues.forEach((expected) => {
      userEvent.type(input, '{backspace}');
      expect(input.value).toBe(expected);
    });
  });

  test('normalizes pasted separators and limits the value to 15 digits', () => {
    render(<ControlledMoneyInput />);
    const input = screen.getByLabelText('Số tiền');

    userEvent.paste(input, '53,000,000');
    expect(input.value).toBe('53000000');

    userEvent.clear(input);
    userEvent.type(input, '1234567890123456');
    expect(input.value).toBe('123456789012345');
  });
});

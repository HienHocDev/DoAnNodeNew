import React, { forwardRef } from 'react';

export const sanitizeMoneyValue = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.replace(/^0+(?=\d)/, '');
};

export const formatMoneyInput = (value) => {
  return sanitizeMoneyValue(value);
};

const MoneyInput = forwardRef(({
  value,
  onValueChange,
  onLimitExceeded,
  maxDigits = 15,
  className = '',
  ...props
}, forwardedRef) => {
  const displayValue = sanitizeMoneyValue(value);

  const handleChange = (event) => {
    const rawValue = sanitizeMoneyValue(event.target.value);

    if (rawValue.length > maxDigits) {
      event.currentTarget.value = displayValue;
      onLimitExceeded?.(maxDigits);
      return;
    }

    onLimitExceeded?.(null);
    onValueChange?.(rawValue);
  };

  return (
    <input
      {...props}
      ref={forwardedRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  );
});

MoneyInput.displayName = 'MoneyInput';

export default MoneyInput;

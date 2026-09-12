import React, { useState, useEffect } from 'react';

export const DebouncedInput = ({
  value: externalValue,
  onChange,
  debounceTime = 500,
  ...props
}: any) => {
  const [value, setValue] = useState(externalValue);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== externalValue) {
        onChange(value);
      }
    }, debounceTime);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        if (value !== externalValue) {
          onChange(value);
        }
        if (props.onBlur) props.onBlur(e);
      }}
    />
  );
};

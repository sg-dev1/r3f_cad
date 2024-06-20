import { Html } from '@react-three/drei';
import React from 'react';

export interface R3fHtmlInputProps {
  type: React.HTMLInputTypeAttribute;
  size: number;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  autoFocus?: boolean;
}

const R3fHtmlInput = ({
  position,
  inputProps,
}: {
  position: [number, number, number];
  inputProps: R3fHtmlInputProps;
}) => {
  return (
    <Html position={position}>
      <input
        type={inputProps.type}
        placeholder={inputProps.placeholder || ''}
        size={inputProps.size}
        autoFocus={inputProps.autoFocus !== undefined ? inputProps.autoFocus : true}
        onKeyDown={inputProps.onKeyDown}
      />
    </Html>
  );
};

export default R3fHtmlInput;

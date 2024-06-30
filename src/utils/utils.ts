/** This library contains misc helper functionality. */
const EPSILON_VALUE: number = 0.000001;

export const floatNumbersEqual = (a: number, b: number) => {
  return Math.abs(a - b) < EPSILON_VALUE;
};

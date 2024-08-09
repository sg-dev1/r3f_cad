/** This library contains misc helper functionality. */
const EPSILON_VALUE: number = 0.000001;

export const floatNumbersEqual = (a: number, b: number) => {
  return Math.abs(a - b) < EPSILON_VALUE;
};

export const round = (num: number, decimalPlaces: number = 6) => {
  const roundVal = 10 * decimalPlaces;
  return Math.round(num * roundVal) / roundVal;
};

/** Always returns an angle between 0 and PI. */
export const calcAngle2d = (v1: [number, number], v2: [number, number]) => {
  // https://www.cuemath.com/geometry/angle-between-vectors/
  // implemented dot product variant
  const dotProd = v1[0] * v2[0] + v1[1] * v2[1];
  const v1Len = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
  const v2Len = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
  //console.log('----v1Len', v1Len, 'v2Len', v2Len);
  return Math.acos(dotProd / (v1Len * v2Len));
};

export const toDegree = (angleInRadiant: number) => {
  return (angleInRadiant * 180) / Math.PI;
};

export const toRadiant = (angleInDegree: number) => {
  return (angleInDegree * Math.PI) / 180;
};

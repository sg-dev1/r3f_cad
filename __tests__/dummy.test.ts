/** A simple dummy test script to verify that jest is installed properly. */
import { describe, expect, test } from '@jest/globals';

describe('dummy test that adds two numbers', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });
});

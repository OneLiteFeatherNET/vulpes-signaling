import { describe, expect, it } from 'vitest';
import { CLIENT_ID_LENGTH, createClientIdGenerator } from '../src/client-id.js';

const ID_PATTERN = /^[a-z0-9]{16}$/;

/** Cycles through 0..35 so every position of the alphabet is hit deterministically. */
function cyclingRandom(): (maxExclusive: number) => number {
  let next = 0;
  return (maxExclusive) => {
    const value = next % maxExclusive;
    next += 1;
    return value;
  };
}

describe('createClientIdGenerator', () => {
  it('returns ids of exactly 16 characters', () => {
    const id = createClientIdGenerator(cyclingRandom())();

    expect(id, 'client id length').toHaveLength(CLIENT_ID_LENGTH);
  });

  it('returns ids made only of lowercase letters and digits', () => {
    const id = createClientIdGenerator(cyclingRandom())();

    expect(id, 'client id alphabet').toMatch(ID_PATTERN);
  });

  it('draws every character from the injected random source', () => {
    const calls: number[] = [];
    const generate = createClientIdGenerator((maxExclusive) => {
      calls.push(maxExclusive);
      return 0;
    });

    generate();

    expect(calls, 'one draw per character over the 36-symbol alphabet').toEqual(
      Array.from({ length: CLIENT_ID_LENGTH }, () => 36),
    );
  });

  it('maps the first random value to the first alphabet character', () => {
    const id = createClientIdGenerator(() => 0)();

    expect(id, 'id built from index 0').toBe('a'.repeat(CLIENT_ID_LENGTH));
  });

  it('maps the last random value to the last alphabet character', () => {
    const id = createClientIdGenerator(() => 35)();

    expect(id, 'id built from index 35').toBe('9'.repeat(CLIENT_ID_LENGTH));
  });
});

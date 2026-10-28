import { randomInt } from 'node:crypto';

/**
 * Blockbench only accepts session tokens of exactly 16 characters from [a-z0-9]
 * (EditSession.matchToken), so the signaling server must hand out ids of that shape.
 */
export const CLIENT_ID_LENGTH = 16;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Returns an integer in [0, maxExclusive). Injected so tests need no real randomness. */
export type RandomInt = (maxExclusive: number) => number;

export function createClientIdGenerator(randomIntSource: RandomInt = (max) => randomInt(max)): () => string {
  return () => {
    let id = '';
    for (let i = 0; i < CLIENT_ID_LENGTH; i++) {
      id += ALPHABET.charAt(randomIntSource(ALPHABET.length));
    }
    return id;
  };
}

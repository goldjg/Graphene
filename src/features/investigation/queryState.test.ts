import { describe, expect, it } from 'vitest';

import { decodeQueryState, defaultQueryState, encodeQueryState } from './queryState.ts';

describe('queryState', () => {
  it('encodes and decodes a search query with inherited relationships excluded', () => {
    const params = encodeQueryState({
      mode: 'search',
      targetId: 'user-123',
      includeInherited: false,
    });

    expect(params.get('mode')).toBe('search');
    expect(params.get('target')).toBe('user-123');
    expect(params.get('inherited')).toBe('0');

    expect(decodeQueryState(params)).toEqual({
      mode: 'search',
      targetId: 'user-123',
      includeInherited: false,
    });
  });

  it('omits the target param in "me" mode even if targetId is set', () => {
    const params = encodeQueryState({ mode: 'me', targetId: 'ignored', includeInherited: true });

    expect(params.has('target')).toBe(false);
  });

  it('falls back to defaults for missing or malformed params', () => {
    expect(decodeQueryState(new URLSearchParams())).toEqual(defaultQueryState);
    expect(decodeQueryState(new URLSearchParams('mode=bogus'))).toEqual(defaultQueryState);
  });

  it('never encodes anything other than mode/target/inherited', () => {
    const params = encodeQueryState({
      mode: 'search',
      targetId: 'user-123',
      includeInherited: true,
    });

    expect([...params.keys()].sort()).toEqual(['inherited', 'mode', 'target']);
  });
});

import { describe, expect, it } from 'vitest';

import { decodeQueryState, defaultQueryState, encodeQueryState } from './queryState.ts';

describe('queryState', () => {
  it('encodes and decodes a search query with inherited relationships excluded', () => {
    const params = encodeQueryState({
      mode: 'search',
      targetType: 'group',
      targetId: 'user-123',
      includeInherited: false,
    });

    expect(params.get('mode')).toBe('search');
    expect(params.get('type')).toBe('group');
    expect(params.get('target')).toBe('user-123');
    expect(params.get('inherited')).toBe('0');

    expect(decodeQueryState(params)).toEqual({
      mode: 'search',
      targetType: 'group',
      targetId: 'user-123',
      includeInherited: false,
    });
  });

  it('omits the target param in "me" mode even if targetId is set', () => {
    const params = encodeQueryState({
      mode: 'me',
      targetType: 'group',
      targetId: 'ignored',
      includeInherited: true,
    });

    expect(params.has('target')).toBe(false);
    expect(params.has('type')).toBe(false);
  });

  it('falls back to defaults for missing or malformed params', () => {
    expect(decodeQueryState(new URLSearchParams())).toEqual(defaultQueryState);
    expect(decodeQueryState(new URLSearchParams('mode=bogus'))).toEqual(defaultQueryState);
  });

  it('never encodes anything other than mode/target/inherited', () => {
    const params = encodeQueryState({
      mode: 'search',
      targetType: 'user',
      targetId: 'user-123',
      includeInherited: true,
    });

    expect([...params.keys()].sort()).toEqual(['inherited', 'mode', 'target', 'type']);
  });

  it('falls back to user when the target type is malformed', () => {
    expect(decodeQueryState(new URLSearchParams('mode=search&type=device&target=abc'))).toEqual({
      mode: 'search',
      targetType: 'user',
      targetId: 'abc',
      includeInherited: true,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { consumeSignInHandoff, createSignInHandoffUrl } from './redirectHandoff.ts';

describe('authentication redirect handoff', () => {
  it('moves sign-in from a deploy preview to the canonical registered origin', () => {
    expect(
      createSignInHandoffUrl(
        'https://deploy-id--graphene-ms.netlify.app/',
        'https://graphene-ms.netlify.app/',
      ),
    ).toBe('https://graphene-ms.netlify.app/?grapheneSignIn=1');
  });

  it('does not hand off when already running on the registered origin', () => {
    expect(
      createSignInHandoffUrl(
        'https://graphene-ms.netlify.app/',
        'https://graphene-ms.netlify.app/',
      ),
    ).toBeNull();
  });

  it('consumes the one-time sign-in marker without retaining it in the URL', () => {
    expect(consumeSignInHandoff('https://graphene-ms.netlify.app/?grapheneSignIn=1')).toEqual({
      requested: true,
      cleanUrl: 'https://graphene-ms.netlify.app/',
    });
  });
});

import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type AuthenticationResult,
  PublicClientApplication,
} from '@azure/msal-browser';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import type { AppConfig } from '../config/environment.ts';
import { GraphClient } from '../microsoftGraph/client/GraphClient.ts';
import { mapGraphError } from '../microsoftGraph/client/errors.ts';
import type { GraphUser } from '../microsoftGraph/dto/user.ts';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext.ts';
import { mapAuthError, type UserFacingError } from './errors.ts';
import { createGraphLoginRequest, createMsalConfig } from './msalConfig.ts';

export function AuthProvider({ config, children }: PropsWithChildren<{ config: AppConfig }>) {
  const msal = useMemo(() => new PublicClientApplication(createMsalConfig(config)), [config]);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<GraphUser | null>(null);
  const [error, setError] = useState<UserFacingError | null>(null);

  const setActiveAccount = useCallback(
    (nextAccount: AccountInfo | null) => {
      msal.setActiveAccount(nextAccount);
      setAccount(nextAccount);
    },
    [msal],
  );

  const acquireGraphToken = useCallback(
    async (tokenAccount: AccountInfo): Promise<string> => {
      try {
        const result = await msal.acquireTokenSilent({
          ...createGraphLoginRequest(),
          account: tokenAccount,
        });
        return result.accessToken;
      } catch (tokenError) {
        if (tokenError instanceof InteractionRequiredAuthError) {
          await msal.acquireTokenRedirect(createGraphLoginRequest());
        }

        throw tokenError;
      }
    },
    [msal],
  );

  const loadIdentity = useCallback(
    async (identityAccount: AccountInfo) => {
      const graph = new GraphClient({
        tokenProvider: () => acquireGraphToken(identityAccount),
      });
      const user = await graph.getCurrentUser();
      setCurrentUser(user);
      setStatus('authenticated');
      setError(null);
    },
    [acquireGraphToken],
  );

  const refreshIdentity = useCallback(async () => {
    const activeAccount = msal.getActiveAccount();

    if (!activeAccount) {
      setStatus('unauthenticated');
      setCurrentUser(null);
      return;
    }

    try {
      await loadIdentity(activeAccount);
    } catch (identityError) {
      setStatus('error');
      setError(mapGraphError(identityError));
    }
  }, [loadIdentity, msal]);

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      try {
        await msal.initialize();
        const redirectResult = await msal.handleRedirectPromise();
        const nextAccount = selectAccount(msal, redirectResult);

        if (cancelled) {
          return;
        }

        setActiveAccount(nextAccount);

        if (!nextAccount) {
          setStatus('unauthenticated');
          return;
        }

        await loadIdentity(nextAccount);
      } catch (authError) {
        if (!cancelled) {
          setStatus('error');
          setError(mapAuthError(authError));
        }
      }
    }

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, [loadIdentity, msal, setActiveAccount]);

  const signIn = useCallback(async () => {
    setError(null);
    await msal.loginRedirect(createGraphLoginRequest());
  }, [msal]);

  const signOut = useCallback(async () => {
    setError(null);
    const activeAccount = msal.getActiveAccount();
    await msal.logoutRedirect(activeAccount ? { account: activeAccount } : {});
  }, [msal]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      account,
      currentUser,
      error,
      signIn,
      signOut,
      refreshIdentity,
    }),
    [account, currentUser, error, refreshIdentity, signIn, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function selectAccount(
  msal: PublicClientApplication,
  redirectResult: AuthenticationResult | null,
): AccountInfo | null {
  const account = redirectResult?.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0];
  return account ?? null;
}

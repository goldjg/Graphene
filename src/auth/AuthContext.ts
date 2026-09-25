import { createContext } from 'react';

import type { AccountInfo } from '@azure/msal-browser';

import type { GraphClient } from '../microsoftGraph/client/GraphClient.ts';
import type { GraphUser } from '../microsoftGraph/dto/user.ts';
import type { UserFacingError } from './errors.ts';

export type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  account: AccountInfo | null;
  currentUser: GraphUser | null;
  error: UserFacingError | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
  /**
   * Returns a Microsoft Graph client bound to the signed-in account's
   * delegated token, or `null` when no account is authenticated. Callers
   * must never cache the returned client past the current investigation
   * action; a fresh client is safe to request per call.
   */
  getGraphClient: () => GraphClient | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

import { AuthError, BrowserAuthError, InteractionRequiredAuthError } from '@azure/msal-browser';

export interface UserFacingError {
  title: string;
  message: string;
  remediation?: string;
}

export function mapAuthError(error: unknown): UserFacingError {
  if (error instanceof BrowserAuthError && error.errorCode === 'user_cancelled') {
    return {
      title: 'Sign-in cancelled',
      message: 'The Microsoft Entra sign-in window was closed before authentication completed.',
      remediation: 'Start sign-in again when you are ready to continue.',
    };
  }

  if (error instanceof InteractionRequiredAuthError) {
    return {
      title: 'More interaction is required',
      message:
        'Microsoft Entra requires an interactive sign-in or consent step before Graphene can continue.',
      remediation: 'Sign in again and complete any Microsoft Entra prompts shown by your tenant.',
    };
  }

  if (error instanceof AuthError) {
    if (error.errorCode === 'access_denied' || error.errorMessage.includes('AADSTS65001')) {
      return {
        title: 'Access denied or admin consent missing',
        message:
          'Graphene could not obtain the approved Microsoft Graph delegated permissions for this tenant.',
        remediation:
          'Confirm that User.Read and Directory.Read.All have been granted, including administrator consent for Directory.Read.All.',
      };
    }

    return {
      title: 'Authentication failed',
      message: error.errorMessage || error.message,
      remediation: 'Check Graphene app consent and try signing in again.',
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Authentication failed',
      message: error.message,
    };
  }

  return {
    title: 'Authentication failed',
    message: 'Microsoft Entra authentication failed for an unknown reason.',
  };
}

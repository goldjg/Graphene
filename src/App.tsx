import { AuthProvider } from './auth/AuthProvider.tsx';
import { useAuth } from './auth/useAuth.ts';
import { getAppConfig } from './config/environment.ts';
import { GraphExplorer } from './features/graphExplorer/GraphExplorer.tsx';

export function App() {
  const configResult = readConfig();

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="graphene-title">
        <p className="eyebrow">Microsoft Entra access investigation</p>
        <h1 id="graphene-title">Graphene</h1>
        <p className="lede">
          A provenance-aware static SPA for exploring how identities relate to Microsoft Entra
          resources. Authentication uses a single-tenant public SPA registration and the approved
          User.Read plus Directory.Read.All delegated permission baseline.
        </p>
      </section>

      <section className="status-card" aria-labelledby="auth-status">
        <h2 id="auth-status">Authentication status</h2>
        <dl>
          <div>
            <dt>Architecture</dt>
            <dd>Static Vite + React + TypeScript SPA for Netlify</dd>
          </div>
          <div>
            <dt>Microsoft Graph scopes</dt>
            <dd>User.Read and Directory.Read.All only</dd>
          </div>
          <div>
            <dt>Authority</dt>
            <dd>{configResult.ok ? configResult.authority : 'Waiting for tenant configuration'}</dd>
          </div>
        </dl>

        {!configResult.ok ? (
          <p className="setup-warning" role="status">
            {configResult.message}
          </p>
        ) : null}
      </section>

      {configResult.ok ? (
        <AuthProvider config={configResult.config}>
          <section className="status-card" aria-label="Identity status">
            <AuthStatusPanel />
          </section>
          <GraphExplorer />
        </AuthProvider>
      ) : null}
    </main>
  );
}

type ConfigReadResult =
  | { ok: true; authority: string; config: ReturnType<typeof getAppConfig> }
  | { ok: false; message: string };

function readConfig(): ConfigReadResult {
  try {
    const config = getAppConfig();
    return { ok: true, authority: config.auth.authority, config };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Graphene configuration is invalid.',
    };
  }
}

function AuthStatusPanel() {
  const { currentUser, error, refreshIdentity, signIn, signOut, status } = useAuth();

  if (status === 'initializing') {
    return (
      <p className="setup-ready" role="status">
        Initializing Microsoft Entra authentication...
      </p>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="auth-actions">
        <p className="setup-ready" role="status">
          Environment configuration is present. Sign in to call Microsoft Graph /me.
        </p>
        <button type="button" onClick={() => void signIn()}>
          Sign in with Microsoft Entra
        </button>
      </div>
    );
  }

  return (
    <div className="auth-actions">
      {currentUser ? (
        <div className="identity-card" aria-labelledby="identity-heading">
          <h3 id="identity-heading">Authenticated identity</h3>
          <dl>
            <div>
              <dt>Display name</dt>
              <dd>{currentUser.displayName ?? 'Not returned by Microsoft Graph'}</dd>
            </div>
            <div>
              <dt>User principal name</dt>
              <dd>{currentUser.userPrincipalName ?? 'Not returned by Microsoft Graph'}</dd>
            </div>
            <div>
              <dt>Object ID</dt>
              <dd>{currentUser.id}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {error ? (
        <div className="setup-warning" role="alert">
          <strong>{error.title}</strong>
          <p>{error.message}</p>
          {error.remediation ? <p>{error.remediation}</p> : null}
        </div>
      ) : null}

      <div className="button-row">
        <button type="button" onClick={() => void refreshIdentity()}>
          Refresh identity
        </button>
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}

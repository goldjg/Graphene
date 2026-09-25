import { getAppConfig } from './config/environment.ts';

export function App() {
  const configResult = readConfig();

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="graphene-title">
        <p className="eyebrow">Microsoft Entra access investigation</p>
        <h1 id="graphene-title">Graphene</h1>
        <p className="lede">
          A provenance-aware static SPA for exploring how identities relate to Microsoft Entra
          resources. Milestone 0 establishes the cARL-governed foundation, tooling, and security
          boundaries before authentication or Graph ingestion is implemented.
        </p>
      </section>

      <section className="status-card" aria-labelledby="foundation-status">
        <h2 id="foundation-status">Foundation status</h2>
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
        ) : (
          <p className="setup-ready" role="status">
            Environment configuration is present. Authentication is planned for Milestone 1.
          </p>
        )}
      </section>
    </main>
  );
}

type ConfigReadResult =
  | { ok: true; authority: string }
  | { ok: false; message: string };

function readConfig(): ConfigReadResult {
  try {
    const config = getAppConfig();
    return { ok: true, authority: config.auth.authority };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Graphene configuration is invalid.',
    };
  }
}

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GraphExplorer } from './GraphExplorer.tsx';

/**
 * Cytoscape.js relies on a real canvas 2D context, which jsdom does not
 * implement. GraphExplorer tests mock the `cytoscape` module so the feature
 * behaviour (demo loading, toolbar, selection wiring) can be verified
 * without depending on canvas rendering internals.
 */
vi.mock('cytoscape', () => {
  const core = {
    on: vi.fn(),
    add: vi.fn(),
    elements: vi.fn(() => ({ remove: vi.fn(), jsons: vi.fn(() => []) })),
    layout: vi.fn(() => ({ run: vi.fn() })),
    fit: vi.fn(),
    reset: vi.fn(),
    zoom: vi.fn(() => 1),
    nodes: vi.fn(() => []),
    edges: vi.fn(() => []),
    destroy: vi.fn(),
  };

  return { default: vi.fn(() => core) };
});

/**
 * GraphExplorer renders QueryPanel, which requires an AuthProvider context.
 * These tests exercise demo-data flows only, so useAuth is mocked directly
 * to avoid standing up MSAL.
 */
vi.mock('../../auth/useAuth.ts', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    account: null,
    currentUser: null,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshIdentity: vi.fn(),
    getGraphClient: () => null,
  }),
}));

describe('GraphExplorer', () => {
  it('shows no graph loaded until demo data is requested', () => {
    render(<GraphExplorer />);

    expect(screen.getByText('No graph loaded')).toBeInTheDocument();
    expect(screen.getByText('Select a node or edge to see its details.')).toBeInTheDocument();
  });

  it('loads the demo graph and reports node/edge counts', () => {
    render(<GraphExplorer />);

    fireEvent.click(screen.getByRole('button', { name: 'Load demo data' }));

    expect(screen.getByText(/nodes, .* edges/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Filters & key' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Access paths' })).toBeInTheDocument();
  });

  it('filters out a node type and its edges without affecting the underlying graph', () => {
    render(<GraphExplorer />);

    fireEvent.click(screen.getByRole('button', { name: 'Load demo data' }));
    const beforeStats = screen.getByText(/nodes, .* edges/).textContent;

    fireEvent.click(screen.getByRole('checkbox', { name: 'Directory roles' }));

    expect(
      screen.getByText(/Filters active: .* nodes hidden, .* edges hidden\./),
    ).toBeInTheDocument();
    const afterStats = screen.getByText(/nodes, .* edges/).textContent;
    expect(afterStats).not.toEqual(beforeStats);

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(screen.getByText(/nodes, .* edges/).textContent).toEqual(beforeStats);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryPanel } from './QueryPanel.tsx';
import type { AuthContextValue } from '../../auth/AuthContext.ts';
import type { GraphClient } from '../../microsoftGraph/client/GraphClient.ts';

const mockUseAuth = vi.fn<() => Partial<AuthContextValue>>();
const fakeGraphClient = {} as GraphClient;

vi.mock('../../auth/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockBuildUserAccessGraph = vi.fn();

vi.mock('../../microsoftGraph/ingestion/buildUserAccessGraph.ts', () => ({
  buildUserAccessGraph: (...args: unknown[]) =>
    (mockBuildUserAccessGraph as (...callArgs: unknown[]) => unknown)(...args),
}));

describe('QueryPanel', () => {
  beforeEach(() => {
    mockBuildUserAccessGraph.mockReset();
    window.history.replaceState(null, '', '/');
  });

  it('disables submission and explains sign-in is required when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', getGraphClient: () => null });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Run investigation' })).toBeDisabled();
    expect(
      screen.getByText('Sign in to run a live Microsoft Graph investigation.'),
    ).toBeInTheDocument();
  });

  it('validates that a search target is provided before querying', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    fireEvent.click(
      screen.getByRole('radio', { name: 'Search by object ID or user principal name' }),
    );
    fireEvent.submit(screen.getByRole('button', { name: 'Run investigation' }).closest('form')!);

    expect(
      screen.getByText('Enter an object ID or user principal name to search for.'),
    ).toBeInTheDocument();
    expect(mockBuildUserAccessGraph).not.toHaveBeenCalled();
  });

  it('runs an investigation for the current user and reports the result', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });
    mockBuildUserAccessGraph.mockResolvedValue({ nodes: [], edges: [] });
    const onResult = vi.fn();

    render(<QueryPanel onResult={onResult} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run investigation' }));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith({ nodes: [], edges: [] });
    });
    expect(mockBuildUserAccessGraph).toHaveBeenCalledWith(expect.anything(), 'me');
  });

  it('filters out inherited edges when the include-inherited toggle is off', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });
    mockBuildUserAccessGraph.mockResolvedValue({
      nodes: [{ id: 'user-1' }],
      edges: [
        { id: 'direct-edge', inherited: false },
        { id: 'inherited-edge', inherited: true },
      ],
    });
    const onResult = vi.fn();

    render(<QueryPanel onResult={onResult} onReset={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Include inherited (transitive) relationships'));
    fireEvent.click(screen.getByRole('button', { name: 'Run investigation' }));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });
    const [[resultGraph]] = onResult.mock.calls as [[{ edges: { id: string }[] }]];
    expect(resultGraph.edges.map((edge) => edge.id)).toEqual(['direct-edge']);
  });

  it('calls onReset and clears validation state on reset', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', getGraphClient: () => null });
    const onReset = vi.fn();

    render(<QueryPanel onResult={vi.fn()} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalled();
  });
});

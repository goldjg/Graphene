import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryPanel } from './QueryPanel.tsx';
import type { AuthContextValue } from '../../auth/AuthContext.ts';
import type { GraphClient } from '../../microsoftGraph/client/GraphClient.ts';

const mockUseAuth = vi.fn<() => Partial<AuthContextValue>>();
const fakeGraphClient = {} as GraphClient;

vi.mock('../../auth/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockBuildInvestigationGraph = vi.fn();

vi.mock('../../microsoftGraph/ingestion/buildInvestigationGraph.ts', () => ({
  buildInvestigationGraph: (...args: unknown[]) =>
    (mockBuildInvestigationGraph as (...callArgs: unknown[]) => unknown)(...args),
}));

describe('QueryPanel', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockBuildInvestigationGraph.mockReset();
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('disables submission and explains sign-in is required when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', getGraphClient: () => null });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Run investigation' })).toBeDisabled();
    expect(
      screen.getByText('Sign in to run a live Microsoft Graph investigation.'),
    ).toBeInTheDocument();
  });

  it('preserves an OAuth response while authentication is initializing', () => {
    window.history.replaceState(null, '', '/?code=auth-code&state=auth-state');
    mockUseAuth.mockReturnValue({ status: 'initializing', getGraphClient: () => null });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    expect(window.location.search).toBe('?code=auth-code&state=auth-state');
  });

  it('validates that a search target is provided before querying', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Search by object type and identifier' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Run investigation' }).closest('form')!);

    expect(
      screen.getByText('Enter an identifier for the selected object type.'),
    ).toBeInTheDocument();
    expect(mockBuildInvestigationGraph).not.toHaveBeenCalled();
  });

  it('runs an investigation for the current user and reports the result', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });
    mockBuildInvestigationGraph.mockResolvedValue({ nodes: [], edges: [] });
    const onResult = vi.fn();

    render(<QueryPanel onResult={onResult} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run investigation' }));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith({ nodes: [], edges: [] });
    });
    expect(mockBuildInvestigationGraph).toHaveBeenCalledWith(expect.anything(), {
      type: 'user',
      identifier: 'me',
    });
  });

  it('filters out inherited edges when the include-inherited toggle is off', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });
    mockBuildInvestigationGraph.mockResolvedValue({
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

  it('runs a group investigation with the selected object type and identifier', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => fakeGraphClient,
    });
    mockBuildInvestigationGraph.mockResolvedValue({ nodes: [], edges: [] });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Search by object type and identifier' }));
    fireEvent.change(screen.getByLabelText('Object type'), { target: { value: 'group' } });
    fireEvent.change(screen.getByLabelText('Identifier'), {
      target: { value: '11111111-2222-3333-4444-555555555555' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run investigation' }));

    await waitFor(() => {
      expect(mockBuildInvestigationGraph).toHaveBeenCalledWith(expect.anything(), {
        type: 'group',
        identifier: '11111111-2222-3333-4444-555555555555',
      });
    });
  });

  it('debounces typeahead and selects a suggestion with the keyboard', async () => {
    vi.useFakeTimers();
    const searchObjects = vi.fn().mockResolvedValue([
      {
        id: '11111111-2222-3333-4444-555555555555',
        label: 'Engineering Team',
        detail: 'engineering@example.test',
        type: 'group',
      },
    ]);
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => ({ searchObjects }) as unknown as GraphClient,
    });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Search by object type and identifier' }));
    fireEvent.change(screen.getByLabelText('Object type'), { target: { value: 'group' } });
    const input = screen.getByRole('combobox', { name: 'Identifier' });
    fireEvent.change(input, { target: { value: 'engin' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(249);
    });
    expect(searchObjects).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(searchObjects).toHaveBeenCalledWith('group', 'engin', expect.any(AbortSignal));
    expect(screen.getByRole('option', { name: /Engineering Team/ })).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input).toHaveValue('11111111-2222-3333-4444-555555555555');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('aborts stale typeahead requests and ignores their late results', async () => {
    vi.useFakeTimers();
    let resolveFirst:
      ((value: Awaited<ReturnType<GraphClient['searchObjects']>>) => void) | undefined;
    let resolveSecond:
      ((value: Awaited<ReturnType<GraphClient['searchObjects']>>) => void) | undefined;
    const firstResult = new Promise<Awaited<ReturnType<GraphClient['searchObjects']>>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    const secondResult = new Promise<Awaited<ReturnType<GraphClient['searchObjects']>>>(
      (resolve) => {
        resolveSecond = resolve;
      },
    );
    const signals: AbortSignal[] = [];
    const searchObjects = vi
      .fn()
      .mockImplementationOnce((_type: string, _query: string, signal: AbortSignal) => {
        signals.push(signal);
        return firstResult;
      })
      .mockImplementationOnce((_type: string, _query: string, signal: AbortSignal) => {
        signals.push(signal);
        return secondResult;
      });
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      getGraphClient: () => ({ searchObjects }) as unknown as GraphClient,
    });

    render(<QueryPanel onResult={vi.fn()} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Search by object type and identifier' }));
    const input = screen.getByRole('combobox', { name: 'Identifier' });
    fireEvent.change(input, { target: { value: 'eng' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    fireEvent.change(input, { target: { value: 'engine' } });
    expect(signals[0]?.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    await act(async () => {
      resolveSecond?.([
        {
          id: 'current-id',
          label: 'Current result',
          detail: 'current@example.test',
          type: 'user',
        },
      ]);
      await secondResult;
    });
    expect(screen.getByText('Current result')).toBeInTheDocument();

    await act(async () => {
      resolveFirst?.([
        {
          id: 'stale-id',
          label: 'Stale result',
          detail: 'stale@example.test',
          type: 'user',
        },
      ]);
      await firstResult;
    });
    expect(screen.queryByText('Stale result')).not.toBeInTheDocument();
    expect(screen.getByText('Current result')).toBeInTheDocument();
  });

  it('calls onReset and clears validation state on reset', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', getGraphClient: () => null });
    const onReset = vi.fn();

    render(<QueryPanel onResult={vi.fn()} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalled();
  });
});

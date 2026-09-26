import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DetailsPanel } from './DetailsPanel.tsx';
import type { InvestigationGraph } from '../../graph/model/types.ts';

const graph: InvestigationGraph = {
  nodes: [
    {
      id: 'permission-1',
      type: 'delegatedPermission',
      label: 'Directory.Read.All',
      metadata: {
        permissionGrantId: 'grant-1',
        consentType: 'Principal',
        principalId: 'user-1',
        clientId: 'client-sp',
        resourceId: 'graph-sp',
        scope: 'Directory.Read.All',
      },
    },
  ],
  edges: [],
};

describe('DetailsPanel', () => {
  it('shows structured delegated-permission grant fields', () => {
    render(<DetailsPanel graph={graph} selection={{ kind: 'node', id: 'permission-1' }} />);

    expect(screen.getByText('Permission grant ID')).toBeInTheDocument();
    expect(screen.getByText('grant-1')).toBeInTheDocument();
    expect(screen.getByText('Consent type')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Client service principal ID')).toBeInTheDocument();
  });
});

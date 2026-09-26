import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FilterPanel } from './FilterPanel.tsx';
import { defaultFilterState } from '../../graph/filters/graphFilters.ts';
import { getNodeTypeIcon } from '../../graph/cytoscape/icons.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';

const graph: InvestigationGraph = {
  nodes: [
    {
      id: 'user-1',
      type: 'user',
      label: 'Ada Lovelace',
      metadata: {},
    },
  ],
  edges: [],
};

describe('FilterPanel', () => {
  it('doubles as the graph key: each object-type checkbox shows the same icon badge rendered on the canvas', () => {
    render(<FilterPanel graph={graph} filters={defaultFilterState()} onChange={vi.fn()} />);

    const label = screen.getByText('Users').closest('label');
    expect(label).not.toBeNull();

    const badge = label!.querySelector('.filter-icon-badge');
    expect(badge).not.toBeNull();
    expect((badge as HTMLElement).style.backgroundImage).toContain(getNodeTypeIcon('user'));
  });

  it('shows a direct/inherited relationship key', () => {
    render(<FilterPanel graph={graph} filters={defaultFilterState()} onChange={vi.fn()} />);

    expect(screen.getByText('Direct relationship')).toBeInTheDocument();
    expect(screen.getByText('Inherited through a group')).toBeInTheDocument();
  });
});

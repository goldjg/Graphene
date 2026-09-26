import { describe, expect, it } from 'vitest';

import { createAccessPathPositions } from './layouts.ts';

describe('createAccessPathPositions', () => {
  it('places the investigation target first and connected nodes in stable layers', () => {
    const elements = [
      {
        group: 'nodes' as const,
        data: {
          id: 'target',
          label: 'Target user',
          graphNodeType: 'user',
          isInvestigationTarget: true,
        },
      },
      {
        group: 'nodes' as const,
        data: { id: 'permission', label: 'User.Read', graphNodeType: 'delegatedPermission' },
      },
      {
        group: 'nodes' as const,
        data: { id: 'resource', label: 'Microsoft Graph', graphNodeType: 'enterpriseApplication' },
      },
      {
        group: 'edges' as const,
        data: { id: 'grant', source: 'target', target: 'permission' },
      },
      {
        group: 'edges' as const,
        data: { id: 'access', source: 'permission', target: 'resource' },
      },
    ];

    const positions = createAccessPathPositions(elements);

    expect(positions.target?.y).toBe(0);
    expect(positions.permission?.y).toBe(190);
    expect(positions.resource?.y).toBe(380);
    expect(createAccessPathPositions(elements)).toEqual(positions);
  });
});

import cytoscape from 'cytoscape';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { getGraphLayoutOptions, type GraphLayoutId } from './layouts.ts';
import { cytoscapeStylesheet } from './stylesheet.ts';

type Core = cytoscape.Core;
type ElementDefinition = cytoscape.ElementDefinition;

export interface GraphSelection {
  kind: 'node' | 'edge';
  id: string;
}

export interface GraphCanvasHandle {
  fit: () => void;
  resetView: () => void;
  zoomBy: (factor: number) => void;
  runLayout: (layoutId: GraphLayoutId) => void;
  exportElementsJson: () => unknown[];
  focusNode: (nodeId: string) => void;
  highlightElements: (elementIds: string[]) => void;
  clearHighlights: () => void;
}

interface GraphCanvasProps {
  elements: ElementDefinition[];
  layout: GraphLayoutId;
  onSelectionChange: (selection: GraphSelection | null) => void;
}

/**
 * Thin React wrapper around a Cytoscape.js core instance.
 *
 * Cytoscape elements must already be produced by
 * `src/graph/transforms/toCytoscapeElements.ts`; this component never talks
 * to Microsoft Graph or the domain model directly.
 */
export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  { elements, layout, onSelectionChange }: GraphCanvasProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const initialLayoutRef = useRef(layout);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStylesheet,
      elements: [],
    });
    cyRef.current = cy;

    const handleSelectionChange = () => {
      const selectedNode = cy.nodes(':selected')[0];

      if (selectedNode) {
        onSelectionChangeRef.current({ kind: 'node', id: selectedNode.id() });
        return;
      }

      const selectedEdge = cy.edges(':selected')[0];

      if (selectedEdge) {
        onSelectionChangeRef.current({ kind: 'edge', id: selectedEdge.id() });
        return;
      }

      onSelectionChangeRef.current(null);
    };

    cy.on('select unselect', handleSelectionChange);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;

    if (!cy) {
      return;
    }

    cy.elements().remove();
    cy.add(elements);
    cy.layout(getGraphLayoutOptions(initialLayoutRef.current, elements)).run();
    cy.fit(undefined, 40);
  }, [elements]);

  useEffect(() => {
    initialLayoutRef.current = layout;
    const cy = cyRef.current;

    if (!cy) {
      return;
    }

    cy.layout(getGraphLayoutOptions(layout, elements)).run();
  }, [elements, layout]);

  useImperativeHandle(
    ref,
    (): GraphCanvasHandle => ({
      fit: () => cyRef.current?.fit(undefined, 40),
      resetView: () => cyRef.current?.reset(),
      zoomBy: (factor) => {
        const cy = cyRef.current;

        if (cy) {
          cy.zoom(cy.zoom() * factor);
        }
      },
      runLayout: (layoutId) => {
        cyRef.current?.layout(getGraphLayoutOptions(layoutId, elements)).run();
      },
      exportElementsJson: () => cyRef.current?.elements().jsons() ?? [],
      focusNode: (nodeId) => {
        const cy = cyRef.current;
        const node = cy?.getElementById(nodeId);
        if (cy && node?.nonempty()) {
          cy.elements().unselect();
          node.select();
          cy.center(node);
        }
      },
      highlightElements: (elementIds) => {
        const cy = cyRef.current;
        if (!cy) {
          return;
        }
        cy.elements().removeClass('analysis-dimmed analysis-highlighted');
        if (elementIds.length === 0) {
          return;
        }
        cy.elements().addClass('analysis-dimmed');
        for (const id of elementIds) {
          cy.getElementById(id).removeClass('analysis-dimmed').addClass('analysis-highlighted');
        }
      },
      clearHighlights: () => {
        cyRef.current?.elements().removeClass('analysis-dimmed analysis-highlighted');
      },
    }),
    [elements],
  );

  return (
    <div
      ref={containerRef}
      className="graph-canvas"
      role="img"
      aria-label="Investigation graph rendered with Cytoscape"
    />
  );
});

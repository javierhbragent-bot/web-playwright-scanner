import type { ComponentArtifact } from '../types/artifacts.js';
import type { PageCapture } from '../explore/route-explorer.js';
import { componentId } from '../utils/id.js';

export function buildComponents(pageCaptures: PageCapture[]): ComponentArtifact[] {
  const components: ComponentArtifact[] = [];
  const seen = new Set<string>();

  for (const page of pageCaptures) {
    // Forms as components
    page.dom.forms.forEach((form, idx) => {
      const id = componentId('form', page.route, idx);
      if (seen.has(id)) return;
      seen.add(id);

      const name =
        form.inputs
          .map((i) => i.name)
          .filter(Boolean)
          .join('-') || `form-${idx}`;

      components.push({
        id,
        name: `Form: ${name}`,
        type: 'form',
        pageIds: [page.pageId],
        states: [],
        screenshotIds: [],
        relatedFlowIds: [],
        relatedApiCallIds: [],
      });
    });

    // Tables as components
    page.dom.tables.forEach((table, idx) => {
      const id = componentId('table', page.route, idx);
      if (seen.has(id)) return;
      seen.add(id);

      const name = table.headers.length > 0 ? table.headers.slice(0, 3).join(', ') : `table-${idx}`;

      components.push({
        id,
        name: `Table: ${name}`,
        type: 'table',
        pageIds: [page.pageId],
        states: [],
        screenshotIds: [],
        relatedFlowIds: [],
        relatedApiCallIds: [],
      });
    });

    // Dialogs as components
    page.dom.dialogs.forEach((dialog, idx) => {
      const id = componentId('dialog', page.route, idx);
      if (seen.has(id)) return;
      seen.add(id);

      components.push({
        id,
        name: `Dialog: ${dialog.title ?? `dialog-${idx}`}`,
        type: 'dialog',
        pageIds: [page.pageId],
        states: [{ name: dialog.open ? 'open' : 'closed' }],
        screenshotIds: [],
        relatedFlowIds: [],
        relatedApiCallIds: [],
      });
    });
  }

  return components;
}

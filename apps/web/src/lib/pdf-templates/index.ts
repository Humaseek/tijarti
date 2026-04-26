/**
 * Template registry — try each template's `detect()` in order. The first
 * match wins. If none match, the generic heuristic in pdf-extract.ts runs.
 *
 * To add a new template:
 *   1. Create `<provider>.ts` with the `TemplateParser` shape
 *   2. Import it here
 *   3. Add it to the `TEMPLATES` array
 *   4. (Optional) Add a meta-mapping if the provider has known sub-formats
 */

import type { TemplateParser } from "./types";
import { morningTemplate } from "./morning";
import { rivhitTemplate } from "./rivhit";
import { icountTemplate } from "./icount";
import { genericIsraeliTemplates } from "./generic-israeli";
import type { ExtractedInvoice } from "../pdf-extract";

// Order matters — more specific templates come first.
export const TEMPLATES: TemplateParser[] = [
  morningTemplate,           // Morning / חשבונית ירוקה (Green Invoice)
  rivhitTemplate,            // Rivhit / תוכנת ריווחית
  icountTemplate,            // iCount
  ...genericIsraeliTemplates, // EZcount, Greeninvoice, Cardcom, Bilfon, Invoice4u, Hashavshevet, YPay
];

export interface TemplateMatch {
  template: TemplateParser;
  result: ExtractedInvoice;
}

/**
 * Try every template in order. Returns the first successful parse,
 * or null if no template matches.
 */
export function tryTemplates(text: string, filename = ""): TemplateMatch | null {
  for (const t of TEMPLATES) {
    if (t.detect(text)) {
      try {
        const result = t.parse(text, filename);
        return { template: t, result };
      } catch {
        // template threw — skip it and try next
      }
    }
  }
  return null;
}

export type { TemplateParser };

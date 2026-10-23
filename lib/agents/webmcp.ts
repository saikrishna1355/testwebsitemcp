import { TOOL_NAME, TOOL_DESCRIPTION, toolInputJsonSchema } from './contract';
import { requestEstimate } from './client';
import type { EstimateResponse } from './service';

type Tool = { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<string> };
export type ModelContext = { registerTool: (tool: Tool, options?: { signal: AbortSignal }) => void | Promise<void>; unregisterTool?: (name: string) => void };
// Current document API plus the earlier navigator API. No polyfill or claim of universal support.
export function registerPremiumTool(context: ModelContext, onResult: (result: EstimateResponse) => void, onError: (message: string) => void, request = requestEstimate) {
  const controller = new AbortController();
  let registered = false;
  let disposed = false;
  const registration = context.registerTool({
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    inputSchema: toolInputJsonSchema,
    annotations: { readOnlyHint: false }, // Updates the visible calculator; no purchase or persistent write.
    execute: async (input, options) => {
      if (disposed) throw new Error('The calculator page is no longer available.');
      try {
        const result = await request(input, options?.signal);
        if (disposed || options?.signal?.aborted) throw new Error('Calculation cancelled.');
        onResult(result);
        return JSON.stringify(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Calculation failed.';
        if (!disposed) onError(message);
        throw error;
      }
    },
  }, { signal: controller.signal });
  if (registration === undefined) registered = true;
  void Promise.resolve(registration).then(() => { if (!disposed) registered = true; }).catch(() => { /* Unsupported trial API must not break the human form. */ });
  return () => { disposed = true; controller.abort(); if (registered) context.unregisterTool?.(TOOL_NAME); };
}

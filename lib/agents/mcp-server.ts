import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { agentInputSchema, TOOL_DESCRIPTION, TOOL_NAME } from './contract';
import { createEstimate, validationFailure } from './service';

export function createMcpServer() {
  const server = new McpServer({ name: 'Shriram-premium', version: '1.0.0' }, {
    instructions: 'Use calculate_premium for Shriram estimates. Ask for missing inputs. Never estimate locally or report success after a tool error. Always identify results as illustrative mock pricing, not actual insurer quotes.',
  });
  server.registerTool(TOOL_NAME, {
    title: 'Calculate Shriram premium',
    description: TOOL_DESCRIPTION,
    inputSchema: agentInputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async input => {
    try {
      const result = createEstimate(input);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], structuredContent: result };
    } catch (error) {
      const failure = error instanceof z.ZodError ? validationFailure(error) : { status: 'error', message: 'Calculation unavailable. Do not invent a premium.' };
      return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify(failure) }] };
    }
  });
  return server;
}

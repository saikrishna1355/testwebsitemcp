import { z } from 'zod';
import { createEstimate, validationFailure } from '@/lib/agents/service';
import { checkOrigin, readJson, HttpError, privateHeaders } from '@/lib/agents/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    return Response.json(createEstimate(await readJson(request)), { headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json(validationFailure(error), { status: 422, headers: privateHeaders });
    if (error instanceof HttpError) return Response.json({ status: 'error', message: error.message }, { status: error.status, headers: privateHeaders });
    return Response.json({ status: 'error', message: 'Calculation unavailable. Do not substitute an estimated premium.' }, { status: 500, headers: privateHeaders });
  }
}

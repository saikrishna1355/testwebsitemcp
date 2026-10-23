import type { EstimateResponse } from './service';
export async function requestEstimate(input: unknown, signal?: AbortSignal): Promise<EstimateResponse> {
  const timeout = AbortSignal.timeout(20_000);
  const response = await fetch('/api/premium', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: signal ? AbortSignal.any([signal, timeout]) : timeout, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || data.status !== 'success') throw new Error(data.issues?.map((issue: { field: string; message: string }) => `${issue.field}: ${issue.message}`).join(' ') || data.message || 'Calculation failed. Please try again.');
  return data as EstimateResponse;
}

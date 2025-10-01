import { vi } from 'vitest';

/**
 * Mock fetch for API tests
 */
export function mockFetch(response: any, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

/**
 * Mock fetch with error
 */
export function mockFetchError(error: Error) {
  return vi.fn().mockRejectedValue(error);
}

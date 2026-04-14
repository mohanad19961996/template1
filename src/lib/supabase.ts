import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_FETCH_TIMEOUT_MS = 4000;

function createTimeoutSignal(signal?: AbortSignal, timeoutMs: number = SUPABASE_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const abortFromUpstream = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortFromUpstream, { once: true });
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (signal && !signal.aborted) {
        signal.removeEventListener('abort', abortFromUpstream);
      }
    },
  };
}

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) {
  const { signal, cleanup } = createTimeoutSignal(init?.signal ?? undefined);

  try {
    return await fetch(input, { ...init, signal });
  } finally {
    cleanup();
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetchWithTimeout,
  },
});

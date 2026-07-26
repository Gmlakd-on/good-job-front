const STORAGE_PREFIX = "goodjob:idempotency:";
const KEY_TTL_MS = 2 * 60 * 60 * 1000;

type StoredRequestKey = {
  fingerprint: string;
  key: string;
  createdAt: number;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(source).sort()) {
      const item = source[key];
      if (item !== undefined) {
        result[key] = canonicalize(item);
      }
    }

    return result;
  }

  return value;
}

function fallbackFingerprint(input: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}:${input.length}`;
}

async function fingerprintPayload(payload: unknown): Promise<string> {
  const input = JSON.stringify(canonicalize(payload)) ?? "null";
  const browserCrypto = globalThis.crypto;

  if (browserCrypto?.subtle) {
    try {
      const digest = await browserCrypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(input),
      );
      return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    } catch {
      // Fall through to the deterministic non-cryptographic fingerprint.
    }
  }

  return fallbackFingerprint(input);
}

function createRequestKey(): string {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID();
  }

  if (browserCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    browserCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export async function getOrCreateIdempotencyKey(
  scope: string,
  payload: unknown,
): Promise<string> {
  const storage = getStorage();
  const fingerprint = await fingerprintPayload(payload);
  const storageKey = `${STORAGE_PREFIX}${scope}`;
  const now = Date.now();

  if (storage) {
    try {
      const raw = storage.getItem(storageKey);
      if (raw) {
        const existing = JSON.parse(raw) as StoredRequestKey;
        const isFresh = now - existing.createdAt <= KEY_TTL_MS;
        if (isFresh && existing.fingerprint === fingerprint && existing.key) {
          return existing.key;
        }
      }
    } catch {
      try {
        storage.removeItem(storageKey);
      } catch {
        // Ignore storage recovery failures.
      }
    }
  }

  const key = createRequestKey();
  if (storage) {
    try {
      const value: StoredRequestKey = { fingerprint, key, createdAt: now };
      storage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage can be blocked in strict privacy modes. The request still works,
      // but a manual retry cannot reuse the same key in that environment.
    }
  }

  return key;
}

export function clearIdempotencyKey(scope: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(`${STORAGE_PREFIX}${scope}`);
  } catch {
    // Ignore storage cleanup failures.
  }
}

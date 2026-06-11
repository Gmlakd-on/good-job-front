/**
 * fetch 래퍼 — 재시도, 타임아웃, 에러 메시지 표준화
 */

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 2, retryDelay = 1000, timeout = 15000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 429 (Rate Limit) or 5xx → 재시도
      if (!response.ok && attempt < retries && (response.status === 429 || response.status >= 500)) {
        await delay(retryDelay * (attempt + 1));
        continue;
      }

      return response;
    } catch (err) {
      if (attempt < retries) {
        await delay(retryDelay * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  // 도달하지 않지만 TypeScript용
  throw new Error("요청에 실패했어요.");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** API 응답에서 에러 메시지 추출 */
export async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || "오류가 발생했어요.";
  } catch {
    return "오류가 발생했어요.";
  }
}

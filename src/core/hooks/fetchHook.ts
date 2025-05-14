export type FetchLogData = {
  url: string;
  method: string;
  requestBody?: string | FormData | URLSearchParams | undefined;
  response?: string;
  status?: number;
  error?: unknown;
  timestamp: number;
};

let originalFetch: typeof fetch | null = null;

const fetchLogs: FetchLogData[] = [];

/**
 * fetch를 가로채는 훅 설치 함수
 * @param onFetch 로그 발생 시 호출할 콜백 함수 (선택)
 */
export const installFetchHook = (onFetch?: (log: FetchLogData) => void) => {
  if (typeof window === 'undefined' || !window.fetch) {
    console.warn('fetch is not available in this environment.');
    return;
  }

  if (originalFetch) return;

  originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method || 'GET';
    const requestBody = init?.body as string | FormData | URLSearchParams | undefined;
    const timestamp = Date.now();

    const logData: FetchLogData = {
      url: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      method,
      requestBody,
      timestamp,
    };

    try {
      const response = await originalFetch!(input, init);
      const clonedResponse = response.clone();
      const responseBody = await clonedResponse.text();

      logData.status = response.status;
      logData.response = responseBody;

      fetchLogs.push(logData);
      onFetch?.(logData);

      return response;
    } catch (error: unknown) {
      logData.error = error;
      fetchLogs.push(logData);
      onFetch?.(logData);

      throw error;
    }
  };
};

/**
 * 가로챈 fetch를 원본으로 복원하는 함수
 */
export const restoreFetchHook = () => {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
};

export type ErrorLogData = {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
  type: 'error' | 'unhandledrejection';
  timestamp: number;
};

// 로그 저장 배열
const errorLogs: ErrorLogData[] = [];

// 원래 핸들러 저장용
let originalOnError: typeof window.onerror | null = null;
let originalOnUnhandledRejection: typeof window.onunhandledrejection | null = null;

/**
 * 전역 에러 훅 설치 함수
 * @param onError 에러 발생 시 호출할 콜백 함수 (선택)
 */
export const installErrorHook = (onError?: (log: ErrorLogData) => void) => {
  if (typeof window === 'undefined') {
    console.warn('error hook is not available in this environment.');
    return;
  }

  // 중복 설치 방지
  if (originalOnError || originalOnUnhandledRejection) return;

  // 기존 핸들러 백업
  originalOnError = window.onerror;
  originalOnUnhandledRejection = window.onunhandledrejection;

  // 전역 error 핸들러
  window.onerror = (message, source, lineno, colno, error) => {
    const logData: ErrorLogData = {
      message: String(message),
      source: source || undefined,
      lineno: lineno || undefined,
      colno: colno || undefined,
      error: error || undefined,
      type: 'error',
      timestamp: Date.now(),
    };

    errorLogs.push(logData);
    onError?.(logData);

    // 기존 핸들러 호출 (있다면)
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }

    return false;
  };

  // unhandledrejection 핸들러
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const logData: ErrorLogData = {
      message: event.reason ? String(event.reason) : 'Unhandled Promise rejection',
      error: event.reason,
      type: 'unhandledrejection',
      timestamp: Date.now(),
    };

    errorLogs.push(logData);
    onError?.(logData);

    // 기존 핸들러 호출 (있다면)
    originalOnUnhandledRejection?.call(window, event);
  };
};

/**
 * 전역 에러 핸들러 원복 함수
 */
export const restoreErrorHook = () => {
  if (typeof window === 'undefined') return;

  if (originalOnError) {
    window.onerror = originalOnError;
    originalOnError = null;
  }

  if (originalOnUnhandledRejection) {
    window.onunhandledrejection = originalOnUnhandledRejection;
    originalOnUnhandledRejection = null;
  }
};

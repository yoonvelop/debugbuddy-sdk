import {HookManager} from "../core/manager/hookManager";
import {LogData} from "../core/hooks/consoleHook";
import {ErrorLogData} from "../core/hooks/errorHook";
import {FetchLogData} from "../core/hooks/fetchHook";

// 메시지 타입 정의
type LogsUpdateMessage = {
  type: 'LOGS_UPDATE';
  payload: {
    console: LogData[];
    error: ErrorLogData[];
    fetch: FetchLogData[];
  };
};

/**
 * 콘텐츠 스크립트에서 안전하게 로그를 출력하는 함수
 * 특별한 접두사를 사용하여 페이지 컨텍스트에서 필터링되도록 함
 */
const safeLog = (message: string, data?: unknown): void => {
  const prefix = '[DebugBuddy]';
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};

safeLog('✅ DebugBuddy content script loaded');

// 페이지 컨텍스트에 직접 스크립트 주입하지 않고 콘솔 로그 가로채기
function setupConsoleHook() {
  safeLog('콘솔 훅 설정 시작');

  // 원본 console 메서드 저장
  const originalConsole: Record<string, any> = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  /**
   * 디버그 관련 메시지인지 확인하는 함수
   * @param args 로그 인자 배열
   * @returns 디버그 메시지 여부
   */
  const isDebugMessage = (args: unknown[]): boolean => {
    if (args.length === 0) return false;

    // 디버그 메시지 키워드 목록
    const debugKeywords = [
      'DebugBuddy',
      '[DebugBuddy]',
      '백그라운드로 로그 전송',
      'Hook 설치 완료',
      'HookManager 상태'
    ];

    try {
      // 첫 번째 인자를 문자열로 변환하여 키워드 포함 여부 확인
      const firstArgStr = String(args[0]);
      return debugKeywords.some(keyword => firstArgStr.includes(keyword));
    } catch (e) {
      // 변환 중 오류 발생 시 안전하게 false 반환
      return false;
    }
  };

  /** 현재 처리 중인 로그 추적을 위한 플래그 */
  let isProcessingLog = false;

  /** 지원하는 콘솔 로그 레벨 */
  type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

  /**
   * 콘솔 로그 이벤트 생성 및 전송 함수
   * @param level 로그 레벨
   * @param args 로그 인자 배열
   */
  const createConsoleLogEvent = (level: ConsoleLevel, args: unknown[]): void => {
    // 로그 데이터 처리 및 백그라운드로 전송
    sendLogsToBackground({
      console: [{
        level,
        message: sanitizeLogMessage(args),
        timestamp: Date.now()
      }],
      error: [],
      fetch: []
    });
  };

  // console 메서드 재정의
  (['log', 'info', 'warn', 'error'] as ConsoleLevel[]).forEach(level => {
    (console as Record<string, any>)[level] = function(...args: unknown[]) {
      // 이미 로그 처리 중이거나 디버그 메시지인 경우 원본 메서드만 호출하고 종료
      if (isProcessingLog || isDebugMessage(args)) {
        originalConsole[level].apply(console, args);
        return;
      }

      // 로그 처리 중 플래그 설정
      isProcessingLog = true;

      try {
        // 원본 메서드 호출
        originalConsole[level].apply(console, args);

        // 로그 데이터 생성 및 처리
        createConsoleLogEvent(level, args);
      } catch (e) {
        // 오류 발생 시 원본 콘솔로 오류 출력
        originalConsole.error('DebugBuddy 로그 처리 중 오류:', e);
      } finally {
        // 로그 처리 완료 플래그 해제
        isProcessingLog = false;
      }
    };
  });

  safeLog('✅ 콘솔 훅 설정 완료');
}

// 페이지 로드 시 콘솔 훅 설정
setupConsoleHook();
safeLog('HookManager 상태:', HookManager.getStatus());

/**
 * 로그 데이터를 백그라운드로 전송하는 함수
 * @param logs 전송할 로그 데이터
 */
const sendLogsToBackground = (logs: {
  console: LogData[];
  error: ErrorLogData[];
  fetch: FetchLogData[];
}): void => {
  try {
    // 로그 데이터가 없으면 전송하지 않음
    if (logs.console.length === 0 && logs.error.length === 0 && logs.fetch.length === 0) {
      return;
    }

    // 로그 전송 정보 출력 (디버깅용)
    safeLog('백그라운드로 로그 전송:', {
      console: logs.console.length,
      error: logs.error.length,
      fetch: logs.fetch.length
    });

    // 로그 데이터 복사 및 제한
    const safePayload = limitLogSize(logs);

    // 메시지 생성
    const message: LogsUpdateMessage = {
      type: 'LOGS_UPDATE',
      payload: safePayload
    };

    // 메시지 전송
    sendMessageToBackground(message);
  } catch (e) {
    safeLog('로그 전송 준비 중 오류:', e);
  }
};

/**
 * 로그 데이터 크기를 제한하는 함수
 * @param logs 원본 로그 데이터
 * @returns 크기가 제한된 로그 데이터
 */
const limitLogSize = (logs: {
  console: LogData[];
  error: ErrorLogData[];
  fetch: FetchLogData[];
}): {
  console: LogData[];
  error: ErrorLogData[];
  fetch: FetchLogData[];
} => {
  const MAX_ITEMS = 50;
  const result = {
    console: [...logs.console],
    error: [...logs.error],
    fetch: [...logs.fetch]
  };

  if (result.console.length > MAX_ITEMS) {
    result.console = result.console.slice(-MAX_ITEMS);
  }
  if (result.error.length > MAX_ITEMS) {
    result.error = result.error.slice(-MAX_ITEMS);
  }
  if (result.fetch.length > MAX_ITEMS) {
    result.fetch = result.fetch.slice(-MAX_ITEMS);
  }

  return result;
};

/**
 * 백그라운드로 메시지를 전송하는 함수
 * @param message 전송할 메시지
 */
const sendMessageToBackground = (message: LogsUpdateMessage): void => {
  try {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        // 메시지 포트 닫힘 에러는 일반적인 상황이므로 무시
        const errorMessage = chrome.runtime.lastError.message || '';
        if (!errorMessage.includes('message port closed')) {
          safeLog('백그라운드 메시지 전송 오류:', chrome.runtime.lastError);
        }
      } else if (response) {
        // 응답이 있을 때만 로그 출력
        safeLog('백그라운드 응답:', response);
      }
    });
  } catch (e) {
    safeLog('백그라운드 메시지 전송 중 예외 발생:', e);
  }
};

/**
 * 로그 메시지를 안전하게 처리하는 함수
 * @param message 원본 로그 메시지 배열
 * @returns 안전하게 처리된 로그 메시지 배열
 */
const sanitizeLogMessage = (message: unknown[]): unknown[] => {
  try {
    // 메시지가 너무 크거나 복잡한 경우 간소화
    return message.map(item => {
      // null 또는 undefined 처리
      if (item === null) return 'null';
      if (item === undefined) return 'undefined';

      // 객체 처리
      if (typeof item === 'object') {
        return sanitizeObjectValue(item);
      }

      // 기본 타입은 그대로 반환
      return item;
    });
  } catch (e) {
    // 오류 발생 시 안전한 값 반환
    safeLog('로그 메시지 처리 중 오류:', e);
    return ['[로그 처리 오류]'];
  }
};

/**
 * 객체 값을 안전하게 처리하는 함수
 * @param value 처리할 객체
 * @returns 안전하게 처리된 값
 */
const sanitizeObjectValue = (value: object): string => {
  try {
    // 객체를 문자열로 변환 시도
    const str = JSON.stringify(value, null, 2);

    // 문자열이 너무 길면 잘라내기
    const MAX_LENGTH = 1000;
    return str.length > MAX_LENGTH
      ? str.substring(0, MAX_LENGTH) + '... (truncated)'
      : str;
  } catch (e) {
    // JSON 변환 실패 시 객체 타입만 반환
    const constructorName = value &&
      typeof value === 'object' &&
      'constructor' in value &&
      value.constructor?.name
        ? value.constructor.name
        : 'Object';

    return `[${constructorName}]`;
  }
};

/**
 * 에러 객체를 안전하게 처리하는 함수
 * @param log 원본 에러 로그
 * @returns 안전하게 처리된 에러 로그
 */
const sanitizeErrorLog = (log: ErrorLogData): ErrorLogData => {
  try {
    // 에러 객체가 너무 크거나 복잡한 경우 간소화
    const sanitizedLog = { ...log };

    if (sanitizedLog.error) {
      sanitizedLog.error = sanitizeErrorObject(sanitizedLog.error);
    }

    return sanitizedLog;
  } catch (e) {
    safeLog('에러 로그 처리 중 오류:', e);
    return {
      message: '[에러 로그 처리 오류]',
      type: 'error',
      timestamp: Date.now()
    };
  }
};

/**
 * 에러 객체를 안전하게 처리하는 함수
 * @param error 처리할 에러 객체
 * @returns 안전하게 처리된 에러 객체
 */
const sanitizeErrorObject = (error: unknown): unknown => {
  try {
    // Error 객체인 경우 필요한 정보만 추출
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 1000)
      };
    }

    // 객체인 경우 JSON으로 변환 시도
    if (error !== null && typeof error === 'object') {
      return sanitizeObjectValue(error);
    }

    // 기본 타입은 그대로 반환
    return error;
  } catch (e) {
    return '[에러 객체 처리 실패]';
  }
};

/**
 * fetch 로그를 안전하게 처리하는 함수
 * @param log 원본 fetch 로그
 * @returns 안전하게 처리된 fetch 로그
 */
const sanitizeFetchLog = (log: FetchLogData): FetchLogData => {
  try {
    // fetch 로그가 너무 크거나 복잡한 경우 간소화
    const sanitizedLog = { ...log };

    // 응답 데이터 처리
    if (sanitizedLog.response) {
      sanitizedLog.response = sanitizeTextContent(sanitizedLog.response);
    }

    // 요청 바디 처리
    if (sanitizedLog.requestBody) {
      sanitizedLog.requestBody = sanitizeTextContent(sanitizedLog.requestBody);
    }

    // 에러 객체 처리
    if (sanitizedLog.error) {
      sanitizedLog.error = sanitizeErrorObject(sanitizedLog.error);
    }

    return sanitizedLog;
  } catch (e) {
    safeLog('fetch 로그 처리 중 오류:', e);
    return {
      url: log.url || '[URL 처리 오류]',
      method: log.method || 'UNKNOWN',
      timestamp: Date.now()
    };
  }
};

/**
 * 텍스트 내용을 안전하게 처리하는 함수
 * @param content 처리할 텍스트 내용
 * @returns 안전하게 처리된 텍스트
 */
const sanitizeTextContent = (content: unknown): string => {
  const MAX_LENGTH = 1000;

  if (typeof content === 'string') {
    return content.length > MAX_LENGTH
      ? content.substring(0, MAX_LENGTH) + '... (truncated)'
      : content;
  }

  try {
    // 문자열이 아닌 경우 JSON으로 변환 시도
    if (content !== null && typeof content === 'object') {
      return sanitizeObjectValue(content);
    }

    // 기타 타입은 문자열로 변환
    return String(content);
  } catch (e) {
    return '[텍스트 처리 실패]';
  }
};

/**
 * 에러 발생 시 호출될 콜백 함수
 * @param log 에러 로그 데이터
 */
const onError = (log: ErrorLogData): void => {
  try {
    const sanitizedLog = sanitizeErrorLog(log);
    sendLogsToBackground({
      console: [],
      error: [sanitizedLog],
      fetch: []
    });
  } catch (e) {
    safeLog('에러 로그 전송 중 오류:', e);
  }
};

/**
 * fetch 요청 발생 시 호출될 콜백 함수
 * @param log fetch 로그 데이터
 */
const onFetch = (log: FetchLogData): void => {
  try {
    const sanitizedLog = sanitizeFetchLog(log);
    sendLogsToBackground({
      console: [],
      error: [],
      fetch: [sanitizedLog]
    });
  } catch (e) {
    safeLog('fetch 로그 전송 중 오류:', e);
  }
};

// 에러와 fetch 훅 설치 (콘솔 훅은 페이지 컨텍스트에 직접 주입했으므로 제외)
HookManager.install('error', onError);
HookManager.install('fetch', onFetch);
safeLog('✅ Hook 설치 완료, 상태:', HookManager.getStatus());

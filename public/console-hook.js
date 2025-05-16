// 원본 콘솔 메서드 저장
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// 순환 참조 감지를 위한 Set
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    // 함수 처리
    if (typeof value === 'function') return 'function() { ... }';

    // 심볼 처리
    if (typeof value === 'symbol') return value.toString();

    // 객체가 아니거나 null인 경우 그대로 반환
    if (typeof value !== 'object' || value === null) return value;

    // 순환 참조 감지
    if (seen.has(value)) return '[Circular Reference]';
    seen.add(value);

    // Error 객체 처리 (AxiosError 등 확장된 에러 객체 포함)
    if (value instanceof Error) {
      const errorObj = {
        name: value.name,
        message: value.message,
        stack: value.stack
      };

      // 추가 속성들 복사 (AxiosError의 response, config, code 등)
      Object.getOwnPropertyNames(value).forEach(prop => {
        if (!errorObj[prop] && prop !== 'toJSON') {
          try {
            const propValue = value[prop];
            // 너무 큰 객체는 요약 정보만 포함
            if (prop === 'config' && propValue && typeof propValue === 'object') {
              errorObj[prop] = {
                url: propValue.url,
                method: propValue.method,
                headers: propValue.headers,
                // 다른 중요 설정들만 선택적으로 포함
              };
            } else if (prop === 'request' && propValue) {
              // XMLHttpRequest 객체는 간략화
              errorObj[prop] = '[XMLHttpRequest]';
            } else if (prop === 'response' && propValue && typeof propValue === 'object') {
              // response 객체에서 중요 정보만 추출
              errorObj[prop] = {
                status: propValue.status,
                statusText: propValue.statusText,
                data: propValue.data
              };
            } else {
              errorObj[prop] = propValue;
            }
          } catch (e) {
            errorObj[prop] = `[Error accessing property: ${e.message}]`;
          }
        }
      });

      return errorObj;
    }

    return value;
  };
};

// 콘솔 메서드 재정의
console.log = function(...args) {
  // 원본 메서드 호출
  originalConsole.log.apply(console, args);

  // 콘텐츠 스크립트로 로그 전송
  window.dispatchEvent(new CustomEvent('debugbuddy_console', {
    detail: {
      level: 'log',
      args: JSON.stringify(args, getCircularReplacer())
    }
  }));
};

// 다른 콘솔 메서드도 유사하게 재정의
console.info = function(...args) {
  originalConsole.info.apply(console, args);
  window.dispatchEvent(new CustomEvent('debugbuddy_console', {
    detail: { level: 'info', args: JSON.stringify(args, getCircularReplacer()) }
  }));
};

console.warn = function(...args) {
  originalConsole.warn.apply(console, args);
  window.dispatchEvent(new CustomEvent('debugbuddy_console', {
    detail: { level: 'warn', args: JSON.stringify(args, getCircularReplacer()) }
  }));
};

console.error = function(...args) {
  originalConsole.error.apply(console, args);
  window.dispatchEvent(new CustomEvent('debugbuddy_console', {
    detail: { level: 'error', args: JSON.stringify(args, getCircularReplacer()) }
  }));
};

console.debug = function(...args) {
  originalConsole.debug ? originalConsole.debug.apply(console, args) : originalConsole.log.apply(console, args);
  window.dispatchEvent(new CustomEvent('debugbuddy_console', {
    detail: { level: 'debug', args: JSON.stringify(args, getCircularReplacer()) }
  }));
};

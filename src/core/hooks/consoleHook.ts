// 지원하는 로그 레벨 타입 정의
export type LogLevel = 'log' | 'info' | 'warn' | 'error';

// 로그 데이터 타입 정의
export type LogData = {
    level: LogLevel;         // 로그 레벨
    message: unknown[];      // 로그에 전달된 값들 (unknown 타입 배열)
    timestamp: number;       // 로그 발생 시간 (밀리초 단위)
};

// 원본 console 메서드를 저장할 객체
let originalConsole: Partial<Record<LogLevel, (...args: unknown[]) => void>> = {};

// 수집한 로그 데이터를 저장하는 배열
const logs: LogData[] = [];

/**
 * 콘솔 메서드(console.log, console.info, console.warn, console.error)를 가로채서
 * 로그 데이터를 가공하고, 콜백으로 전달하거나, 내부 배열에 저장하는 함수
 *
 * @param onLog 로그 발생 시 호출되는 콜백 함수 (선택)
 */
export const installConsoleHook = (onLog?: (log: LogData) => void) => {
    (['log', 'info', 'warn', 'error'] as LogLevel[]).forEach((level) => {
        // 기존 console 메서드를 저장해둠
        originalConsole[level] = console[level];

        // console 메서드 재정의
        console[level] = (...args: unknown[]) => {
            const logData: LogData = {
                level,
                message: args,
                timestamp: Date.now(),
            };

            logs.push(logData);
            onLog?.(logData);
            originalConsole[level]?.apply(console, args);
        };
    });
};

/**
 * 가로챈 콘솔 메서드를 원래 상태로 복원하는 함수
 */
export const restoreConsoleHook = () => {
    (['log', 'info', 'warn', 'error'] as LogLevel[]).forEach((level) => {
        if (originalConsole[level]) {
            console[level] = originalConsole[level]!;
        }
    });
};


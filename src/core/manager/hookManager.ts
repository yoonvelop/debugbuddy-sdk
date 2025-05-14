import { installConsoleHook, restoreConsoleHook, LogData } from '../hooks/consoleHook';
import { installFetchHook, restoreFetchHook, FetchLogData } from '../hooks/fetchHook';
import { ErrorLogData, installErrorHook, restoreErrorHook } from '../hooks/errorHook';

/**
 * 설치/해제 가능한 Hook 종류 정의
 */
type HookType = 'console' | 'fetch' | 'error';

/**
 * HookManager는 여러 Hook을 한 번에 설치/해제하고
 * 개별 Hook의 설치 상태를 관리하는 역할을 한다.
 */
export const HookManager = (() => {
    // 어떤 Hook이 설치됐는지 관리하는 상태 객체
    const installedHooks: Record<HookType, boolean> = {
        console: false,
        fetch: false,
        error: false,
    };

    return {

        /**
         * 특정 Hook만 설치
         * @param type Hook 타입
         * @param callback Hook 타입에 따른 콜백 함수 (선택)
         */
        install(type: HookType, callback?: (log: any) => void) {
            if (type === 'console' && !installedHooks.console) {
                installConsoleHook(callback);
                installedHooks.console = true;
            }
            if (type === 'fetch' && !installedHooks.fetch) {
                installFetchHook(callback);
                installedHooks.fetch = true;
            }
            if (type === 'error' && !installedHooks.error) {
                installErrorHook(callback);
                installedHooks.error = true;
            }
        },


        /**
         * 현재 설치 상태 확인
         * @returns 설치 상태 객체
         */
        getStatus() {
            return { ...installedHooks };
        },
    };
})();

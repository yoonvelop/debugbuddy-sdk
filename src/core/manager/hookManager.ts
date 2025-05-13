import { installConsoleHook, restoreConsoleHook} from '../hooks/consoleHook';
import {installFetchHook, restoreFetchHook} from '../hooks/fetchHook';
import {ErrorLogData, installErrorHook, restoreErrorHook} from '../hooks/errorHook';

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
         * 모든 Hook 설치
         */
        installAll() {
            if (!installedHooks.console) {
                installConsoleHook();
                installedHooks.console = true;
            }
            if (!installedHooks.fetch) {
                installFetchHook();
                installedHooks.fetch = true;
            }
            if (!installedHooks.error) {
                installErrorHook();
                installedHooks.error = true;
            }
        },

        /**
         * 모든 Hook 해제
         */
        uninstallAll() {
            if (installedHooks.console) {
                restoreConsoleHook();
                installedHooks.console = false;
            }
            if (installedHooks.fetch) {
                restoreFetchHook();
                installedHooks.fetch = false;
            }
            if (installedHooks.error) {
                restoreErrorHook();
                installedHooks.error = false;
            }
        },

        /**
         * 특정 Hook만 설치
         * @param type Hook 타입
         * @param onError
         */
        install(type: HookType, onError?: (log: ErrorLogData) => void) {
            if (type === 'console' && !installedHooks.console) {
                installConsoleHook();
                installedHooks.console = true;
            }
            if (type === 'fetch' && !installedHooks.fetch) {
                installFetchHook();
                installedHooks.fetch = true;
            }
            if (type === 'error' && !installedHooks.error) {
                installErrorHook(onError);
                installedHooks.error = true;
            }
        },

        /**
         * 특정 Hook만 해제
         * @param type Hook 타입
         */
        uninstall(type: HookType) {
            if (type === 'console' && installedHooks.console) {
                restoreConsoleHook();
                installedHooks.console = false;
            }
            if (type === 'fetch' && installedHooks.fetch) {
                restoreFetchHook();
                installedHooks.fetch = false;
            }
            if (type === 'error' && installedHooks.error) {
                restoreErrorHook();
                installedHooks.error = false;
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

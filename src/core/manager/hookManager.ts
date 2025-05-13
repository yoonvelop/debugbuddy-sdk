import { initConsoleHook, restoreConsole } from '../hooks/consoleHook';
import { installFetchHook, restoreFetch } from '../hooks/fetchHook';

/**
 * 설치/해제 가능한 Hook 종류 정의
 */
type HookType = 'console' | 'fetch';

/**
 * HookManager는 여러 Hook을 한 번에 설치/해제하고
 * 개별 Hook의 설치 상태를 관리하는 역할을 한다.
 */
export const HookManager = (() => {
    // 어떤 Hook이 설치됐는지 관리하는 상태 객체
    const installedHooks: Record<HookType, boolean> = {
        console: false,
        fetch: false,
    };

    return {
        /**
         * 모든 Hook 설치
         */
        installAll() {
            if (!installedHooks.console) {
                initConsoleHook();
                installedHooks.console = true;
            }
            if (!installedHooks.fetch) {
                installFetchHook();
                installedHooks.fetch = true;
            }
        },

        /**
         * 모든 Hook 해제
         */
        uninstallAll() {
            if (installedHooks.console) {
                restoreConsole();
                installedHooks.console = false;
            }
            if (installedHooks.fetch) {
                restoreFetch();
                installedHooks.fetch = false;
            }
        },

        /**
         * 특정 Hook만 설치
         * @param type Hook 타입
         */
        install(type: HookType) {
            if (type === 'console' && !installedHooks.console) {
                initConsoleHook();
                installedHooks.console = true;
            }
            if (type === 'fetch' && !installedHooks.fetch) {
                installFetchHook();
                installedHooks.fetch = true;
            }
        },

        /**
         * 특정 Hook만 해제
         * @param type Hook 타입
         */
        uninstall(type: HookType) {
            if (type === 'console' && installedHooks.console) {
                restoreConsole();
                installedHooks.console = false;
            }
            if (type === 'fetch' && installedHooks.fetch) {
                restoreFetch();
                installedHooks.fetch = false;
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

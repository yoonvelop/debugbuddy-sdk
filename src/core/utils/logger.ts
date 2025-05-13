export function log(message: string) {
    console.log(`[DebugBuddy] ${message}`);
}
import { initConsoleHook, restoreConsole, getLogs } from '../hooks/consoleHook';

initConsoleHook((log) => {
    // 로그 발생할 때마다 호출됨
    console.info('📝 Hooked log:', log);
});

console.log('Hello from log!');
console.warn('Hello from warn!');
console.error('Hello from error!');
console.info('Hello from info!');

console.table([{ name: 'DebugBuddy', status: '✅' }]);

console.log('📝 현재 로그 목록:', getLogs());

restoreConsole();

console.log('restore 이후 정상 로그');

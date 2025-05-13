import { HookManager } from '../manager/hookManager';


import { getErrorLogs } from '../hooks/errorHook';

HookManager.install('error', (log) => {
    console.log('💥 ErrorHook에서 수집한 로그:', log);
});

console.log('콘솔 테스트');
fetch('https://jsonplaceholder.typicode.com/posts/1');

setTimeout(() => {
    throw new Error('테스트 에러 발생');
}, 1000);

Promise.reject('테스트 unhandled rejection');

setTimeout(() => {
    console.log('설치 상태:', HookManager.getStatus());
    console.log('📝 수집된 에러 로그:', getErrorLogs());
    HookManager.uninstallAll();
    console.log('모두 해제 후 상태:', HookManager.getStatus());
}, 5000);

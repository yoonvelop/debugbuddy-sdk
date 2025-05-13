import { HookManager } from '../manager/hookManager';

HookManager.installAll();

console.log('Hello from debugbuddy!');
console.warn('경고입니다!');
console.error('에러 발생!');

console.log('현재 상태:', HookManager.getStatus());

HookManager.uninstallAll();

console.log('이건 더이상 가로채지 않음');

fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(res => res.json())
    .then(data => console.log('fetch 응답', data))
    .catch(err => console.error('fetch 에러', err));

setTimeout(() => {
    console.log('설치 상태:', HookManager.getStatus());
    HookManager.uninstallAll();
    console.log('hook 해제 후 로그');
}, 3000);

import { HookManager } from '../manager/hookManager';

HookManager.installAll();

console.log('Hello from debugbuddy!');
console.warn('경고입니다!');
console.error('에러 발생!');

console.log('현재 상태:', HookManager.getStatus());

HookManager.uninstallAll();

console.log('이건 더이상 가로채지 않음');

import { initConsoleHook } from "../hooks/consoleHook";

initConsoleHook();

console.log("테스트 로그: Hello from browser");
console.warn("테스트 워닝");
console.error("테스트 에러");

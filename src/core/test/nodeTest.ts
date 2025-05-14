import { installConsoleHook } from "../hooks/consoleHook.js";

installConsoleHook();

console.log("테스트 로그: Hello from node");
console.warn("테스트 워닝");
console.error("테스트 에러");

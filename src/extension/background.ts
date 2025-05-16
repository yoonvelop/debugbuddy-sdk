import { LogData } from '../core/hooks/consoleHook';
import { ErrorLogData } from '../core/hooks/errorHook';
import { FetchLogData } from '../core/hooks/fetchHook';

/**
 * 디버그 로그 데이터 타입
 */
interface DebugLogsData {
  console: LogData[];
  error: ErrorLogData[];
  fetch: FetchLogData[];
}

/**
 * 로그 데이터를 저장할 객체
 */
const debugLogs: DebugLogsData = {
  console: [],
  error: [],
  fetch: [],
};

/**
 * 로그 데이터를 스토리지에서 로드하는 함수
 */
function loadLogsFromStorage(): void {
  chrome.storage.local.get('debugLogs', (result) => {
    if (result.debugLogs) {
      debugLogs.console = result.debugLogs.console || [];
      debugLogs.error = result.debugLogs.error || [];
      debugLogs.fetch = result.debugLogs.fetch || [];
    }
  });
}

/**
 * 로그 데이터를 스토리지에 저장하는 함수
 */
function saveLogsToStorage(): void {
  chrome.storage.local.set({ debugLogs });
}

/**
 * 로그 업데이트 메시지 타입
 */
interface LogsUpdateMessage {
  type: 'LOGS_UPDATE';
  payload: DebugLogsData;
}

/**
 * 로그 요청 메시지 타입
 */
interface GetLogsMessage {
  type: 'GET_LOGS';
}

/**
 * 로그 초기화 메시지 타입
 */
interface ClearLogsMessage {
  type: 'CLEAR_LOGS';
}

/**
 * 메시지 유니온 타입
 */
type Message = LogsUpdateMessage | GetLogsMessage | ClearLogsMessage;

/**
 * 로그 데이터 업데이트 처리 함수
 * @param message 로그 업데이트 메시지
 */
function handleLogsUpdate(message: LogsUpdateMessage): void {
  // 새로운 로그 데이터 추가
  debugLogs.console = [...debugLogs.console, ...message.payload.console];
  debugLogs.error = [...debugLogs.error, ...message.payload.error];
  debugLogs.fetch = [...debugLogs.fetch, ...message.payload.fetch];

  // 스토리지에 저장
  saveLogsToStorage();
}

/**
 * 로그 데이터 초기화 함수
 * @returns 성공 여부 객체
 */
function clearLogs(): { success: boolean } {
  debugLogs.console = [];
  debugLogs.error = [];
  debugLogs.fetch = [];

  // 스토리지에서도 삭제
  saveLogsToStorage();

  return { success: true };
}

/**
 * 콘텐츠 스크립트에서 전송한 메시지 처리
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case 'LOGS_UPDATE':
      handleLogsUpdate(message);
      break;

    case 'GET_LOGS':
      sendResponse(debugLogs);
      return true; // 비동기 응답을 위해 true 반환

    case 'CLEAR_LOGS':
      sendResponse(clearLogs());
      return true;
  }
});

/**
 * 익스텐션 설치 시 이벤트 핸들러
 * 초기 설정 및 환영 메시지 표시
 */
chrome.runtime.onInstalled.addListener(() => {
  // 개발 모드에서만 로그 출력
  if (import.meta.env.DEV) {
    console.log('✅ DebugBuddy 익스텐션이 설치되었습니다.');
  }
});

// 백그라운드 스크립트 시작 시 스토리지에서 로그 로드
loadLogsFromStorage();

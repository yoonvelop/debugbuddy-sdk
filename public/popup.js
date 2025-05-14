// 현재 활성화된 탭
let activeTab = 'console';

// 로그 데이터
let logs = {
  console: [],
  error: [],
  fetch: [],
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // 탭 클릭 이벤트 리스너 등록
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      // 이전 활성 탭 비활성화
      document.querySelector('.tab.active').classList.remove('active');
      // 새 탭 활성화
      tab.classList.add('active');
      // 활성 탭 업데이트
      activeTab = tab.dataset.tab;
      // 로그 표시 업데이트
      renderLogs();
    });
  });

  // 로그 지우기 버튼
  document.getElementById('clear-logs').addEventListener('click', () => {
    // 백그라운드에 로그 지우기 요청
    chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' }, () => {
      // 로컬 로그 데이터 초기화
      logs = { console: [], error: [], fetch: [] };
      // UI 업데이트
      renderLogs();
      updateLogCount();
    });
  });

  // 로그 복사 버튼
  document.getElementById('copy-logs').addEventListener('click', () => {
    // 현재 활성화된 탭의 로그만 복사
    const logsToCopy = logs[activeTab];
    if (logsToCopy.length === 0) {
      alert('복사할 로그가 없습니다.');
      return;
    }

    // 로그 데이터를 JSON 문자열로 변환
    const logText = JSON.stringify(logsToCopy, null, 2);

    // 클립보드에 복사
    navigator.clipboard
      .writeText(logText)
      .then(() => {
        alert('로그가 클립보드에 복사되었습니다.');
      })
      .catch((err) => {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다.');
      });
  });

  // 초기 로그 데이터 로드
  loadLogs();
});

// 백그라운드에서 로그 데이터 로드
function loadLogs() {
  chrome.runtime.sendMessage({ type: 'GET_LOGS' }, (response) => {
    if (response) {
      logs = response;
      renderLogs();
      updateLogCount();
    }
  });
}

// 로그 수 업데이트
function updateLogCount() {
  document.getElementById('log-count').textContent =
    logs.console.length + logs.error.length + logs.fetch.length;
}

// 로그 렌더링
function renderLogs() {
  const contentElement = document.getElementById('log-content');
  const currentLogs = logs[activeTab];

  // 로그가 없는 경우 빈 상태 표시
  if (currentLogs.length === 0) {
    contentElement.innerHTML = '<div class="empty-state">로그 데이터가 없습니다.</div>';
    return;
  }

  // 로그 항목 생성
  let html = '';

  if (activeTab === 'console') {
    // 콘솔 로그 렌더링
    currentLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const timeString = date.toLocaleTimeString();

      html += `
        <div class="log-item ${log.level}">
          <div class="timestamp">${timeString}</div>
          <div>${formatLogMessage(log.message)}</div>
        </div>
      `;
    });
  } else if (activeTab === 'error') {
    // 에러 로그 렌더링
    currentLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const timeString = date.toLocaleTimeString();

      html += `
        <div class="log-item error">
          <div class="timestamp">${timeString} - ${log.type}</div>
          <div><strong>${escapeHtml(log.message)}</strong></div>
          ${log.source ? `<div>Source: ${escapeHtml(log.source)}</div>` : ''}
          ${log.lineno ? `<div>Line: ${log.lineno}, Column: ${log.colno || 'N/A'}</div>` : ''}
        </div>
      `;
    });
  } else if (activeTab === 'fetch') {
    // 네트워크 로그 렌더링
    currentLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const timeString = date.toLocaleTimeString();
      const statusClass = log.status && log.status >= 400 ? 'error' : 'fetch';

      html += `
        <div class="log-item ${statusClass}">
          <div class="timestamp">${timeString}</div>
          <div><strong>${log.method}</strong> ${escapeHtml(log.url)}</div>
          ${log.status ? `<div>Status: ${log.status}</div>` : ''}
          ${log.error ? `<div>Error: ${escapeHtml(String(log.error))}</div>` : ''}
        </div>
      `;
    });
  }

  contentElement.innerHTML = html;
}

// 로그 메시지 포맷팅
function formatLogMessage(messages) {
  if (!Array.isArray(messages)) {
    return escapeHtml(String(messages));
  }

  return messages
    .map((msg) => {
      if (typeof msg === 'object') {
        try {
          return `<pre>${escapeHtml(JSON.stringify(msg, null, 2))}</pre>`;
        } catch (e) {
          return escapeHtml(String(msg));
        }
      }
      return escapeHtml(String(msg));
    })
    .join(' ');
}

// HTML 이스케이프
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

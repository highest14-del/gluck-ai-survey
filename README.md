# 글룩 AI 진단 (gluck-ai-survey)

글룩 임직원의 AI 활용 패턴을 진단하고, 가장 적합한 AI 구독을 추천하는 웹앱입니다.
관리자 페이지에서 구글 시트의 응답을 **CSV 다운로드 없이 바로** 확인할 수 있어요.

## 1. 빠른 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`

## 2. 두 가지 모드

| 모드 | URL | 비밀번호 |
|---|---|---|
| 진단 | `/` | — |
| 관리자 | `/#admin` | `gluck2026` |

## 3. 구글 시트 웹훅 설정 (Apps Script)

### 1) 구글 시트 1행에 헤더 입력
```
제출시간 | 이름 | 소속팀 | 직책 | Q1_용도 | Q2_분량 | Q3_빈도 | Q4_불편 | Q5_현재AI | Q6_주관식 | 추천AI | 추천티어 | 예상절약액 | 활용도점수 | 활용도등급
```

### 2) 확장 프로그램 → Apps Script 에 아래 코드 붙여넣기

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.name, data.team, data.role,
    data.q1, data.q2, data.q3, data.q4, data.q5, data.q6,
    data.recommendedAi, data.recommendedTier,
    data.savings, data.maturityScore, data.maturityLabel,
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const records = values.slice(1).map(row => ({
    timestamp: row[0] ? new Date(row[0]).toISOString() : '',
    name: String(row[1] || ''),
    team: String(row[2] || ''),
    role: String(row[3] || ''),
    q1: String(row[4] || ''),
    q2: String(row[5] || ''),
    q3: String(row[6] || ''),
    q4: String(row[7] || ''),
    q5: String(row[8] || ''),
    q6: String(row[9] || ''),
    ai: String(row[10] || ''),
    tier: String(row[11] || ''),
    savings: Number(row[12]) || 0,
    score: Number(row[13]) || 0,
    grade: String(row[14] || ''),
  }));
  return ContentService.createTextOutput(JSON.stringify(records))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3) 배포 → 새 배포 → 웹앱
- 액세스 권한: **모든 사용자** (Anyone)
- 실행 계정: 본인
- 발급된 URL을 복사

### 4) `src/AIRecommender.jsx` 9번째 줄 수정

```js
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
```

저장하고 GitHub에 push 하면 vercel이 자동 재배포.

## 4. 관리자 페이지 작동 방식

`/#admin` 접근 → 비밀번호 입력 → **자동으로 시트 데이터 fetch** → 보고서 표시

- **새로고침** 버튼: 최신 응답 다시 불러오기
- **CSV 업로드** (폴백): 자동 fetch 실패 시 사용
- **PDF 인쇄**: window.print 호출

## 5. Vercel 배포

```bash
npm i -g vercel
vercel
```

또는 GitHub 푸시 → vercel.com 에서 import.

## 6. 진단 흐름 (총 7단계)

1. **이름** — 입력하면 명단에서 자동 매칭 → "안녕하세요, 기획팀 김태완 팀장님!" 환영 인사 → 시작
   - 명단에 없으면 "직접 입력하기"로 폴백 (팀 + 직책 수동 입력)
2. **Q1 용도** — 다중 선택
3. Q2 분량
4. Q3 빈도
5. Q4 현재 AI 답답한 점
6. **Q5 현재 사용 중인 AI** — 다중 선택
7. Q6 주관식 (10자 이상)

> 임직원 명단은 `src/AIRecommender.jsx` 상단 `EMPLOYEES` 배열에서 관리합니다. 인원 변경 시 이 배열만 수정하면 됩니다.

→ 로딩 1.8초 (이때 웹훅 전송) → 결과 화면

## 7. 추천 로직 요약

| 조건 | 결과 |
|---|---|
| Q4 = `never` 또는 `none` | 무료 |
| Q4 = `limit`/`context` AND 헤비 AND 긴 분량 | Max |
| 그 외 | Pro |

추천 AI는 Q1 용도 우선순위(coding > research > writing > image > general)로 결정.

## 8. 커스터마이징

| 변경 | 위치 |
|---|---|
| 관리자 비밀번호 | `src/AIRecommender.jsx` 상수 `ADMIN_PASSWORD` |
| 웹훅 URL | `src/AIRecommender.jsx` 상수 `WEBHOOK_URL` |
| 팀 목록 | `TEAMS` 배열 |
| 질문/선택지 | `QUESTIONS` 객체 |
| 추천 로직 | `getRecommendation()` |
| 점수 로직 | `getMaturity()` |

---
GLUCK · 2026

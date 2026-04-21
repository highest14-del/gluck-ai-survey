import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  Upload, Lock, FileText, BarChart3, Users, TrendingUp,
  Printer, RefreshCw, Heart, Loader2, AlertCircle,
} from 'lucide-react';

// ============================================================
// 상수
// ============================================================
const WEBHOOK_URL = 'YOUR_APPS_SCRIPT_URL';
const ADMIN_PASSWORD = '1111';
const LOCAL_KEY = 'gluck-ai-survey-responses';

// ============================================================
// 로컬 저장소 (웹훅 미설정 시 폴백 — 같은 브라우저 내 응답만 보존)
// ============================================================
function saveLocal(record) {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    list.push({
      _id: (window.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2)),
      timestamp: new Date().toISOString(),
      ...record,
    });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch (e) {}
}

function loadLocal() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return list.map((r) => ({
      _id: r._id,
      timestamp: r.timestamp || '',
      name: r.name || '',
      team: r.team || '',
      role: r.role || '',
      q1: r.q1 || '',
      q2: r.q2 || '',
      q3: r.q3 || '',
      q4: r.q4 || '',
      q4Limit: r.q4Limit || '',
      q5: r.q5 || '',
      q5Payment: r.q5Payment || '',
      q6: r.q6 || '',
      ai: r.recommendedAi || r.ai || '',
      tier: r.recommendedTier || r.tier || '',
      savings: Number(r.savings) || 0,
      score: Number(r.maturityScore || r.score) || 0,
      grade: r.maturityLabel || r.grade || '',
    }));
  } catch (e) { return []; }
}

function deleteLocal(id) {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.filter((r) => r._id !== id)));
  } catch (e) {}
}

const TEAMS = ['경영진', '기획팀', '운영팀', '출력팀', '후가공팀', '팩토리팀', '경영지원팀'];

// ============================================================
// 글룩 임직원 명단 — 이름 자동 인식 + 직급 환영 인사용
// ============================================================
const EMPLOYEES = [
  // 경영진
  { name: '홍재옥', team: '경영진',     role: '대표' },
  { name: '신연선', team: '경영진',     role: '이사' },
  // 경영지원팀
  { name: '이수영', team: '경영지원팀', role: '부장' },
  { name: '배윤진', team: '경영지원팀', role: '대리' },
  { name: '이나현', team: '경영지원팀', role: '사원' },
  // 기획팀
  { name: '김태완', team: '기획팀',     role: '팀장' },
  { name: '고유정', team: '기획팀',     role: '책임' },
  { name: '허은지', team: '기획팀',     role: '주임' },
  { name: '김민정', team: '기획팀',     role: '사원' },
  // 운영팀
  { name: '이민아', team: '운영팀',     role: '팀장' },
  { name: '임동휘', team: '운영팀',     role: '책임' },
  { name: '서한솔', team: '운영팀',     role: '주임' },
  { name: '이미란', team: '운영팀',     role: '사원' },
  { name: '황인덕', team: '운영팀',     role: '사원' },
  // 출력팀
  { name: '이수원', team: '출력팀',     role: '팀장' },
  { name: '김재현', team: '출력팀',     role: '주임' },
  { name: '조재희', team: '출력팀',     role: '주임' },
  { name: '안성준', team: '출력팀',     role: '사원' },
  // 후가공팀
  { name: '성두현', team: '후가공팀',   role: '팀장' },
  { name: '김윤기', team: '후가공팀',   role: '주임' },
  { name: '박소현', team: '후가공팀',   role: '주임' },
  { name: '배아현', team: '후가공팀',   role: '주임' },
  { name: '박이건', team: '후가공팀',   role: '사원' },
  { name: '김동윤', team: '후가공팀',   role: '사원' },
  { name: '정실라', team: '후가공팀',   role: '사원' },
  { name: '유윤종', team: '후가공팀',   role: '사원' },
  // 팩토리팀
  { name: '백철민', team: '팩토리팀',   role: '수석' },
  { name: '허준회', team: '팩토리팀',   role: '팀장' },
  { name: '경일규', team: '팩토리팀',   role: '수석' },
  { name: '박명희', team: '팩토리팀',   role: '책임' },
  { name: '권혁주', team: '팩토리팀',   role: '책임' },
  { name: '김응균', team: '팩토리팀',   role: '선임' },
  { name: '강성구', team: '팩토리팀',   role: '선임' },
  { name: '권지문', team: '팩토리팀',   role: '선임' },
  { name: '김민규', team: '팩토리팀',   role: '주임' },
  { name: '이지혜', team: '팩토리팀',   role: '주임' },
  { name: '전해리', team: '팩토리팀',   role: '주임' },
  { name: '김준수', team: '팩토리팀',   role: '사원' },
  { name: '박성진', team: '팩토리팀',   role: '사원' },
  { name: '백혜원', team: '팩토리팀',   role: '사원' },
  { name: '원승주', team: '팩토리팀',   role: '사원' },
  { name: '유지호', team: '팩토리팀',   role: '사원' },
];

function findEmployee(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  return EMPLOYEES.find((e) => e.name === trimmed) || null;
}

// ============================================================
// 질문 정의
// ============================================================
const QUESTIONS = {
  q1: {
    label: 'AI를 주로 어떤 용도로 사용하시나요?',
    hint: '해당되는 것 모두 선택해주세요',
    multi: true,
    options: [
      { value: 'coding',        label: '코딩 및 개발',                  desc: '웹, 앱, 데이터 분석' },
      { value: 'writing',       label: '긴 문서 작성 및 전문 글쓰기',     desc: '보고서, 기획서' },
      { value: 'general',       label: '일상 질문, 번역, 브레인스토밍',   desc: '가벼운 활용' },
      { value: 'image',         label: '이미지/영상 생성 및 디자인',      desc: '비주얼 콘텐츠 제작' },
      { value: 'research',      label: '학술 연구, 논문 검토',           desc: '심층 자료 분석' },
      { value: 'communication', label: '커뮤니케이션·고객 응대',          desc: '메일, 카톡, CS' },
      { value: 'planning',      label: '기획·전략·마케팅',               desc: '아이디어 정리, 캠페인 기획' },
      { value: 'analysis',      label: '데이터 분석·엑셀 작업',           desc: '수치 정리, 보고용 차트' },
      { value: 'other',         label: '기타',                          desc: '직접 입력' },
    ],
  },
  q2: {
    label: '다루는 데이터나 문서의 분량은요?',
    options: [
      { value: 'oneline', label: '한두 문장의 짧은 질문',           desc: '단발성 메시지' },
      { value: 'short',   label: 'A4 한 장 이내',                  desc: '메모·짧은 답변' },
      { value: 'medium',  label: 'A4 2~5장 분량',                 desc: '보고서·기획서' },
      { value: 'large',   label: 'A4 10~30장 / 긴 코드 파일',      desc: '본격 문서·소스 단위' },
      { value: 'massive', label: '책 한 권 / 대규모 코드베이스',     desc: '100장 이상 / 프로젝트 전체' },
    ],
  },
  q3: {
    label: '평소 AI 사용 빈도는요?',
    options: [
      { value: 'rarely',  label: '한 달에 몇 번',                desc: '가끔만 사용' },
      { value: 'weekly',  label: '일주일에 2~3번',               desc: '필요할 때만' },
      { value: 'daily',   label: '매일 30분~1시간',              desc: '습관적으로' },
      { value: 'regular', label: '매일 2~4시간',                 desc: '주요 업무 도구' },
      { value: 'heavy',   label: '하루 종일 (업무의 대부분)',     desc: '없으면 일이 안 됨' },
    ],
  },
  q4: {
    label: '현재 AI를 쓰면서 답답하게 느끼는 점은요?',
    hint: '해당되는 것 모두 선택해주세요 (1~3번은 중복 가능)',
    multi: true,
    exclusive: ['none', 'never'],
    options: [
      { value: 'limit',   label: '무료 한도가 빨리 떨어져요',              desc: '횟수/시간 제한' },
      { value: 'quality', label: '응답 품질이 좀 더 좋았으면 해요',          desc: '정확도/깊이 부족' },
      { value: 'context', label: '더 긴 문서/대용량 자료를 한 번에 다루고 싶어요', desc: '컨텍스트 부족' },
      { value: 'none',    label: '특별히 부족한 점은 없어요',              desc: '지금 충분' },
      { value: 'never',   label: '아직 본격적으로 써본 적 없어요',           desc: '입문 단계' },
    ],
  },
  // Q5 결제 방식 후속 질문 — 유료 도구 사용 시 노출
  q5Payment: {
    label: '구독료는 어떻게 결제하고 계신가요?',
    options: [
      { value: 'personal', label: '전부 개인 결제',          desc: '내 카드로 직접' },
      { value: 'company',  label: '전부 회사 결제',          desc: '법인카드/지원' },
      { value: 'mixed',    label: '일부 개인, 일부 회사',    desc: '도구별로 다름' },
      { value: 'na',       label: '무료 도구만 쓰는 중',     desc: '결제 없음' },
    ],
  },

  // Q4 한도 부족 후속 질문 — Q4에 'limit' 체크 시 노출
  q4Limit: {
    label: '한도가 얼마나 부족하신가요?',
    options: [
      { value: 'mild',     label: '가끔 답답한 정도',                  desc: '월 2~3회 도달' },
      { value: 'moderate', label: '주 단위로 빨리 떨어짐',              desc: '주 1~2회 도달' },
      { value: 'severe',   label: '매일 한도 도달, 작업 흐름이 끊김',    desc: '거의 매일' },
      { value: 'critical', label: '여러 계정 돌려쓰거나 결제 고민 중',   desc: '일상 차질' },
    ],
  },
  q5: {
    label: '현재 사용 중인 AI 도구가 있다면 모두 알려주세요',
    hint: '해당되는 것 모두 선택해주세요',
    multi: true,
    exclusive: ['none'],
    options: [
      { value: 'none',       label: '아직 써본 적 없어요',    desc: '미사용' },
      { value: 'chatgpt',    label: 'ChatGPT',              desc: 'OpenAI' },
      { value: 'claude',     label: 'Claude',               desc: 'Anthropic' },
      { value: 'gemini',     label: 'Gemini',               desc: 'Google' },
      { value: 'perplexity', label: 'Perplexity',           desc: '검색 특화' },
      { value: 'cursor',     label: 'Cursor',               desc: '코딩 IDE' },
      { value: 'other',      label: '기타',                  desc: '그 외 다른 도구 (직접 입력)' },
    ],
  },
};

// ============================================================
// 유틸
// ============================================================
function pickPrimary(q1Array) {
  const arr = Array.isArray(q1Array) ? q1Array : q1Array ? [q1Array] : [];
  if (arr.includes('coding')) return 'coding';
  // analysis는 research와 같은 도구군 (Perplexity·Claude)
  if (arr.includes('research') || arr.includes('analysis')) return 'research';
  // planning은 writing과 같은 도구군 (Claude·ChatGPT)
  if (arr.includes('writing') || arr.includes('planning')) return 'writing';
  if (arr.includes('image')) return 'image';
  // communication, general, other는 범용 도구군
  return 'general';
}

function toArr(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return String(v).split(/,\s*/).filter(Boolean);
}

// ============================================================
// 추천 로직 — 다양한 AI 도구 (Claude / ChatGPT / Gemini / Perplexity / Cursor / Midjourney / Runway / Sora)
// ============================================================

// 도구별 강점 — 결과 화면 "왜 이 AI인가요?" 카드용 (각 3개까지)
const TOOL_REASONS = {
  'Claude Pro': [
    'Claude는 2026년 코딩(SWE-bench)·긴 문서 분석에서 1위 평가',
    'Artifacts/Projects로 결과물을 옆 패널에서 실시간 편집·미리보기',
    '한국어 문장력과 톤 조절이 가장 자연스럽다는 평',
  ],
  'Claude Max': [
    'Pro 대비 5~20배 한도 — Rate limit 걱정 없이 헤비 사용 가능',
    'Claude Code CLI로 터미널·IDE에서 코드베이스 전체 작업',
    'Opus(최상위 모델) 사용량도 충분해 복잡한 추론 반복 가능',
  ],
  'ChatGPT Plus': [
    'GPT-5 + DALL-E + 음성 + GPTs까지 한 구독에 모두 포함',
    '국내 사용자가 가장 많아 한국어 학습 자료·팁이 풍부',
    '반복 업무는 GPTs(개인 챗봇)로 자동화해서 시간 절약 가능',
  ],
  'Gemini Advanced': [
    '2M 토큰 컨텍스트 — 책 한 권을 통째로 던질 수 있음',
    'Gmail·Drive·Docs 직접 연동으로 워크스페이스 시너지 극대화',
    'Deep Research 모드로 리서치 자동화',
  ],
  'Perplexity Pro': [
    '실시간 웹 검색 + 출처 인용으로 팩트체크 신뢰성 1위',
    'Deep Research 모드는 5~10분 만에 보고서급 결과물 생성',
    'Claude·GPT-5 모델을 선택해서 함께 사용 가능',
  ],
  'Cursor Pro': [
    'IDE 안에서 코드와 직접 상호작용 — 브라우저 왕복 없이 빠름',
    'Agent 모드로 멀티 파일 자동 수정 + 모델(Claude/GPT) 선택 가능',
    '@codebase 명령으로 프로젝트 전체 컨텍스트 활용',
  ],
  'Runway': [
    '영상 생성 도구 중 안정성·일관성 가장 우수 (Gen-3)',
    '이미지→영상, 텍스트→영상, 마스크 인페인팅까지 풀 파이프라인',
    '레퍼런스 영상 스타일 전이 기능 제공',
  ],
  'Sora': [
    'OpenAI 영상 모델 — ChatGPT Plus 안에서 추가 비용 없이 사용',
    '최대 20초 일관성 영상 생성 (인물·배경 안정적 유지)',
    '텍스트 프롬프트만으로 영상 시나리오 구성 가능',
  ],
};

// 추천 사유 생성 — 단일 도구면 그 도구 강점 2개, 조합이면 각 1개씩
function reasonsFor(toolNames, extra) {
  const list = [];
  if (toolNames.length === 1) {
    const r = TOOL_REASONS[toolNames[0]] || [];
    list.push(...r.slice(0, 2));
  } else {
    toolNames.slice(0, 2).forEach((t) => {
      const r = TOOL_REASONS[t];
      if (r && r[0]) list.push(r[0]);
    });
  }
  if (extra) list.push(extra);
  return list.slice(0, 3);
}

function rec(ai, icon, tier, savings, advice, primaryTools, extraReason) {
  return { ai, icon, tier, savings, advice, reasons: reasonsFor(primaryTools, extraReason) };
}

function getRecommendation(answers) {
  const primary = pickPrimary(answers.q1);
  const volume = answers.q2;
  const frequency = answers.q3;
  const painArr = toArr(answers.q4);
  const hasPain = (p) => painArr.includes(p);
  // 가장 우선되는 단일 pain (advice 문구 생성용)
  const pain = hasPain('never') ? 'never'
    : hasPain('limit') ? 'limit'
    : hasPain('context') ? 'context'
    : hasPain('quality') ? 'quality'
    : hasPain('none') ? 'none'
    : '';
  const text = (answers.q6 || '').toLowerCase();
  const wantsVideo = /영상|동영상|비디오|video|movie|short|숏폼|릴스/.test(text);
  const currentAis = toArr(answers.q5);
  const has = (a) => currentAis.includes(a);

  // ---------- 티어 결정 ----------
  // 원칙:
  //  1. heavy/regular(매일 2시간+) 사용자는 무조건 Pro 이상
  //  2. Max 후보: 한도(severe/critical) 또는 (한도+긴 분량) 조합
  //  3. light(주 2~3회 이하)는 Q4 따라 free/pro
  const heavyUsage  = frequency === 'heavy'  || frequency === 'regular';   // 매일 2시간+
  const dailyUsage  = frequency === 'daily';                                // 매일 30분~1시간
  const isLongVol   = volume === 'large' || volume === 'massive';           // A4 10장 이상
  const limitSev    = answers.q4Limit;                                      // mild/moderate/severe/critical
  const severeLimit = limitSev === 'severe' || limitSev === 'critical';

  let tier;
  const isMaxCandidate =
    heavyUsage && (
      (hasPain('limit') && severeLimit) ||                             // 심각한 한도 부족 단독으로도 Max
      ((hasPain('limit') || hasPain('context')) && isLongVol)          // 한도/컨텍스트 + 긴 분량
    );

  if (heavyUsage) {
    tier = isMaxCandidate ? 'max' : 'pro';
  } else if (dailyUsage) {
    tier = 'pro';
  } else {
    // weekly / rarely
    if (hasPain('never') || (hasPain('none') && painArr.length === 1)) tier = 'free';
    else tier = 'pro';
  }

  // 다중 pain 시 부드럽게 묶어서 표현
  const painLabels = {
    limit: '한도 부족',
    quality: '응답 품질',
    context: '긴 자료 처리',
  };
  const realPains = painArr.filter((p) => painLabels[p]);
  const painLabel = realPains.length >= 2
    ? `현재 ${realPains.map((p) => painLabels[p]).join('·')} 부분에서 아쉬움을 느끼고 계신 점`
    : ({
        limit: '현재 한도 부족을 느끼고 계신 점',
        quality: '응답 품질에 아쉬움을 느끼시는 점',
        context: '긴 자료를 한 번에 다루고 싶어하시는 점',
      }[pain] || '현재 업무 패턴');

  // 공통 마무리 문구
  const TAIL = '답변 덕분에 글룩의 AI 예산 활용 계획에 큰 도움이 되었습니다.';

  // ---------- 무료 ----------
  if (tier === 'free') {
    if (wantsVideo) {
      return rec(
        'Runway 무료 + Microsoft Designer', '🎬', 'free', 240000,
        pain === 'never'
          ? `영상 생성에 관심이 있으시군요. 우선 Runway 무료 플랜으로 짧은 클립부터 만들어 보시고, 필요해지면 그때 유료를 검토하시는 게 가장 효율적입니다. ${TAIL}`
          : `영상 작업 빈도가 아직 가벼우시다면 Runway 무료로도 핵심 기능을 충분히 체험할 수 있습니다. ${TAIL}`,
        ['Runway'],
        'Microsoft Designer는 Bing Image Creator(DALL-E 3) 기반으로 무료 이미지 생성 제공',
      );
    }
    if (primary === 'image') {
      return rec(
        'ChatGPT 무료 + Microsoft Designer', '🖼️', 'free', 240000,
        `이미지 생성 빈도가 가벼운 패턴에는 무료 도구 조합으로도 충분합니다. ${TAIL}`,
        ['ChatGPT Plus'],
        'Microsoft Designer는 무료로 DALL-E 3 기반 이미지를 생성할 수 있는 가장 가성비 좋은 옵션',
      );
    }
    if (primary === 'research') {
      return rec(
        'Perplexity 무료 + Gemini 무료', '🔍', 'free', 240000,
        `리서치 위주의 사용 패턴에는 출처 기반 검색 Perplexity와 Google 검색 통합 Gemini 조합이 무료에서 가장 강력합니다. ${TAIL}`,
        ['Perplexity Pro', 'Gemini Advanced'],
      );
    }
    if (primary === 'coding') {
      return rec(
        'Claude 무료 + ChatGPT 무료', '🎨', 'free', 240000,
        `코딩 학습·실험 단계에는 Claude(추론력)와 ChatGPT(생태계)를 무료로 병행하는 것이 가장 효율적입니다. ${TAIL}`,
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    if (primary === 'writing') {
      return rec(
        'Claude 무료 + ChatGPT 무료', '✍️', 'free', 240000,
        `문서 작업이 가벼운 단계에는 무료 모델 조합으로 충분합니다. ${TAIL}`,
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    return rec(
      'Gemini 무료 + ChatGPT 무료', '💎', 'free', 240000,
      pain === 'never'
        ? `이제 AI 활용을 시작하시는 단계이시군요. Gemini와 ChatGPT 무료를 함께 써보시면서 어떤 도구가 본인 업무에 잘 맞는지 비교해보시는 것을 추천드립니다. ${TAIL}`
        : `일상 활용에는 무료 조합으로도 부족함이 거의 없습니다. ${TAIL} 감사합니다.`,
      ['ChatGPT Plus', 'Gemini Advanced'],
    );
  }

  // ---------- Max ----------
  if (tier === 'max') {
    if (primary === 'coding') {
      return rec(
        'Claude Max + Cursor Pro', '💎', 'max', 0,
        `대규모 코드베이스를 하루 종일 다루시는 헤비 패턴에는 Claude Max(고용량 추론)와 Cursor Pro(IDE 통합) 조합이 본전을 뽑는 투자입니다. ${TAIL}`,
        ['Claude Max', 'Cursor Pro'],
      );
    }
    if (primary === 'writing' || primary === 'research') {
      return rec(
        'Claude Max + Gemini Advanced', '📚', 'max', 0,
        `방대한 문서를 매일 다루시는 업무 특성상 Claude Max(추론력)와 Gemini Advanced(2M 컨텍스트) 조합이 가장 강력합니다. ${TAIL}`,
        ['Claude Max', 'Gemini Advanced'],
      );
    }
    if (wantsVideo) {
      return rec(
        'Sora + Runway + ChatGPT Plus', '🎬', 'max', 0,
        `영상 작업을 본격적으로 하시는 패턴이라면 Sora·Runway(영상 생성)와 ChatGPT Plus(스크립트·DALL-E 3 키프레임) 조합이 풀 파이프라인을 커버합니다. ${TAIL}`,
        ['Sora', 'Runway'],
      );
    }
    if (primary === 'image') {
      return rec(
        'ChatGPT Plus + Runway', '🎨', 'max', 0,
        `비주얼 작업을 헤비하게 하시는 패턴에는 ChatGPT Plus(DALL-E 3·빠른 이미지 생성)와 Runway(정밀 편집·영상 확장) 조합이 실용적입니다. ${TAIL}`,
        ['ChatGPT Plus', 'Runway'],
      );
    }
    return rec(
      'ChatGPT Plus + Claude Pro 병행', '⚡', 'pro', 0,
      `다양한 업무에 AI를 적극 활용하시는 패턴에는 ChatGPT Plus와 Claude Pro 조합이 실용적입니다. ${TAIL}`,
      ['ChatGPT Plus', 'Claude Pro'],
    );
  }

  // ---------- Pro ----------
  if (primary === 'coding') {
    if (isLongVol && (heavyUsage || dailyUsage)) {
      return rec(
        'Cursor Pro', '⌨️', 'pro', 180000,
        `${painLabel}을 고려하면 IDE 통합 코딩 도구 Cursor Pro가 정답입니다. 백엔드로 Claude·GPT-5를 모두 사용할 수 있어 모델 선택의 유연성도 확보됩니다. ${TAIL}`,
        ['Cursor Pro'],
      );
    }
    return rec(
      'Claude Pro', '⚡', 'pro', 180000,
      `${painLabel}을 고려하면 Claude Pro가 가장 확실한 선택입니다. 2026년 기준 코딩 문맥 파악과 긴 코드베이스 이해력에서 압도적입니다. ${TAIL}`,
      ['Claude Pro'],
    );
  }

  if (primary === 'writing') {
    if (isLongVol) {
      return rec(
        'Gemini Advanced', '📜', 'pro', 180000,
        `긴 문서를 자주 다루시는 패턴에는 Gemini Advanced의 2M 토큰 컨텍스트가 결정적입니다. 책 한 권 통째로 던지고 요약·분석이 가능합니다. ${TAIL}`,
        ['Gemini Advanced'],
      );
    }
    if (pain === 'quality') {
      return rec(
        'Claude Pro', '📝', 'pro', 180000,
        `응답 품질을 중요하게 보시는 패턴에는 Claude Pro가 정답입니다. 한국어 문장 자연스러움과 톤 조절에서 가장 안정적입니다. ${TAIL}`,
        ['Claude Pro'],
      );
    }
    return rec(
      'ChatGPT Plus', '💬', 'pro', 180000,
      `다양한 글쓰기 작업에는 ChatGPT Plus가 가장 친숙하고, GPTs로 반복 업무 자동화까지 가능합니다. ${TAIL}`,
      ['ChatGPT Plus'],
    );
  }

  if (primary === 'research') {
    return rec(
      'Perplexity Pro', '🔎', 'pro', 180000,
      `리서치 중심의 사용 패턴에는 Perplexity Pro의 Deep Research가 최적입니다. 5~10분 만에 보고서 수준의 출처 기반 결과를 만들어줍니다. ${TAIL}`,
      ['Perplexity Pro'],
    );
  }

  if (primary === 'image') {
    if (wantsVideo) {
      return rec(
        'Runway 또는 Sora', '🎬', 'pro', 180000,
        `영상 생성 작업을 시작하시는 패턴이라면 Runway($15/월) 또는 ChatGPT Plus 안에서 쓰는 Sora가 정답입니다. ${TAIL}`,
        ['Runway', 'Sora'],
        '이미 ChatGPT Plus를 쓰고 계신다면 Sora가 추가 비용 없이 사용 가능',
      );
    }
    return rec(
      'ChatGPT Plus', '🖼️', 'pro', 180000,
      `이미지 생성에는 ChatGPT Plus의 DALL-E 3로 충분합니다. 텍스트·이미지·음성을 한 구독으로 통합 사용할 수 있어 가장 가성비가 좋습니다. ${TAIL}`,
      ['ChatGPT Plus'],
    );
  }

  // general — 이미 쓰는 도구를 보고 다른 옵션 추천
  if (has('chatgpt') && !has('gemini') && !has('claude')) {
    return rec(
      'Claude Pro 또는 Gemini Advanced', '🆕', 'pro', 180000,
      `이미 ChatGPT를 잘 쓰고 계시니, Claude Pro(자연스러운 글쓰기·추론)나 Gemini Advanced(긴 컨텍스트·Google 연동) 중 하나를 추가로 시도해보시는 것을 추천드립니다. ${TAIL}`,
      ['Claude Pro', 'Gemini Advanced'],
    );
  }
  if (has('claude') && !has('chatgpt') && !has('gemini')) {
    return rec(
      'ChatGPT Plus', '💬', 'pro', 180000,
      `이미 Claude를 잘 쓰고 계시니, ChatGPT Plus를 추가하시면 GPTs·DALL-E·음성까지 도구 폭이 크게 넓어집니다. ${TAIL}`,
      ['ChatGPT Plus'],
    );
  }
  return rec(
    'ChatGPT Plus', '💬', 'pro', 180000,
    `범용 사용에는 ChatGPT Plus 하나로 대부분의 업무가 커버됩니다. ${painLabel}도 유료 구독으로 대부분 풀립니다. ${TAIL}`,
    ['ChatGPT Plus'],
  );
}

// ============================================================
// AI 활용 성숙도 점수 (결과엔 표시 안 하고 관리자/웹훅용)
// ============================================================
function getMaturity(answers) {
  let score = 0;
  // Q3 빈도 (5단계)
  const q3Map = { rarely: 5, weekly: 15, daily: 25, regular: 40, heavy: 55 };
  score += q3Map[answers.q3] || 0;

  // Q2 분량 (5단계)
  const q2Map = { oneline: 2, short: 5, medium: 15, large: 22, massive: 28 };
  score += q2Map[answers.q2] || 0;

  // Q1 (array) — 용도 중 가장 높은 점수만 반영
  const q1ScoreMap = {
    coding: 15, research: 15, analysis: 13, planning: 12, writing: 10,
    image: 8, communication: 7, general: 5, other: 8,
  };
  const q1Arr = toArr(answers.q1);
  const q1Max = q1Arr.reduce((m, v) => Math.max(m, q1ScoreMap[v] || 0), 0);
  score += q1Max;

  // Q4 (pain point, 다중) — 가장 높은 점수만 반영
  const q4ScoreMap = { never: 0, none: 5, quality: 8, limit: 10, context: 12 };
  const q4Arr = toArr(answers.q4);
  const q4Max = q4Arr.reduce((m, v) => Math.max(m, q4ScoreMap[v] || 0), 0);
  score += q4Max;

  // Q5 (현재 사용 중인 AI 수) — 도구 다양성
  const q5Arr = toArr(answers.q5).filter((v) => v !== 'none');
  score += Math.min(10, q5Arr.length * 3);

  // Q6 주관식 길이
  const len = (answers.q6 || '').length;
  if (len >= 100) score += 10;
  else if (len >= 50) score += 5;

  score = Math.min(100, score);

  if (score >= 80) return { score, label: 'AI 파워유저',     emoji: '💎' };
  if (score >= 60) return { score, label: '적극 활용자',      emoji: '🚀' };
  if (score >= 40) return { score, label: '꾸준한 사용자',    emoji: '✨' };
  if (score >= 20) return { score, label: '탐색 중인 사용자', emoji: '🌱' };
  return                  { score, label: '이제 시작하는 분', emoji: '🌰' };
}

// 주제별 맞춤 팁 (Q6 키워드 매칭용)
const SUBTOPICS = [
  {
    key: 'summary',
    match: /요약|정리|회의록|녹취|녹음|인터뷰|회의 내용|미팅/,
    title: '회의록·문서 요약',
    tips: [
      { title: '"3단계 구조" 요약 프롬프트', body: '"이 회의록을 (1) 주요 결정사항 (2) 액션 아이템 (3) 미결 논의 3가지로 정리해줘"로 구조를 잡으세요. 자유 형식으로 요약해달라고 하면 놓치는 게 많은데, 구조를 정해주면 누락이 없고 다음 회의에 그대로 활용할 수 있습니다.' },
      { title: '녹음 파일은 텍스트로 먼저', body: 'AI는 음성 직접 요약보다 텍스트 변환 후 요약이 훨씬 정확합니다. Vrew나 네이버 Clovanote(무료)로 텍스트화한 뒤 Claude/ChatGPT에 던지세요. 긴 회의일수록 차이가 큽니다.' },
      { title: '참석자별 의견 정리', body: '"참석자 A, B, C의 주요 의견을 각각 3줄로 정리해줘"로 요청하면 누가 어떤 입장인지 한눈에 보입니다. 공유 메일이나 의사결정 리뷰에 그대로 활용 가능해요.' },
      { title: '다음 회의 아젠다까지 자동', body: '마지막에 "이 회의록 기준, 다음 회의에서 논의해야 할 안건 5개 제안해줘"를 덧붙이면 후속 미팅 준비까지 한 번에 끝납니다.' },
    ],
  },
  {
    key: 'report',
    match: /보고서|기획서|제안서|발표자료|슬라이드|ppt|presentation|제안|보고/,
    title: '보고서·기획서 작성',
    tips: [
      { title: '목차부터 확정', body: '20장짜리 보고서를 한 번에 시키면 일관성이 무너집니다. 먼저 "이 주제로 보고서 목차를 5단계 깊이로 짜줘" → 목차 확인·수정 → 섹션별로 본문 작성 → 마지막에 "전체 톤 통일" 순서로 가세요.' },
      { title: '대상·형식 명시', body: '"잘 써줘"는 막연합니다. "(1) 임원 보고용 (2) 1페이지 요약 (3) 확신 있는 톤"처럼 대상·형식·톤 3가지를 명시하면 결과물이 완전히 달라집니다.' },
      { title: '"왜 이렇게 썼는지" 묻기', body: '초안이 어색하면 "이 문장을 왜 이렇게 썼는지 근거 3가지 대줘"라고 물어보세요. AI가 자기 선택을 설명하는 과정에서 더 나은 대안이 드러납니다.' },
      { title: '데이터 주장 뒷받침', body: '"여기 넣을 만한 통계·사례·인용구 3개 제안해줘"를 추가하면 숫자 기반 설득력이 올라갑니다. Perplexity로 출처 확인하면 안전해요.' },
    ],
  },
  {
    key: 'translation',
    match: /번역|영어|외국어|영작|영문|중국어|일본어|일어|한글화|localization/,
    title: '번역 업무',
    tips: [
      { title: '"맥락 + 원문 + 목적"을 함께', body: '번역만 요청하면 기계번역 수준이 나옵니다. "이것은 [어떤 상황]에서 [누구에게] 보낼 [이메일/보고서]야. 톤은 [정중/친근/전문적]으로 번역해줘"처럼 맥락을 주면 자연스러워집니다.' },
      { title: '두 번 번역해서 검증', body: '번역한 결과를 다시 한국어로 역번역(back-translation) 시켜보세요. 의미가 왜곡된 부분이 금방 보입니다. Claude가 이 용도로 특히 정확합니다.' },
      { title: '전문 용어는 미리 고정', body: '"회사명, 제품명, 기술 용어는 번역하지 말고 원어 유지"를 처음부터 명시하세요. 매번 수정하는 시간이 절반으로 줄어듭니다.' },
      { title: '영문 이메일은 페르소나 지정', body: '"Harvard MBA 출신 임원이 쓴 이메일 톤"처럼 페르소나를 주면 격식 수준이 안정됩니다. 해외 바이어·파트너 메일에 효과 좋아요.' },
    ],
  },
  {
    key: 'data',
    match: /데이터|분석|통계|엑셀|스프레드시트|차트|그래프|수치|숫자|계산|매출|비용|kpi/,
    title: '데이터 분석·계산',
    tips: [
      { title: 'CSV/엑셀은 그대로 붙여넣기', body: '이미지로 찍지 말고 엑셀 데이터를 Ctrl+C → AI에 Ctrl+V 하세요. "이 데이터에서 (1) 전월 대비 증감 (2) 이상치 (3) 인사이트 3가지 뽑아줘" 같은 구조화된 질문이 효과적입니다.' },
      { title: '엑셀 함수 문의 특화', body: '"[이런 데이터 구조]에서 [이런 결과]를 뽑는 엑셀 함수 알려줘" + 예시 몇 행을 제공하면 VLOOKUP·SUMIFS 같은 복잡한 함수도 바로 만들어줍니다.' },
      { title: '차트 추천부터', body: '"이 데이터를 시각화하려면 어떤 차트가 적합해? 3가지 옵션과 각 장단점"을 먼저 물어본 뒤 선택하면 엉뚱한 차트 만드는 시간이 절약됩니다.' },
      { title: '가설 검증형 질문', body: '"이 데이터를 보면 [가설 A]가 맞는지 검증해줘. 반대되는 증거도 같이"로 요청하면 편향 없이 결과가 나옵니다.' },
    ],
  },
  {
    key: 'comm',
    match: /메일|이메일|카톡|카카오|메시지|문의|답변|cs|고객|공지|안내|응대/,
    title: '커뮤니케이션·고객 응대',
    tips: [
      { title: '"상황 + 톤 + 길이" 지정', body: '"[이런 상황]의 고객에게 [정중하지만 확실한] 톤으로 [3줄 이내]로 답변해줘"처럼 3가지를 묶어 지시하면 바로 쓸 수 있는 결과가 나옵니다.' },
      { title: '여러 톤 한 번에 뽑기', body: '"동일 내용을 (1) 매우 정중 (2) 친근한 (3) 단호한 3가지 버전으로" 요청한 뒤 골라 쓰세요. 상황마다 다르게 보내야 할 때 시간이 크게 절약됩니다.' },
      { title: '자주 쓰는 답변은 GPTs로', body: 'ChatGPT Plus의 GPTs 기능으로 "우리 회사 CS 응대 봇"을 만들어두면 이후엔 상황만 입력하면 톤 맞춰 답이 나옵니다. 10번만 써도 본전 뽑습니다.' },
      { title: '발송 전 점검 요청', body: '"이 메일을 받는 사람이 오해할 여지가 있는 부분 3개만 짚어줘"를 마지막에 돌리면 사고 방지에 효과적입니다.' },
    ],
  },
  {
    key: 'idea',
    match: /아이디어|브레인스토밍|기획|컨셉|발상|제안|신규|기획안|브랜딩|마케팅|네이밍/,
    title: '아이디어·기획',
    tips: [
      { title: '"10개 던지고 3개 고르기"', body: 'AI에 "이 주제로 아이디어 10개 뽑아줘. 뻔한 것 5, 엉뚱한 것 5"라고 시키세요. 평범한 5개에서 기본기를, 엉뚱한 5개에서 영감을 얻어 조합하면 좋은 아이디어가 나옵니다.' },
      { title: '제약 조건 먼저 주기', body: '"예산 X원, 기간 Y주, 인원 Z명이라는 제약 안에서 실행 가능한 아이디어"처럼 제약을 먼저 주면 실용성이 올라갑니다. 무제한이면 하늘의 구름만 나와요.' },
      { title: '반대 관점 요청', body: '아이디어 확정 전에 "이 아이디어를 반대하는 사람이라면 어떤 근거로 반대할까? 5가지"를 시켜보세요. 의사결정 전 리스크 체크에 효과적입니다.' },
      { title: '유사 사례 조사', body: 'Perplexity에 "이와 비슷한 시도를 한 국내외 사례 3개와 각각의 성공/실패 요인"을 검색시키면 바퀴를 다시 발명하는 낭비를 막을 수 있습니다.' },
    ],
  },
  {
    key: 'debug',
    match: /에러|버그|오류|크래시|디버깅|exception|error|예외|안돼|안됨|문제가|망가/,
    title: '에러·디버깅',
    tips: [
      { title: '에러 로그 + 코드 + 맥락 3종', body: '에러 메시지 한 줄만 던지지 말고 (1) 전체 스택트레이스 (2) 문제 함수 코드 (3) 이 코드가 어떤 흐름에서 호출되는지 — 3가지를 함께 주세요. 정확도가 완전히 달라집니다.' },
      { title: '"단계별 해결책 + 트레이드오프"', body: '"왜 발생 → 해결책 3개 → 각 해결책의 장단점 → 추천 순서" 구조로 답해달라고 요청하면 그때만 막는 게 아니라 구조적 이해가 쌓입니다.' },
      { title: '재현 조건 먼저 묻기', body: '"이 에러를 안정적으로 재현하려면 어떤 조건이 필요한가?"를 먼저 정리하면 디버깅 시간이 절반으로 줍니다.' },
      { title: '유사 케이스 찾기', body: 'Perplexity로 "[에러 메시지] github issue"를 검색하면 같은 문제를 겪은 사람들의 해결 과정이 바로 나옵니다.' },
    ],
  },
];

function detectQ6Issue(text) {
  const raw = (text || '').trim();
  const clean = raw.replace(/\s/g, '');
  if (clean.length < 10) return { type: 'too_short' };
  const uniq = new Set(clean.split(''));
  if (uniq.size <= 2) return { type: 'repetitive' };
  if (uniq.size <= 4 && clean.length < 25) return { type: 'repetitive' };
  if (/^(없[어다요음]|모름|모르|해당없|그냥|패스|skip|pass)/.test(clean)) return { type: 'no_concern' };
  return null;
}

function matchSubtopic(text) {
  const lower = (text || '').toLowerCase();
  for (const sub of SUBTOPICS) {
    if (sub.match.test(lower)) return sub;
  }
  return null;
}

function getTips(answers) {
  const primary = pickPrimary(answers.q1);
  const rawText = answers.q6 || '';
  const text = rawText.toLowerCase();
  const wantsVideo = /영상|동영상|비디오|video|movie|short|숏폼|릴스/.test(text);

  // 1. 쓰레기/빈 입력 감지 → 피드백 + 일반 팁
  const issue = detectQ6Issue(rawText);
  if (issue) {
    return {
      issue,
      subtopicTitle: null,
      items: getDefaultTips(primary, wantsVideo),
    };
  }

  // 2. 영상 키워드 특수 처리
  if (wantsVideo) {
    return {
      issue: null,
      subtopicTitle: '영상 콘텐츠 제작',
      items: getDefaultTips(primary, true),
    };
  }

  // 3. 주제 키워드 매칭
  const matched = matchSubtopic(rawText);
  if (matched) {
    return {
      issue: null,
      subtopicTitle: matched.title,
      items: matched.tips,
    };
  }

  // 4. Fallback — Q1 기반 기본 팁
  return {
    issue: null,
    subtopicTitle: null,
    items: getDefaultTips(primary, false),
  };
}

function getDefaultTips(primary, wantsVideo) {
  if (wantsVideo) {
    return [
      {
        title: '짧은 클립부터, 나눠서 만들기',
        body: '영상은 5초 단위 클립을 따로따로 생성한 뒤 CapCut·Premiere 같은 편집툴에서 합치는 게 가장 안정적입니다. 한 번에 30초짜리를 만들려고 하면 중간에 캐릭터·배경이 흔들려서 다시 작업해야 할 확률이 높아져요. "5초씩 6컷 = 30초 영상" 으로 접근하세요.',
      },
      {
        title: '이미지→영상이 정답',
        body: '텍스트로 바로 영상을 만들면 결과가 들쭉날쭉합니다. ChatGPT(DALL-E 3)로 원하는 분위기의 키 프레임 이미지를 먼저 뽑은 뒤, 그 이미지를 Runway·Sora에 업로드해서 "이걸 자연스럽게 움직이게 해줘"라고 요청하세요. 인물·배경 일관성이 비교가 안 됩니다.',
      },
      {
        title: '카메라 워크를 프롬프트에 명시',
        body: '"카메라가 천천히 줌인" "왼쪽에서 오른쪽으로 패닝" "공중에서 아래로 내려오는 드론샷" 처럼 영상 용어를 직접 적어주세요. 영어로 zoom in / pan right / dolly out / aerial shot 등도 잘 통합니다. 막연히 "역동적으로" 라고만 하면 의도와 다른 결과가 나와요.',
      },
      {
        title: 'BGM·자막은 무료 도구로',
        body: '영상 자체는 AI로 만들고, BGM은 Suno(무료)나 유튜브 오디오 라이브러리, 자막은 Vrew·CapCut 자동 자막을 쓰면 무료 영역에서 모든 후반 작업이 끝납니다. 이 조합만 익혀도 단가 50만원짜리 외주 결과물 정도는 사내에서 만들 수 있어요.',
      },
    ];
  }

  const tips = {
    coding: [
      {
        title: '파일 전체를 통째로 던져서 리뷰받기',
        body: '함수 하나만 복사하지 말고 파일 전체(또는 관련 파일 2~3개)를 한 번에 붙여넣고 "이 코드를 (1) 성능 (2) 가독성 (3) 잠재 버그 3가지 관점으로 리뷰해줘"라고 요청하세요. 막연히 "좋게 해줘"라고 하면 결과가 산만해집니다. 리뷰를 받은 뒤엔 "2번 항목부터 고쳐줘" 식으로 한 항목씩 적용하세요.',
      },
      {
        title: '에러는 로그 전체 + 맥락까지',
        body: '에러 메시지 한 줄만 던지지 말고 전체 스택트레이스 + 해당 코드 + "이 함수가 어떤 상황에서 호출되는지"까지 같이 주세요. 그리고 "왜 발생했는지 → 단계별 해결책 3개 → 각 해결책의 트레이드오프"순으로 답해달라고 요청하면 단순 복붙이 아니라 원인을 이해하게 됩니다.',
      },
      {
        title: 'Claude Code CLI로 프로젝트 통째로 작업',
        body: '브라우저에서 코드 복붙 왕복은 비효율적입니다. Claude Code CLI를 터미널에 설치하면 "src 폴더 전체에서 deprecated된 API 다 찾아서 새 API로 마이그레이션해줘" 같은 명령이 한 번에 실행됩니다. Cursor도 비슷한 역할인데 IDE 안에서 동작해요.',
      },
      {
        title: '테스트 코드부터 짜달라고 하기',
        body: '기능 구현 전에 "이 요구사항에 대한 테스트 케이스 먼저 5개 만들어줘"를 시키고, 그 테스트가 통과하도록 구현을 부탁하세요. AI는 명세가 명확할수록 결과가 좋아지는데, 테스트 코드가 가장 좋은 명세입니다. 결과물 품질이 눈에 띄게 올라갑니다.',
      },
    ],
    writing: [
      {
        title: '초안 → 방향 지시로 다듬기',
        body: '처음부터 완벽한 결과물을 기대하지 말고, 일단 거친 초안을 받은 뒤 "더 간결하게 / 더 전문적 톤으로 / 임원 보고용으로 / 친근하게" 같은 방향 지시로 다듬으세요. 한 번에 다 시키면 평이한 결과가 나오지만, 2~3번 다듬으면 사람이 쓴 것처럼 자연스러워집니다.',
      },
      {
        title: '긴 보고서는 개요부터',
        body: '20장짜리 보고서를 한 번에 부탁하면 일관성이 무너집니다. 먼저 "이 주제로 보고서 목차를 5단계 깊이로 짜줘" → 목차 확정 → 섹션별로 따로 본문 작성 → 마지막에 "전체 톤 통일해줘"로 마무리하세요. 결과물 품질 차이가 큽니다.',
      },
      {
        title: '"대상 + 형식" 지시가 핵심',
        body: '"잘 써줘"는 막연합니다. "다음 내용을 (1) 신입사원 (2) 임원 (3) 외부 고객 — 각 대상별로 (1) 1페이지 요약 (2) 3줄 요약 (3) 카카오톡 메시지" 식으로 대상과 형식을 명시하세요. 같은 내용도 완전히 다른 글로 나옵니다.',
      },
      {
        title: '"왜 이렇게 썼는지" 묻기',
        body: '결과물이 어딘가 어색하면 "이 문장을 왜 이렇게 썼는지 근거 3가지 대줘"라고 물어보세요. AI가 자기 선택을 설명하는 과정에서 "더 나은 대안"이 나오는 경우가 많습니다. 비판적 사고를 유도하는 가장 강력한 프롬프트입니다.',
      },
    ],
    research: [
      {
        title: 'Perplexity 검색 → Claude 분석',
        body: '최신 정보(시장 동향·통계·뉴스)는 Perplexity로 출처와 함께 가져오고, 그 자료를 Claude에 던져서 "이걸 핵심 주장 3가지로 정리하고, 각 주장의 한계점도 짚어줘"라고 분석하세요. Perplexity는 검색에 강하고 Claude는 추론에 강해서, 둘을 분업시키면 한 도구로 다 하는 것보다 결과가 좋습니다.',
      },
      {
        title: '편향 차단 프롬프트',
        body: '리서치 결과를 그대로 믿지 말고 "이 주장에 반대되는 증거도 찾아서 양쪽 관점을 정리해줘" 또는 "이 결론의 한계점·반례 5가지를 들어봐"를 추가로 요청하세요. AI는 첫 답변에서 한쪽 관점만 강조하는 경향이 있어서, 이걸로 균형을 맞춰야 합니다.',
      },
      {
        title: '논문은 PDF째로 + 구조 요청',
        body: 'Claude에 논문 PDF를 업로드하고 "(1) 핵심 주장 (2) 방법론 (3) 한계점 — 3가지로 정리하고, 마지막에 이 논문을 한 줄로 요약해줘"라고 요청하세요. 자유 형식 요약보다 구조를 정해주면 누락이 없고 비교하기 쉽습니다.',
      },
      {
        title: '"내가 모르는 것"을 묻기',
        body: '"이 주제에서 내가 놓치고 있을 만한 관점·반례·연관 분야는?"이라고 물어보세요. 자기가 아는 것만 검색하면 시야가 좁아지는데, AI가 인접 영역을 짚어주면 리서치 깊이가 한 단계 올라갑니다. 보고서 마무리 단계에 항상 던져보세요.',
      },
    ],
    image: [
      {
        title: '"스타일·조명·구도" 3종 세트',
        body: '"멋진 그림 그려줘"는 노이즈가 큽니다. "스타일: 미드센추리 모던 / 조명: 따뜻한 골든아워 / 구도: 로우앵글 와이드샷" 처럼 3가지 속성을 정리해서 적으세요. 결과물 일관성이 크게 올라갑니다. 매번 처음부터 쓰지 말고 본인 자주 쓰는 조합을 메모해두세요.',
      },
      {
        title: '레퍼런스 이미지 업로드가 정답',
        body: '말로 설명하는 것보다 "이런 느낌으로"가 100배 정확합니다. 핀터레스트·구글에서 비슷한 톤의 이미지 1~2장 찾아서 ChatGPT에 업로드하고 "이 분위기로 [원하는 주제]를 그려줘"라고 하면 첫 시도부터 결과가 다릅니다.',
      },
      {
        title: '부분 수정으로 좁혀가기',
        body: '첫 결과가 80% 마음에 들면 처음부터 다시 그리지 말고 "조명만 좀 더 따뜻하게" "오른쪽 인물 표정만 미소로" 같은 부분 수정 지시를 쓰세요. 매번 새로 그리면 좋았던 부분도 같이 사라집니다. 좋은 결과는 "절반의 우연"이라 보존이 중요해요.',
      },
      {
        title: '한국어보다 영어 프롬프트가 정확',
        body: '대부분 이미지 생성 모델이 영어 데이터로 학습돼서 영어 프롬프트가 결과가 더 정확합니다. 한국어로 먼저 원하는 그림을 ChatGPT에 설명하고 "이 설명을 이미지 생성에 최적화된 영어 프롬프트로 바꿔줘"를 시키면 자연스럽게 영어 프롬프트가 나옵니다.',
      },
    ],
    general: [
      {
        title: '질문을 잘게 나누기',
        body: '"마케팅 전략 짜줘" 같은 큰 질문은 결과가 평이합니다. "(1) 우리 제품 타겟층 분석 → (2) 그 타겟층의 페인 포인트 → (3) 각 페인 포인트별 메시지" 처럼 3~4단계로 나눠서 던지면 답변 깊이가 완전히 달라집니다. 한 번에 다 시키지 마세요.',
      },
      {
        title: '"~를 모르는 사람에게" 페르소나',
        body: '복잡한 개념을 이해하고 싶을 때 "이걸 (1) 초등학생 (2) 비전공자 임원 (3) 고등학교 후배에게 설명해줘" 식으로 페르소나를 지정하세요. 같은 내용이 완전히 다른 깊이로 풀려서 본인이 어디까지 이해하고 어디서 막히는지 명확해집니다.',
      },
      {
        title: '애매한 답엔 "구체적 예시 3개"',
        body: 'AI 답변이 추상적이면 "구체적 예시 3개와 함께" "실제 사례 3가지로 다시 설명해줘"를 덧붙이세요. 추상→구체 변환은 AI가 잘하는 영역이라, 이거 하나만 추가해도 답변 활용도가 2배 올라갑니다.',
      },
      {
        title: '대화창 하나에서 맥락 이어가기',
        body: '같은 주제는 새 대화창 만들지 말고 한 대화창에서 계속 이어가세요. AI는 대화 초반의 맥락을 끝까지 기억하고 활용합니다. 새 대화로 넘어가면 매번 같은 배경 설명을 반복해야 하니 비효율적이에요.',
      },
    ],
  };
  return tips[primary] || tips.general;
}

// ============================================================
// 웹훅 전송 (POST, no-cors)
// ============================================================
async function sendWebhook(payload) {
  saveLocal(payload);  // 항상 로컬에도 백업 저장 (관리자 페이지 폴백용)
  if (!WEBHOOK_URL || WEBHOOK_URL === 'YOUR_APPS_SCRIPT_URL') return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (e) {}
}

// CSV fallback용 파서
function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      field += ch; i++;
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === ',') { row.push(field); field = ''; i++; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = ''; rows.push(row); row = []; i++;
      } else { field += ch; i++; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

// ============================================================
// 최상위
// ============================================================
export default function AIRecommender() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const check = () => setIsAdmin(window.location.hash === '#admin');
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  return isAdmin ? <AdminMode /> : <SurveyMode />;
}

// ============================================================
// 진단 모드
// Step: 0=intro, 1=name, 2=welcome(+team+role), 3=q1, 4=q2, 5=q3, 6=q4, 7=q5, 8=q6, 9=loading, 10=result
// Progress: 1~8 / 8
// ============================================================
function SurveyMode() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: '', team: '', role: '',
    q1: [], q1Other: '', q2: '', q3: '', q4: [], q4Limit: '', q5: [], q5Other: '', q5Payment: '', q6: '',
  });
  const [result, setResult] = useState(null);

  const setField = (k, v) => setAnswers((p) => ({ ...p, [k]: v }));
  const setMany = (obj) => setAnswers((p) => ({ ...p, ...obj }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => {
    setStep(0);
    setAnswers({ name: '', team: '', role: '', q1: [], q2: '', q3: '', q4: [], q4Limit: '', q5: [], q5Other: '', q6: '' });
    setResult(null);
  };

  const selectAndNext = (key, value) => {
    setField(key, value);
    setTimeout(next, 220);
  };

  // Step 9 로딩 진입 시 결과 계산 + 웹훅
  useEffect(() => {
    if (step !== 9) return;
    const rec = getRecommendation(answers);
    const mat = getMaturity(answers);
    setResult({ ...rec, maturityScore: mat.score, maturityLabel: mat.label, maturityEmoji: mat.emoji });

    sendWebhook({
      name: answers.name,
      team: answers.team,
      role: answers.role || '',
      q1: toArr(answers.q1).map((v) => v === 'other' && answers.q1Other ? `기타(${answers.q1Other})` : v).join(', '),
      q2: answers.q2, q3: answers.q3,
      q4: toArr(answers.q4).join(', '),
      q4Limit: answers.q4Limit || '',
      q5: toArr(answers.q5).map((v) => v === 'other' && answers.q5Other ? `기타(${answers.q5Other})` : v).join(', '),
      q5Payment: answers.q5Payment || '',
      q6: answers.q6,
      recommendedAi: rec.ai,
      recommendedTier: rec.tier,
      savings: rec.savings,
      maturityScore: mat.score,
      maturityLabel: mat.label,
    });

    const t = setTimeout(() => setStep(10), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const progressStep = step >= 1 && step <= 8 ? step : step >= 9 ? 8 : 0;
  const showProgress = step >= 1 && step <= 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {showProgress && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500 tabular-nums">
              {progressStep}/8
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${(progressStep / 8) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div key={step} className="anim-fade-in">
          {step === 0 && <Intro onStart={next} />}
          {step === 1 && (
            <NameStep
              value={answers.name}
              onChange={(v) => setField('name', v)}
              onNext={next}
            />
          )}
          {step === 2 && (
            <WelcomeStep
              name={answers.name}
              team={answers.team} role={answers.role}
              onConfirm={(emp) => { setMany({ team: emp.team, role: emp.role }); next(); }}
              onManualSubmit={(team, role) => { setMany({ team, role }); next(); }}
              onChangeName={() => prev()}
              onPrev={prev}
            />
          )}
          {step === 3 && (
            <MultiQuestionStep
              num="Q1" question={QUESTIONS.q1}
              values={answers.q1} onChange={(v) => setField('q1', v)}
              otherValue="other"
              otherText={answers.q1Other}
              onOtherChange={(v) => setField('q1Other', v)}
              otherPlaceholder="예: 영상 편집, 이메일 자동화, 음악 생성 등"
              onNext={next} onPrev={prev}
            />
          )}
          {step >= 4 && step <= 5 && (
            <SingleQuestionStep
              num={['Q2', 'Q3'][step - 4]}
              qKey={['q2', 'q3'][step - 4]}
              question={QUESTIONS[['q2', 'q3'][step - 4]]}
              value={answers[['q2', 'q3'][step - 4]]}
              onSelect={selectAndNext}
              onPrev={prev}
            />
          )}
          {step === 6 && (
            <MultiQuestionStep
              num="Q4" question={QUESTIONS.q4}
              values={answers.q4} onChange={(v) => setField('q4', v)}
              followValue="limit"
              followQuestion={QUESTIONS.q4Limit}
              followSelected={answers.q4Limit}
              onFollowChange={(v) => setField('q4Limit', v)}
              onNext={next} onPrev={prev}
            />
          )}
          {step === 7 && (
            <MultiQuestionStep
              num="Q5" question={QUESTIONS.q5}
              values={answers.q5} onChange={(v) => setField('q5', v)}
              otherValue="other"
              otherText={answers.q5Other}
              onOtherChange={(v) => setField('q5Other', v)}
              otherPlaceholder="예: Notion AI, Suno, ElevenLabs 등"
              paymentQuestion={QUESTIONS.q5Payment}
              paymentSelected={answers.q5Payment}
              onPaymentChange={(v) => setField('q5Payment', v)}
              onNext={next} onPrev={prev}
            />
          )}
          {step === 8 && (
            <Q6Step value={answers.q6} onChange={(v) => setField('q6', v)} onSubmit={next} onPrev={prev} />
          )}
          {step === 9 && <LoadingStep name={answers.name} role={answers.role} />}
          {step === 10 && result && <ResultStep answers={answers} result={result} onRestart={restart} />}
        </div>
      </div>
    </div>
  );
}

// ---------- 인트로 ----------
function Intro({ onStart }) {
  return (
    <div className="text-center py-8 sm:py-16">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-medium mb-6">
        <Sparkles size={12} /> GLUCK · 2026
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
        글룩 AI 진단
      </h1>
      <p className="text-lg sm:text-xl text-slate-700 mb-2">
        우리 팀의 AI 활용 현황을 함께 그려봐요
      </p>
      <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
        여러분의 답변이 글룩의 합리적인 AI 예산 수립에 큰 도움이 됩니다.
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto mb-8 shadow-sm">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
          <div><div className="text-2xl mb-1">⏱️</div><div className="font-medium">2분 내외</div></div>
          <div className="w-px h-12 bg-slate-200" />
          <div><div className="text-2xl mb-1">📋</div><div className="font-medium">8단계 간단 진단</div></div>
        </div>
      </div>

      <button onClick={onStart} className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5">
        진단 시작하기 <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ---------- Step 1: 이름만 입력 ----------
function NameStep({ value, onChange, onNext }) {
  const ok = (value || '').trim().length >= 2;
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">이름을 입력해주세요</h2>

      <input type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && ok) onNext(); }}
        placeholder="예: 홍재옥" autoFocus
        className="w-full px-5 py-4 text-lg bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" />

      <button onClick={onNext} disabled={!ok}
        className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all ${
          ok ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}>
        다음 →
      </button>
    </div>
  );
}

// ---------- Step 2: 환영 인사 (명단 매칭 OR 수동 입력) ----------
function WelcomeStep({ name, team, role, onConfirm, onManualSubmit, onChangeName, onPrev }) {
  const trimmed = (name || '').trim();
  const matched = findEmployee(trimmed);
  const [manualMode, setManualMode] = useState(!matched); // 매칭 안 되면 자동으로 수동 모드
  const [manualTeam, setManualTeam] = useState(team || '');
  const [manualRole, setManualRole] = useState(role || '');

  // 매칭됨 + 수동 모드 X → 환영 인사 화면
  if (matched && !manualMode) {
    return (
      <div>
        <div className="text-xs font-mono font-bold text-slate-400 mb-2">반갑습니다 👋</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 leading-snug">
          확인했어요!
        </h2>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-7 mb-5 text-center anim-fade-in">
          <div className="text-5xl mb-3">👋</div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-emerald-800 text-xs font-semibold mb-3">
            {matched.team} · {matched.role}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug mb-3">
            {matched.name} {matched.role}님, 반갑습니다!
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            글룩 AI 진단에 함께해주셔서 감사합니다.<br />
            잠깐의 시간이 글룩의 합리적인 AI 예산 수립에<br className="sm:hidden" /> 큰 힘이 됩니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onPrev} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
            <ArrowLeft size={16} /> 이전
          </button>
          <button onClick={() => onConfirm(matched)}
            className="flex-1 py-4 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 transition-all">
            진단 시작하기 →
          </button>
        </div>

        <button onClick={() => setManualMode(true)}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-all">
          제가 아니에요 (직접 입력하기)
        </button>
      </div>
    );
  }

  // 수동 입력 모드 (명단 미매칭 또는 사용자가 직접 입력 선택)
  const okManual = !!manualTeam;
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2">소속 입력</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">소속을 알려주세요</h2>
      {!matched && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">"{trimmed}"님은 임직원 명단에서 찾지 못했어요.</div>
              <div className="text-xs text-amber-800/80 mt-1">오타가 있다면 <button onClick={onChangeName} className="underline font-medium">이름 수정하기</button>, 아니면 아래에서 직접 입력해주세요.</div>
            </div>
          </div>
        </div>
      )}

      <label className="block text-sm font-semibold text-slate-700 mb-2">
        소속팀 <span className="text-rose-500">*</span>
      </label>
      <select value={manualTeam} onChange={(e) => setManualTeam(e.target.value)}
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all mb-5">
        <option value="">팀을 선택해주세요</option>
        {TEAMS.map((t) => (<option key={t} value={t}>{t}</option>))}
      </select>

      <label className="block text-sm font-semibold text-slate-700 mb-2">
        직책 <span className="text-slate-400 text-xs">(선택)</span>
      </label>
      <input type="text" value={manualRole} onChange={(e) => setManualRole(e.target.value)}
        placeholder="예: 팀장, 책임, 선임, 주임, 사원 등"
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" />

      <div className="flex gap-3 mt-8">
        <button onClick={matched ? () => setManualMode(false) : onPrev}
          className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
          <ArrowLeft size={16} /> 이전
        </button>
        <button onClick={() => okManual && onManualSubmit(manualTeam, manualRole)} disabled={!okManual}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${okManual ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          다음 →
        </button>
      </div>
    </div>
  );
}

// ---------- 단일 선택 (Q2, Q3, Q4) ----------
function SingleQuestionStep({ num, qKey, question, value, onSelect, onPrev }) {
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2">{num}</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 leading-snug">{question.label}</h2>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const sel = value === opt.value;
          return (
            <button key={opt.value} onClick={() => onSelect(qKey, opt.value)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${sel ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'}`}>
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-6 h-6 rounded-full border-2 grid place-items-center ${sel ? 'border-white bg-white' : 'border-slate-300'}`}>
                  {sel && <CheckCircle2 size={20} className="text-slate-900" />}
                </div>
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${sel ? 'text-white/70' : 'text-slate-500'}`}>{opt.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onPrev} className="mt-6 px-5 py-3 text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> 이전
      </button>
    </div>
  );
}

// ---------- 다중 선택 (Q1, Q4, Q5) ----------
function MultiQuestionStep({
  num, question, values, onChange, onNext, onPrev,
  otherValue, otherText, onOtherChange, otherPlaceholder,
  followValue, followQuestion, followSelected, onFollowChange,
  paymentQuestion, paymentSelected, onPaymentChange,
}) {
  const current = Array.isArray(values) ? values : [];
  const exclusive = question.exclusive || [];
  const showOther = otherValue && current.includes(otherValue);
  const showFollow = followValue && followQuestion && current.includes(followValue);
  // 결제 follow-up: 선택값이 있고 배타적 옵션('none')만 고른 게 아니면 표시
  const showPayment = paymentQuestion && current.length > 0 && current.some((v) => !exclusive.includes(v));

  const toggle = (v) => {
    let next;
    if (current.includes(v)) {
      next = current.filter((x) => x !== v);
    } else if (exclusive.includes(v)) {
      next = [v]; // 배타적 옵션 선택 → 나머지 초기화
    } else if (current.some((x) => exclusive.includes(x))) {
      next = [v]; // 배타적 옵션이 있던 상태에서 다른 것 선택 → 배타적 제거
    } else {
      next = [...current, v];
    }
    onChange(next);
  };

  const ok = current.length > 0
    && (!showOther || (otherText || '').trim().length > 0)
    && (!showFollow || !!followSelected)
    && (!showPayment || !!paymentSelected);

  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2 flex items-center gap-2">
        <span>{num}</span>
        <span className="text-slate-400 font-sans font-normal normal-case">· {question.hint || '중복 선택 가능'}</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 leading-snug">{question.label}</h2>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const sel = current.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${sel ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'}`}>
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-6 h-6 rounded-md border-2 grid place-items-center ${sel ? 'border-white bg-white' : 'border-slate-300'}`}>
                  {sel && <CheckCircle2 size={18} className="text-slate-900" />}
                </div>
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${sel ? 'text-white/70' : 'text-slate-500'}`}>{opt.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showOther && (
        <div className="mt-4 anim-fade-in">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            기타 도구 이름을 적어주세요 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={otherText || ''}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder={otherPlaceholder || '예: Notion AI, Suno, ElevenLabs 등'}
            className="w-full px-5 py-3 text-base bg-white border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
          />
        </div>
      )}

      {showFollow && (
        <div className="mt-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 anim-fade-in">
          <div className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
            <AlertCircle size={16} /> {followQuestion.label} <span className="text-rose-500">*</span>
          </div>
          <div className="text-xs text-amber-800/80 mb-3">한도 부족 정도를 알려주시면 예산 배분에 반영됩니다.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {followQuestion.options.map((opt) => {
              const sel = followSelected === opt.value;
              return (
                <button key={opt.value} onClick={() => onFollowChange(opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    sel
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400 hover:-translate-y-0.5'
                  }`}>
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${sel ? 'text-white/80' : 'text-slate-500'}`}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showPayment && (
        <div className="mt-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-200 anim-fade-in">
          <div className="text-sm font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
            💳 {paymentQuestion.label} <span className="text-rose-500">*</span>
          </div>
          <div className="text-xs text-indigo-800/80 mb-3">개인 부담 비율을 파악해 회사 지원 범위를 정하는 데 활용됩니다.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paymentQuestion.options.map((opt) => {
              const sel = paymentSelected === opt.value;
              return (
                <button key={opt.value} onClick={() => onPaymentChange(opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    sel
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-white text-slate-700 border-indigo-200 hover:border-indigo-400 hover:-translate-y-0.5'
                  }`}>
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${sel ? 'text-white/80' : 'text-slate-500'}`}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button onClick={onPrev} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
          <ArrowLeft size={16} /> 이전
        </button>
        <button onClick={onNext} disabled={!ok}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${ok ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          {current.length > 0 ? `다음 (${current.length}개 선택)` : '1개 이상 선택'} →
        </button>
      </div>
    </div>
  );
}

// ---------- Q6 주관식 ----------
function Q6Step({ value, onChange, onSubmit, onPrev }) {
  const len = (value || '').length;
  const ok = (value || '').trim().length >= 10;
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2">Q6</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">
        평소 AI로 해결하고 싶은 고민이나 업무를 적어주세요
      </h2>
      <p className="text-slate-500 mb-6 text-sm">구체적일수록 정확한 추천이 가능해요.</p>

      <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, 500))} rows={5}
        placeholder="예: 긴 회의록을 요약하고 싶어요 / 3D 모델링 데이터 분석 자동화가 필요해요"
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all resize-none" />

      <div className="flex justify-between mt-2 text-xs">
        <span className={ok ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
          {ok ? '✓ 충분합니다' : `최소 10자 이상 (현재 ${len}자)`}
        </span>
        <span className="text-slate-400 tabular-nums">{len}/500</span>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onPrev} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
          <ArrowLeft size={16} /> 이전
        </button>
        <button onClick={onSubmit} disabled={!ok}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${ok ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          결과 보기 →
        </button>
      </div>
    </div>
  );
}

// ---------- 로딩 ----------
function LoadingStep({ name, role }) {
  const display = role ? `${name} ${role}` : name;
  return (
    <div className="text-center py-20">
      <div className="inline-flex gap-1.5 mb-8">
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        {display}님께 딱 맞는 AI를 찾고 있어요
      </h2>
      <p className="text-sm text-slate-500">잠시만 기다려주세요…</p>
    </div>
  );
}

// ---------- 결과 (활용도 점수 카드 제거) ----------
const TIER_BADGE = {
  free: { label: '무료', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pro:  { label: 'Pro',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  max:  { label: 'Max',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function ResultStep({ answers, result, onRestart }) {
  const tierBadge = TIER_BADGE[result.tier] || TIER_BADGE.pro;
  const reasons = result.reasons || [];
  const tipResult = getTips(answers);
  const tips = tipResult.items;
  const userText = answers.q6 || '';

  // 피드백 메시지 (쓰레기/빈 입력일 때)
  const feedbackMsg = tipResult.issue && {
    too_short: '적어주신 내용이 너무 짧아서 구체적인 맞춤 팁을 드리기 어려웠어요. 다음엔 "어떤 작업에서 무엇을 개선하고 싶은지" 한 문장으로라도 적어주시면 훨씬 정확한 도움을 드릴 수 있어요. 우선 사용 패턴 기반 기본 팁을 안내드립니다.',
    repetitive: '입력하신 내용에서 의미를 파악하기 어려웠어요. 혹시 실수로 눌리셨거나, 지금은 떠오르는 고민이 없으신 것 같네요. 일반적으로 유용한 AI 활용 팁을 안내드릴게요. 구체적인 고민이 생기면 다시 진단해주세요.',
    no_concern: '지금은 특별한 고민이 없으시다고 답해주셨네요. 그 자체로도 의미 있는 응답이에요. AI를 더 적극적으로 활용하고 싶어지는 순간이 오면 유용할 기본 팁을 안내드립니다.',
  }[tipResult.issue.type];

  return (
    <div className="space-y-5 pb-12">
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-xl font-bold text-slate-900">
            {answers.name}{answers.role ? ` ${answers.role}` : ''}님의 진단 결과
          </h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            {answers.team}{answers.role ? ` · ${answers.role}` : ''}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 p-4 flex items-start gap-3">
        <Heart size={18} className="text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed">
          소중한 응답 감사합니다. 여러분의 답변이 글룩의 AI 예산 수립에 직접적인 도움이 됩니다.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
        <div className="text-7xl sm:text-8xl mb-5">{result.icon}</div>
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">추천 AI</div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">{result.ai}</h2>
        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${tierBadge.cls}`}>
          {tierBadge.label} 티어
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-slate-900 p-6 shadow-sm">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">컨설턴트 메시지</div>
        <p className="text-slate-700 leading-relaxed">{result.advice}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">🎯 이 AI를 추천하는 이유</h3>
        <ul className="space-y-3">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          🛠️ 고민 맞춤 활용 팁
          {tipResult.subtopicTitle && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              {tipResult.subtopicTitle}
            </span>
          )}
        </h3>

        {feedbackMsg ? (
          <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>{feedbackMsg}</div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic mb-5 px-3 py-2 bg-slate-50 rounded-lg">
            “{userText.length > 60 ? userText.slice(0, 60) + '…' : userText}”
          </p>
        )}

        <ol className="space-y-5">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm mb-1.5">{t.title}</div>
                <div className="text-sm text-slate-600 leading-relaxed">{t.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center pt-4">
        <button onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm transition-all">
          <RefreshCw size={16} /> 다시 진단하기
        </button>
        <p className="text-xs text-slate-400 mt-6">GLUCK · 2026</p>
      </div>
    </div>
  );
}

// ============================================================
// 관리자 모드 — 로그인 → 자동 fetch → 대시보드 (CSV 업로드는 폴백)
// ============================================================
function AdminMode() {
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('local'); // 'local' | 'webhook'
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyDiHwnogg2cbXWcbSu_dGr7WtJ5t4s7ppZB7e0tYeZhaQ1lauaXKvUv4yQfb_nD9TMOw/exec';
  const useWebhook = WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_APPS_SCRIPT_URL';
  const fetchData = async () => {
    setLoading(true);
    if (useWebhook) {
      try {
        const res = await fetch(WEBHOOK_URL + '?action=list', { method: 'GET' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error('invalid response shape');
        setData(json);
        setSource('webhook');
        setLoading(false);
        return;
      } catch (e) {
        // fallthrough to local
      }
    }
    setData(loadLocal());
    setSource('local');
    setLoading(false);
  };

  const handleDelete = (id) => {
    if (source === 'local') {
      deleteLocal(id);
      setData(loadLocal());
    } else {
      // 웹훅 모드: 화면에서만 제거 (시트에서 영구 삭제하려면 doDelete API 추가 필요)
      setData((prev) => prev.filter((r) => r._id !== id));
    }
  };

  useEffect(() => {
    if (authed && !data) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;
  if (loading) return <AdminLoading />;
  if (data) return <AdminDashboard data={data} source={source} onRefresh={fetchData} onDelete={handleDelete} onReset={() => setData(null)} />;
  return <AdminLoading />;
}

function AdminLogin({ onAuth }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pw === ADMIN_PASSWORD) onAuth();
    else { setErr(true); setTimeout(() => setErr(false), 500); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
      <div className={`bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-sm ${err ? 'anim-shake' : ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <Lock size={20} className="text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">관리자 모드</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">진단 결과 보고서에 접근하려면 비밀번호를 입력해주세요.</p>
        <input type="password" value={pw} autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="비밀번호"
          className={`w-full px-5 py-4 text-base bg-white border rounded-xl focus:ring-4 outline-none transition-all ${err ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/5'}`} />
        {err && <div className="text-rose-500 text-sm mt-2">비밀번호가 틀렸습니다</div>}
        <button onClick={submit} className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all">
          확인
        </button>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
      <div className="text-center">
        <Loader2 className="animate-spin text-slate-900 mx-auto mb-4" size={36} />
        <div className="text-lg font-semibold text-slate-900 mb-1">데이터를 불러오는 중…</div>
        <div className="text-sm text-slate-500">구글 시트에서 응답을 가져오고 있어요</div>
      </div>
    </div>
  );
}

function AdminUpload({ onUploaded, fetchErr, onRetry }) {
  const [err, setErr] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { setErr('데이터가 비어있습니다.'); return; }

      // CSV 컬럼 순서: 제출시간,이름,소속팀,직책,Q1,Q2,Q3,Q4,Q5,Q6,추천AI,추천티어,예상절약액,활용도점수,활용도등급
      const records = rows.slice(1).map((row) => ({
        timestamp: row[0] || '',
        name:      row[1] || '',
        team:      row[2] || '',
        role:      row[3] || '',
        q1:        row[4] || '',
        q2:        row[5] || '',
        q3:        row[6] || '',
        q4:        row[7] || '',
        q5:        row[8] || '',
        q6:        row[9] || '',
        ai:        row[10] || '',
        tier:      row[11] || '',
        savings:   parseInt(row[12], 10) || 0,
        score:     parseInt(row[13], 10) || 0,
        grade:     row[14] || '',
      }));

      onUploaded(records);
    } catch (e2) {
      setErr('CSV 파싱에 실패했습니다. 파일 형식을 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-lg w-full shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-amber-500" />
          <h1 className="text-xl font-bold text-slate-900">자동 불러오기 실패</h1>
        </div>

        {fetchErr && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900 leading-relaxed">
            {fetchErr}
          </div>
        )}

        <button onClick={onRetry}
          className="w-full py-3 mb-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm text-slate-700">
          <RefreshCw size={14} /> 다시 시도
        </button>

        <div className="relative text-center my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <span className="relative bg-white px-3 text-xs text-slate-400">또는 수동 업로드</span>
        </div>

        <div className="text-xs text-slate-500 mb-3 leading-relaxed">
          구글 시트 → <b>파일 → 다운로드 → CSV(.csv)</b> → 아래 업로드
        </div>

        <label className="block">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <div className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-center cursor-pointer transition-all flex items-center justify-center gap-2">
            <FileText size={18} /> CSV 파일 선택
          </div>
        </label>

        {err && (
          <div className="mt-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{err}</div>
        )}
      </div>
    </div>
  );
}

function teamGrade(avg) {
  if (avg >= 80) return { label: 'AI 선도 팀', color: 'text-purple-700 bg-purple-50 border-purple-200',
    comment: '팀원들이 AI를 깊이 있게 활용하고 있는 팀입니다. 고급 유료 도구 도입으로 성과를 더 끌어올릴 수 있는 시점입니다.' };
  if (avg >= 60) return { label: '활발한 활용 팀', color: 'text-blue-700 bg-blue-50 border-blue-200',
    comment: 'AI를 능숙하게 다루는 팀으로, Pro 티어 일괄 도입 시 생산성 시너지가 기대됩니다.' };
  if (avg >= 40) return { label: '안정적 사용 팀', color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    comment: 'AI 활용이 안정화된 팀입니다. 맞춤 교육으로 활용 영역을 넓힐 수 있는 여지가 큽니다.' };
  return { label: '도입 확대 기회 팀', color: 'text-amber-700 bg-amber-50 border-amber-200',
    comment: 'AI 도입을 확대할 수 있는 팀입니다. 무료 버전부터 업무에 맞춰 점진적으로 도입해보면 좋습니다.' };
}

const Q1_LABEL = {
  coding: '코딩 및 개발', writing: '문서 작성', general: '일상 사용',
  image: '이미지 생성', research: '학술 연구',
  communication: '커뮤니케이션·CS', planning: '기획·전략', analysis: '데이터 분석',
  other: '기타',
};
const Q4_LABEL = { limit: '한도 부족', quality: '품질 부족', context: '긴 자료 처리', none: '부족함 없음', never: '미사용' };

// 티어별 비용 (USD/월)
const TIER_USD = { free: 0, pro: 20, max: 100 };
const KRW_RATE = 1380;

function teamBudget(members) {
  const tiers = { free: 0, pro: 0, max: 0 };
  members.forEach((m) => { if (tiers[m.tier] !== undefined) tiers[m.tier]++; });
  const monthlyUSD = tiers.pro * TIER_USD.pro + tiers.max * TIER_USD.max;
  return { tiers, monthlyUSD, monthlyKRW: monthlyUSD * KRW_RATE, yearlyKRW: monthlyUSD * 12 * KRW_RATE };
}

function teamMgmtAdvice(avg, tiers) {
  if (avg >= 70) return 'AI를 깊이 활용하는 팀입니다. 전사 노하우 공유 워크숍을 진행하면 다른 팀의 활용도까지 끌어올릴 수 있습니다. Pro/Max 도입 효과가 가장 빠르게 회수되는 팀입니다.';
  if (avg >= 50) return 'Pro 티어 일괄 도입 시 즉시 생산성 효과가 나타날 것으로 예상됩니다. 도입 후 1개월 단위로 사용량을 모니터링하면서 Max 승급 후보를 찾아주세요.';
  if (avg >= 30) return '소수 인원에게 Pro 티어 시범 도입 후 효과 검증 → 점진적 확대가 안전합니다. 동시에 사내 무료 도구 활용 교육 1회를 권장합니다.';
  return 'AI 도입 초기 단계입니다. 무료 도구 활용 교육부터 시작하세요. Pro 티어 도입은 사용 패턴이 확립된 이후가 비용 효율적입니다.';
}

function generateExecutiveInsights(data, byTeam, q4Map, tierCounts) {
  const total = data.length;
  const insights = [];
  if (total === 0) return insights;

  const avgScore = Math.round(data.reduce((s, d) => s + (Number(d.score) || 0), 0) / total);
  const limitCount = q4Map['limit'] || 0;
  const neverCount = q4Map['never'] || 0;
  const noneCount = q4Map['none'] || 0;
  const teams = Object.keys(byTeam);
  const teamAvgs = teams.map((t) => Math.round(byTeam[t].reduce((s, m) => s + (Number(m.score) || 0), 0) / byTeam[t].length));
  const maxAvg = teamAvgs.length ? Math.max(...teamAvgs) : 0;
  const minAvg = teamAvgs.length ? Math.min(...teamAvgs) : 0;
  const gap = maxAvg - minAvg;

  // 1. 전사 활용 단계
  let stage;
  if (avgScore >= 70) stage = '숙련 단계';
  else if (avgScore >= 50) stage = '안정 단계';
  else if (avgScore >= 30) stage = '도입 확산 단계';
  else stage = '도입 초기 단계';
  insights.push({
    icon: '📊',
    title: `전사 AI 활용 단계: ${stage} (평균 ${avgScore}점)`,
    body: avgScore >= 50
      ? '유료 도구 도입 효과가 명확히 나타날 시점입니다. 헤비 사용자 중심 우선 도입 → 일반 사용자 확산 순서로 진행하면 ROI가 좋습니다.'
      : '전사 평균 활용도가 아직 높지 않으므로, 무료 도구 활성화와 사내 교육에 우선 투자하는 것이 효율적입니다. 일부 헤비 사용자만 Pro 도입을 검토하세요.',
  });

  // 2. 한도 부족 비중
  if (limitCount > 0) {
    const pct = Math.round((limitCount / total) * 100);
    const monthlyKRW = limitCount * 20 * KRW_RATE;
    insights.push({
      icon: pct >= 30 ? '⚠️' : '📈',
      title: `한도 부족 응답 ${limitCount}명 (${pct}%)`,
      body: pct >= 30
        ? `전체의 ${pct}%가 무료 한도 부족을 호소합니다. 이들에게 Pro 티어 일괄 지원이 가장 ROI 높은 투자입니다. 예상 비용: 월 약 ${monthlyKRW.toLocaleString('ko-KR')}원.`
        : `한도 부족 호소가 ${pct}%로 아직 부담이 크지 않습니다. 해당 인원만 선별적으로 Pro를 지원하는 게 가장 효율적입니다.`,
    });
  }

  // 3. Max 추천자
  if (tierCounts.max > 0) {
    const monthlyKRW = tierCounts.max * 100 * KRW_RATE;
    insights.push({
      icon: '👑',
      title: `핵심 헤비 사용자 ${tierCounts.max}명 식별`,
      body: `Max 티어를 본전 뽑을 헤비 사용자로 진단됐습니다. 이들의 생산성이 회사 전체에 큰 영향을 주므로 우선 지원하세요. 예상 비용: 월 약 ${monthlyKRW.toLocaleString('ko-KR')}원. 도입 후 실제 사용량을 보고 1개월 단위로 Pro 다운그레이드 여부 검토 권장.`,
    });
  }

  // 4. 미사용자 / 부족함 없음
  if (neverCount + noneCount > 0) {
    const pct = Math.round(((neverCount + noneCount) / total) * 100);
    insights.push({
      icon: '🌱',
      title: `유료 불필요 응답 ${neverCount + noneCount}명 (${pct}%)`,
      body: `${neverCount}명이 미사용, ${noneCount}명이 무료로 충분하다고 답했습니다. 이들에게는 유료 도구 강제 도입보다 무료 도구 활용 교육 1회가 더 효과적입니다.`,
    });
  }

  // 5. 팀 격차
  if (gap >= 30) {
    insights.push({
      icon: '⚖️',
      title: `팀별 활용도 격차 ${gap}점`,
      body: `최고 팀(${maxAvg}점)과 최저 팀(${minAvg}점)의 격차가 큽니다. 격차 해소를 위해 활용도가 높은 팀의 사례를 사내에 공유하는 자리(예: 점심 데모 세션)를 분기 1회 마련해보세요.`,
    });
  }

  // 6. 권장 예산 합계
  const monthlyUSD = tierCounts.pro * 20 + tierCounts.max * 100;
  insights.push({
    icon: '💰',
    title: `전사 권장 예산: 연 약 ${(monthlyUSD * 12 * KRW_RATE).toLocaleString('ko-KR')}원`,
    body: `Pro ${tierCounts.pro}명 + Max ${tierCounts.max}명 + 무료 ${tierCounts.free}명 기준, 월 약 ${(monthlyUSD * KRW_RATE).toLocaleString('ko-KR')}원이 적정 예산입니다. (환율 1,380원 가정) 1차 도입 → 1개월 모니터링 → 조정 순서로 진행하면 시행착오를 줄일 수 있습니다.`,
  });

  return insights;
}

function AdminDashboard({ data, source, onRefresh, onDelete, onReset }) {
  const total = data.length;

  if (total === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-sm text-center">
          <div className="text-4xl mb-3">📭</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">아직 응답이 없습니다</h2>
          <p className="text-sm text-slate-500 mb-6">팀원들이 진단을 완료하면 여기에 표시됩니다.</p>
          {source === 'local' && (
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              현재 <b>로컬 모드</b>입니다 — 이 브라우저에서 진단한 응답만 보입니다.<br />
              여러 사람의 응답을 모으려면 Apps Script 웹훅 설정이 필요합니다.
            </p>
          )}
          <button onClick={onRefresh} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold">
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(data.reduce((s, d) => s + (Number(d.score) || 0), 0) / total);

  const byTeam = {};
  data.forEach((d) => {
    const t = d.team || '미지정';
    if (!byTeam[t]) byTeam[t] = [];
    byTeam[t].push(d);
  });
  const teams = Object.keys(byTeam).sort();

  // Q1 분포 (array 처리)
  const q1Map = {};
  data.forEach((d) => {
    const items = toArr(d.q1);
    items.forEach((item) => {
      if (!q1Map[item]) q1Map[item] = { count: 0, scoreSum: 0 };
      q1Map[item].count++;
      q1Map[item].scoreSum += Number(d.score) || 0;
    });
  });

  // Q4 분포 (다중 선택)
  const q4Map = {};
  data.forEach((d) => {
    const items = toArr(d.q4);
    if (items.length === 0) {
      q4Map['unknown'] = (q4Map['unknown'] || 0) + 1;
    } else {
      items.forEach((item) => { q4Map[item] = (q4Map[item] || 0) + 1; });
    }
  });

  // Q5 결제 방식 분포
  const paymentMap = {};
  data.forEach((d) => {
    const k = d.q5Payment || 'unknown';
    paymentMap[k] = (paymentMap[k] || 0) + 1;
  });

  // 추천 티어 분포
  const tierCounts = { free: 0, pro: 0, max: 0 };
  data.forEach((d) => { if (tierCounts[d.tier] !== undefined) tierCounts[d.tier]++; });
  const totalBudget = teamBudget(data);

  // 추천 도구 채택 분포 (다중 추천 — 슬래시·플러스 분할)
  const toolMap = {};
  data.forEach((d) => {
    const ai = (d.ai || '').replace(/\s*무료/g, '').replace(/Plus|Pro|Max|Advanced|Code/gi, '').trim();
    String(d.ai || '').split(/[+/또는]/).map((s) => s.trim()).filter(Boolean).forEach((t) => {
      const clean = t.replace(/병행/g, '').trim();
      if (clean) toolMap[clean] = (toolMap[clean] || 0) + 1;
    });
  });

  // 종합 인사이트 자동 생성
  const insights = generateExecutiveInsights(data, byTeam, q4Map, tierCounts);

  const sorted = [...data].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">글룩 AI 진단 보고서</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${source === 'webhook' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {source === 'webhook' ? '시트 연동' : '로컬 모드'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1">
              <RefreshCw size={14} /> 새로고침
            </button>
            <button onClick={() => window.print()} className="px-3 py-2 text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all flex items-center gap-1">
              <Printer size={14} /> PDF 인쇄
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {source === 'local' && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 leading-relaxed no-print">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">로컬 모드로 작동 중입니다</div>
                <div className="text-xs text-amber-800/90">
                  현재 이 브라우저에서 진단한 응답만 보입니다. 다른 컴퓨터·다른 사람의 응답을 모으려면 README의 Apps Script 웹훅 설정이 필요합니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ 종합 권고 - 데이터 기반 자동 분석 */}
        <Section title="📌 글룩 AI 예산 종합 권고" icon={<Sparkles size={20} />}>
          <div className="grid sm:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 print-card shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{ins.icon}</span>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight flex-1">{ins.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ins.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="전체 요약" icon={<BarChart3 size={20} />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="총 응답자" value={`${total}명`} />
            <Stat label="평균 활용도" value={`${avgScore}점`} />
            <Stat label="응답 팀 수" value={`${teams.length}팀`} />
            <Stat label="권장 월 예산" value={`${totalBudget.monthlyKRW.toLocaleString('ko-KR')}원`} accent />
          </div>

          {/* 티어 분포 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm mb-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4">추천 티어 분포</h3>
            <div className="flex h-10 rounded-lg overflow-hidden border border-slate-200 mb-3">
              {tierCounts.max > 0 && (
                <div className="bg-purple-500 grid place-items-center text-xs text-white font-semibold" style={{ flex: tierCounts.max }} title={`Max ${tierCounts.max}명`}>
                  Max {tierCounts.max}
                </div>
              )}
              {tierCounts.pro > 0 && (
                <div className="bg-blue-500 grid place-items-center text-xs text-white font-semibold" style={{ flex: tierCounts.pro }} title={`Pro ${tierCounts.pro}명`}>
                  Pro {tierCounts.pro}
                </div>
              )}
              {tierCounts.free > 0 && (
                <div className="bg-emerald-500 grid place-items-center text-xs text-white font-semibold" style={{ flex: tierCounts.free }} title={`무료 ${tierCounts.free}명`}>
                  무료 {tierCounts.free}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />Max {tierCounts.max}명 · 월 {(tierCounts.max * 100 * KRW_RATE).toLocaleString('ko-KR')}원</div>
              <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />Pro {tierCounts.pro}명 · 월 {(tierCounts.pro * 20 * KRW_RATE).toLocaleString('ko-KR')}원</div>
              <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />무료 {tierCounts.free}명 · 0원</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">팀별 응답자 수</h3>
            <div className="space-y-3">
              {teams.map((t) => {
                const cnt = byTeam[t].length;
                const pct = total ? (cnt / total) * 100 : 0;
                return (
                  <div key={t}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{t}</span>
                      <span className="text-slate-500 tabular-nums">{cnt}명</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="팀별 AI 활용도 + 권장 예산" icon={<Users size={20} />}>
          <div className="grid sm:grid-cols-2 gap-4">
            {teams.map((t) => {
              const members = byTeam[t];
              const avg = Math.round(members.reduce((s, m) => s + (Number(m.score) || 0), 0) / members.length);
              const grade = teamGrade(avg);
              const budget = teamBudget(members);
              const aiCount = {};
              members.forEach((m) => { aiCount[m.ai] = (aiCount[m.ai] || 0) + 1; });
              const topAis = Object.entries(aiCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([ai]) => ai);
              const mgmt = teamMgmtAdvice(avg, budget.tiers);

              return (
                <div key={t} className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{t}</h3>
                      <div className="text-xs text-slate-500">{members.length}명 응답</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${grade.color}`}>
                      {grade.label}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>팀 평균 활용도</span>
                      <span className="font-mono font-bold tabular-nums">{avg}/100</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${avg}%` }} />
                    </div>
                  </div>

                  {/* 팀별 티어 분포 */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1.5">티어 분포</div>
                    <div className="flex h-6 rounded overflow-hidden border border-slate-200 text-[10px] text-white font-semibold">
                      {budget.tiers.max > 0 && <div className="bg-purple-500 grid place-items-center" style={{ flex: budget.tiers.max }}>{budget.tiers.max}</div>}
                      {budget.tiers.pro > 0 && <div className="bg-blue-500 grid place-items-center" style={{ flex: budget.tiers.pro }}>{budget.tiers.pro}</div>}
                      {budget.tiers.free > 0 && <div className="bg-emerald-500 grid place-items-center" style={{ flex: budget.tiers.free }}>{budget.tiers.free}</div>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Max {budget.tiers.max} · Pro {budget.tiers.pro} · 무료 {budget.tiers.free}</div>
                  </div>

                  <div className="text-xs text-slate-500 mb-1">팀 권장 예산</div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <div className="text-lg font-black text-slate-900 tabular-nums">월 {budget.monthlyKRW.toLocaleString('ko-KR')}원</div>
                    <div className="text-xs text-slate-500">/ 연 {budget.yearlyKRW.toLocaleString('ko-KR')}원</div>
                  </div>

                  {topAis.length > 0 && (
                    <>
                      <div className="text-xs text-slate-500 mb-2">주 추천 도구</div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {topAis.map((ai) => (
                          <span key={ai} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">{ai}</span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    <div className="font-semibold text-slate-700 mb-1">💬 관리 권고</div>
                    {mgmt}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="개인별 AI 활용도 상세" icon={<TrendingUp size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">이름</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">소속팀</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">직책</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">점수</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">등급</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">티어</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">추천 AI</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">주요 고민</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-700 no-print">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d, i) => (
                    <tr key={d._id || i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{i < 3 && '👑 '}{d.name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.team}</td>
                      <td className="px-4 py-3 text-slate-600">{d.role || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">{d.score}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.grade}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          d.tier === 'max' ? 'bg-purple-100 text-purple-700' :
                          d.tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {d.tier === 'max' ? 'Max' : d.tier === 'pro' ? 'Pro' : '무료'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.ai}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[240px] truncate">
                        {(d.q6 || '').slice(0, 40)}{(d.q6 || '').length > 40 ? '…' : ''}
                      </td>
                      <td className="px-3 py-3 text-center no-print">
                        <button
                          onClick={() => {
                            if (confirm(`${d.name}님의 응답을 삭제할까요?\n\n이 작업은 되돌릴 수 없습니다.`)) {
                              onDelete(d._id || `${d.name}-${d.timestamp}`);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1.5 transition-all"
                          title="이 응답 삭제"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {source === 'webhook' && (
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              ⚠️ 시트 연동 모드: 화면에서만 숨겨지며 구글 시트 원본은 유지됩니다. 시트에서 행을 직접 삭제해야 영구 삭제됩니다.
            </p>
          )}
        </Section>

        <Section title="추천 도구 채택 빈도" icon={<TrendingUp size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            <div className="space-y-3">
              {Object.entries(toolMap).sort((a, b) => b[1] - a[1]).map(([tool, count]) => {
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={tool}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{tool}</span>
                      <span className="text-slate-500 tabular-nums">{count}명 ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              💡 동일 도구를 추천받은 인원이 많을수록 일괄 도입 시 협상력이 높아집니다 (5명 이상 시 팀 플랜 검토 가능).
            </div>
          </div>
        </Section>

        <Section title="용도 분포 (다중 선택 집계)" icon={<BarChart3 size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            <div className="space-y-4">
              {Object.entries(q1Map).sort((a, b) => b[1].count - a[1].count).map(([k, v]) => {
                const pct = total ? (v.count / total) * 100 : 0;
                const avg = v.count ? Math.round(v.scoreSum / v.count) : 0;
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{Q1_LABEL[k] || k}</span>
                      <span className="text-slate-500 tabular-nums">{v.count}명 · 평균 {avg}점</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="현재 AI 사용 불편점 분포" icon={<AlertCircle size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            <div className="space-y-3">
              {Object.entries(q4Map).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                const pct = total ? (v / total) * 100 : 0;
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{Q4_LABEL[k] || k}</span>
                      <span className="text-slate-500 tabular-nums">{v}명 ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              💡 "한도 부족"이 많다면 → Pro 일괄 도입 근거. "미사용"이 많다면 → 도입 교육 필요.
            </div>
          </div>
        </Section>

        <Section title="구독료 결제 방식 분포" icon={<AlertCircle size={20} />}>
          <PaymentDistribution data={data} paymentMap={paymentMap} total={total} byTeam={byTeam} teams={teams} />
        </Section>

        <Section title="주관식 답변 모아보기" icon={<FileText size={20} />}>
          <div className="space-y-6">
            {teams.map((t) => (
              <div key={t} className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  {t}<span className="text-xs font-normal text-slate-500">({byTeam[t].length}명)</span>
                </h3>
                <div className="space-y-3">
                  {byTeam[t].map((m, i) => (
                    <div key={i} className="border-l-2 border-slate-200 pl-4 py-1">
                      <div className="text-xs text-slate-500 mb-1">
                        <b className="text-slate-700">{m.name}</b>{m.role ? ` · ${m.role}` : ''}
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed">{m.q6 || '(답변 없음)'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

const PAYMENT_LABEL = {
  personal: '개인 결제',
  company:  '회사 결제',
  mixed:    '개인·회사 혼합',
  na:       '무료 도구만 사용',
  unknown:  '미응답',
};
const PAYMENT_COLOR = {
  personal: 'bg-rose-500',
  company:  'bg-emerald-500',
  mixed:    'bg-amber-500',
  na:       'bg-slate-400',
  unknown:  'bg-slate-200',
};

function PaymentDistribution({ data, paymentMap, total, byTeam, teams }) {
  const personalCount = paymentMap.personal || 0;
  const companyCount = paymentMap.company || 0;
  const mixedCount = paymentMap.mixed || 0;
  const personalShare = personalCount + mixedCount * 0.5;  // mixed는 절반만 개인 부담으로 계산
  const personalPct = total ? Math.round((personalShare / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 전사 결제 방식 분포 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900">전사 결제 방식</h3>
          <div className="text-xs">
            <span className="font-semibold text-rose-600">개인 부담 추정 {personalPct}%</span>
            <span className="text-slate-400"> · 개인 {personalCount} / 혼합 {mixedCount} / 회사 {companyCount}</span>
          </div>
        </div>

        {/* 비율 바 */}
        <div className="flex h-10 rounded-lg overflow-hidden border border-slate-200 mb-3">
          {Object.entries(paymentMap).sort((a, b) => {
            const order = { personal: 0, mixed: 1, company: 2, na: 3, unknown: 4 };
            return (order[a[0]] ?? 5) - (order[b[0]] ?? 5);
          }).map(([k, v]) => (
            <div
              key={k}
              className={`${PAYMENT_COLOR[k] || 'bg-slate-300'} grid place-items-center text-[10px] text-white font-semibold`}
              style={{ flex: v }}
              title={`${PAYMENT_LABEL[k] || k} ${v}명`}
            >
              {v >= Math.ceil(total * 0.08) ? `${PAYMENT_LABEL[k] || k} ${v}` : v}
            </div>
          ))}
        </div>

        {/* 세부 리스트 */}
        <div className="space-y-2">
          {Object.entries(paymentMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
            const pct = total ? (v / total) * 100 : 0;
            return (
              <div key={k} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full ${PAYMENT_COLOR[k] || 'bg-slate-300'}`} />
                <span className="font-medium text-slate-700 w-32">{PAYMENT_LABEL[k] || k}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${PAYMENT_COLOR[k] || 'bg-slate-300'} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-slate-500 tabular-nums w-20 text-right">{v}명 ({pct.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
          💡 <b>개인 부담 비율이 높을수록</b> 회사 차원의 지원이 필요하다는 신호입니다.
          {personalPct >= 40 && (
            <span className="text-rose-700 font-semibold"> 현재 개인 부담이 {personalPct}%로 높은 편 — 회사 예산 배정 검토를 권장합니다.</span>
          )}
        </div>
      </div>

      {/* 팀별 개인 결제 비율 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">팀별 개인 결제 비율</h3>
        <div className="space-y-2.5">
          {teams.map((t) => {
            const members = byTeam[t];
            const tCount = members.length;
            const tPersonal = members.filter((m) => m.q5Payment === 'personal').length;
            const tMixed = members.filter((m) => m.q5Payment === 'mixed').length;
            const tShare = tPersonal + tMixed * 0.5;
            const tPct = tCount ? Math.round((tShare / tCount) * 100) : 0;
            return (
              <div key={t} className="flex items-center gap-3 text-xs">
                <span className="font-medium text-slate-700 w-24">{t}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${tPct >= 50 ? 'bg-rose-500' : tPct >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${tPct}%` }} />
                </div>
                <span className="text-slate-500 tabular-nums w-28 text-right">
                  {tPersonal + tMixed}/{tCount}명 · {tPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
        <span className="text-slate-900">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-4 print-card ${accent ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-200 shadow-sm'}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl sm:text-2xl font-black tabular-nums ${accent ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

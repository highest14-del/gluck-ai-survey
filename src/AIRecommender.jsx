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
const ADMIN_PASSWORD = 'gluck2026';

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
      { value: 'coding',   label: '코딩 및 개발',                       desc: '웹, 앱, 데이터 분석' },
      { value: 'writing',  label: '긴 문서 작성 및 전문 글쓰기',          desc: '보고서, 기획서' },
      { value: 'general',  label: '일상 질문, 번역, 아이디어 브레인스토밍', desc: '가벼운 활용' },
      { value: 'image',    label: '이미지/영상 생성 및 디자인',           desc: '비주얼 콘텐츠 제작' },
      { value: 'research', label: '학술 연구, 논문 검토',                desc: '심층 자료 분석' },
    ],
  },
  q2: {
    label: '다루는 데이터나 문서의 분량은요?',
    options: [
      { value: 'short',  label: '짧은 문장이나 질문 위주',          desc: '단발성' },
      { value: 'medium', label: 'A4 2~3장 분량',                   desc: '중간 길이' },
      { value: 'long',   label: '책 한 권이나 대규모 코드베이스',     desc: '매우 김' },
    ],
  },
  q3: {
    label: '평소 AI 사용 빈도는요?',
    options: [
      { value: 'rare',  label: '일주일에 몇 번',           desc: '가끔' },
      { value: 'daily', label: '매일 1~2시간',             desc: '자주' },
      { value: 'heavy', label: '업무의 대부분, 하루 종일',   desc: '헤비' },
    ],
  },
  q4: {
    label: '현재 AI를 쓰면서 가장 답답하게 느끼는 점은요?',
    options: [
      { value: 'limit',   label: '무료 한도가 빨리 떨어져요',              desc: '횟수/시간 제한' },
      { value: 'quality', label: '응답 품질이 좀 더 좋았으면 해요',          desc: '정확도/깊이 부족' },
      { value: 'context', label: '더 긴 문서/대용량 자료를 한 번에 다루고 싶어요', desc: '컨텍스트 부족' },
      { value: 'none',    label: '특별히 부족한 점은 없어요',              desc: '지금 충분' },
      { value: 'never',   label: '아직 본격적으로 써본 적 없어요',           desc: '입문 단계' },
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
      { value: 'midjourney', label: 'Midjourney',           desc: '이미지' },
      { value: 'other',      label: '기타',                  desc: '그 외 다른 도구' },
    ],
  },
};

// ============================================================
// 유틸
// ============================================================
function pickPrimary(q1Array) {
  const arr = Array.isArray(q1Array) ? q1Array : q1Array ? [q1Array] : [];
  if (arr.includes('coding')) return 'coding';
  if (arr.includes('research')) return 'research';
  if (arr.includes('writing')) return 'writing';
  if (arr.includes('image')) return 'image';
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

// 도구별 강점 — 결과 화면 "왜 이 AI인가요?" 카드용
const TOOL_REASONS = {
  'Claude Pro': [
    'Claude는 2026년 코딩(SWE-bench)·긴 문서 분석에서 1위 평가',
    'Artifacts/Projects로 결과물을 옆 패널에서 실시간 편집·미리보기',
  ],
  'Claude Max': [
    'Pro 대비 5~20배 한도 — Rate limit 걱정 없이 헤비 사용 가능',
    'Claude Code CLI로 터미널·IDE에서 코드베이스 전체 작업',
  ],
  'ChatGPT Plus': [
    'GPT-5 + DALL-E + 음성 + GPTs까지 한 구독에 모두 포함',
    '국내 사용자가 가장 많아 한국어 학습 자료·팁이 가장 풍부',
  ],
  'Gemini Advanced': [
    '2M 토큰 컨텍스트 — 책 한 권을 통째로 던질 수 있음',
    'Gmail·Drive·Docs 직접 연동으로 워크스페이스 시너지 극대화',
  ],
  'Perplexity Pro': [
    '실시간 웹 검색 + 출처 인용으로 팩트체크 신뢰성 1위',
    'Deep Research 모드는 5~10분 만에 보고서급 결과물 생성',
  ],
  'Cursor Pro': [
    'IDE 안에서 코드와 직접 상호작용 — 브라우저 왕복 없이 빠름',
    'Agent 모드로 멀티 파일 자동 수정 + 모델(Claude/GPT) 선택 가능',
  ],
  'Midjourney': [
    '예술적 비주얼 퀄리티 업계 1위 — 디자인·콘셉트 작업 최강',
    '레퍼런스 이미지 기반 변형(--cref, --sref) 워크플로 직관적',
  ],
  'Runway': [
    '영상 생성 도구 중 안정성·일관성 가장 우수 (Gen-3)',
    '이미지→영상, 텍스트→영상, 마스크 인페인팅까지 풀 파이프라인',
  ],
  'Sora': [
    'OpenAI 영상 모델 — ChatGPT Plus 안에서 추가 비용 없이 사용',
    '최대 20초 일관성 영상 생성 (인물·배경 안정적 유지)',
  ],
};

function reasonsFor(toolNames, extra) {
  const list = [];
  toolNames.slice(0, 2).forEach((t) => {
    const r = TOOL_REASONS[t];
    if (r && r[0]) list.push(r[0]);
  });
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
  const pain = answers.q4;
  const text = (answers.q6 || '').toLowerCase();
  const wantsVideo = /영상|동영상|비디오|video|movie|short|숏폼|릴스/.test(text);
  const currentAis = toArr(answers.q5);
  const has = (a) => currentAis.includes(a);

  // ---------- 티어 결정 ----------
  let tier;
  if (pain === 'never' || pain === 'none') tier = 'free';
  else if ((pain === 'limit' || pain === 'context') && frequency === 'heavy' && volume === 'long') tier = 'max';
  else tier = 'pro';

  const painLabel = {
    limit: '현재 한도 부족을 느끼고 계신 점',
    quality: '응답 품질에 아쉬움을 느끼시는 점',
    context: '긴 자료를 한 번에 다루고 싶어하시는 점',
  }[pain] || '현재 업무 패턴';

  // ---------- 무료 ----------
  if (tier === 'free') {
    if (wantsVideo) {
      return rec(
        'Runway 무료 + Microsoft Designer', '🎬', 'free', 240000,
        pain === 'never'
          ? '영상 생성에 관심이 있으시군요. 우선 Runway 무료 플랜으로 짧은 클립부터 만들어 보시고, 필요해지면 그때 유료를 검토하시는 게 가장 효율적입니다. 답변 덕분에 글룩이 영상 도구 도입 시점을 정확히 가늠할 수 있게 되었습니다.'
          : '영상 작업 빈도가 아직 가벼우시다면 Runway 무료로도 핵심 기능을 충분히 체험할 수 있습니다. 답변 덕분에 글룩의 영상 콘텐츠 예산이 합리적으로 책정될 수 있게 되었습니다.',
        ['Runway'],
        'Microsoft Designer는 Bing Image Creator(DALL-E 3) 기반으로 무료 이미지 생성 제공',
      );
    }
    if (primary === 'image') {
      return rec(
        'ChatGPT 무료 + Microsoft Designer', '🖼️', 'free', 240000,
        '이미지 생성 빈도가 가벼운 패턴에는 무료 도구 조합으로도 충분합니다. 답변 덕분에 글룩이 비주얼 업무 영역의 도입 우선순위를 정할 수 있게 되었습니다.',
        ['ChatGPT Plus'],
        'Microsoft Designer는 무료로 DALL-E 3 기반 이미지를 생성할 수 있는 가장 가성비 좋은 옵션',
      );
    }
    if (primary === 'research') {
      return rec(
        'Perplexity 무료 + Gemini 무료', '🔍', 'free', 240000,
        '리서치 위주의 사용 패턴에는 출처 기반 검색 Perplexity와 Google 검색 통합 Gemini 조합이 무료에서 가장 강력합니다. 답변 덕분에 글룩이 합리적인 도입 계획을 세울 수 있게 되었습니다.',
        ['Perplexity Pro', 'Gemini Advanced'],
      );
    }
    if (primary === 'coding') {
      return rec(
        'Claude 무료 + ChatGPT 무료', '🎨', 'free', 240000,
        '코딩 학습·실험 단계에는 Claude(추론력)와 ChatGPT(생태계)를 무료로 병행하는 것이 가장 효율적입니다. 답변 덕분에 글룩이 개발 인력 대상 도입 시점을 잡을 수 있게 되었습니다.',
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    if (primary === 'writing') {
      return rec(
        'Claude 무료 + ChatGPT 무료', '✍️', 'free', 240000,
        '문서 작업이 가벼운 단계에는 무료 모델 조합으로 충분합니다. 답변 덕분에 글룩의 문서 업무 도구 예산이 합리적으로 책정될 수 있게 되었습니다.',
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    return rec(
      'Gemini 무료 + ChatGPT 무료', '💎', 'free', 240000,
      pain === 'never'
        ? '이제 AI 활용을 시작하시는 단계이시군요. Gemini와 ChatGPT 무료를 함께 써보시면서 어떤 도구가 본인 업무에 잘 맞는지 비교해보시는 것을 추천드립니다.'
        : '일상 활용에는 무료 조합으로도 부족함이 거의 없습니다. 답변 덕분에 글룩이 불필요한 구독 없이 합리적인 예산을 수립할 수 있게 되었습니다. 감사합니다.',
      ['ChatGPT Plus', 'Gemini Advanced'],
    );
  }

  // ---------- Max ----------
  if (tier === 'max') {
    if (primary === 'coding') {
      return rec(
        'Claude Max + Cursor Pro', '💎', 'max', 0,
        '대규모 코드베이스를 하루 종일 다루시는 헤비 패턴에는 Claude Max(고용량 추론)와 Cursor Pro(IDE 통합) 조합이 본전을 뽑는 투자입니다. 응답 덕분에 글룩이 핵심 개발 인력 지원 전략을 명확히 세울 수 있게 되었습니다.',
        ['Claude Max', 'Cursor Pro'],
      );
    }
    if (primary === 'writing' || primary === 'research') {
      return rec(
        'Claude Max + Gemini Advanced', '📚', 'max', 0,
        '방대한 문서를 매일 다루시는 업무 특성상 Claude Max(추론력)와 Gemini Advanced(2M 컨텍스트) 조합이 가장 강력합니다. 답변 덕분에 글룩의 핵심 작업자 AI 지원 예산 수립에 큰 도움이 되었습니다.',
        ['Claude Max', 'Gemini Advanced'],
      );
    }
    if (wantsVideo) {
      return rec(
        'Sora + Midjourney + ChatGPT Plus', '🎬', 'max', 0,
        '영상 작업을 본격적으로 하시는 패턴이라면 Sora(영상)+Midjourney(키프레임)+ChatGPT Plus(스크립트) 조합이 풀 파이프라인을 커버합니다. 답변 덕분에 글룩의 콘텐츠 제작 전략에 맞는 예산이 잡힐 수 있게 되었습니다.',
        ['Sora', 'Midjourney'],
      );
    }
    if (primary === 'image') {
      return rec(
        'Midjourney + ChatGPT Plus', '🎨', 'max', 0,
        '비주얼 작업을 헤비하게 하시는 패턴에는 Midjourney(예술성)와 ChatGPT Plus(텍스트+빠른 이미지) 조합이 정답입니다. 답변 덕분에 글룩의 디자인 영역 AI 투자가 명확해졌습니다.',
        ['Midjourney', 'ChatGPT Plus'],
      );
    }
    return rec(
      'ChatGPT Plus + Claude Pro 병행', '⚡', 'pro', 0,
      '다양한 업무에 AI를 적극 활용하시는 패턴에는 ChatGPT Plus와 Claude Pro 조합이 실용적입니다. 답변 덕분에 글룩이 멀티 도구 전략에 맞는 예산을 수립할 수 있게 되었습니다.',
      ['ChatGPT Plus', 'Claude Pro'],
    );
  }

  // ---------- Pro ----------
  if (primary === 'coding') {
    if (volume === 'long' && (frequency === 'heavy' || frequency === 'daily')) {
      return rec(
        'Cursor Pro', '⌨️', 'pro', 180000,
        `${painLabel}을 고려하면 IDE 통합 코딩 도구 Cursor Pro가 정답입니다. 백엔드로 Claude·GPT-5를 모두 사용할 수 있어 모델 선택의 유연성도 확보됩니다. 답변 덕분에 글룩이 개발 생산성에 맞춰 도구를 정확히 배치할 수 있게 되었습니다.`,
        ['Cursor Pro', 'Claude Pro'],
      );
    }
    return rec(
      'Claude Pro', '⚡', 'pro', 180000,
      `${painLabel}을 고려하면 Claude Pro가 가장 확실한 선택입니다. 2026년 기준 코딩 문맥 파악과 긴 코드베이스 이해력에서 압도적입니다. 답변 덕분에 글룩이 개발 도구를 정확히 배치할 수 있게 되었습니다.`,
      ['Claude Pro', 'ChatGPT Plus'],
    );
  }

  if (primary === 'writing') {
    if (volume === 'long') {
      return rec(
        'Gemini Advanced', '📜', 'pro', 180000,
        `긴 문서를 자주 다루시는 패턴에는 Gemini Advanced의 2M 토큰 컨텍스트가 결정적입니다. 책 한 권 통째로 던지고 요약·분석이 가능합니다. 답변 덕분에 글룩의 문서 업무 효율화 예산이 정확히 잡힐 수 있게 되었습니다.`,
        ['Gemini Advanced', 'Claude Pro'],
      );
    }
    if (pain === 'quality') {
      return rec(
        'Claude Pro', '📝', 'pro', 180000,
        `응답 품질을 중요하게 보시는 패턴에는 Claude Pro가 정답입니다. 한국어 문장 자연스러움과 톤 조절에서 가장 안정적입니다. 답변 덕분에 글룩의 문서 작업 도구 선정이 명확해졌습니다.`,
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    return rec(
      'ChatGPT Plus', '💬', 'pro', 180000,
      `다양한 글쓰기 작업에는 ChatGPT Plus가 가장 친숙하고, GPTs로 반복 업무 자동화까지 가능합니다. 답변 덕분에 글룩의 실용적 도구 선정 기준이 세워졌습니다.`,
      ['ChatGPT Plus', 'Claude Pro'],
    );
  }

  if (primary === 'research') {
    return rec(
      'Perplexity Pro', '🔎', 'pro', 180000,
      `리서치 중심의 사용 패턴에는 Perplexity Pro의 Deep Research가 최적입니다. 5~10분 만에 보고서 수준의 출처 기반 결과를 만들어줍니다. 답변 덕분에 글룩의 리서치 업무 효율화 방향이 명확해졌습니다.`,
      ['Perplexity Pro', 'Claude Pro'],
    );
  }

  if (primary === 'image') {
    if (wantsVideo) {
      return rec(
        'Runway 또는 Sora', '🎬', 'pro', 180000,
        `영상 생성 작업을 시작하시는 패턴이라면 Runway($15/월) 또는 ChatGPT Plus 안에서 쓰는 Sora가 정답입니다. 답변 덕분에 글룩의 영상 콘텐츠 도구 도입 방향이 정해졌습니다.`,
        ['Runway', 'Sora'],
        '이미 ChatGPT Plus를 쓰고 계신다면 Sora가 추가 비용 없이 사용 가능',
      );
    }
    if (pain === 'quality') {
      return rec(
        'Midjourney', '🎨', 'pro', 150000,
        `이미지 품질을 최우선으로 두시는 패턴에는 Midjourney가 정답입니다. 예술적 퀄리티에서 압도적이며, 디자인·콘셉트 작업에 가장 적합합니다. 답변 덕분에 글룩의 디자인 영역 도구 선정이 명확해졌습니다.`,
        ['Midjourney', 'ChatGPT Plus'],
      );
    }
    return rec(
      'ChatGPT Plus', '🖼️', 'pro', 180000,
      `이미지 생성에는 ChatGPT Plus의 DALL-E로 충분합니다. 텍스트·이미지·음성을 한 구독으로 통합 사용할 수 있어 가장 가성비가 좋습니다. 답변 덕분에 글룩의 비주얼 업무 예산이 정확히 잡혔습니다.`,
      ['ChatGPT Plus', 'Midjourney'],
    );
  }

  // general — 이미 쓰는 도구를 보고 다른 옵션 추천
  if (has('chatgpt') && !has('gemini') && !has('claude')) {
    return rec(
      'Claude Pro 또는 Gemini Advanced', '🆕', 'pro', 180000,
      `이미 ChatGPT를 잘 쓰고 계시니, Claude Pro(자연스러운 글쓰기·추론)나 Gemini Advanced(긴 컨텍스트·Google 연동) 중 하나를 추가로 시도해보시는 것을 추천드립니다. 답변 덕분에 글룩의 도구 다양화 전략이 명확해졌습니다.`,
      ['Claude Pro', 'Gemini Advanced'],
    );
  }
  if (has('claude') && !has('chatgpt') && !has('gemini')) {
    return rec(
      'ChatGPT Plus', '💬', 'pro', 180000,
      `이미 Claude를 잘 쓰고 계시니, ChatGPT Plus를 추가하시면 GPTs·DALL-E·음성까지 도구 폭이 크게 넓어집니다. 답변 덕분에 글룩의 도구 다양화 전략이 명확해졌습니다.`,
      ['ChatGPT Plus', 'Gemini Advanced'],
    );
  }
  return rec(
    'ChatGPT Plus', '💬', 'pro', 180000,
    `범용 사용에는 ChatGPT Plus 하나로 대부분의 업무가 커버됩니다. ${painLabel}도 유료 구독으로 대부분 풀립니다. 답변 덕분에 글룩의 실용적 AI 예산 기준이 세워졌습니다.`,
    ['ChatGPT Plus', 'Claude Pro'],
  );
}

// ============================================================
// AI 활용 성숙도 점수 (결과엔 표시 안 하고 관리자/웹훅용)
// ============================================================
function getMaturity(answers) {
  let score = 0;
  if (answers.q3 === 'rare') score += 10;
  if (answers.q3 === 'daily') score += 30;
  if (answers.q3 === 'heavy') score += 50;

  if (answers.q2 === 'short') score += 5;
  if (answers.q2 === 'medium') score += 15;
  if (answers.q2 === 'long') score += 25;

  // Q1 (array) — 용도 중 가장 높은 점수만 반영
  const q1ScoreMap = { coding: 15, research: 15, writing: 10, image: 8, general: 5 };
  const q1Arr = toArr(answers.q1);
  const q1Max = q1Arr.reduce((m, v) => Math.max(m, q1ScoreMap[v] || 0), 0);
  score += q1Max;

  // Q4 (pain point) — 사용 숙련도 간접 반영
  const q4Map = { never: 0, none: 5, quality: 8, limit: 10, context: 12 };
  score += q4Map[answers.q4] || 0;

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

function getTips(answers) {
  const primary = pickPrimary(answers.q1);
  const text = (answers.q6 || '').toLowerCase();
  const wantsVideo = /영상|동영상|비디오|video|movie|short|숏폼|릴스/.test(text);

  if (wantsVideo) {
    return [
      '영상은 짧게 시작하세요. 5초 단위 클립을 만든 뒤 편집툴(CapCut/Premiere)에서 합치는 게 안정적입니다',
      '이미지→영상이 텍스트→영상보다 결과가 일관됩니다. Midjourney/DALL-E로 키 프레임 먼저 만들고 Runway/Sora에 업로드',
      "프롬프트에 카메라 움직임(zoom in, pan right, dolly out)을 명시하면 의도대로 나옵니다",
    ];
  }

  const tips = {
    coding: [
      "파일 전체를 복사해서 붙여넣고 '리팩토링 관점에서 리뷰해줘'라고 요청하세요",
      "에러 로그 전체를 주고 '왜 발생했고 어떻게 고칠지 단계별로 설명해줘'라고 하세요",
      'Claude Code CLI를 쓰면 터미널에서 바로 프로젝트 전체 작업이 가능합니다',
    ],
    writing: [
      "초안을 먼저 쓰고 '더 간결하게 / 더 전문적 톤으로' 등 방향 지시로 다듬으세요",
      '긴 보고서는 개요부터 잡고 섹션별로 나눠 작성하면 일관성이 유지됩니다',
      "'다음 글을 ~를 위한 1페이지 요약으로' 같은 대상+형식 지시가 효과적입니다",
    ],
    research: [
      'Perplexity로 최신 정보 검색 → Claude로 심층 분석 조합이 베스트입니다',
      "'이 주장에 반대되는 증거도 찾아서 양쪽 관점을 정리해줘'로 편향을 줄이세요",
      "논문은 PDF 업로드 후 '핵심 주장, 방법론, 한계점 3가지로 정리'를 요청하세요",
    ],
    image: [
      "프롬프트에 '스타일: ~, 조명: ~, 구도: ~'처럼 구체적 속성을 명시하세요",
      "레퍼런스 이미지를 업로드하고 '이런 느낌으로'라고 지시하면 정확도가 올라갑니다",
      "첫 결과가 마음에 안 들면 전체 다시 말고 '조명만 따뜻하게' 식 부분 수정으로 좁히세요",
    ],
    general: [
      '질문을 짧게 나눠서 던지면 답변 품질이 올라갑니다',
      "'~를 모르는 사람에게 설명해줘' 같은 페르소나 지정이 효과적입니다",
      "답변이 애매하면 '구체적 예시 3개와 함께'라고 덧붙이세요",
    ],
  };
  return tips[primary] || tips.general;
}

// ============================================================
// 웹훅 전송 (POST, no-cors)
// ============================================================
async function sendWebhook(payload) {
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
// Step: 0=intro, 1=name(+team+role), 2=q1, 3=q2, 4=q3, 5=q4, 6=q5, 7=q6, 8=loading, 9=result
// Progress: 1~7 / 7
// ============================================================
function SurveyMode() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: '', team: '', role: '',
    q1: [], q2: '', q3: '', q4: '', q5: [], q6: '',
  });
  const [result, setResult] = useState(null);

  const setField = (k, v) => setAnswers((p) => ({ ...p, [k]: v }));
  const setMany = (obj) => setAnswers((p) => ({ ...p, ...obj }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => {
    setStep(0);
    setAnswers({ name: '', team: '', role: '', q1: [], q2: '', q3: '', q4: '', q5: [], q6: '' });
    setResult(null);
  };

  const selectAndNext = (key, value) => {
    setField(key, value);
    setTimeout(next, 220);
  };

  // Step 8 로딩 진입 시 결과 계산 + 웹훅
  useEffect(() => {
    if (step !== 8) return;
    const rec = getRecommendation(answers);
    const mat = getMaturity(answers);
    setResult({ ...rec, maturityScore: mat.score, maturityLabel: mat.label, maturityEmoji: mat.emoji });

    sendWebhook({
      name: answers.name,
      team: answers.team,
      role: answers.role || '',
      q1: toArr(answers.q1).join(', '),
      q2: answers.q2, q3: answers.q3, q4: answers.q4,
      q5: toArr(answers.q5).join(', '),
      q6: answers.q6,
      recommendedAi: rec.ai,
      recommendedTier: rec.tier,
      savings: rec.savings,
      maturityScore: mat.score,
      maturityLabel: mat.label,
    });

    const t = setTimeout(() => setStep(9), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const progressStep = step >= 1 && step <= 7 ? step : step >= 8 ? 7 : 0;
  const showProgress = step >= 1 && step <= 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {showProgress && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500 tabular-nums">
              {progressStep}/7
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${(progressStep / 7) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div key={step} className="anim-fade-in">
          {step === 0 && <Intro onStart={next} />}
          {step === 1 && (
            <NameStep
              name={answers.name} team={answers.team} role={answers.role}
              onName={(v) => setField('name', v)}
              onConfirm={(emp) => { setMany({ team: emp.team, role: emp.role }); next(); }}
              onManualSubmit={(team, role) => { setMany({ team, role }); next(); }}
              onPrev={prev}
            />
          )}
          {step === 2 && (
            <MultiQuestionStep
              num="Q1" question={QUESTIONS.q1}
              values={answers.q1} onChange={(v) => setField('q1', v)}
              onNext={next} onPrev={prev}
            />
          )}
          {step >= 3 && step <= 5 && (
            <SingleQuestionStep
              num={['Q2', 'Q3', 'Q4'][step - 3]}
              qKey={['q2', 'q3', 'q4'][step - 3]}
              question={QUESTIONS[['q2', 'q3', 'q4'][step - 3]]}
              value={answers[['q2', 'q3', 'q4'][step - 3]]}
              onSelect={selectAndNext}
              onPrev={prev}
            />
          )}
          {step === 6 && (
            <MultiQuestionStep
              num="Q5" question={QUESTIONS.q5}
              values={answers.q5} onChange={(v) => setField('q5', v)}
              onNext={next} onPrev={prev}
            />
          )}
          {step === 7 && (
            <Q6Step value={answers.q6} onChange={(v) => setField('q6', v)} onSubmit={next} onPrev={prev} />
          )}
          {step === 8 && <LoadingStep name={answers.name} />}
          {step === 9 && result && <ResultStep answers={answers} result={result} onRestart={restart} />}
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
          <div><div className="text-2xl mb-1">📋</div><div className="font-medium">7단계 간단 진단</div></div>
        </div>
      </div>

      <button onClick={onStart} className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5">
        진단 시작하기 <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ---------- 이름 + 자동 인식 환영 인사 ----------
function NameStep({ name, team, role, onName, onConfirm, onManualSubmit, onPrev }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualTeam, setManualTeam] = useState(team || '');
  const [manualRole, setManualRole] = useState(role || '');
  const trimmed = (name || '').trim();
  const matched = findEmployee(trimmed);
  const minLength = trimmed.length >= 2;

  // 명단에 매칭된 경우 — 환영 인사 화면
  if (matched && !manualMode) {
    return (
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">이름을 입력해주세요</h2>
        <p className="text-slate-500 mb-6 text-sm">글룩 임직원 명단에서 자동으로 찾아드려요.</p>

        <input type="text" value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="예: 홍재옥" autoFocus
          className="w-full px-5 py-4 text-lg bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all mb-5" />

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 mb-5 anim-fade-in">
          <div className="text-3xl mb-2">👋</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-1">
            <span className="text-emerald-700">{matched.team} {matched.role}</span> {matched.name}님,<br />
            반갑습니다!
          </div>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            글룩 AI 진단에 함께해주셔서 감사합니다.<br />
            잠깐의 시간이 글룩의 합리적인 AI 예산 수립에 큰 힘이 됩니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onPrev} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
            <ArrowLeft size={16} /> 이전
          </button>
          <button onClick={() => onConfirm(matched)}
            className="flex-1 py-4 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 transition-all">
            네, 시작할게요 →
          </button>
        </div>

        <button onClick={() => setManualMode(true)}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-all">
          제가 아니에요 (직접 입력하기)
        </button>
      </div>
    );
  }

  // 명단에 없는 경우 또는 직접 입력 모드
  if (manualMode) {
    const okManual = trimmed.length >= 2 && manualTeam;
    return (
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">정보를 직접 입력해주세요</h2>
        <p className="text-slate-500 mb-6 text-sm">팀별 분석에 활용됩니다.</p>

        <label className="block text-sm font-semibold text-slate-700 mb-2">
          이름 <span className="text-rose-500">*</span>
        </label>
        <input type="text" value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="이름"
          className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all mb-5" />

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
          <button onClick={() => setManualMode(false)} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
            <ArrowLeft size={16} /> 명단으로
          </button>
          <button onClick={() => okManual && onManualSubmit(manualTeam, manualRole)} disabled={!okManual}
            className={`flex-1 py-4 rounded-xl font-semibold transition-all ${okManual ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            다음 →
          </button>
        </div>
      </div>
    );
  }

  // 기본: 이름 입력 화면
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">이름을 입력해주세요</h2>
      <p className="text-slate-500 mb-8 text-sm">글룩 임직원 명단에서 자동으로 찾아드려요.</p>

      <input type="text" value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="예: 홍재옥" autoFocus
        className="w-full px-5 py-4 text-lg bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" />

      {minLength && !matched && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-relaxed anim-fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium mb-1">"{trimmed}"님은 명단에서 찾지 못했어요.</div>
              <div className="text-xs text-amber-800/80">오타가 있는지 확인해보시거나, 아래 버튼으로 직접 입력해주세요.</div>
            </div>
          </div>
        </div>
      )}

      {minLength && !matched && (
        <button onClick={() => setManualMode(true)}
          className="w-full mt-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium">
          직접 입력하기 →
        </button>
      )}
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

// ---------- 다중 선택 (Q1, Q5) ----------
function MultiQuestionStep({ num, question, values, onChange, onNext, onPrev }) {
  const current = Array.isArray(values) ? values : [];
  const exclusive = question.exclusive || [];

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

  const ok = current.length > 0;

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
function LoadingStep({ name }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex gap-1.5 mb-8">
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-3 h-3 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        {name}님께 딱 맞는 AI를 찾고 있어요
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
  const tips = getTips(answers);
  const userText = answers.q6 || '';

  return (
    <div className="space-y-5 pb-12">
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-xl font-bold text-slate-900">{answers.name}님의 진단 결과</h1>
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
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">🛠️ 고민 맞춤 활용 팁</h3>
        <p className="text-sm text-slate-500 italic mb-4 px-3 py-2 bg-slate-50 rounded-lg">
          “{userText.length > 60 ? userText.slice(0, 60) + '…' : userText}”
        </p>
        <ul className="space-y-3">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
              <span className="shrink-0 text-slate-900 font-bold">▹</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {result.savings > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-emerald-600 font-semibold mb-2">예상 효율화 효과</div>
          <div className="text-3xl font-black text-emerald-700 mb-2 tabular-nums">
            연간 약 {result.savings.toLocaleString('ko-KR')}원
          </div>
          <p className="text-sm text-emerald-700/80 leading-relaxed">
            이번 진단을 통해 글룩이 구독료를 효율화할 수 있는 근거가 확보되었습니다.
          </p>
        </div>
      )}

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
  const [fetchErr, setFetchErr] = useState('');

  const fetchData = async () => {
    if (!WEBHOOK_URL || WEBHOOK_URL === 'YOUR_APPS_SCRIPT_URL') {
      setFetchErr('WEBHOOK_URL이 아직 설정되지 않았습니다. 아래 CSV 업로드를 이용하시거나 관리자에게 문의해주세요.');
      return;
    }
    setLoading(true);
    setFetchErr('');
    try {
      const res = await fetch(WEBHOOK_URL + '?action=list', { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('invalid response shape');
      setData(json);
    } catch (e) {
      setFetchErr('자동 불러오기에 실패했습니다. Apps Script의 doGet 배포 상태를 확인하시거나, 아래 CSV 업로드를 이용해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed && !data) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;
  if (loading) return <AdminLoading />;
  if (data) return <AdminDashboard data={data} onRefresh={fetchData} onReset={() => setData(null)} />;
  return <AdminUpload onUploaded={setData} fetchErr={fetchErr} onRetry={fetchData} />;
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

const Q1_LABEL = { coding: '코딩 및 개발', writing: '문서 작성', general: '일상 사용', image: '이미지 생성', research: '학술 연구' };
const Q4_LABEL = { limit: '한도 부족', quality: '품질 부족', context: '긴 자료 처리', none: '부족함 없음', never: '미사용' };

function AdminDashboard({ data, onRefresh, onReset }) {
  const total = data.length;

  if (total === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-sm text-center">
          <div className="text-4xl mb-3">📭</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">아직 응답이 없습니다</h2>
          <p className="text-sm text-slate-500 mb-6">팀원들이 진단을 완료하면 여기에 표시됩니다.</p>
          <button onClick={onRefresh} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold">
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(data.reduce((s, d) => s + (Number(d.score) || 0), 0) / total);
  const totalSavings = data.reduce((s, d) => s + (Number(d.savings) || 0), 0);

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

  // Q4 분포
  const q4Map = {};
  data.forEach((d) => {
    const k = d.q4 || 'unknown';
    q4Map[k] = (q4Map[k] || 0) + 1;
  });

  const sorted = [...data].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">글룩 AI 진단 보고서</h1>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1">
              <RefreshCw size={14} /> 새로고침
            </button>
            <button onClick={onReset} className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1">
              <Upload size={14} /> 초기화
            </button>
            <button onClick={() => window.print()} className="px-3 py-2 text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all flex items-center gap-1">
              <Printer size={14} /> PDF 인쇄
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <Section title="전체 요약" icon={<BarChart3 size={20} />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="총 응답자" value={`${total}명`} />
            <Stat label="평균 활용도" value={`${avgScore}점`} />
            <Stat label="응답 팀 수" value={`${teams.length}팀`} />
            <Stat label="총 효율화 예상액" value={`${totalSavings.toLocaleString('ko-KR')}원`} accent />
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

        <Section title="팀별 AI 활용도 평가" icon={<Users size={20} />}>
          <div className="grid sm:grid-cols-2 gap-4">
            {teams.map((t) => {
              const members = byTeam[t];
              const avg = Math.round(members.reduce((s, m) => s + (Number(m.score) || 0), 0) / members.length);
              const grade = teamGrade(avg);
              const savings = members.reduce((s, m) => s + (Number(m.savings) || 0), 0);
              const aiCount = {};
              members.forEach((m) => { aiCount[m.ai] = (aiCount[m.ai] || 0) + 1; });
              const topAis = Object.entries(aiCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([ai]) => ai);

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

                  <div className="text-xs text-slate-500 mb-2">주 추천 AI</div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {topAis.map((ai) => (
                      <span key={ai} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">{ai}</span>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 mb-1">팀 효율화 예상액</div>
                  <div className="text-base font-bold text-emerald-700 mb-3 tabular-nums">
                    {savings.toLocaleString('ko-KR')}원
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    💬 {grade.comment}
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
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">추천 AI</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">주요 고민</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{i < 3 && '👑 '}{d.name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.team}</td>
                      <td className="px-4 py-3 text-slate-600">{d.role || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">{d.score}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.grade}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.ai}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[240px] truncate">
                        {(d.q6 || '').slice(0, 40)}{(d.q6 || '').length > 40 ? '…' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

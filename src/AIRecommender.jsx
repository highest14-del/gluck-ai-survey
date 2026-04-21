import React, { useState, useEffect } from 'react';

/**
 * GLUCK 임직원을 위한 AI 구독 진단기
 * 2026년 4월 기준 최신 AI 라인업 반영
 */
const AIRecommender = () => {
  // step: 'intro' | 1~5 | 'loading' | 'result'
  const [step, setStep] = useState('intro');
  const [answers, setAnswers] = useState({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: '',
  });
  const [result, setResult] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // ---------- AI 데이터베이스 (2026년 4월 기준) ----------
  const AI_DB = {
    'chatgpt-free': {
      name: 'ChatGPT 무료',
      emoji: '💬',
      brand: 'from-emerald-500 to-teal-600',
      ring: 'ring-emerald-400',
      tier: 'free',
      price: 0,
      strength: '범용성과 친숙한 UX',
    },
    'claude-free': {
      name: 'Claude 무료',
      emoji: '🤖',
      brand: 'from-orange-500 to-amber-600',
      ring: 'ring-orange-400',
      tier: 'free',
      price: 0,
      strength: '자연스러운 글쓰기와 추론',
    },
    'gemini-free': {
      name: 'Gemini 무료',
      emoji: '✨',
      brand: 'from-blue-500 to-sky-600',
      ring: 'ring-blue-400',
      tier: 'free',
      price: 0,
      strength: '구글 검색 통합과 멀티모달',
    },
    'perplexity-free': {
      name: 'Perplexity 무료',
      emoji: '🔎',
      brand: 'from-cyan-500 to-teal-500',
      ring: 'ring-cyan-400',
      tier: 'free',
      price: 0,
      strength: '출처 기반 실시간 검색',
    },
    'chatgpt-plus': {
      name: 'ChatGPT Plus',
      emoji: '💎',
      brand: 'from-emerald-500 to-green-700',
      ring: 'ring-emerald-400',
      tier: 'plus',
      price: 20,
      strength: 'GPT-5 + DALL·E 이미지 + GPTs 생태계',
    },
    'claude-pro': {
      name: 'Claude Pro',
      emoji: '🧠',
      brand: 'from-orange-500 to-rose-600',
      ring: 'ring-orange-400',
      tier: 'plus',
      price: 20,
      strength: '긴 문서·코드 이해력, Projects, Artifacts',
    },
    'claude-max': {
      name: 'Claude Max',
      emoji: '👑',
      brand: 'from-amber-500 via-orange-500 to-rose-600',
      ring: 'ring-amber-400',
      tier: 'max',
      price: 100,
      strength: '한도 5~20배 + Claude Code 풀 활용',
    },
    'gemini-advanced': {
      name: 'Gemini Advanced',
      emoji: '🚀',
      brand: 'from-blue-500 to-indigo-700',
      ring: 'ring-blue-400',
      tier: 'plus',
      price: 20,
      strength: '2M 토큰 컨텍스트 + 워크스페이스 연동',
    },
    'perplexity-pro': {
      name: 'Perplexity Pro',
      emoji: '🔭',
      brand: 'from-cyan-500 to-sky-700',
      ring: 'ring-cyan-400',
      tier: 'plus',
      price: 20,
      strength: '심층 리서치(Deep Research) + 최신 모델 선택',
    },
    'cursor-pro': {
      name: 'Cursor Pro',
      emoji: '⌨️',
      brand: 'from-zinc-600 to-slate-800',
      ring: 'ring-zinc-400',
      tier: 'plus',
      price: 20,
      strength: 'IDE 통합 코딩, Agent 모드',
    },
    'midjourney': {
      name: 'Midjourney',
      emoji: '🎨',
      brand: 'from-fuchsia-500 to-purple-700',
      ring: 'ring-fuchsia-400',
      tier: 'plus',
      price: 30,
      strength: '예술적 이미지 퀄리티 최상',
    },
  };

  // ---------- 질문 정의 ----------
  const questions = [
    {
      id: 'q1',
      title: 'AI를 주로 어떤 용도로 쓰세요?',
      sub: '가장 많은 시간을 쓰는 영역 하나만요.',
      options: [
        { v: 'coding', label: '코딩 및 개발', desc: '웹·앱·데이터 분석' },
        { v: 'writing', label: '긴 문서 작성·전문 글쓰기', desc: '보고서, 기획서' },
        { v: 'casual', label: '일상 질문·번역·브레인스토밍', desc: '가볍게 활용' },
        { v: 'image', label: '이미지·영상 생성·디자인', desc: '비주얼 작업' },
        { v: 'research', label: '학술 연구·논문 검토', desc: '깊이 있는 분석' },
      ],
    },
    {
      id: 'q2',
      title: '다루는 데이터·문서의 분량은요?',
      sub: '한 번에 AI에 던지는 양 기준이에요.',
      options: [
        { v: 'short', label: '짧은 문장·질문 위주', desc: '단발성' },
        { v: 'medium', label: 'A4 2~3장 분량', desc: '중간 길이' },
        { v: 'long', label: '책 한 권·대규모 코드베이스', desc: '매우 김' },
      ],
    },
    {
      id: 'q3',
      title: 'AI 사용 빈도는요?',
      sub: '솔직하게요. 본전 계산이 달라져요.',
      options: [
        { v: 'rare', label: '일주일에 몇 번', desc: '가끔' },
        { v: 'daily', label: '매일 1~2시간', desc: '자주' },
        { v: 'heavy', label: '업무의 대부분', desc: '하루 종일' },
      ],
    },
    {
      id: 'q4',
      title: 'AI 구독에 대한 생각은요?',
      sub: '예산이 합리적인 추천을 좌우합니다.',
      options: [
        { v: 'free', label: '무료만 쓸래요', desc: '0원' },
        { v: 'cheap', label: '월 2~3만원까지는 OK', desc: '~₩30,000' },
        { v: 'mid', label: '월 10만원 이상도 투자 가능', desc: '~₩150,000' },
        { v: 'unlimited', label: '최고 성능이면 돈 안 아낌', desc: '제한 없음' },
      ],
    },
  ];

  // ---------- 점수 계산 로직 ----------
  const calc = () => {
    const s = Object.fromEntries(Object.keys(AI_DB).map((k) => [k, 0]));
    const { q1, q2, q3, q4, q5 } = answers;

    // Q1: 용도
    if (q1 === 'coding') {
      s['claude-pro'] += 5;
      s['claude-max'] += 4;
      s['cursor-pro'] += 5;
      s['chatgpt-plus'] += 2;
      s['claude-free'] += 2;
    }
    if (q1 === 'writing') {
      s['claude-pro'] += 5;
      s['claude-max'] += 3;
      s['chatgpt-plus'] += 3;
      s['gemini-advanced'] += 2;
      s['claude-free'] += 2;
    }
    if (q1 === 'casual') {
      s['chatgpt-free'] += 5;
      s['gemini-free'] += 5;
      s['claude-free'] += 4;
      s['perplexity-free'] += 3;
    }
    if (q1 === 'image') {
      s['midjourney'] += 6;
      s['chatgpt-plus'] += 4;
      s['gemini-advanced'] += 2;
    }
    if (q1 === 'research') {
      s['perplexity-pro'] += 5;
      s['claude-pro'] += 4;
      s['claude-max'] += 3;
      s['gemini-advanced'] += 3;
      s['perplexity-free'] += 2;
    }

    // Q2: 분량
    if (q2 === 'short') {
      s['chatgpt-free'] += 3;
      s['gemini-free'] += 3;
      s['claude-free'] += 3;
      s['perplexity-free'] += 2;
    }
    if (q2 === 'medium') {
      s['chatgpt-plus'] += 3;
      s['claude-pro'] += 3;
      s['gemini-advanced'] += 2;
    }
    if (q2 === 'long') {
      s['claude-pro'] += 5;
      s['claude-max'] += 5;
      s['gemini-advanced'] += 4;
    }

    // Q3: 빈도
    if (q3 === 'rare') {
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].tier === 'free') s[k] += 3;
      });
    }
    if (q3 === 'daily') {
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].tier === 'plus') s[k] += 3;
      });
    }
    if (q3 === 'heavy') {
      s['claude-max'] += 5;
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].tier === 'plus') s[k] += 2;
      });
    }

    // Q4: 예산 (필터 + 가산점)
    if (q4 === 'free') {
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].tier !== 'free') s[k] -= 100;
        else s[k] += 4;
      });
    }
    if (q4 === 'cheap') {
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].price > 30) s[k] -= 100;
        if (AI_DB[k].tier === 'plus') s[k] += 2;
      });
    }
    if (q4 === 'mid') {
      Object.keys(s).forEach((k) => {
        if (AI_DB[k].tier === 'plus') s[k] += 1;
      });
    }
    if (q4 === 'unlimited') {
      s['claude-max'] += 4;
    }

    // Q5: 키워드 부스트
    const text = (q5 || '').toLowerCase();
    const kw = (arr) => arr.some((w) => text.includes(w));
    if (kw(['코드', '코딩', '개발', '리뷰', 'python', '파이썬', '버그', '리팩'])) {
      s['claude-pro'] += 3;
      s['cursor-pro'] += 3;
      s['claude-max'] += 2;
    }
    if (kw(['논문', '연구', '리서치', '검색', '출처', '레퍼런스'])) {
      s['perplexity-pro'] += 3;
      s['claude-pro'] += 2;
    }
    if (kw(['이미지', '디자인', '그림', '로고', '포스터', '영상'])) {
      s['midjourney'] += 3;
      s['chatgpt-plus'] += 2;
    }
    if (kw(['요약', '회의록', '보고서', '문서', '기획'])) {
      s['claude-pro'] += 3;
      s['gemini-advanced'] += 2;
    }
    if (kw(['번역', '메일', '카톡', '일상'])) {
      s['chatgpt-free'] += 2;
      s['gemini-free'] += 2;
    }

    // 정렬
    const ranked = Object.entries(s)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, score: v, ...AI_DB[k] }));

    return ranked;
  };

  // ---------- 결과 메시지 빌더 ----------
  const buildResult = () => {
    const ranked = calc();
    const top = ranked[0];
    const second = ranked.find((r) => r.key !== top.key && r.score > 0);

    // 톤 결정
    let headline = '';
    let tone = 'free';
    if (top.tier === 'free') {
      tone = 'free';
      headline = `솔직히 말씀드릴게요. 고객님은 유료 결제하실 필요 전혀 없습니다. ${top.name} 하나면 차고 넘쳐요. 월 구독료 아끼시고 그 돈으로 점심 한 끼 더 드세요.`;
    } else if (top.tier === 'plus') {
      tone = 'plus';
      headline = `이것저것 다 결제하지 마시고, 딱 ${top.name} 하나만 뽑으세요. ${top.strength}에서 압도적입니다. 두 개 이상 결제는 99% 낭비입니다.`;
    } else {
      tone = 'max';
      headline = `사용 패턴 보니까 ${top.name} 본전 충분히 뽑으십니다. 다만 한 달 써보고 한도 절반도 못 쓰면 미련 없이 Pro로 내리세요. 자존심 지키려고 비싼 거 쓰는 건 오히려 손해예요.`;
    }

    // 추천 이유 3가지 (동적)
    const reasons = [];
    const { q1, q2, q3, q4 } = answers;
    const usageMap = {
      coding: '코딩·개발',
      writing: '긴 문서 작성',
      casual: '일상 질문',
      image: '이미지 생성',
      research: '학술 연구',
    };
    const lengthMap = {
      short: '짧은 단발성 질문',
      medium: 'A4 2~3장 분량',
      long: '대용량 문서·코드베이스',
    };
    const freqMap = {
      rare: '주 몇 회',
      daily: '매일 1~2시간',
      heavy: '하루 종일',
    };

    reasons.push(
      `${usageMap[q1]} 용도에서 ${top.name}의 핵심 강점인 "${top.strength}"이 정확히 들어맞습니다.`
    );
    reasons.push(
      `${lengthMap[q2]} 작업량과 ${freqMap[q3]} 사용 패턴 기준, ${
        top.tier === 'free'
          ? '굳이 유료로 갈 이유가 없습니다.'
          : top.tier === 'max'
          ? '무제한급 한도가 실질적으로 필요합니다.'
          : '월 $20 라인이 가성비 정점입니다.'
      }`
    );
    reasons.push(
      q4 === 'free'
        ? '"무료만 쓰겠다"는 답변, 존중합니다. 그 기준에서 가장 강한 무료 모델을 골랐어요.'
        : q4 === 'unlimited'
        ? '"최고 성능이면 돈 안 아낀다" 하셨지만, 그렇다고 무지성 결제는 안 됩니다. 진짜 필요한 1~2개만 가세요.'
        : '예산 안에서 만족도 1순위 옵션입니다.'
    );

    // 절약 효과 계산
    // 가정: 사용자가 "다 결제했을 때" = ChatGPT Plus + Claude Max + Midjourney
    const overpay = 20 + 100 + 30; // $150/월
    const recommendedCost = top.price;
    const monthlySaving = Math.max(0, overpay - recommendedCost);
    const yearlySavingKRW = monthlySaving * 12 * 1380; // 환율 가정

    // 주관식 맞춤 팁
    const userText = (answers.q5 || '').trim();
    const tips = generateTips(top.key, userText);
    const samplePrompt = generateSamplePrompt(top.key, userText);

    return {
      ranked,
      top,
      second,
      headline,
      tone,
      reasons,
      monthlySaving,
      yearlySavingKRW,
      userText,
      tips,
      samplePrompt,
    };
  };

  const generateTips = (key, userText) => {
    const generic = [
      '한 번에 모든 걸 묻지 말고, 큰 작업은 단계별로 쪼개서 시키세요.',
      '결과물이 마음에 안 들면 "왜 이렇게 했는지 근거를 대라"고 다시 물어보세요.',
      '같은 대화창에서 맥락을 이어가면 답변 품질이 올라갑니다. 새 대화 남발 금지.',
    ];
    const map = {
      'claude-pro': [
        'Projects 기능에 자주 쓰는 문서·자료를 미리 올려두면 매번 붙여넣을 필요가 없어요.',
        'Artifacts로 코드·문서를 옆 패널에서 실시간 편집·미리보기 하세요.',
        '긴 문서는 PDF째 던지고 "핵심 5가지만 뽑아줘"가 가장 빠릅니다.',
      ],
      'claude-max': [
        'Claude Code를 터미널에 설치해서 실제 코드베이스에 붙이세요. 채팅창보다 10배 빠릅니다.',
        'Sonnet과 Opus를 작업별로 구분해 쓰세요. 가벼운 건 Sonnet, 깊은 추론은 Opus.',
        '한도 무한해 보여도 실제로 쓰면 금방 소진됩니다. 본전 계산은 한 달 단위로.',
      ],
      'cursor-pro': [
        'Cmd+K로 인라인 편집, Cmd+L로 채팅. 두 개만 마스터해도 생산성 2배.',
        'Agent 모드는 강력하지만 위험합니다. 항상 git commit 후 돌리세요.',
        '@ 멘션으로 파일·심볼을 참조시키면 환각이 확 줄어요.',
      ],
      'chatgpt-plus': [
        'GPTs에서 본인 업무 특화 봇을 하나 만들어 두면 매일 프롬프트 짤 시간이 줄어요.',
        '이미지가 필요하면 따로 결제하지 말고 DALL·E 통합 기능부터 써보세요.',
        '캔버스 모드는 글 다듬기에 최적화돼 있어요. 회의록 정리에 특히 좋아요.',
      ],
      'gemini-advanced': [
        'Gmail·Drive·Docs와 직접 연동되니, 굳이 복붙하지 말고 "내 Drive의 X 문서 요약해줘".',
        '2M 컨텍스트는 진짜 깁니다. 책 한 권을 통째로 던져도 됩니다.',
        'Deep Research 모드를 켜면 보고서 초안까지 자동으로 만들어줘요.',
      ],
      'perplexity-pro': [
        '항상 출처 링크를 클릭해서 검증하세요. AI 요약은 가끔 늬앙스를 놓칩니다.',
        'Deep Research 모드는 5~10분 걸리지만 결과물이 다릅니다. 급하지 않은 조사에 쓰세요.',
        'Spaces 기능으로 주제별 검색 히스토리를 모아두면 재참조가 쉬워요.',
      ],
      'midjourney': [
        '--ar로 비율, --s로 스타일라이즈, --v로 버전. 이 세 개만 외워도 90% 커버.',
        '레퍼런스 이미지를 먼저 올린 뒤 "이 스타일로"가 텍스트 묘사보다 정확합니다.',
        '한 번에 마음에 들 때까지 돌리지 말고, U/V 버튼으로 변형하면서 좁혀가세요.',
      ],
      'chatgpt-free': [
        '무료도 GPT-5 일부 사용 가능합니다. 한도 도달하면 모델이 자동 다운그레이드되니 중요한 작업은 한도 리셋 직후에.',
        '같은 질문이라도 영어로 한 번 더 물어보면 답변 품질이 다릅니다.',
        '음성 모드 무료 기능 활용하면 통근길 학습용으로 훌륭합니다.',
      ],
      'claude-free': [
        '무료 한도가 빠르게 소진됩니다. 짧은 질문은 다른 무료 AI로, 글쓰기·추론이 필요할 때만 Claude로.',
        '시스템 프롬프트 없이도 톤·스타일 지시를 첫 메시지에 명확히 적으세요.',
        '코드 한 덩이 정도는 무료로도 충분히 처리됩니다. 무리하지 않으면.',
      ],
      'gemini-free': [
        '구글 검색 결과를 함께 가져오니 "최신 정보 알려줘"에 강합니다.',
        'Drive·Gmail 연동은 무료에서도 일부 작동합니다. 굳이 Advanced 안 가도 돼요.',
        '이미지 입력 무료라서 영수증·스크린샷 분석에 쓰면 가성비 최고.',
      ],
      'perplexity-free': [
        '검색 횟수에 제한이 있으니 "한 번에 깊게" 묻는 습관을 들이세요.',
        'Pro Search는 하루 5회 무료. 진짜 중요한 질문에 아껴 쓰세요.',
        '출처가 약해 보이면 다른 무료 LLM에 교차 검증하세요.',
      ],
    };
    const specific = map[key] || generic;
    return specific.slice(0, 3);
  };

  const generateSamplePrompt = (key, userText) => {
    const snippet = userText.length > 30 ? userText.slice(0, 30) + '...' : userText;
    const base = snippet || '내가 다루는 업무';
    const map = {
      'claude-pro': `다음은 [${base}] 관련 자료야. 핵심 쟁점 3가지를 추리고, 각 쟁점에 대한 찬반 논리를 표로 정리해줘. 마지막에 내가 어떤 결정을 내려야 할지 너의 의견도 한 줄로 덧붙여줘.`,
      'claude-max': `[${base}] 작업을 단계별 계획으로 나눠줘. 각 단계마다 (1) 예상 소요 시간 (2) 필요한 입력 (3) 산출물 형태를 명시하고, 1단계 산출물부터 바로 만들어줘.`,
      'cursor-pro': `@codebase 이 프로젝트에서 [${base}] 와 관련된 함수를 찾고, 리팩토링이 필요한 부분 3곳을 지적해줘. 그 다음 가장 우선순위 높은 1곳을 직접 수정해줘.`,
      'chatgpt-plus': `[${base}] 에 대해 임원 보고용 1슬라이드 요약을 만들어줘. 헤드라인 1줄, 핵심 3가지, 의사결정 요청 사항 1가지 구조로. 톤은 간결·확신 있게.`,
      'gemini-advanced': `내 Drive에 있는 [${base}] 관련 문서들을 모두 참조해서, 지난 분기 대비 달라진 점을 표로 정리해줘. 출처 문서명도 함께 표시해줘.`,
      'perplexity-pro': `[${base}] 에 대한 2026년 최신 동향을 조사해줘. 1차 출처(논문·공식 발표) 위주로 5개만 인용하고, 한국어 요약과 함께 원문 링크를 달아줘.`,
      'midjourney': `[${base}] concept art, cinematic lighting, ultra detailed, 8k, --ar 16:9 --s 250 --v 6`,
      'chatgpt-free': `[${base}] 를 초등학생도 이해할 수 있게 3문단으로 설명해줘. 비유는 한국 일상에서 가져와줘.`,
      'claude-free': `[${base}] 에 대해 내가 놓치고 있을 만한 관점 3가지를 짚어줘. 그리고 각 관점에 대해 내가 다음에 무엇을 검토해야 할지 알려줘.`,
      'gemini-free': `[${base}] 와 관련된 최신 뉴스를 검색해서, 신뢰도 높은 출처 3개만 추리고 핵심을 한 줄씩 요약해줘.`,
      'perplexity-free': `[${base}] 에 대한 가장 최신 자료 3개를 찾아주고, 각 자료의 결론만 한 문장으로 요약해줘.`,
    };
    return map[key] || `[${base}] 에 대해 단계별로 자세히 설명해줘.`;
  };

  // ---------- 핸들러 ----------
  const handleStart = () => {
    setStep(1);
    setAnimKey((k) => k + 1);
  };

  const handleSelect = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setTimeout(() => {
      const next = step + 1;
      if (next <= 5) {
        setStep(next);
        setAnimKey((k) => k + 1);
      }
    }, 280);
  };

  const handleSubmit = () => {
    if ((answers.q5 || '').trim().length < 10) return;
    setStep('loading');
    setAnimKey((k) => k + 1);
    setTimeout(() => {
      setResult(buildResult());
      setStep('result');
      setAnimKey((k) => k + 1);
    }, 1500);
  };

  const handleRestart = () => {
    setAnswers({ q1: null, q2: null, q3: null, q4: null, q5: '' });
    setResult(null);
    setStep('intro');
    setAnimKey((k) => k + 1);
  };

  // ---------- 진행률 ----------
  const progress =
    step === 'intro'
      ? 0
      : step === 'loading' || step === 'result'
      ? 5
      : Number(step);

  // ---------- 공통 셸 ----------
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-slate-100">
      {/* 상단 프로그레스 바 (고정) */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/70 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center font-bold text-sm">
              G
            </div>
            <div className="text-xs text-slate-400 leading-tight">
              <div className="font-semibold text-slate-200">GLUCK · AI 진단기</div>
              <div className="opacity-70">불필요한 구독 막아드립니다</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 transition-all duration-500"
                style={{ width: `${(progress / 5) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 tabular-nums">
            {progress}/5
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-12">
        <div
          key={animKey}
          className="animate-[fadeSlide_0.45s_ease-out]"
          style={{
            animation: 'fadeSlide 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {step === 'intro' && <IntroScreen onStart={handleStart} />}
          {typeof step === 'number' && step <= 4 && (
            <QuestionScreen
              q={questions[step - 1]}
              value={answers[questions[step - 1].id]}
              onSelect={handleSelect}
              stepNum={step}
            />
          )}
          {step === 5 && (
            <OpenScreen
              value={answers.q5}
              onChange={(v) => setAnswers((p) => ({ ...p, q5: v }))}
              onSubmit={handleSubmit}
            />
          )}
          {step === 'loading' && <LoadingScreen />}
          {step === 'result' && result && (
            <ResultScreen result={result} onRestart={handleRestart} />
          )}
        </div>
      </div>

      {/* 키프레임 */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// 인트로
// ============================================================
const IntroScreen = ({ onStart }) => (
  <div className="text-center py-10 sm:py-16">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-6">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      2026년 4월 최신 AI 라인업 반영
    </div>
    <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 bg-gradient-to-br from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
      나에게 딱 맞는 AI 찾기
    </h1>
    <p className="text-lg sm:text-xl text-slate-300 mb-2">
      월 30만원 구독료, 진짜 다 필요하신가요?
    </p>
    <p className="text-sm text-slate-400 mb-10 max-w-xl mx-auto">
      5개 질문으로 당신의 사용 패턴을 진단하고, 정말 필요한 AI 한 개만
      골라드립니다. 과소비를 부추기지 않는, 솔직한 컨설팅이에요.
    </p>

    <button
      onClick={onStart}
      className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-purple-500/40 hover:-translate-y-0.5"
    >
      진단 시작하기
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </button>

    <div className="mt-12 grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="text-2xl mb-1">⏱️</div>
        <div className="text-slate-300">2분이면 끝</div>
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="text-2xl mb-1">💸</div>
        <div className="text-slate-300">평균 30만원 절약</div>
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="text-2xl mb-1">🎯</div>
        <div className="text-slate-300">딱 1개만 추천</div>
      </div>
    </div>
  </div>
);

// ============================================================
// 객관식 질문
// ============================================================
const QuestionScreen = ({ q, value, onSelect, stepNum }) => (
  <div>
    <div className="text-xs font-mono text-indigo-300 mb-2">
      QUESTION {stepNum} / 5
    </div>
    <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
      {q.title}
    </h2>
    <p className="text-sm text-slate-400 mb-8">{q.sub}</p>

    <div className="space-y-3">
      {q.options.map((opt, idx) => {
        const selected = value === opt.v;
        return (
          <button
            key={opt.v}
            onClick={() => onSelect(q.id, opt.v)}
            className={`group w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
              selected
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/60 ring-2 ring-indigo-400/40 scale-[1.01]'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-x-1'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center font-bold text-sm transition-colors ${
                  selected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-slate-300 group-hover:bg-white/20'
                }`}
              >
                {selected ? '✓' : ['①', '②', '③', '④', '⑤'][idx]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{opt.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ============================================================
// 주관식
// ============================================================
const OpenScreen = ({ value, onChange, onSubmit }) => {
  const len = (value || '').trim().length;
  const ok = len >= 10;
  return (
    <div>
      <div className="text-xs font-mono text-indigo-300 mb-2">
        QUESTION 5 / 5
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
        평소 AI로 해결하고 싶은 고민을 적어주세요.
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        구체적일수록 추천이 정확해집니다. 한두 문장이면 충분해요.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 긴 회의록을 요약하고 싶어요 / 파이썬 코드 리뷰가 필요해요"
        rows={5}
        className="w-full p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/30 outline-none text-white placeholder-slate-500 resize-none transition-all"
      />
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className={ok ? 'text-emerald-400' : 'text-slate-500'}>
          {ok ? '✓ 입력 충분합니다' : `최소 10자 이상 (현재 ${len}자)`}
        </span>
        <span className="text-slate-500">{len}자</span>
      </div>

      <button
        onClick={onSubmit}
        disabled={!ok}
        className={`w-full mt-8 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
          ok
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5'
            : 'bg-white/5 text-slate-500 cursor-not-allowed'
        }`}
      >
        결과 보기 →
      </button>
    </div>
  );
};

// ============================================================
// 로딩
// ============================================================
const LoadingScreen = () => (
  <div className="text-center py-20">
    <div className="inline-flex gap-2 mb-8">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full bg-indigo-400"
          style={{
            animation: `pulseDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
      당신의 답변을 AI 전문가가 분석 중입니다...
    </h2>
    <p className="text-sm text-slate-400">
      11개 모델 비교, 사용 패턴 매칭, 가성비 계산 중
    </p>
    <div className="max-w-xs mx-auto mt-8 space-y-2 text-left">
      {[
        '✓ 사용 용도 분석',
        '✓ 사용량 패턴 분석',
        '⏳ 예산 대비 가성비 계산',
        '⏳ 최적 모델 매칭',
      ].map((s, i) => (
        <div
          key={i}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300"
        >
          {s}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// 결과
// ============================================================
const ResultScreen = ({ result, onRestart }) => {
  const { top, headline, tone, reasons, monthlySaving, yearlySavingKRW, userText, tips, samplePrompt, ranked } = result;

  const toneLabel = {
    free: { tag: '무료로 충분', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    plus: { tag: '딱 하나만 결제', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    max: { tag: '본전 뽑는 헤비유저', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  }[tone];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. 추천 카드 */}
      <div
        className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br ${top.brand} shadow-2xl`}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${toneLabel.color} bg-white/10 backdrop-blur-sm mb-4`}
          >
            {toneLabel.tag}
          </div>
          <div className="text-7xl sm:text-8xl mb-4">{top.emoji}</div>
          <div className="text-sm text-white/80 mb-1">당신에게 추천하는 AI는</div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
            {top.name}
          </h1>
          <div className="text-white/90 text-sm">
            {top.tier === 'free'
              ? '월 0원 · 추가 결제 불필요'
              : top.tier === 'max'
              ? `월 약 $${top.price}~ · 헤비유저용`
              : `월 약 $${top.price} · 가성비 최적`}
          </div>
        </div>
      </div>

      {/* 2. 핵심 한 줄 조언 */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">💬</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              컨설턴트의 솔직한 한마디
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-white">
              {headline}
            </p>
          </div>
        </div>
      </div>

      {/* 3. 추천 이유 */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> 왜 이 AI를 추천하나요?
        </h3>
        <ul className="space-y-3">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-200 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 grid place-items-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. 주관식 맞춤 */}
      <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-xl">🛠️</span> 적어주신 고민에 맞춘 활용 팁
        </h3>
        <p className="text-sm text-slate-300 mb-5 italic">
          "특히 적어주신 <span className="text-purple-200">「{userText.length > 40 ? userText.slice(0, 40) + '…' : userText}」</span> 작업에는요…"
        </p>
        <ul className="space-y-3 mb-6">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-200 leading-relaxed">
              <span className="shrink-0 text-purple-300 font-bold">▹</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
          <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold mb-2">
            바로 써먹는 예시 프롬프트
          </div>
          <code className="block text-sm text-slate-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
            {samplePrompt}
          </code>
        </div>
      </div>

      {/* 5. 절약 효과 */}
      <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span> 절약 효과
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 mb-1">다 결제했다면</div>
            <div className="text-xl font-bold text-rose-300 line-through decoration-rose-500/50">
              $150/월
            </div>
            <div className="text-xs text-slate-500">Plus + Max + MJ</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-emerald-500/30">
            <div className="text-xs text-emerald-300 mb-1">추천대로 하면</div>
            <div className="text-xl font-bold text-emerald-300">
              ${top.price}/월
            </div>
            <div className="text-xs text-slate-500">{top.name}</div>
          </div>
        </div>
        <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-xs text-emerald-200 mb-1">연간 예상 절약액</div>
          <div className="text-3xl font-black text-emerald-300">
            약 {yearlySavingKRW.toLocaleString('ko-KR')}원
          </div>
          <div className="text-xs text-slate-400 mt-1">
            (월 ${monthlySaving} × 12개월 × ₩1,380 환율 가정)
          </div>
        </div>
      </div>

      {/* 6. 차순위 옵션 */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white/5 border border-white/10">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
          참고: 후순위 옵션
        </h3>
        <div className="space-y-2">
          {ranked.slice(1, 4).filter(r => r.score > 0).map((r) => (
            <div
              key={r.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl">{r.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{r.name}</div>
                <div className="text-xs text-slate-400">{r.strength}</div>
              </div>
              <div className="text-xs font-mono text-slate-500">
                {r.tier === 'free' ? 'FREE' : `$${r.price}/mo`}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          ⚠️ 추천 1개로 충분합니다. 후순위는 "혹시 안 맞으면" 대안일 뿐, 동시
          결제 권장이 아닙니다.
        </p>
      </div>

      {/* 7. 다시 진단 */}
      <div className="text-center pt-4">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-medium transition-all hover:-translate-y-0.5"
        >
          ↻ 다시 진단하기
        </button>
        <p className="text-xs text-slate-500 mt-6">
          GLUCK 임직원 전용 · 본 추천은 일반 가이드이며, 실제 구독 결정은 본인의
          업무 특성을 고려해주세요.
        </p>
      </div>
    </div>
  );
};

export default AIRecommender;

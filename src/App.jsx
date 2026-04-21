import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Upload,
  Lock,
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  Printer,
  RefreshCw,
  Heart,
} from 'lucide-react';

// ============================================================
// 상수 — 배포 전 WEBHOOK_URL 만 교체하면 됩니다.
// ============================================================
const WEBHOOK_URL = 'YOUR_APPS_SCRIPT_URL';
const ADMIN_PASSWORD = 'gluck2026';

const TEAMS = ['기획팀', '운영팀', '출력팀', '후가공팀', '팩토리팀', '경영지원부'];

const QUESTIONS = {
  q1: {
    label: 'AI를 주로 어떤 용도로 사용하시나요?',
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
    label: 'AI 구독에 대한 생각은요?',
    options: [
      { value: 'free', label: '무료만 쓸래요',              desc: '구독 없이' },
      { value: 'low',  label: '월 2~3만원까지는 OK',        desc: '합리적 투자' },
      { value: 'mid',  label: '월 10만원 이상도 투자 가능', desc: '적극적 투자' },
      { value: 'high', label: '최고 성능이면 돈 안 아낌',   desc: '성과 우선' },
    ],
  },
};

// ============================================================
// 추천 로직
// ============================================================
function getRecommendation(answers) {
  const { q1: useCase, q2: volume, q3: frequency, q4: budget } = answers;

  // 케이스 1: 무료
  if (budget === 'free') {
    let ai, icon;
    if (useCase === 'research' || useCase === 'general') { ai = 'Perplexity 무료 + Claude 무료'; icon = '🔍'; }
    else if (useCase === 'coding' || useCase === 'writing') { ai = 'Claude 무료'; icon = '🎨'; }
    else if (useCase === 'image') { ai = 'ChatGPT 무료'; icon = '🖼️'; }
    else { ai = 'Gemini 무료'; icon = '💎'; }
    return {
      ai, icon, tier: 'free', savings: 240000,
      advice:
        '지금 사용 패턴이라면 무료 버전으로도 충분히 필요한 작업을 해내실 수 있습니다. 합리적인 선택이에요. 남겨주신 답변 덕분에 글룩이 불필요한 구독 지출 없이 AI 예산을 효율적으로 수립할 수 있게 되었습니다. 감사합니다.',
    };
  }

  // 케이스 3: Max
  if (budget === 'high' || (budget === 'mid' && frequency === 'heavy')) {
    if (useCase === 'coding' && volume === 'long') {
      return {
        ai: 'Claude Max', icon: '💎', tier: 'max', savings: 0,
        advice:
          '대규모 코드베이스를 집중적으로 다루시는 패턴에는 Claude Max가 본전을 뽑을 수 있는 구독입니다. Rate limit 걱정 없이 작업 가능합니다. 응답해주신 덕분에 글룩이 헤비유저 대상의 AI 투자 전략을 명확히 세울 수 있게 되었습니다.',
      };
    }
    if (useCase === 'writing' && volume === 'long') {
      return {
        ai: 'Claude Max', icon: '📚', tier: 'max', savings: 0,
        advice:
          '방대한 문서를 매일 다루는 업무에는 Max 구독이 확실한 투자입니다. 남겨주신 답변이 글룩의 핵심 작업자 대상 AI 지원 예산 수립에 큰 도움이 되었습니다.',
      };
    }
    return {
      ai: 'Claude Pro + ChatGPT Plus 병행', icon: '⚡', tier: 'pro', savings: 0,
      advice:
        '다양한 업무에 AI를 적극 활용하시는 패턴에는 Claude Pro와 ChatGPT Plus를 조합하는 것이 실용적입니다. 응답해주신 덕분에 글룩이 멀티 도구 전략에 맞는 예산을 수립할 수 있게 되었습니다.',
    };
  }

  // 케이스 2: Pro (low or mid+!heavy)
  if (useCase === 'coding') {
    return {
      ai: 'Claude Pro', icon: '⚡', tier: 'pro', savings: 180000,
      advice:
        '현재 업무 패턴에는 Claude Pro 하나로 충분히 고효율을 낼 수 있습니다. 2026년 기준 코딩 문맥 파악과 긴 코드베이스 이해력이 가장 뛰어난 도구입니다. 소중한 답변 덕분에 글룩이 개발 생산성에 맞춰 AI 도구를 정확히 배치할 수 있게 되었습니다.',
    };
  }
  if (useCase === 'writing' || useCase === 'research') {
    return {
      ai: 'Claude Pro', icon: '📝', tier: 'pro', savings: 180000,
      advice:
        '긴 문서 작업에는 Claude Pro가 가장 안정적인 선택입니다. 200K 토큰 컨텍스트로 방대한 자료도 한 번에 처리할 수 있어요. 남겨주신 답변 덕분에 글룩이 문서 업무 효율화에 맞는 AI 예산을 수립할 수 있게 되었습니다.',
    };
  }
  if (useCase === 'image') {
    return {
      ai: 'ChatGPT Plus', icon: '🎨', tier: 'pro', savings: 180000,
      advice:
        '이미지 생성 중심의 작업에는 ChatGPT Plus의 DALL-E로 충분한 퀄리티를 낼 수 있습니다. 응답해주신 덕분에 글룩의 비주얼 업무 영역에 맞는 AI 예산을 정할 수 있게 되었습니다.',
    };
  }
  return {
    ai: 'ChatGPT Plus', icon: '💬', tier: 'pro', savings: 180000,
    advice:
      '범용 사용에는 ChatGPT Plus나 Gemini Advanced 중 하나로 충분합니다. 남겨주신 답변이 글룩의 실용적인 AI 예산 기준을 세우는 데 큰 도움이 되었습니다.',
  };
}

// ============================================================
// AI 활용 성숙도 점수 (0~100)
// ============================================================
function getMaturity(answers) {
  let score = 0;
  if (answers.q3 === 'rare') score += 10;
  if (answers.q3 === 'daily') score += 30;
  if (answers.q3 === 'heavy') score += 50;

  if (answers.q2 === 'short') score += 5;
  if (answers.q2 === 'medium') score += 15;
  if (answers.q2 === 'long') score += 25;

  if (answers.q1 === 'coding' || answers.q1 === 'research') score += 15;
  else if (answers.q1 === 'writing') score += 10;
  else if (answers.q1 === 'image') score += 8;
  else if (answers.q1 === 'general') score += 5;

  const len = (answers.q5 || '').length;
  if (len >= 100) score += 10;
  else if (len >= 50) score += 5;

  score = Math.min(100, score);

  if (score >= 80) return { score, label: 'AI 파워유저',         emoji: '💎', color: 'purple' };
  if (score >= 60) return { score, label: '적극 활용자',          emoji: '🚀', color: 'blue' };
  if (score >= 40) return { score, label: '꾸준한 사용자',        emoji: '✨', color: 'green' };
  if (score >= 20) return { score, label: '탐색 중인 사용자',     emoji: '🌱', color: 'amber' };
  return                  { score, label: '이제 시작하는 분',     emoji: '🌰', color: 'gray' };
}

function getReasons(answers, tier) {
  const base = {
    coding: [
      '코딩 용도에서 Claude는 2026년 현재 가장 높은 SWE-bench 점수를 기록 중입니다',
      'IDE 통합(Claude Code)과 긴 컨텍스트로 전체 프로젝트 이해가 가능합니다',
    ],
    writing: [
      '한국어 문장력과 톤 조절에서 Claude가 자연스럽습니다',
      '긴 문서 요약과 일관성 유지에 강점이 있습니다',
    ],
    research: [
      'Perplexity는 실시간 웹 검색 + 출처 표기로 팩트 체크에 유리합니다',
      'Claude는 논문 해석과 비판적 분석에 강점이 있습니다',
    ],
    image: [
      'ChatGPT Plus의 DALL-E로 안정적인 이미지 품질을 확보할 수 있습니다',
      '텍스트 작업도 함께 가능해 효율적입니다',
    ],
    general: [
      '무료 버전만으로도 일상 사용에는 부족함이 없습니다',
      '여러 AI를 병행 사용하는 것이 특정 유료보다 효과적일 수 있습니다',
    ],
  };
  const reasons = [...(base[answers.q1] || base.general)];

  if (answers.q2 === 'long')
    reasons.push('긴 문서/코드 처리엔 Claude의 200K 컨텍스트가 결정적입니다');
  else if (tier === 'free')
    reasons.push('현재 사용 패턴에 맞는 가장 합리적인 선택입니다');
  else
    reasons.push('사용 빈도 대비 가성비가 가장 좋은 조합입니다');

  return reasons;
}

function getTips(useCase) {
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
  return tips[useCase] || tips.general;
}

// ============================================================
// 웹훅 전송 — no-cors 모드, 실패해도 사용자 화면 정상 진행
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
  } catch (e) {
    // 의도적으로 무시
  }
}

// ============================================================
// CSV 파싱 (쉼표 + 따옴표 처리)
// ============================================================
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
// 최상위 — URL 해시로 모드 분기
// ============================================================
export default function App() {
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
// ============================================================
function SurveyMode() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: '', team: '', role: '',
    q1: '', q2: '', q3: '', q4: '', q5: '',
  });
  const [result, setResult] = useState(null);

  const setField = (k, v) => setAnswers((p) => ({ ...p, [k]: v }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => {
    setStep(0);
    setAnswers({ name: '', team: '', role: '', q1: '', q2: '', q3: '', q4: '', q5: '' });
    setResult(null);
  };

  // Q1~Q4 클릭 시 자동 다음
  const selectAndNext = (key, value) => {
    setField(key, value);
    setTimeout(next, 220);
  };

  // Step 8 진입 시 결과 계산 + 웹훅 전송
  useEffect(() => {
    if (step !== 8) return;
    const rec = getRecommendation(answers);
    const mat = getMaturity(answers);
    const fullResult = {
      ...rec,
      maturityScore: mat.score,
      maturityLabel: mat.label,
      maturityEmoji: mat.emoji,
      maturityColor: mat.color,
    };
    setResult(fullResult);

    sendWebhook({
      name: answers.name,
      team: answers.team,
      role: answers.role || '',
      q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: answers.q4, q5: answers.q5,
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
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: `${(progressStep / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div key={step} className="animate-fade-in">
          {step === 0 && <Intro onStart={next} />}
          {step === 1 && (
            <NameStep
              value={answers.name}
              onChange={(v) => setField('name', v)}
              onNext={next}
            />
          )}
          {step === 2 && (
            <TeamStep
              team={answers.team}
              role={answers.role}
              onTeam={(v) => setField('team', v)}
              onRole={(v) => setField('role', v)}
              onNext={next}
              onPrev={prev}
            />
          )}
          {step >= 3 && step <= 6 && (
            <QuestionStep
              qKey={['q1', 'q2', 'q3', 'q4'][step - 3]}
              question={QUESTIONS[['q1', 'q2', 'q3', 'q4'][step - 3]]}
              value={answers[['q1', 'q2', 'q3', 'q4'][step - 3]]}
              onSelect={selectAndNext}
              onPrev={prev}
            />
          )}
          {step === 7 && (
            <Q5Step
              value={answers.q5}
              onChange={(v) => setField('q5', v)}
              onSubmit={next}
              onPrev={prev}
            />
          )}
          {step === 8 && <LoadingStep name={answers.name} />}
          {step === 9 && result && (
            <ResultStep answers={answers} result={result} onRestart={restart} />
          )}
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
          <div>
            <div className="text-2xl mb-1">⏱️</div>
            <div className="font-medium">1~2분</div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div>
            <div className="text-2xl mb-1">📋</div>
            <div className="font-medium">5객관식 + 1주관식</div>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5"
      >
        진단 시작하기 <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ---------- 이름 ----------
function NameStep({ value, onChange, onNext }) {
  const ok = (value || '').trim().length >= 2;
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
        이름을 입력해주세요
      </h2>
      <p className="text-slate-500 mb-8 text-sm">진단 결과에 표시될 이름이에요.</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && ok) onNext(); }}
        placeholder="홍길동"
        className="w-full px-5 py-4 text-lg bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
        autoFocus
      />
      <button
        onClick={onNext}
        disabled={!ok}
        className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all ${
          ok
            ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        다음 →
      </button>
    </div>
  );
}

// ---------- 팀/직책 ----------
function TeamStep({ team, role, onTeam, onRole, onNext, onPrev }) {
  const ok = !!team;
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
        소속과 직책을 알려주세요
      </h2>
      <p className="text-slate-500 mb-8 text-sm">팀별 분석에 활용됩니다.</p>

      <label className="block text-sm font-semibold text-slate-700 mb-2">
        소속팀 <span className="text-rose-500">*</span>
      </label>
      <select
        value={team}
        onChange={(e) => onTeam(e.target.value)}
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all mb-6"
      >
        <option value="">팀을 선택해주세요</option>
        {TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label className="block text-sm font-semibold text-slate-700 mb-2">
        직책 <span className="text-slate-400 text-xs">(선택)</span>
      </label>
      <input
        type="text"
        value={role}
        onChange={(e) => onRole(e.target.value)}
        placeholder="예: 대표이사, 이사, 팀장, 책임, 선임, 주임, 사원 등"
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
      />

      <div className="flex gap-3 mt-8">
        <button
          onClick={onPrev}
          className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1"
        >
          <ArrowLeft size={16} /> 이전
        </button>
        <button
          onClick={onNext}
          disabled={!ok}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
            ok
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

// ---------- 객관식 Q1~Q4 ----------
function QuestionStep({ qKey, question, value, onSelect, onPrev }) {
  const num = ['Q1', 'Q2', 'Q3', 'Q4'][['q1', 'q2', 'q3', 'q4'].indexOf(qKey)];
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2">{num}</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 leading-snug">
        {question.label}
      </h2>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const sel = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(qKey, opt.value)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                sel
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 w-6 h-6 rounded-full border-2 grid place-items-center ${
                    sel ? 'border-white bg-white' : 'border-slate-300'
                  }`}
                >
                  {sel && <CheckCircle2 size={20} className="text-slate-900" />}
                </div>
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${sel ? 'text-white/70' : 'text-slate-500'}`}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onPrev}
        className="mt-6 px-5 py-3 text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={16} /> 이전
      </button>
    </div>
  );
}

// ---------- Q5 주관식 ----------
function Q5Step({ value, onChange, onSubmit, onPrev }) {
  const len = (value || '').length;
  const ok = (value || '').trim().length >= 10;
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2">Q5</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">
        평소 AI로 해결하고 싶은 고민이나 업무를 적어주세요
      </h2>
      <p className="text-slate-500 mb-6 text-sm">구체적일수록 정확한 추천이 가능해요.</p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 500))}
        rows={5}
        placeholder="예: 긴 회의록을 요약하고 싶어요 / 3D 모델링 데이터 분석 자동화가 필요해요"
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all resize-none"
      />

      <div className="flex justify-between mt-2 text-xs">
        <span className={ok ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
          {ok ? '✓ 충분합니다' : `최소 10자 이상 (현재 ${len}자)`}
        </span>
        <span className="text-slate-400 tabular-nums">{len}/500</span>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onPrev}
          className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1"
        >
          <ArrowLeft size={16} /> 이전
        </button>
        <button
          onClick={onSubmit}
          disabled={!ok}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
            ok
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
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

// ---------- 결과 ----------
const TIER_BADGE = {
  free: { label: '무료', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pro:  { label: 'Pro',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  max:  { label: 'Max',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const MATURITY_COLOR = {
  purple: 'bg-purple-500',
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  amber:  'bg-amber-500',
  gray:   'bg-slate-400',
};

function ResultStep({ answers, result, onRestart }) {
  const tierBadge = TIER_BADGE[result.tier] || TIER_BADGE.pro;
  const reasons = getReasons(answers, result.tier);
  const tips = getTips(answers.q1);
  const userText = answers.q5 || '';

  return (
    <div className="space-y-5 pb-12">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-xl font-bold text-slate-900">
            {answers.name}님의 진단 결과
          </h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            {answers.team}{answers.role ? ` · ${answers.role}` : ''}
          </span>
        </div>
      </div>

      {/* 감사 메시지 */}
      <div className="rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 p-4 flex items-start gap-3">
        <Heart size={18} className="text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed">
          소중한 응답 감사합니다. 여러분의 답변이 글룩의 AI 예산 수립에 직접적인 도움이 됩니다.
        </p>
      </div>

      {/* 추천 AI 대형 카드 */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
        <div className="text-7xl sm:text-8xl mb-5">{result.icon}</div>
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
          추천 AI
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {result.ai}
        </h2>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${tierBadge.cls}`}
        >
          {tierBadge.label} 티어
        </span>
      </div>

      {/* 활용도 점수 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              AI 활용 성숙도
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{result.maturityEmoji}</span>
              <span className="text-lg font-bold text-slate-900">
                {result.maturityLabel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-900 tabular-nums">
              {result.maturityScore}
            </div>
            <div className="text-xs text-slate-400">/ 100점</div>
          </div>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${MATURITY_COLOR[result.maturityColor]} rounded-full transition-all duration-1000`}
            style={{ width: `${result.maturityScore}%` }}
          />
        </div>
      </div>

      {/* 컨설턴트 메시지 */}
      <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-slate-900 p-6 shadow-sm">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
          컨설턴트 메시지
        </div>
        <p className="text-slate-700 leading-relaxed">{result.advice}</p>
      </div>

      {/* 이유 3개 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          🎯 이 AI를 추천하는 이유
        </h3>
        <ul className="space-y-3">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Q5 맞춤 팁 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          🛠️ 고민 맞춤 활용 팁
        </h3>
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

      {/* 절약액 */}
      {result.savings > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-emerald-600 font-semibold mb-2">
            예상 효율화 효과
          </div>
          <div className="text-3xl font-black text-emerald-700 mb-2 tabular-nums">
            연간 약 {result.savings.toLocaleString('ko-KR')}원
          </div>
          <p className="text-sm text-emerald-700/80 leading-relaxed">
            이번 진단을 통해 글룩이 구독료를 효율화할 수 있는 근거가 확보되었습니다.
          </p>
        </div>
      )}

      <div className="text-center pt-4">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          <RefreshCw size={16} /> 다시 진단하기
        </button>
        <p className="text-xs text-slate-400 mt-6">GLUCK · 2026</p>
      </div>
    </div>
  );
}

// ============================================================
// 관리자 모드
// ============================================================
function AdminMode() {
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;
  if (!data) return <AdminUpload onUploaded={setData} />;
  return <AdminDashboard data={data} onReset={() => setData(null)} />;
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
      <div
        className={`bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-sm ${
          err ? 'animate-shake' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Lock size={20} className="text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">관리자 모드</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          진단 결과 보고서에 접근하려면 비밀번호를 입력해주세요.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="비밀번호"
          className={`w-full px-5 py-4 text-base bg-white border rounded-xl focus:ring-4 outline-none transition-all ${
            err
              ? 'border-rose-300 focus:ring-rose-100'
              : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/5'
          }`}
          autoFocus
        />
        {err && <div className="text-rose-500 text-sm mt-2">비밀번호가 틀렸습니다</div>}
        <button
          onClick={submit}
          className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}

function AdminUpload({ onUploaded }) {
  const [err, setErr] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { setErr('데이터가 비어있습니다.'); return; }

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
        ai:        row[9] || '',
        tier:      row[10] || '',
        savings:   parseInt(row[11], 10) || 0,
        score:     parseInt(row[12], 10) || 0,
        grade:     row[13] || '',
      }));

      onUploaded(records);
    } catch (e2) {
      setErr('CSV 파싱에 실패했습니다. 파일 형식을 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-lg w-full shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Upload size={20} className="text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">CSV 업로드</h1>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 leading-relaxed">
          <div className="font-semibold text-slate-900 mb-2">📁 데이터 가져오기</div>
          <div>
            구글 시트 → <b>파일 → 다운로드 → CSV(.csv)</b> 형식으로 저장한 후 업로드하세요.
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-4 leading-relaxed">
          <div className="font-semibold mb-1">CSV 컬럼 순서:</div>
          <code className="block p-2 bg-slate-50 rounded text-[10px] break-all">
            제출시간, 이름, 소속팀, 직책, Q1_용도, Q2_분량, Q3_빈도, Q4_예산, Q5_주관식, 추천AI, 추천티어, 예상절약액, 활용도점수, 활용도등급
          </code>
        </div>

        <label className="block">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <div className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-center cursor-pointer transition-all flex items-center justify-center gap-2">
            <FileText size={18} /> CSV 파일 선택
          </div>
        </label>

        {err && (
          <div className="mt-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}

function teamGrade(avg) {
  if (avg >= 80)
    return {
      label: 'AI 선도 팀',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      comment:
        '팀원들이 AI를 깊이 있게 활용하고 있는 팀입니다. 고급 유료 도구 도입으로 성과를 더 끌어올릴 수 있는 시점입니다.',
    };
  if (avg >= 60)
    return {
      label: '활발한 활용 팀',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      comment:
        'AI를 능숙하게 다루는 팀으로, Pro 티어 일괄 도입 시 생산성 시너지가 기대됩니다.',
    };
  if (avg >= 40)
    return {
      label: '안정적 사용 팀',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      comment:
        'AI 활용이 안정화된 팀입니다. 맞춤 교육으로 활용 영역을 넓힐 수 있는 여지가 큽니다.',
    };
  return {
    label: '도입 확대 기회 팀',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    comment:
      'AI 도입을 확대할 수 있는 팀입니다. 무료 버전부터 업무에 맞춰 점진적으로 도입해보면 좋습니다.',
  };
}

function AdminDashboard({ data, onReset }) {
  const total = data.length;
  const avgScore = total ? Math.round(data.reduce((s, d) => s + d.score, 0) / total) : 0;
  const totalSavings = data.reduce((s, d) => s + d.savings, 0);

  const byTeam = {};
  data.forEach((d) => {
    if (!byTeam[d.team]) byTeam[d.team] = [];
    byTeam[d.team].push(d);
  });
  const teams = Object.keys(byTeam).sort();

  const q1Map = {};
  data.forEach((d) => {
    if (!q1Map[d.q1]) q1Map[d.q1] = { count: 0, scoreSum: 0 };
    q1Map[d.q1].count++;
    q1Map[d.q1].scoreSum += d.score;
  });
  const q1Labels = {
    coding: '코딩 및 개발',
    writing: '문서 작성',
    general: '일상 사용',
    image: '이미지 생성',
    research: '학술 연구',
  };

  const sorted = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            글룩 AI 진단 보고서
          </h1>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
            >
              <Upload size={14} /> 재업로드
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all flex items-center gap-1"
            >
              <Printer size={14} /> PDF 인쇄
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* 섹션 1: 전체 요약 */}
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
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* 섹션 2: 팀별 활용도 평가 */}
        <Section title="팀별 AI 활용도 평가" icon={<Users size={20} />}>
          <div className="grid sm:grid-cols-2 gap-4">
            {teams.map((t) => {
              const members = byTeam[t];
              const avg = Math.round(
                members.reduce((s, m) => s + m.score, 0) / members.length
              );
              const grade = teamGrade(avg);
              const savings = members.reduce((s, m) => s + m.savings, 0);
              const aiCount = {};
              members.forEach((m) => {
                aiCount[m.ai] = (aiCount[m.ai] || 0) + 1;
              });
              const topAis = Object.entries(aiCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([ai]) => ai);

              return (
                <div
                  key={t}
                  className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{t}</h3>
                      <div className="text-xs text-slate-500">{members.length}명 응답</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${grade.color}`}
                    >
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
                      <span
                        key={ai}
                        className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700"
                      >
                        {ai}
                      </span>
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

        {/* 섹션 3: 개인별 상세 */}
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
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {i < 3 && '👑 '}
                        {d.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.team}</td>
                      <td className="px-4 py-3 text-slate-600">{d.role || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {d.score}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.grade}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.ai}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[240px] truncate">
                        {(d.q5 || '').slice(0, 40)}
                        {(d.q5 || '').length > 40 ? '…' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* 섹션 4: 용도별 분포 */}
        <Section title="용도별 분포" icon={<BarChart3 size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            <div className="space-y-4">
              {Object.entries(q1Map)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([k, v]) => {
                  const pct = total ? (v.count / total) * 100 : 0;
                  const avg = Math.round(v.scoreSum / v.count);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">
                          {q1Labels[k] || k}
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {v.count}명 · 평균 {avg}점
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Section>

        {/* 섹션 5: 주관식 모아보기 */}
        <Section title="주관식 답변 모아보기" icon={<FileText size={20} />}>
          <div className="space-y-6">
            {teams.map((t) => (
              <div
                key={t}
                className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  {t}
                  <span className="text-xs font-normal text-slate-500">
                    ({byTeam[t].length}명)
                  </span>
                </h3>
                <div className="space-y-3">
                  {byTeam[t].map((m, i) => (
                    <div key={i} className="border-l-2 border-slate-200 pl-4 py-1">
                      <div className="text-xs text-slate-500 mb-1">
                        <b className="text-slate-700">{m.name}</b>
                        {m.role ? ` · ${m.role}` : ''}
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {m.q5 || '(답변 없음)'}
                      </div>
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
    <div
      className={`rounded-2xl p-4 print-card ${
        accent
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div
        className={`text-xl sm:text-2xl font-black tabular-nums ${
          accent ? 'text-emerald-700' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

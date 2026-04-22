import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  Upload, Lock, FileText, BarChart3, Users, TrendingUp,
  Printer, RefreshCw, Heart, Loader2, AlertCircle,
} from 'lucide-react';

// ============================================================
// 상수
// ============================================================
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyHcZ6dzTZ_oFDTYD8iDqFBHaIO2zFsFmbEOj18JmWOY22JjtO61ncCvRnfKDTjkZm79A/exec';
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
      q5PaymentAmount: r.q5PaymentAmount || '',
      q6: r.q6 || '',
      q7: r.q7 || '',
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

// ============================================================
// 글룩 사내 AI 활용 사례 (잔디 「AI 활용 연구소」 채널 정리, 2026.04.17~)
// 진단 보고서에 사례 카드 + 총평 연동에 활용
// ============================================================
const INTERNAL_THEMES = [
  { key: 'all',         label: '전체',          icon: '📚', dot: 'bg-slate-500',   ring: 'border-slate-900 bg-slate-900 text-white',     idle: 'border-slate-200 text-slate-700 hover:border-slate-400' },
  { key: 'knowledge',   label: '지식 학습·상담', icon: '🧠', dot: 'bg-purple-500',  ring: 'border-purple-600 bg-purple-600 text-white',   idle: 'border-purple-200 text-purple-700 hover:border-purple-400' },
  { key: 'document',    label: '문서·보고서',    icon: '📝', dot: 'bg-blue-500',    ring: 'border-blue-600 bg-blue-600 text-white',       idle: 'border-blue-200 text-blue-700 hover:border-blue-400' },
  { key: 'automation',  label: '프로세스 자동화', icon: '⚙️', dot: 'bg-emerald-500', ring: 'border-emerald-600 bg-emerald-600 text-white', idle: 'border-emerald-200 text-emerald-700 hover:border-emerald-400' },
  { key: 'engineering', label: '설계·엔지니어링', icon: '🛠', dot: 'bg-amber-500',   ring: 'border-amber-600 bg-amber-600 text-white',     idle: 'border-amber-200 text-amber-700 hover:border-amber-400' },
  { key: 'enablement',  label: '전사 확산 기반', icon: '🌱', dot: 'bg-cyan-500',    ring: 'border-cyan-600 bg-cyan-600 text-white',       idle: 'border-cyan-200 text-cyan-700 hover:border-cyan-400' },
];

const INTERNAL_CASES = [
  {
    name: '홍재옥', team: '경영진', role: '대표',
    themes: ['knowledge', 'document', 'automation', 'enablement'],
    tools: ['Claude Opus 4.7', 'Claude Code', 'NotebookLM', 'LangGraph', 'Streamlit'],
    summary: '정부과제 멀티 에이전트 시스템 + DFAM 학습',
    champion: '🏆 멀티 에이전트 오케스트레이션',
    details: [
      { title: 'DFAM 학습 & 신규 패턴 특허 초안', body: 'NotebookLM에 DFAM 자료·논문 학습 → 신규 패턴 특허 초안 작성, 학습·질의응답 용도.' },
      { title: '정부과제 멀티 에이전트 시스템 (4/19)', body: '공고문 업로드 → 전략가/기술전문가/사업전문가/정책전문가 에이전트 섹션 분담 작성 → 기술·사업·예산행정 심사위원 에이전트 평가 → 85점 미달 시 자동 재작성 루프(최대 3라운드). 글룩 자산(SLA/다크팩토리, ±30μm 정밀도, 삼성/LG 1차벤더 등) 내장. NIPA 선정작 PDF로 검증 완료, 품질 튜닝 후 팀 배포 예정.' },
      { title: 'Office 연동 (4/20)', body: 'Word·PPT·Excel에 Claude를 붙여 통합 활용.' },
    ],
  },
  {
    name: '이수원', team: '출력팀', role: '팀장',
    themes: ['enablement', 'automation'],
    tools: ['Gemini', 'Notion AI'],
    summary: '바이브코딩 마스터 프롬프트 + 노션 AI 자동화',
    details: [
      { title: '바이브코딩용 마스터 프롬프트 (Gemini 기반)', body: '"수석 기술 슈퍼바이저 & 프로젝트 무결성 아키텍트" 역할 프롬프트. 비전공자 SOP, Mermaid/ASCII 시각화, 코드 무결성(회귀 테스트·전체 코드 제공), 보안(시크릿 마스킹), 문맥 체크포인트, 트러블슈팅 규약 포함.' },
      { title: '노션 AI 에이전트로 루틴 업무 자동화', body: '머티리얼라이즈 SW 라이선스 만료일 확인 → 할 일 자동 생성 → 담당자 리마인더 발송.' },
    ],
  },
  {
    name: '안성준', team: '출력팀', role: '사원',
    themes: ['automation'],
    tools: ['ChatGPT'],
    summary: 'AnyDesk 원격접속 런처 자동화',
    details: [
      { title: '원격 접속 런처 프로그램 제작', body: 'ChatGPT에 AnyDesk 바로가기 속성의 인자값 구조를 설명 → 장비별 접속 정보(이름·프로그램·주소·버튼 색/위치)를 버튼 런처화. 반복적인 주소 검색 과정 제거, 원격 접속 업무 단순화.' },
    ],
  },
  {
    name: '경일규', team: '팩토리팀', role: '수석',
    themes: ['knowledge', 'engineering'],
    tools: ['ChatGPT', 'AI Agent'],
    summary: '설계 상담 + 비전공 분야(유체역학·화학·에너지) 전문지식',
    details: [
      { title: 'ChatGPT 전문 지식 상담', body: '설계 초안 작성, 유체역학·화학·에너지 등 비전공 분야 상담.' },
      { title: '테스트 데이터화 검토', body: 'AI Agent·녹음기 활용해 테스트 결과 데이터화 실무 적용 검토 중.' },
    ],
  },
  {
    name: '권혁주', team: '팩토리팀', role: '책임',
    themes: ['document'],
    tools: ['Claude'],
    summary: 'SLA 교육 음성 → PPT 자동 변환 (OJT 자료)',
    details: [
      { title: '교육 음성 → PPT 변환', body: '경수석 SLA 교육 녹음 → 텍스트 추출 → Claude로 PPT화. 사내 교육/OJT 자료 제작 목적, 결과물 만족도 높음.' },
    ],
  },
  {
    name: '성두현', team: '후가공팀', role: '팀장',
    themes: ['enablement'],
    tools: ['Claude', 'Gemini', 'GPT'],
    summary: 'Claude 사용 가이드 사내 공유',
    details: [
      { title: 'Claude 사용 가이드 공유', body: 'Gemini/GPT 학습 내용을 Claude로 이어 활용하는 유튜브 가이드 공유. 팀 온보딩·사용법 공유 목적.' },
    ],
  },
  {
    name: '김민정', team: '기획팀', role: '사원',
    themes: ['document', 'knowledge'],
    tools: ['NotebookLM'],
    summary: '마케팅 데이터 심층 분석 (만족도·검색·콘텐츠)',
    details: [
      { title: '노트북LM으로 마케팅 데이터 분석', body: '(1) 만족도 조사·사용자 피드백 분석 (2) 검색 데이터 성과 분석 (유입 키워드, 노출·클릭 효율) (3) 콘텐츠 발행 성과 분석 (클릭률, 소재·발송 시간대별 반응). 보고서·데이터표 작업에 활용.' },
    ],
  },
  {
    name: '허은지', team: '기획팀', role: '주임',
    themes: ['engineering', 'automation', 'document'],
    tools: ['AI크론', 'Higgsfield', 'AI Studio', 'Claude'],
    summary: '이미지/영상 대량 생성 + 마케팅 너처링 자동화',
    details: [
      { title: '이미지/영상 생성 (AI크론, Higgsfield)', body: '이미지 한 장으로 다양한 앵글·구도 생성, 대량 영상 생성. 최근 로봇 자동화 영상 제작에 활용.' },
      { title: '마케팅 자동화 너처링 메일 + 대시보드', body: '세일즈맵 마케팅 셋팅 플로우 녹화 영상 기반. AI Studio + Claude로 자동화 너처링 메일 발송. 대시보드 디자인 작업 진행 중.' },
    ],
  },
  {
    name: '박이건', team: '후가공팀', role: '사원',
    themes: ['automation'],
    tools: ['Claude', 'Airtable API', 'Notion API'],
    summary: '출고 프로세스 자동화 (사진→Notion 일괄 업로드)',
    champion: '🏆 풀 파이프라인 자동화',
    details: [
      { title: '출고 자동화 시스템', body: '일련번호 입력 → Airtable에서 업체/고객 정보 자동 조회 → 카메라로 출고 사진 자동 촬영 → Notion에 일괄 업로드. Windows 11 미지원 장비는 IVCAM으로 카메라 연동.' },
      { title: '제작 프로세스', body: '1) 기존 업무 흐름 다이어그램화 → 2) 병목·자동화 포인트 분석 → 3) Airtable·Notion API 구조 설계 → 4) Claude로 코드 작성 → 5) 테스트·피드백 반영.' },
    ],
  },
  {
    name: '김태완', team: '기획팀', role: '팀장',
    note: '팩토리 MES 담당',
    themes: ['automation'],
    tools: ['Airtable'],
    summary: '팩토리 MES 메인 DB 통합 (Airtable)',
    details: [
      { title: 'MES DB 통합 구축', body: '빌드 완성 이미지, 폐기 이미지, QC 정보, 작업 특이사항, 출고 정보 등 Airtable로 통합 기록.' },
      { title: '선정 이유', body: '수십만 건 데이터 관리 가능, 확장성·사용성 우수, AI·자동화 도입 용이. 박이건의 출고 자동화 사례를 팩토리에도 참고 적용 예정.' },
    ],
  },
  {
    name: '유윤종', team: '후가공팀', role: '사원',
    note: '설계 업무 담당',
    themes: ['engineering'],
    tools: ['Claude'],
    summary: '회전판 설계용 AI 계산기 (3캠 4단계 위상차)',
    details: [
      { title: '회전판 설계용 AI 계산기', body: '단일 모터로 틸트 운동 구현을 위한 3개 캠의 4단계 위상차 계산. Claude가 만든 계산기로 변수값 조절 후 설계에 반영. 수학·기하학 계산을 AI에 맡기고 산출값으로 애니메이션·설계 진행.' },
    ],
  },
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
      { value: 'meeting',       label: '회의록·녹취록 정리',              desc: '회의 요약, 녹음 텍스트화' },
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
    hint: '해당되는 것 모두 선택해주세요 (1~4번은 중복 가능)',
    multi: true,
    exclusive: ['none', 'never'],
    options: [
      { value: 'limit',    label: '무료 한도가 빨리 떨어져요',                  desc: '횟수/시간 제한' },
      { value: 'quality',  label: '응답 품질이 좀 더 좋았으면 해요',              desc: '정확도/깊이 부족' },
      { value: 'context',  label: '더 긴 문서/대용량 자료를 한 번에 다루고 싶어요', desc: '컨텍스트 부족' },
      { value: 'training', label: 'AI 에이전트·심화 활용법을 배우고 싶어요',       desc: '교육·학습 니즈' },
      { value: 'none',     label: '특별히 부족한 점은 없어요',                  desc: '지금 충분' },
      { value: 'never',    label: '아직 본격적으로 써본 적 없어요',              desc: '입문 단계' },
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

  // 결제 2차 후속 — personal/mixed 시 본인 부담 월 지출 파악
  q5PaymentAmount: {
    label: '월 본인 부담 금액은 얼마 정도인가요?',
    options: [
      { value: 'under10k',  label: '월 1만원 이하',        desc: '소액 구독' },
      { value: '10to30k',   label: '월 1~3만원',          desc: 'Pro 1개 수준' },
      { value: '30to50k',   label: '월 3~5만원',          desc: 'Pro 2개 수준' },
      { value: '50to100k',  label: '월 5~10만원',         desc: '다수 Pro 구독' },
      { value: '100to200k', label: '월 10~20만원',        desc: 'Max 티어 포함' },
      { value: 'over200k',  label: '월 20만원 이상',       desc: '헤비 투자' },
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
      { value: 'copilot',    label: 'Microsoft Copilot',    desc: 'MS365·오피스 통합' },
      { value: 'wrtn',       label: '뤼튼 (Wrtn)',          desc: '한국 서비스' },
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
  // planning, meeting은 writing과 같은 도구군 (Claude·ChatGPT — 요약·문서화 강점)
  if (arr.includes('writing') || arr.includes('planning') || arr.includes('meeting')) return 'writing';
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

  // 메인으로 쓰는 도구 식별 (우선순위: claude > chatgpt > gemini > perplexity)
  // 이미 잘 쓰는 도구를 존중해서 추천
  const mainTool = has('claude') ? 'claude'
    : has('chatgpt') ? 'chatgpt'
    : has('gemini') ? 'gemini'
    : has('perplexity') ? 'perplexity'
    : null;

  // 다양성: Q1 용도 3개 이상이면 "여러 영역 사용자" → 조합 추천
  const q1Count = toArr(answers.q1).filter((v) => v !== 'other').length;
  const isVaried = q1Count >= 3;

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
    training: '심화 활용법 학습 니즈',
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
  // 다양한 용도(3+)를 다루시는 분은 조합 추천 — 이미 쓰는 메인 도구 존중
  if (isVaried) {
    if (mainTool === 'claude') {
      return rec(
        'Claude Pro + ChatGPT Plus', '⚡', 'pro', 180000,
        `Claude를 메인으로 잘 쓰고 계시니 Pro 업그레이드가 가장 자연스럽습니다. 여러 용도(${q1Count}가지)를 다루시는 만큼 ChatGPT Plus(DALL·E·GPTs·음성)를 보조로 조합하면 영역별 강점을 모두 활용할 수 있습니다. ${TAIL}`,
        ['Claude Pro', 'ChatGPT Plus'],
      );
    }
    if (mainTool === 'chatgpt') {
      return rec(
        'ChatGPT Plus + Claude Pro', '⚡', 'pro', 180000,
        `ChatGPT를 메인으로 잘 쓰고 계시니 Plus 업그레이드가 자연스럽습니다. 여러 용도(${q1Count}가지)를 다루시는 만큼 Claude Pro(긴 문서·추론·한국어 글쓰기)를 보조로 조합하면 시너지가 큽니다. ${TAIL}`,
        ['ChatGPT Plus', 'Claude Pro'],
      );
    }
    if (mainTool === 'gemini') {
      return rec(
        'Gemini Advanced + Claude Pro', '⚡', 'pro', 180000,
        `Gemini를 메인으로 쓰고 계시니 Advanced(2M 컨텍스트·Workspace 연동)를 유지하시고, Claude Pro(추론·코딩·긴 한국어 문서)를 추가하면 여러 용도(${q1Count}가지)를 효율적으로 커버할 수 있습니다. ${TAIL}`,
        ['Gemini Advanced', 'Claude Pro'],
      );
    }
    // 메인 도구가 아직 없는 경우
    return rec(
      'Claude Pro + ChatGPT Plus', '⚡', 'pro', 180000,
      `여러 용도(${q1Count}가지)를 다양하게 활용하시니 각 영역에 강점이 다른 두 도구를 조합하는 게 가장 실용적입니다. ${TAIL}`,
      ['Claude Pro', 'ChatGPT Plus'],
    );
  }

  // 단일 용도 중심 — 메인 도구 우선
  if (primary === 'coding') {
    // 이미 Cursor를 쓰고 있다면 Cursor Pro 추천
    if (has('cursor') && isLongVol && (heavyUsage || dailyUsage)) {
      return rec(
        'Cursor Pro', '⌨️', 'pro', 180000,
        `이미 Cursor를 쓰고 계시니 Pro 업그레이드가 가장 자연스럽습니다. 백엔드로 Claude·GPT-5를 함께 활용할 수 있어 모델 유연성도 확보됩니다. ${TAIL}`,
        ['Cursor Pro'],
      );
    }
    // Claude를 쓰면 Claude Pro 우선. 대규모 코드베이스면 Cursor 병행 제안
    if (mainTool === 'claude') {
      if (isLongVol && heavyUsage) {
        return rec(
          'Claude Pro (필요 시 Cursor Pro 병행)', '⚡', 'pro', 180000,
          `이미 Claude를 잘 쓰고 계시니 Pro 업그레이드가 최우선입니다. 대규모 코드베이스 작업이 많아지면 Cursor Pro를 추가 도입해 IDE 안에서 같은 Claude 모델을 더 빠르게 쓸 수 있습니다. ${TAIL}`,
          ['Claude Pro'],
          'Cursor Pro는 Claude·GPT-5를 백엔드로 선택 가능한 IDE 통합 도구입니다',
        );
      }
      return rec(
        'Claude Pro', '⚡', 'pro', 180000,
        `${painLabel}을 고려하면 이미 쓰고 계신 Claude를 Pro로 올리는 것이 가장 자연스럽습니다. 2026년 기준 코딩 문맥 파악에서 압도적입니다. ${TAIL}`,
        ['Claude Pro'],
      );
    }
    // ChatGPT 메인 사용자
    if (mainTool === 'chatgpt') {
      return rec(
        'ChatGPT Plus + Claude Pro 검토', '⚡', 'pro', 180000,
        `이미 ChatGPT를 잘 쓰시니 Plus 업그레이드가 우선입니다. 코딩 퀄리티가 아쉽다면 Claude Pro를 추가로 써보세요 — 코드 이해력에서 차이가 납니다. ${TAIL}`,
        ['ChatGPT Plus', 'Claude Pro'],
      );
    }
    // 새로 시작하는 경우 — 대규모 + 헤비면 Cursor, 아니면 Claude Pro
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
    // Claude 메인 사용자 우선
    if (mainTool === 'claude') {
      if (isLongVol) {
        return rec(
          'Claude Pro (긴 문서엔 Gemini Advanced 병행)', '📝', 'pro', 180000,
          `이미 Claude를 잘 쓰시니 Pro 업그레이드가 우선입니다. 책 한 권 분량의 문서는 Gemini Advanced(2M 컨텍스트)를 추가로 쓰시면 완벽합니다. ${TAIL}`,
          ['Claude Pro', 'Gemini Advanced'],
        );
      }
      return rec(
        'Claude Pro', '📝', 'pro', 180000,
        `이미 Claude를 잘 쓰고 계시니 Pro로 올리는 것이 가장 자연스럽습니다. 한국어 글쓰기·톤 조절에서 가장 안정적입니다. ${TAIL}`,
        ['Claude Pro'],
      );
    }
    if (mainTool === 'chatgpt') {
      if (pain === 'quality') {
        return rec(
          'ChatGPT Plus + Claude Pro', '📝', 'pro', 180000,
          `ChatGPT를 쓰시면서 품질에 아쉬움을 느끼시는 패턴입니다. Plus 유지하면서 Claude Pro(한국어 문장력 우위)를 추가하면 품질 이슈가 해소됩니다. ${TAIL}`,
          ['ChatGPT Plus', 'Claude Pro'],
        );
      }
      return rec(
        'ChatGPT Plus', '💬', 'pro', 180000,
        `이미 ChatGPT를 쓰고 계시니 Plus 업그레이드가 가장 자연스럽습니다. GPTs로 반복 업무 자동화까지 가능합니다. ${TAIL}`,
        ['ChatGPT Plus'],
      );
    }
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
    // Perplexity 쓰면 Pro로, 아니면 메인 도구 + Perplexity 조합
    if (has('perplexity')) {
      return rec(
        'Perplexity Pro', '🔎', 'pro', 180000,
        `이미 Perplexity를 쓰고 계시니 Pro 업그레이드가 가장 자연스럽습니다. Deep Research 모드로 보고서급 결과물까지 생성됩니다. ${TAIL}`,
        ['Perplexity Pro'],
      );
    }
    if (mainTool === 'claude') {
      return rec(
        'Claude Pro + Perplexity Pro', '🔎', 'pro', 180000,
        `Claude를 잘 쓰시니 Pro는 유지하시고, 리서치 특화 Perplexity Pro(실시간 검색·출처 인용)를 함께 쓰면 팩트 체크와 심층 분석 모두 커버됩니다. ${TAIL}`,
        ['Claude Pro', 'Perplexity Pro'],
      );
    }
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
// AI 활용 성숙도 점수 (max 100, 100점은 매우 드물게 나오도록 세분화)
//
// 배점 합계 (이론상 max ~108, cap 100):
//  - Q3 빈도        max 35
//  - Q2 분량        max 18
//  - Q1 용도        max 13 + 다양성 보너스 max 5
//  - Q4 불편 인식   max 12 + 한도+컨텍스트 동시 +2
//  - Q5 도구 다양성 max 10
//  - Q5 결제 적극성 max 5
//  - Q6 고민 품질   max 12 (길이 + 의미 키워드)
//  - Q7 의견 적극성 max 6 (길이 + 정책 키워드)
//  - Q6 가비지 입력 페널티 -5 (ㅇㅇㅇㅇ 같은 입력)
function getMaturity(answers) {
  let score = 0;

  // 1) Q3 빈도 (max 35)
  const q3Map = { rarely: 5, weekly: 12, daily: 20, regular: 28, heavy: 35 };
  score += q3Map[answers.q3] || 0;

  // 2) Q2 분량 (max 18)
  const q2Map = { oneline: 2, short: 5, medium: 10, large: 14, massive: 18 };
  score += q2Map[answers.q2] || 0;

  // 3) Q1 용도 (max 13 + 다양성 5) — 가장 높은 점수 1개 + 다양성 보너스
  const q1Map = {
    coding: 13, research: 13, analysis: 11, planning: 9, writing: 9, meeting: 9,
    image: 7, communication: 6, other: 5, general: 3,
  };
  const q1Arr = toArr(answers.q1).filter((v) => v !== 'other' || (answers.q1Other || '').trim());
  const q1Top = q1Arr.reduce((m, v) => Math.max(m, q1Map[v] || 0), 0);
  score += q1Top;
  if (q1Arr.length >= 5) score += 5;
  else if (q1Arr.length >= 3) score += 3;

  // 4) Q4 불편 인식 (max 12) + 한도+컨텍스트 동시 +2
  const q4Map = { never: 0, none: 3, training: 5, quality: 7, limit: 9, context: 10 };
  const q4Arr = toArr(answers.q4);
  const q4Top = q4Arr.reduce((m, v) => Math.max(m, q4Map[v] || 0), 0);
  score += q4Top;
  if (q4Arr.includes('limit') && q4Arr.includes('context')) score += 2;

  // 5) Q5 도구 다양성 (max 10)
  const q5Arr = toArr(answers.q5).filter((v) => v !== 'none');
  if (q5Arr.length >= 3) score += 10;
  else if (q5Arr.length === 2) score += 7;
  else if (q5Arr.length === 1) score += 4;

  // 6) Q5 결제 적극성 (max 5)
  const pay = answers.q5Payment;
  const amt = answers.q5PaymentAmount;
  if (pay === 'company') score += 4;
  else if (pay === 'mixed') score += 3;
  else if (pay === 'personal') score += 3;
  // 월 5만원 이상 본인 부담은 적극성 +1
  if ((pay === 'personal' || pay === 'mixed') &&
      (amt === '50to100k' || amt === '100to200k' || amt === 'over200k')) score += 1;

  // 7) Q6 고민 품질 (max 12) — 길이 + 작업 의도 키워드
  const q6 = (answers.q6 || '').trim();
  const q6Len = q6.length;
  if (q6Len >= 80) score += 9;
  else if (q6Len >= 40) score += 6;
  else if (q6Len >= 10) score += 3;
  // 작업 의도 키워드 — 구체성 있는 답변에 가산점
  const intentRe = /자동화|효율|통합|리뷰|리팩토링|분석|개선|최적화|요약|정리|학습|교육|보고서|기획|번역|디자인|코드|데이터|회의록|이메일|업무|시간/gi;
  const intentHits = (q6.match(intentRe) || []).length;
  if (intentHits >= 2) score += 3;
  else if (intentHits >= 1) score += 1;

  // 8) Q7 정책 의견 (max 6) — 길이 + 정책 키워드
  const q7 = (answers.q7 || '').trim();
  if (q7.length >= 30) score += 4;
  else if (q7.length >= 5) score += 2;
  if (/교육|도입|지원|예산|가이드|정책|보안|규정|공유|세션|워크숍|체계|구독/.test(q7)) score += 1;

  // 9) Q6 가비지 입력 페널티 (-5) — "ㅇㅇㅇㅇ" 같은 무성의 답변
  if (q6Len >= 5) {
    const uniq = new Set(q6.replace(/\s/g, '').split('')).size;
    if (uniq <= 2) score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  // 6단계 등급 — 100점은 정말 드물게 나오도록 분포 세밀화
  if (score >= 85) return { score, label: 'AI 마스터',          emoji: '👑' };
  if (score >= 70) return { score, label: 'AI 파워유저',         emoji: '💎' };
  if (score >= 55) return { score, label: '적극 활용자',          emoji: '🚀' };
  if (score >= 40) return { score, label: '꾸준한 사용자',        emoji: '✨' };
  if (score >= 25) return { score, label: '탐색 중인 사용자',     emoji: '🌱' };
  return                    { score, label: '도입 초기 단계',     emoji: '🌰' };
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
// Step: 0=intro, 1=name, 2=welcome, 3=q1, 4=q2, 5=q3, 6=q4, 7=q5, 8=q6, 9=q7, 10=loading, 11=result
// Progress: 1~9 / 9
// ============================================================
function SurveyMode() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: '', team: '', role: '',
    q1: [], q1Other: '', q2: '', q3: '', q4: [], q4Limit: '', q5: [], q5Other: '', q5Payment: '', q5PaymentAmount: '', q6: '', q7: '',
  });
  const [result, setResult] = useState(null);

  const setField = (k, v) => setAnswers((p) => ({ ...p, [k]: v }));
  const setMany = (obj) => setAnswers((p) => ({ ...p, ...obj }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => {
    setStep(0);
    setAnswers({
      name: '', team: '', role: '',
      q1: [], q1Other: '', q2: '', q3: '',
      q4: [], q4Limit: '',
      q5: [], q5Other: '', q5Payment: '', q5PaymentAmount: '',
      q6: '', q7: '',
    });
    setResult(null);
  };

  const selectAndNext = (key, value) => {
    setField(key, value);
    setTimeout(next, 220);
  };

  // Step 10 로딩 진입 시 결과 계산 + 웹훅
  useEffect(() => {
    if (step !== 10) return;
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
      q5PaymentAmount: answers.q5PaymentAmount || '',
      q6: answers.q6,
      q7: answers.q7 || '',
      recommendedAi: rec.ai,
      recommendedTier: rec.tier,
      savings: rec.savings,
      maturityScore: mat.score,
      maturityLabel: mat.label,
    });

    const t = setTimeout(() => setStep(11), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const progressStep = step >= 1 && step <= 9 ? step : step >= 10 ? 9 : 0;
  const showProgress = step >= 1 && step <= 9;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {showProgress && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500 tabular-nums">
              {progressStep}/9
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${(progressStep / 9) * 100}%` }} />
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
              paymentAmountQuestion={QUESTIONS.q5PaymentAmount}
              paymentAmountSelected={answers.q5PaymentAmount}
              onPaymentAmountChange={(v) => setField('q5PaymentAmount', v)}
              onNext={next} onPrev={prev}
            />
          )}
          {step === 8 && (
            <Q6Step value={answers.q6} onChange={(v) => setField('q6', v)} onSubmit={next} onPrev={prev} />
          )}
          {step === 9 && (
            <Q7Step value={answers.q7} onChange={(v) => setField('q7', v)} onSubmit={next} onPrev={prev} />
          )}
          {step === 10 && <LoadingStep name={answers.name} role={answers.role} />}
          {step === 11 && result && <ResultStep answers={answers} result={result} onRestart={restart} />}
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
          <div><div className="text-2xl mb-1">📋</div><div className="font-medium">9단계 간단 진단</div></div>
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
  paymentAmountQuestion, paymentAmountSelected, onPaymentAmountChange,
}) {
  const current = Array.isArray(values) ? values : [];
  const exclusive = question.exclusive || [];
  const showOther = otherValue && current.includes(otherValue);
  const showFollow = followValue && followQuestion && current.includes(followValue);
  // 결제 follow-up: 선택값이 있고 배타적 옵션('none')만 고른 게 아니면 표시
  const showPayment = paymentQuestion && current.length > 0 && current.some((v) => !exclusive.includes(v));
  // 결제 2차 follow-up: paymentSelected가 'personal' 또는 'mixed'일 때만
  const showPaymentAmount = paymentAmountQuestion && showPayment &&
    (paymentSelected === 'personal' || paymentSelected === 'mixed');

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
    && (!showPayment || !!paymentSelected)
    && (!showPaymentAmount || !!paymentAmountSelected);

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

      {showPaymentAmount && (
        <div className="mt-4 p-5 rounded-2xl bg-rose-50 border border-rose-200 anim-fade-in">
          <div className="text-sm font-bold text-rose-900 mb-1 flex items-center gap-1.5">
            💰 {paymentAmountQuestion.label} <span className="text-rose-500">*</span>
          </div>
          <div className="text-xs text-rose-800/80 mb-3">
            {paymentSelected === 'mixed'
              ? '개인이 부담하시는 부분만 해당되는 범위를 골라주세요.'
              : '본인이 직접 결제하는 월 지출 합계를 알려주세요.'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paymentAmountQuestion.options.map((opt) => {
              const sel = paymentAmountSelected === opt.value;
              return (
                <button key={opt.value} onClick={() => onPaymentAmountChange(opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    sel
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-white text-slate-700 border-rose-200 hover:border-rose-400 hover:-translate-y-0.5'
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
          다음 →
        </button>
      </div>
    </div>
  );
}

// ---------- Q7 (선택 입력) — 회사 AI 정책 의견 ----------
function Q7Step({ value, onChange, onSubmit, onPrev }) {
  const len = (value || '').length;
  const hasContent = (value || '').trim().length > 0;
  return (
    <div>
      <div className="text-xs font-mono font-bold text-slate-400 mb-2 flex items-center gap-2">
        <span>Q7</span>
        <span className="text-slate-400 font-sans font-normal normal-case">· 선택 입력</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">
        회사 AI 정책에 바라는 점이 있다면?
      </h2>
      <p className="text-slate-500 mb-6 text-sm leading-relaxed">
        건의사항·제안·개선 아이디어를 편하게 남겨주세요. 비워두셔도 괜찮아요.
      </p>

      <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, 500))} rows={5}
        placeholder="예: 팀별 Pro 구독 일괄 지원 검토 / 사내 AI 교육 세션 / 보안 가이드라인 / 정기 노하우 공유 자리 등"
        className="w-full px-5 py-4 text-base bg-white border border-slate-200 rounded-2xl focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all resize-none" />

      <div className="flex justify-end mt-2 text-xs">
        <span className="text-slate-400 tabular-nums">{len}/500</span>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onPrev} className="px-5 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
          <ArrowLeft size={16} /> 이전
        </button>
        <button onClick={onSubmit}
          className="flex-1 py-4 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 transition-all">
          {hasContent ? '결과 보기 →' : '건너뛰고 결과 보기 →'}
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
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyHcZ6dzTZ_oFDTYD8iDqFBHaIO2zFsFmbEOj18JmWOY22JjtO61ncCvRnfKDTjkZm79A/exec';
  const useWebhook = WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_APPS_SCRIPT_URL';
  // 옛날 응답들도 최신 점수 공식으로 재계산해서 표시 (시트의 score는 저장 당시 값이라 갱신 안 됨)
  const recompute = (records) => records.map((r, i) => {
    const mat = getMaturity(r);
    return {
      ...r,
      _id: r._id || (r.timestamp ? `${r.timestamp}|${r.name || ''}` : `idx-${i}`),
      score: mat.score,
      grade: mat.label,
    };
  });

  const fetchData = async () => {
    setLoading(true);
    if (useWebhook) {
      try {
        const res = await fetch(WEBHOOK_URL + '?action=list', { method: 'GET' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error('invalid response shape');
        setData(recompute(json));
        setSource('webhook');
        setLoading(false);
        return;
      } catch (e) {
        // fallthrough to local
      }
    }
    setData(recompute(loadLocal()));
    setSource('local');
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (source === 'local') {
      deleteLocal(id);
      setData(recompute(loadLocal()));
      return;
    }

    // 웹훅 모드: 시트에서 영구 삭제 요청 후 UI에서 제거
    const record = (data || []).find((r) => r._id === id);
    if (!record) return;
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete',
          timestamp: record.timestamp || '',
          name: record.name || '',
        }),
      });
    } catch (e) {
      // no-cors라 응답 못 읽음. 실패해도 UI에선 즉시 제거
    }
    setData((prev) => prev.filter((r) => r._id !== id));
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

// ============================================================
// AI 컨설턴트 총평 — 데이터 기반 자동 생성 (보고서 마지막 카드)
// ============================================================
function generateFinalAssessment(data, byTeam, q4Map, tierCounts, paymentMap, amountMap) {
  const total = data.length;
  if (total === 0) return null;

  const avgScore = Math.round(data.reduce((s, d) => s + (Number(d.score) || 0), 0) / total);
  const teams = Object.keys(byTeam);
  const teamAvgs = teams.map((t) => ({
    name: t,
    avg: Math.round(byTeam[t].reduce((s, m) => s + (Number(m.score) || 0), 0) / byTeam[t].length),
    count: byTeam[t].length,
  }));
  const topTeam = [...teamAvgs].sort((a, b) => b.avg - a.avg)[0];
  const bottomTeam = [...teamAvgs].sort((a, b) => a.avg - b.avg)[0];
  const gap = topTeam.avg - bottomTeam.avg;

  const limitN = q4Map['limit'] || 0;
  const trainingN = q4Map['training'] || 0;
  const neverN = q4Map['never'] || 0;
  const noneN = q4Map['none'] || 0;
  const lowNeedN = neverN + noneN;
  const personalN = paymentMap['personal'] || 0;
  const mixedN = paymentMap['mixed'] || 0;
  const highBurden = (amountMap['100to200k'] || 0) + (amountMap['over200k'] || 0);
  const multiToolUsers = data.filter((d) => toArr(d.q5).filter((v) => v !== 'none').length >= 2).length;

  const monthlyUSD = tierCounts.pro * TIER_USD.pro + tierCounts.max * TIER_USD.max;
  const yearlyKRW = monthlyUSD * 12 * KRW_RATE;

  // ---------- 한 줄 진단 ----------
  let headline;
  let stage;
  if (avgScore >= 75) { headline = '글룩은 AI 활용 성숙 단계에 진입했습니다'; stage = 'mature'; }
  else if (avgScore >= 60) { headline = '글룩은 AI 안정 활용 단계에 있습니다'; stage = 'stable'; }
  else if (avgScore >= 45) { headline = '글룩은 AI 도입 확산 단계로 본격 가속이 필요한 시점입니다'; stage = 'spreading'; }
  else if (avgScore >= 30) { headline = '글룩은 AI 도입 확장 단계로 체계적 지원이 필요합니다'; stage = 'expanding'; }
  else { headline = '글룩은 AI 도입을 본격적으로 시작할 시점입니다'; stage = 'starting'; }

  // ---------- 사례 기반 분석 (잔디 채널) ----------
  const caseCount = INTERNAL_CASES.length;
  const automationCases = INTERNAL_CASES.filter((c) => c.themes.includes('automation')).length;
  const championCount = INTERNAL_CASES.filter((c) => c.champion).length;
  const champions = INTERNAL_CASES.filter((c) => c.champion).map((c) => `${c.name} ${c.role}(${c.summary})`);

  // ---------- 강점 ----------
  const strengths = [];
  // 사내 사례 강점 (제일 먼저)
  if (caseCount > 0) {
    strengths.push(`사내 잔디 채널에 이미 ${caseCount}명의 활용 사례가 축적되어 있습니다 (멀티 에이전트·풀 파이프라인 자동화·MES 통합 등). 일반 중소기업 평균을 상회하는 노하우 자산입니다.`);
  }
  if (automationCases >= 3) {
    strengths.push(`프로세스 자동화 사례가 ${automationCases}건 — 출고(박이건)·MES(김태완)·노션 리마인더(이수원)·원격접속(안성준)·정부과제(홍재옥)로 자동화 노하우가 다층적으로 형성되어 있습니다.`);
  }
  if (championCount > 0) {
    strengths.push(`멀티 에이전트 오케스트레이션 단계까지 진입한 챔피언 ${championCount}명 (${champions.join(', ')}) — 사내 모범 사례로 활용 가능합니다.`);
  }
  if (tierCounts.max > 0) {
    strengths.push(`이미 ${tierCounts.max}명의 헤비 사용자가 진단으로 식별 — 사내 AI 노하우 자산이 형성되어 있습니다.`);
  }
  if (multiToolUsers >= total * 0.4) {
    strengths.push(`응답자의 ${Math.round((multiToolUsers / total) * 100)}%가 2개 이상 AI 도구를 병행 사용 중 — 도구 활용 폭이 넓습니다.`);
  }
  if (gap <= 20 && teams.length >= 3) {
    strengths.push(`팀 간 활용도 격차가 ${gap}점 이내로 균형잡힌 분포를 보이고 있습니다.`);
  }
  if (topTeam.avg >= 70) {
    strengths.push(`${topTeam.name}이 ${topTeam.avg}점으로 사내 AI 활용 모범 사례 후보입니다.`);
  }
  if (strengths.length === 0) {
    strengths.push('아직 명확한 강점은 형성 단계 — 첫 6개월 도입 결과로 강점을 만들어갈 시점입니다.');
  }

  // ---------- 약점·리스크 ----------
  const weaknesses = [];
  if (gap >= 30) {
    weaknesses.push(`${topTeam.name}(${topTeam.avg}점)과 ${bottomTeam.name}(${bottomTeam.avg}점)의 격차가 ${gap}점으로 큽니다. 사내 활용 격차가 생산성 격차로 이어질 수 있습니다.`);
  }
  if (limitN >= total * 0.3) {
    weaknesses.push(`${limitN}명(${Math.round((limitN / total) * 100)}%)이 한도 부족을 호소 — 회사 차원 Pro 지원 공백이 명확합니다.`);
  }
  if (highBurden > 0) {
    weaknesses.push(`${highBurden}명이 월 10만원 이상을 자비로 부담 중 — 핵심 사용자에 대한 회사 지원이 시급합니다.`);
  } else if (personalN >= total * 0.3) {
    weaknesses.push(`개인 결제 응답자가 ${personalN}명(${Math.round((personalN / total) * 100)}%)에 달합니다 — 회사 차원 도구 정책이 부재한 신호입니다.`);
  }
  if (lowNeedN >= total * 0.4) {
    weaknesses.push(`AI 도입 미체감 응답자가 ${lowNeedN}명(${Math.round((lowNeedN / total) * 100)}%) — 도입 의지·교육 격차 해소가 필요합니다.`);
  }
  if (trainingN >= 3) {
    weaknesses.push(`${trainingN}명이 심화 교육 니즈를 표명 — 도구만 주는 것 외 활용법 교육 인프라 필요.`);
  }

  // ---------- 단기 액션 (1개월 내) ----------
  const shortTerm = [];
  if (tierCounts.max > 0) {
    shortTerm.push(`핵심 헤비 사용자 ${tierCounts.max}명에게 Claude Max(또는 Pro+조합) 우선 지원 — 즉시 도입.`);
  }
  if (limitN > 0) {
    shortTerm.push(`한도 부족 응답자 ${limitN}명에 Pro 라이선스 지급 — 개인별 ${(20 * KRW_RATE).toLocaleString('ko-KR')}원/월.`);
  }
  if (highBurden > 0) {
    shortTerm.push(`자비 월 10만원+ 부담자 ${highBurden}명 명단 확보 → 전액 회사 지원 전환.`);
  }
  if (lowNeedN >= 3 || trainingN >= 3) {
    shortTerm.push('전사 1시간 AI 활용 입문 워크숍 1회 개최 — 무료 도구 위주, 실무 사례 중심.');
  }
  if (shortTerm.length === 0) {
    shortTerm.push('현재 큰 결손은 없음 — 응답 누적 후 분기 단위로 재점검 권장.');
  }

  // ---------- 중기 액션 (3~6개월) ----------
  const midTerm = [];
  if (topTeam.avg >= 65) {
    midTerm.push(`${topTeam.name}을 'AI 챔피언 팀'으로 지정 → 분기 1회 노하우 공유 세션 운영.`);
  }
  // 사내 사례 활용 권고
  if (championCount > 0) {
    midTerm.push(`잔디 채널 챔피언(${champions.slice(0, 3).join(' / ')})의 사례를 사내 표준 매뉴얼로 정리 → 신규 도입 팀 가이드로 활용.`);
  }
  if (automationCases >= 3) {
    midTerm.push('박이건의 출고 자동화 + 김태완의 MES 통합 + 이수원의 노션 리마인더를 묶어 "글룩 업무 자동화 표준 패턴" 사내 가이드 발행.');
  }
  if (INTERNAL_CASES.some((c) => c.themes.includes('automation') && c.tools.some((t) => /agent|langgraph/i.test(t)))) {
    midTerm.push('홍재옥 대표의 정부과제 멀티 에이전트 시스템을 사내 SaaS화 검토 — 다른 정부지원사업·제안서 작성에도 재활용 가능.');
  }
  if (gap >= 25) {
    midTerm.push(`하위 팀 대상 맞춤 교육 — ${bottomTeam.name}부터 시작.`);
  }
  midTerm.push('사내 AI 활용 가이드라인 수립 — 보안·저작권·고객 데이터 처리 기준 명시.');
  midTerm.push('분기별 재진단 (이 설문 다시 돌리기) — 도입 효과 정량 측정.');
  if (tierCounts.max > 0 || limitN >= 5) {
    midTerm.push('1개월 단위 Pro/Max 사용량 리뷰 — 다운그레이드/업그레이드 후보 선별.');
  }

  // ---------- 예산 권고 ----------
  const budget = total > 0
    ? `1차 도입 예산은 연 약 ${yearlyKRW.toLocaleString('ko-KR')}원이 적정선입니다. 핵심 헤비 사용자(Max)부터 시작 → 한도 부족자(Pro) 확대 → 일반 사용자 점진적 흡수 순서로 진행하면 시행착오를 최소화할 수 있습니다. 환율(${KRW_RATE.toLocaleString('ko-KR')}원·Max 평균 $${TIER_USD.max}) 변동 시 재산정 필요.`
    : '응답 누적 후 산정 가능합니다.';

  // ---------- 노하우 자산화 · 계정·토큰 운영 ----------
  const accountOps = [];
  // 계정 관리
  if (personalN + mixedN >= total * 0.3) {
    accountOps.push({
      label: '회사 계정 일원화',
      body: `현재 자비 부담 비율이 ${Math.round(((personalN + mixedN) / total) * 100)}%로 분산되어 있습니다. 회사 명의 통합 계정으로 전환하면 (1) Team Plan 단가 절감 (2) 퇴사자 데이터 회수 가능 (3) 보안·감사 추적 가능 — 3가지 이점이 한 번에 확보됩니다.`,
    });
  }
  if (tierCounts.pro + tierCounts.max >= 5) {
    accountOps.push({
      label: 'Team Plan 활용',
      body: `Pro·Max 라이선스가 5개 이상이면 Claude Team($25/seat·5명+ 시작) 또는 ChatGPT Team($25/seat·2명+ 시작) 같은 팀 플랜이 개별 결제 대비 관리·보안·공유 측면에서 유리합니다. 5명 이상 단위로 묶어 일괄 가입 권장.`,
    });
  } else {
    accountOps.push({
      label: '계정 발급·회수 SOP 수립',
      body: '입사 시 즉시 발급, 퇴사 시 즉시 회수하는 표준 절차를 경영지원팀이 보유하면 라이선스 누수와 데이터 유출 리스크를 동시에 줄일 수 있습니다.',
    });
  }

  // 토큰·한도 관리
  if (tierCounts.max > 0 || limitN > 0) {
    accountOps.push({
      label: '한도 모니터링 정례화',
      body: `Pro/Max 라이선스는 도입 후 1개월 단위로 실제 사용량을 점검해야 ROI가 보장됩니다. 한도의 30% 미만 사용 → Pro 다운그레이드 / 한도 90%+ 자주 도달 → Max 업그레이드 식으로 분기별 재배치하면 예산을 ${Math.round(yearlyKRW * 0.15).toLocaleString('ko-KR')}원(약 15%)까지 절감 가능합니다.`,
    });
  }
  accountOps.push({
    label: '토큰 효율 프롬프트 가이드',
    body: '같은 결과를 더 적은 토큰으로 — (1) 시스템 프롬프트 재사용 (2) 긴 문서는 한 번에 한 가지만 묻기 (3) "간결하게" 명시 — 3가지 원칙만 사내에 공유해도 헤비 사용자의 한도 도달 빈도가 30% 이상 줄어듭니다.',
  });

  // 노하우 자산화 — 잔디 채널 이미 운영 중이면 그것 강조
  if (caseCount > 0) {
    accountOps.push({
      label: '잔디 「AI 활용 연구소」 채널 공식화',
      body: `이미 ${caseCount}명의 활용 사례가 잔디 채널에 누적되고 있습니다. 한 단계 더 나아가 (1) 분기별 챔피언 시상 (2) 사례별 재현 가능한 프롬프트·코드 첨부 의무화 (3) 신입 온보딩 필독 자료로 지정 — 이렇게만 해도 채널이 살아있는 사내 자산이 됩니다.`,
    });
  } else {
    accountOps.push({
      label: '프롬프트·GPTs 공용 풀 운영',
      body: '잘 쓴 프롬프트, 자주 쓰는 GPTs, Claude Projects 템플릿을 사내 Notion·Slack 채널에 모으세요. 한 번 잘 만든 자산이 100명에게 복제되는 효과 — 이게 글룩의 진짜 AI 노하우 자산이 됩니다.',
    });
  }
  if (topTeam.avg >= 60) {
    accountOps.push({
      label: 'AI 챔피언 제도',
      body: `${topTeam.name} 같은 활용도 높은 팀에서 1~2명을 'AI 챔피언'으로 지정 → 월 1회 1시간 사내 데모 세션 운영. 챔피언에게는 Max 라이선스 + 약간의 인센티브(상품권·뱃지)를 제공하면 자발적 활성화가 일어납니다.`,
    });
  }
  if (trainingN >= 3 || avgScore < 50) {
    accountOps.push({
      label: '신입 온보딩에 AI 모듈 추가',
      body: '입사 첫 주에 1시간 AI 활용 입문 세션을 정규 온보딩에 포함하세요. 이후 합류한 인원은 자동으로 사내 평균 활용도 위에서 시작 — 격차 누적을 원천 차단할 수 있습니다.',
    });
  }
  accountOps.push({
    label: '분기별 재진단 → 데이터 누적',
    body: '이 진단을 분기마다 같은 형식으로 돌리면 점수·도구·예산이 시계열 데이터로 쌓입니다. 6~12개월 후엔 "어떤 교육이 점수를 몇 점 올렸는지" 정량 측정이 가능해집니다.',
  });

  // ---------- 마무리 ----------
  const caseAddendum = caseCount > 0
    ? ` 특히 잔디 채널의 ${caseCount}개 사례를 보면 글룩은 도구 단순 도입을 넘어 멀티 에이전트·풀 파이프라인 자동화 단계까지 진입한 드문 조직입니다 — 이 자산을 체계화하면 동종업계 대비 2~3년의 도입 격차가 만들어집니다.`
    : '';

  const closing = (stage === 'mature'
    ? '이미 글룩은 AI를 잘 다루는 조직입니다. 이제는 도구 도입을 넘어 AI를 활용한 새로운 업무 방식을 설계할 시점입니다. 임직원분들의 적극적인 참여에 다시 한 번 감사드립니다.'
    : stage === 'stable' || stage === 'spreading'
    ? '글룩은 AI 활용에서 좋은 출발점에 있습니다. 핵심 사용자 우선 지원 + 전사 교육 두 축을 병행하면 6개월 내 활용도 평균 15~20점 상승이 기대됩니다. 임직원분들의 정직한 답변 덕분에 명확한 액션 플랜을 세울 수 있게 되었습니다.'
    : '도입 초기는 가장 중요한 시기입니다. 무리한 일괄 도입보다는 핵심 사용자 1~3명에게 시범 도입 → 사내 사례 만들기 → 점진적 확산 순서가 가장 안전하고 효과적입니다. 글룩의 첫 AI 도입 여정에 함께할 수 있어 영광입니다.'
  ) + caseAddendum;

  return { headline, stage, strengths, weaknesses, shortTerm, midTerm, budget, accountOps, closing, avgScore };
}

function teamGrade(avg) {
  if (avg >= 80) return { label: 'AI 선도 팀', color: 'text-purple-700 bg-purple-50 border-purple-200',
    comment: '팀원들이 AI를 깊이 있게 활용하고 있는 최상위 팀입니다. Max·고급 도구 도입으로 성과를 한 단계 더 끌어올릴 수 있는 시점이며, 다른 팀에 노하우를 전파하는 사내 워크숍을 권장합니다.' };
  if (avg >= 65) return { label: '활발한 활용 팀', color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    comment: 'AI를 능숙하게 다루는 팀으로, Pro 티어 일괄 도입 시 생산성 시너지가 즉시 나타날 것으로 예상됩니다.' };
  if (avg >= 50) return { label: '안정 사용 팀', color: 'text-blue-700 bg-blue-50 border-blue-200',
    comment: 'AI 활용이 안정화된 팀입니다. 일부 헤비 사용자에게 Pro 우선 도입 → 효과 검증 후 확대가 안전합니다.' };
  if (avg >= 35) return { label: '성장 중인 팀', color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    comment: '맞춤 교육과 활용 사례 공유로 활용 영역을 넓힐 수 있는 여지가 큽니다. 무료 도구 활용 가이드부터 시작해보세요.' };
  if (avg >= 20) return { label: '탐색 단계 팀', color: 'text-amber-700 bg-amber-50 border-amber-200',
    comment: 'AI를 일부 시도해보는 단계입니다. 사내 무료 도구 활용 워크숍 1회로 활용도가 빠르게 올라갈 수 있는 팀입니다.' };
  return { label: '도입 검토 팀', color: 'text-slate-700 bg-slate-50 border-slate-200',
    comment: 'AI 활용이 아직 저조한 팀입니다. 무료 버전 + 입문 교육 1회 → 1~2명 시범 도입 → 점진적 확산 순서를 추천합니다.' };
}

const Q1_LABEL = {
  coding: '코딩 및 개발', writing: '문서 작성', general: '일상 사용',
  image: '이미지 생성', research: '학술 연구',
  communication: '커뮤니케이션·CS', planning: '기획·전략', analysis: '데이터 분석',
  meeting: '회의록 정리', other: '기타',
};
const Q4_LABEL = { limit: '한도 부족', quality: '품질 부족', context: '긴 자료 처리', training: '교육·학습 니즈', none: '부족함 없음', never: '미사용' };
const Q4LIMIT_LABEL = {
  mild: '가끔 답답',
  moderate: '주 단위 도달',
  severe: '매일 도달 (심각)',
  critical: '여러 계정 돌려쓰는 중',
};

// 티어별 비용 (USD/월)
// AI 도구 가격표 (USD/월) — 2026년 4월 기준
// Claude Max: 5x Pro($100) ~ 20x Pro($200) — 헤비 사용자 추천이라 평균 $150로 추산
// ChatGPT Plus / Claude Pro / Gemini Advanced / Perplexity Pro / Cursor Pro / Copilot Pro: 모두 $20
// MS Copilot for M365: $30 / Runway Standard $15 / Sora는 ChatGPT Plus 포함
const TIER_USD = { free: 0, pro: 20, max: 150 };
const KRW_RATE = 1450;  // 2026년 4월 기준 환율 — 변경 시 1곳만 고치면 전체 반영

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

  // 1. 전사 활용 단계 (점수 분포 6단계와 일관된 기준)
  let stage;
  if (avgScore >= 75) stage = 'AI 성숙 단계';
  else if (avgScore >= 60) stage = '안정 활용 단계';
  else if (avgScore >= 45) stage = '확산 단계';
  else if (avgScore >= 30) stage = '도입 확장 단계';
  else stage = '도입 초기 단계';
  insights.push({
    icon: '📊',
    title: `전사 AI 활용 단계: ${stage} (평균 ${avgScore}점)`,
    body: avgScore >= 50
      ? '유료 도구 도입 효과가 명확히 나타날 시점입니다. 헤비 사용자 중심 우선 도입 → 일반 사용자 확산 순서로 진행하면 ROI가 좋습니다.'
      : '전사 평균 활용도가 아직 높지 않으므로, 무료 도구 활성화와 사내 교육에 우선 투자하는 것이 효율적입니다. 일부 헤비 사용자만 Pro 도입을 검토하세요.',
  });

  // 2. 한도 부족 응답자 — 명단 포함
  const limitMembers = data.filter((d) => toArr(d.q4).includes('limit'));
  if (limitMembers.length > 0) {
    const pct = Math.round((limitMembers.length / total) * 100);
    const monthlyKRW = limitMembers.length * 20 * KRW_RATE;
    insights.push({
      icon: pct >= 30 ? '⚠️' : '📈',
      title: `한도 부족 응답자 ${limitMembers.length}명 (${pct}%)`,
      body: pct >= 30
        ? `전체의 ${pct}%가 무료 한도 부족을 호소합니다. 이들에게 Pro 티어 일괄 지원이 가장 ROI 높은 투자입니다. 예상 비용: 월 약 ${monthlyKRW.toLocaleString('ko-KR')}원.`
        : `한도 부족 호소가 ${pct}%로 아직 부담이 크지 않습니다. 해당 인원만 선별적으로 Pro를 지원하는 게 가장 효율적입니다.`,
      members: limitMembers.map((d) => ({
        name: d.name, team: d.team, role: d.role,
        detail: d.q4Limit ? Q4LIMIT_LABEL[d.q4Limit] || d.q4Limit : '강도 미응답',
        intense: d.q4Limit === 'severe' || d.q4Limit === 'critical',
      })),
    });
  }

  // 3. 핵심 헤비 사용자 (Max 추천) — 명단 포함
  const maxMembers = data.filter((d) => d.tier === 'max');
  if (maxMembers.length > 0) {
    const monthlyKRW = maxMembers.length * TIER_USD.max * KRW_RATE;
    insights.push({
      icon: '👑',
      title: `핵심 헤비 사용자 ${maxMembers.length}명 식별`,
      body: `Max 티어를 본전 뽑을 헤비 사용자로 진단됐습니다. 이들의 생산성이 회사 전체에 큰 영향을 주므로 우선 지원하세요. 예상 비용: 월 약 ${monthlyKRW.toLocaleString('ko-KR')}원. 도입 후 실제 사용량을 보고 1개월 단위로 Pro 다운그레이드 여부 검토 권장.`,
      members: maxMembers.map((d) => ({
        name: d.name, team: d.team, role: d.role,
        detail: d.ai || '추천 미상',
        intense: true,
      })),
    });
  }

  // 4. 유료 불필요 응답자 — 명단 포함
  const lowNeed = data.filter((d) => {
    const arr = toArr(d.q4);
    return arr.includes('never') || (arr.includes('none') && arr.length === 1);
  });
  if (lowNeed.length > 0) {
    const pct = Math.round((lowNeed.length / total) * 100);
    insights.push({
      icon: '🌱',
      title: `유료 불필요 응답자 ${lowNeed.length}명 (${pct}%)`,
      body: `${neverCount}명이 미사용, ${noneCount}명이 무료로 충분하다고 답했습니다. 이들에게는 유료 도구 강제 도입보다 무료 도구 활용 교육 1회가 더 효과적입니다.`,
      members: lowNeed.map((d) => {
        const arr = toArr(d.q4);
        const reason = arr.includes('never') ? '아직 미사용' : '무료로 충분';
        return { name: d.name, team: d.team, role: d.role, detail: reason, intense: false };
      }),
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
  const monthlyUSD = tierCounts.pro * TIER_USD.pro + tierCounts.max * TIER_USD.max;
  insights.push({
    icon: '💰',
    title: `전사 권장 예산: 연 약 ${(monthlyUSD * 12 * KRW_RATE).toLocaleString('ko-KR')}원`,
    body: `Pro ${tierCounts.pro}명 + Max ${tierCounts.max}명 + 무료 ${tierCounts.free}명 기준, 월 약 ${(monthlyUSD * KRW_RATE).toLocaleString('ko-KR')}원이 적정 예산입니다. (환율 ${KRW_RATE.toLocaleString('ko-KR')}원·Pro $${TIER_USD.pro}·Max 평균 $${TIER_USD.max} 가정) 1차 도입 → 1개월 모니터링 → 조정 순서로 진행하면 시행착오를 줄일 수 있습니다.`,
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

  // Q5 월 본인 부담 금액 분포 (개인/혼합 응답자만)
  const amountMap = {};
  const burdeners = data.filter((d) => d.q5Payment === 'personal' || d.q5Payment === 'mixed');
  burdeners.forEach((d) => {
    const k = d.q5PaymentAmount || 'unknown';
    amountMap[k] = (amountMap[k] || 0) + 1;
  });
  // 대략 추정 월 합계 (범위 중간값으로)
  const AMOUNT_MID = { under10k: 5000, '10to30k': 20000, '30to50k': 40000, '50to100k': 75000, '100to200k': 150000, over200k: 250000 };
  const estimatedPersonalMonthly = burdeners.reduce((s, d) => s + (AMOUNT_MID[d.q5PaymentAmount] || 0), 0);

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

  // 데이터 진단 — 각 필드 수집률 체크 (0명이면 Apps Script 구버전)
  const fieldCoverage = {
    q4Limit: data.filter((d) => d.q4Limit).length,
    q5Payment: data.filter((d) => d.q5Payment).length,
    q5PaymentAmount: data.filter((d) => d.q5PaymentAmount).length,
    q6: data.filter((d) => d.q6).length,
    q7: data.filter((d) => d.q7).length,
  };
  const missingFields = Object.entries(fieldCoverage).filter(([_, v]) => v === 0).map(([k]) => k);
  const FIELD_LABEL = {
    q4Limit: 'Q4 한도수준', q5Payment: 'Q5 결제방식',
    q5PaymentAmount: 'Q5 개인월비용', q6: 'Q6 주관식 고민', q7: 'Q7 정책 의견',
  };

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
        {/* 데이터 진단 — 필드 수집률 상시 표시 */}
        {missingFields.length > 0 && (
          <div className="rounded-2xl bg-rose-50 border-2 border-rose-300 p-5 shadow-sm no-print">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-900 mb-1">
                  ⚠️ 시트에 저장되지 않는 필드가 있습니다
                </h3>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  아래 필드들이 전부 비어있어요. Apps Script가 최신 버전이 아니거나 시트 헤더 수가 안 맞는 경우입니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {Object.entries(fieldCoverage).map(([k, v]) => {
                const bad = v === 0;
                return (
                  <div key={k} className={`px-3 py-2 rounded-lg border text-xs ${bad ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <div className="font-semibold mb-0.5">{bad ? '❌' : '✓'} {FIELD_LABEL[k]}</div>
                    <div className="text-[10px] opacity-80">{v}/{total}명 응답</div>
                  </div>
                );
              })}
            </div>

            <details className="text-xs text-rose-900">
              <summary className="cursor-pointer font-semibold hover:underline">해결 방법 펼치기 ▾</summary>
              <ol className="mt-3 space-y-2 pl-4 list-decimal leading-relaxed">
                <li>
                  <b>구글 시트</b> 열기 → 1행이 <b>19개 컬럼</b>인지 확인:
                  <div className="mt-1 p-2 bg-white rounded border border-rose-200 font-mono text-[10px] break-all">
                    제출시간 | 이름 | 소속팀 | 직책 | Q1_용도 | Q2_분량 | Q3_빈도 | Q4_불편 | Q4_한도수준 | Q5_현재AI | Q5_결제 | Q5_개인월비용 | Q6_주관식 | Q7_정책의견 | 추천AI | 추천티어 | 예상절약액 | 활용도점수 | 활용도등급
                  </div>
                </li>
                <li><b>확장 프로그램 → Apps Script</b> 열기 → 기존 코드 전체 지우고 README의 최신 코드로 교체 → 저장(Ctrl+S)</li>
                <li><b>배포 → 배포 관리</b> → 현재 배포 ✏️ 연필 → 버전: <b>새 버전</b> → 배포</li>
                <li>이 페이지 우상단 <b>새로고침</b> 버튼 클릭 → 새 응답 한 건 직접 테스트</li>
              </ol>
              <p className="mt-3 text-[10px] opacity-70">
                ⓘ 이미 쌓인 구버전 응답 행은 새 컬럼이 비어 있어 정상입니다. 새 응답부터 반영됩니다.
              </p>
            </details>
          </div>
        )}


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

                {ins.members && ins.members.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors select-none">
                      <span className="inline-block transition-transform group-open:rotate-90">▸</span>
                      인원 {ins.members.length}명 보기
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      {ins.members.map((m, mi) => (
                        <div
                          key={mi}
                          className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
                            m.intense ? 'bg-rose-50' : 'bg-slate-50'
                          }`}
                        >
                          <span className="font-semibold text-slate-900 min-w-0">
                            {m.name}{m.role && <span className="font-normal text-slate-500 ml-0.5">{m.role}</span>}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{m.team}</span>
                          {m.detail && (
                            <>
                              <span className="text-slate-300 ml-auto pl-2">·</span>
                              <span className={m.intense ? 'text-rose-700 font-medium' : 'text-slate-500'}>
                                {m.detail}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
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
              <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />Max {tierCounts.max}명 · 월 {(tierCounts.max * TIER_USD.max * KRW_RATE).toLocaleString('ko-KR')}원</div>
              <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />Pro {tierCounts.pro}명 · 월 {(tierCounts.pro * TIER_USD.pro * KRW_RATE).toLocaleString('ko-KR')}원</div>
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

        <Section title="권장 예산 시뮬레이터" icon={<TrendingUp size={20} />}>
          <BudgetSimulator data={data} />
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
              ⚠️ 삭제 시 구글 시트 행도 함께 영구 삭제됩니다. 되돌릴 수 없으니 신중히 진행해주세요.
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
          <PaymentDistribution
            data={data} paymentMap={paymentMap} total={total} byTeam={byTeam} teams={teams}
            amountMap={amountMap} burdenersCount={burdeners.length}
            estimatedPersonalMonthly={estimatedPersonalMonthly}
          />
        </Section>

        <Section title="주관식 답변 모아보기 (Q6 · 고민)" icon={<FileText size={20} />}>
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

        <Section title="회사 AI 정책 의견 (Q7)" icon={<FileText size={20} />}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
            {data.filter((d) => (d.q7 || '').trim().length > 0).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">아직 남겨진 의견이 없습니다.</p>
            ) : (
              <div className="space-y-6">
                {teams.map((t) => {
                  const withOpinion = byTeam[t].filter((m) => (m.q7 || '').trim().length > 0);
                  if (withOpinion.length === 0) return null;
                  return (
                    <div key={t}>
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        {t}<span className="text-xs font-normal text-slate-500">({withOpinion.length}명 의견)</span>
                      </h3>
                      <div className="space-y-3">
                        {withOpinion.map((m, i) => (
                          <div key={i} className="border-l-4 border-indigo-200 bg-indigo-50/30 pl-4 pr-3 py-2 rounded-r-lg">
                            <div className="text-xs text-slate-500 mb-1">
                              <b className="text-slate-700">{m.name}</b>{m.role ? ` · ${m.role}` : ''}
                            </div>
                            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{m.q7}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              💡 반복적으로 언급되는 요청은 공식 AI 정책 문서에 반영할 후보입니다.
            </div>
          </div>
        </Section>

        {/* 사내 AI 활용 사례 — 잔디 채널 정리 */}
        <Section title="🌟 글룩 사내 AI 활용 사례" icon={<Sparkles size={20} />}>
          <InternalCasesSection />
        </Section>

        {/* AI 컨설턴트 총평 — 보고서 마무리 카드 (사례 분석 자동 반영) */}
        <FinalAssessmentCard
          assessment={generateFinalAssessment(data, byTeam, q4Map, tierCounts, paymentMap, amountMap)}
        />
      </div>
    </div>
  );
}

// ============================================================
// 권장 예산 시뮬레이터 — 추천 결과를 디폴트로, 슬라이더로 실시간 조정
// ============================================================
const SIM_TOOLS = [
  { key: 'claude_max', name: 'Claude Max',     usd: 150, color: 'bg-purple-500',  ring: 'accent-purple-500',  desc: '헤비 사용자 대상 · Pro의 5~20배 한도' },
  { key: 'claude_pro', name: 'Claude Pro',     usd: 20,  color: 'bg-orange-500',  ring: 'accent-orange-500',  desc: '추론·코딩·긴 문서 강점' },
  { key: 'chatgpt',    name: 'ChatGPT Plus',   usd: 20,  color: 'bg-emerald-500', ring: 'accent-emerald-500', desc: 'GPT-5·DALL-E·GPTs 통합' },
  { key: 'gemini',     name: 'Gemini Advanced',usd: 20,  color: 'bg-blue-500',    ring: 'accent-blue-500',    desc: '2M 컨텍스트·Workspace 연동' },
  { key: 'perplexity', name: 'Perplexity Pro', usd: 20,  color: 'bg-cyan-500',    ring: 'accent-cyan-500',    desc: '리서치·실시간 검색 특화' },
  { key: 'cursor',     name: 'Cursor Pro',     usd: 20,  color: 'bg-slate-700',   ring: 'accent-slate-700',   desc: 'IDE 통합 코딩 전용' },
  { key: 'copilot',    name: 'MS Copilot Pro', usd: 30,  color: 'bg-indigo-500',  ring: 'accent-indigo-500',  desc: 'M365 오피스 통합' },
  { key: 'runway',     name: 'Runway Standard',usd: 15,  color: 'bg-fuchsia-500', ring: 'accent-fuchsia-500', desc: '영상 생성 Gen-3' },
];

function countRecommendations(data) {
  const counts = Object.fromEntries(SIM_TOOLS.map((t) => [t.key, 0]));
  data.forEach((d) => {
    const ai = (d.ai || '').toLowerCase();
    if (ai.includes('claude max')) counts.claude_max++;
    if (ai.includes('claude pro') || /claude(?!\s*(?:max|무료))/i.test(d.ai || '')) {
      // "Claude Pro" 또는 단독 "Claude" (Max/무료 제외)
      if (!ai.includes('max') || ai.includes('claude pro')) {
        if (ai.includes('claude pro')) counts.claude_pro++;
      }
    }
    if (ai.includes('chatgpt plus')) counts.chatgpt++;
    if (ai.includes('gemini advanced')) counts.gemini++;
    if (ai.includes('perplexity pro')) counts.perplexity++;
    if (ai.includes('cursor pro')) counts.cursor++;
    if (ai.includes('copilot')) counts.copilot++;
    if (ai.includes('runway')) counts.runway++;
  });
  return counts;
}

function BudgetSimulator({ data }) {
  const total = data.length;
  const defaults = useMemo(() => countRecommendations(data), [data]);
  const [counts, setCounts] = useState(defaults);

  // data가 바뀌면 디폴트 재반영
  useEffect(() => { setCounts(defaults); }, [defaults]);

  const totalLicenses = SIM_TOOLS.reduce((s, t) => s + (counts[t.key] || 0), 0);
  const monthlyUSD = SIM_TOOLS.reduce((s, t) => s + (counts[t.key] || 0) * t.usd, 0);
  const monthlyKRW = monthlyUSD * KRW_RATE;
  const yearlyKRW = monthlyKRW * 12;

  const baselineUSD = SIM_TOOLS.reduce((s, t) => s + defaults[t.key] * t.usd, 0);
  const diffUSD = monthlyUSD - baselineUSD;
  const diffKRW = diffUSD * KRW_RATE;

  const setTool = (key, val) => setCounts((c) => ({ ...c, [key]: Number(val) }));
  const reset = () => setCounts(defaults);
  const allFree = () => setCounts(Object.fromEntries(SIM_TOOLS.map((t) => [t.key, 0])));

  // 사용 가능한 최대값 (총 응답자 수, 또는 디폴트 + 여유 5)
  const maxFor = (key) => Math.max(total, defaults[key] + 5, 10);

  return (
    <div className="space-y-4">
      {/* 합계 카드 */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="rounded-xl bg-slate-900 text-white p-4">
            <div className="text-xs text-slate-300 mb-1">월 비용</div>
            <div className="text-xl sm:text-2xl font-black tabular-nums">{monthlyKRW.toLocaleString('ko-KR')}원</div>
            <div className="text-[10px] text-slate-400 mt-1">${monthlyUSD.toLocaleString('en-US')}</div>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <div className="text-xs text-slate-500 mb-1">연 비용</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{yearlyKRW.toLocaleString('ko-KR')}원</div>
            <div className="text-[10px] text-slate-400 mt-1">월 × 12</div>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <div className="text-xs text-slate-500 mb-1">총 라이선스</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{totalLicenses}개</div>
            <div className="text-[10px] text-slate-400 mt-1">전체 응답자 {total}명</div>
          </div>
          <div className={`rounded-xl p-4 ${diffUSD === 0 ? 'bg-slate-100' : diffUSD > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="text-xs text-slate-500 mb-1">추천값 대비</div>
            <div className={`text-xl sm:text-2xl font-black tabular-nums ${diffUSD === 0 ? 'text-slate-900' : diffUSD > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {diffUSD > 0 ? '+' : diffUSD < 0 ? '−' : '±'}{Math.abs(diffKRW).toLocaleString('ko-KR')}원
            </div>
            <div className="text-[10px] text-slate-400 mt-1">월 기준</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={reset} className="px-3 py-2 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1">
            <RefreshCw size={12} /> 추천값으로 리셋
          </button>
          <button onClick={allFree} className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            전부 0으로
          </button>
          <div className="ml-auto text-[11px] text-slate-500 self-center">
            환율 {KRW_RATE.toLocaleString('ko-KR')}원 적용 · 슬라이더로 인원 조정
          </div>
        </div>
      </div>

      {/* 슬라이더 그리드 */}
      <div className="grid sm:grid-cols-2 gap-3">
        {SIM_TOOLS.map((t) => {
          const cnt = counts[t.key] || 0;
          const def = defaults[t.key] || 0;
          const max = maxFor(t.key);
          const subtotalKRW = cnt * t.usd * KRW_RATE;
          return (
            <div key={t.key} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${t.color}`} />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{t.desc} · ${t.usd}/월</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xl font-black text-slate-900 tabular-nums leading-none">{cnt}</div>
                  <div className="text-[9px] text-slate-500">명</div>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={max}
                value={cnt}
                onChange={(e) => setTool(t.key, e.target.value)}
                className={`w-full ${t.ring}`}
                style={{ accentColor: t.color.replace('bg-', '').replace('-500', '') }}
              />

              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>0</span>
                <span className={def > 0 ? 'font-semibold text-slate-600' : ''}>추천 {def}명</span>
                <span>{max}</span>
              </div>

              <div className="mt-2 flex justify-between text-[11px]">
                <span className="text-slate-500">월 {subtotalKRW.toLocaleString('ko-KR')}원</span>
                <span className="text-slate-400">연 {(subtotalKRW * 12).toLocaleString('ko-KR')}원</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 leading-relaxed px-1">
        💡 디폴트 슬라이더 값은 응답자들에게 진단 시스템이 추천한 결과를 자동 집계한 것입니다.
        실제 도입 인원을 조정해서 월·연 예산을 시뮬레이션해보세요.
        하나의 추천 문구에 두 도구가 함께 있는 경우(예: "Claude Pro + ChatGPT Plus") 둘 다 1로 카운트됩니다.
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

const AMOUNT_LABEL = {
  under10k: '월 1만원 이하',
  '10to30k': '월 1~3만원',
  '30to50k': '월 3~5만원',
  '50to100k': '월 5~10만원',
  '100to200k': '월 10~20만원',
  over200k: '월 20만원 이상',
  unknown: '미응답',
};

function PaymentDistribution({ data, paymentMap, total, byTeam, teams, amountMap, burdenersCount, estimatedPersonalMonthly }) {
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

      {/* 월 본인 부담 금액 분포 */}
      {burdenersCount > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">월 본인 부담 금액 분포</h3>
              <div className="text-xs text-slate-500 mt-0.5">개인·혼합 결제 응답자 {burdenersCount}명 기준</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">전체 개인 지출 추정</div>
              <div className="text-base font-bold text-rose-700 tabular-nums">월 약 {estimatedPersonalMonthly.toLocaleString('ko-KR')}원</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {['under10k', '10to30k', '30to50k', '50to100k', '100to200k', 'over200k', 'unknown'].filter((k) => amountMap[k]).map((k) => {
              const v = amountMap[k] || 0;
              const pct = burdenersCount ? (v / burdenersCount) * 100 : 0;
              const intense = k === '100to200k' || k === 'over200k';
              return (
                <div key={k} className="flex items-center gap-3 text-xs">
                  <span className="font-medium text-slate-700 w-28">{AMOUNT_LABEL[k] || k}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${intense ? 'bg-rose-600' : 'bg-rose-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-500 tabular-nums w-20 text-right">{v}명 ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            💡 월 10만원 이상 개인 부담 응답자가 있다면 <b>즉시 회사 지원 전환 검토</b>가 필요합니다.
            연 환산하면 <span className="font-semibold text-rose-700 tabular-nums">약 {(estimatedPersonalMonthly * 12).toLocaleString('ko-KR')}원</span>이 개인 주머니에서 나가고 있는 셈입니다.
          </div>
        </div>
      )}

      {/* 개인 부담 명단 — 회사 지원 전환 후보 리스트 */}
      {burdenersCount > 0 && (
        <PersonalBurdenList data={data} />
      )}
    </div>
  );
}

// 개인 부담 응답자 명단 — 누구한테 얼마나 지원해야 하는지 한눈에
function PersonalBurdenList({ data }) {
  const AMOUNT_RANK = { over200k: 6, '100to200k': 5, '50to100k': 4, '30to50k': 3, '10to30k': 2, under10k: 1, unknown: 0 };
  const AMOUNT_MID = { under10k: 5000, '10to30k': 20000, '30to50k': 40000, '50to100k': 75000, '100to200k': 150000, over200k: 250000 };
  const PAY_LABEL = { personal: '전부 개인', mixed: '일부 개인' };
  const PAY_BADGE = {
    personal: 'bg-rose-100 text-rose-800 border-rose-200',
    mixed: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const burdeners = data
    .filter((d) => d.q5Payment === 'personal' || d.q5Payment === 'mixed')
    .sort((a, b) => (AMOUNT_RANK[b.q5PaymentAmount] || 0) - (AMOUNT_RANK[a.q5PaymentAmount] || 0));

  if (burdeners.length === 0) return null;

  // 도구별 그룹핑 (어떤 도구를 자비로 쓰는지 한눈에 보려고)
  const totalEstMonthly = burdeners.reduce((s, d) => s + (AMOUNT_MID[d.q5PaymentAmount] || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 print-card shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">🙋 개인 부담 응답자 명단</h3>
          <div className="text-xs text-slate-500 mt-0.5">회사 지원 전환 우선순위 후보</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">합계</div>
          <div className="text-base font-bold text-rose-700 tabular-nums">
            {burdeners.length}명 · 월 약 {totalEstMonthly.toLocaleString('ko-KR')}원
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-slate-700">이름</th>
              <th className="text-left px-3 py-2.5 font-semibold text-slate-700">소속</th>
              <th className="text-left px-3 py-2.5 font-semibold text-slate-700">결제</th>
              <th className="text-left px-3 py-2.5 font-semibold text-slate-700">월 부담액</th>
              <th className="text-left px-3 py-2.5 font-semibold text-slate-700">사용 중 도구</th>
            </tr>
          </thead>
          <tbody>
            {burdeners.map((d, i) => {
              const intense = d.q5PaymentAmount === '100to200k' || d.q5PaymentAmount === 'over200k';
              const amountLabel = AMOUNT_LABEL[d.q5PaymentAmount] || '미응답';
              return (
                <tr key={d._id || i} className={`border-b border-slate-100 hover:bg-slate-50 ${intense ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    {intense && '⚠️ '}{d.name}
                    {d.role && <span className="text-xs text-slate-500 font-normal ml-1">{d.role}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{d.team}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${PAY_BADGE[d.q5Payment] || ''}`}>
                      {PAY_LABEL[d.q5Payment] || d.q5Payment}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 font-semibold tabular-nums ${intense ? 'text-rose-700' : 'text-slate-700'}`}>
                    {amountLabel}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[260px] truncate" title={d.q5}>
                    {d.q5 || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
        💡 ⚠️ 표시된 분들은 <b>월 10만원 이상</b> 자비로 부담 중입니다 — 우선 회사 지원 전환을 검토해주세요.
        "일부 개인" 응답자는 자비 부담분만 회사 결제로 전환하는 것이 가장 효율적입니다.
      </div>
    </div>
  );
}

// ============================================================
// 사내 AI 활용 사례 섹션 (잔디 채널 기반)
// ============================================================
function InternalCasesSection() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all'
    ? INTERNAL_CASES
    : INTERNAL_CASES.filter((c) => c.themes.includes(filter));

  // 테마별 카운트
  const themeCount = (key) =>
    key === 'all' ? INTERNAL_CASES.length : INTERNAL_CASES.filter((c) => c.themes.includes(key)).length;

  // 도구별 활용자 수
  const toolUsage = {};
  INTERNAL_CASES.forEach((c) => c.tools.forEach((t) => { toolUsage[t] = (toolUsage[t] || 0) + 1; }));
  const topTools = Object.entries(toolUsage).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* 헤더 정보 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 print-card shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">출처: 잔디 「AI 활용 연구소 / 글룩 내부 사례 중심」 토픽</div>
            <div className="text-xs text-slate-400">2026.04.17 개설 · 개설자: 홍재옥 대표 · 자유롭게 잘된 사례·시행착오·아이디어 공유</div>
          </div>
          <div className="flex gap-3 text-center">
            <div className="px-3 py-1.5 rounded-lg bg-slate-100">
              <div className="text-xl font-black text-slate-900 tabular-nums leading-none">{INTERNAL_CASES.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">활용자</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-100">
              <div className="text-xl font-black text-slate-900 tabular-nums leading-none">{INTERNAL_THEMES.length - 1}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">활용 축</div>
            </div>
          </div>
        </div>

        {/* 테마 필터 */}
        <div className="flex flex-wrap gap-2">
          {INTERNAL_THEMES.map((t) => {
            const sel = filter === t.key;
            const cnt = themeCount(t.key);
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${sel ? t.ring : t.idle + ' bg-white'}`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <span className={`tabular-nums ${sel ? 'opacity-90' : 'opacity-60'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 사례 카드 그리드 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => <CaseCard key={c.name + i} c={c} />)}
      </div>

      {/* 도구 빈도 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 print-card shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">🧰 사내 활용 도구 TOP 6</h3>
        <div className="flex flex-wrap gap-2">
          {topTools.map(([t, n]) => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-900">{t}</span>
              <span className="text-slate-500 tabular-nums">{n}명</span>
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          💡 도구 단순 도입을 넘어 <b>멀티 에이전트 오케스트레이션·풀 파이프라인 자동화</b> 단계까지 진입한 사례가 있어, 글룩의 AI 활용 성숙도는 일반 중소기업 평균보다 한 단계 위에 있습니다.
        </p>
      </div>
    </div>
  );
}

function CaseCard({ c }) {
  const themeMeta = (k) => INTERNAL_THEMES.find((t) => t.key === k);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 print-card shadow-sm flex flex-col">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0">
          <div className="font-bold text-slate-900 leading-tight">
            {c.name} <span className="text-xs font-normal text-slate-500">{c.role}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {c.team}{c.note && <span className="ml-1 italic">· {c.note}</span>}
          </div>
        </div>
        {c.champion && (
          <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200">
            챔피언
          </span>
        )}
      </div>

      {/* 테마 도트 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {c.themes.map((tk) => {
          const m = themeMeta(tk);
          if (!m) return null;
          return (
            <span key={tk} className="inline-flex items-center gap-1 text-[10px] text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
              {m.label}
            </span>
          );
        })}
      </div>

      {/* 요약 */}
      <p className="text-sm text-slate-700 leading-relaxed mb-3 font-medium">{c.summary}</p>

      {/* 도구 칩 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {c.tools.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-mono">{t}</span>
        ))}
      </div>

      {c.champion && (
        <div className="text-xs text-amber-700 font-semibold mb-2">{c.champion}</div>
      )}

      {/* 자세히 펼치기 */}
      <details className="mt-auto group">
        <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors select-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span>
          자세히 보기
        </summary>
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
          {c.details.map((d, di) => (
            <div key={di}>
              <div className="text-xs font-bold text-slate-800 mb-0.5">{d.title}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{d.body}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// 보고서 마지막 — AI 컨설턴트 총평 카드
function FinalAssessmentCard({ assessment }) {
  if (!assessment) return null;
  const { headline, strengths, weaknesses, shortTerm, midTerm, budget, accountOps, closing, avgScore } = assessment;

  return (
    <section className="print-break">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl overflow-hidden print-card border border-slate-700">
        {/* 헤더 */}
        <div className="px-6 sm:px-10 py-8 border-b border-white/10 bg-gradient-to-br from-indigo-900/40 via-transparent to-purple-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-300 uppercase">Final Assessment</span>
            <span className="text-xs text-slate-400">· AI 컨설턴트 총평</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black leading-snug mb-3">
            {headline}
          </h2>
          <div className="flex items-baseline gap-2 text-sm text-slate-300">
            <span>전사 평균 활용도</span>
            <span className="text-2xl font-black text-white tabular-nums">{avgScore}</span>
            <span className="text-slate-400">/ 100점</span>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 sm:px-10 py-8 space-y-7">
          {/* 강점 */}
          <AssessSection icon="✅" title="강점" color="text-emerald-300">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                <span className="text-emerald-400 shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </AssessSection>

          {/* 약점·리스크 */}
          {weaknesses.length > 0 && (
            <AssessSection icon="⚠️" title="약점·리스크" color="text-rose-300">
              {weaknesses.map((s, i) => (
                <li key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                  <span className="text-rose-400 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </AssessSection>
          )}

          {/* 단기 액션 */}
          <AssessSection icon="⚡" title="단기 액션 (1개월 내)" color="text-amber-300">
            {shortTerm.map((s, i) => (
              <li key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                <span className="text-amber-400 shrink-0 font-bold">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </AssessSection>

          {/* 중기 액션 */}
          <AssessSection icon="🎯" title="중기 액션 (3~6개월)" color="text-blue-300">
            {midTerm.map((s, i) => (
              <li key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
                <span className="text-blue-400 shrink-0 font-bold">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </AssessSection>

          {/* 예산 권고 */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">예산 권고</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{budget}</p>
          </div>

          {/* 노하우 자산화 · 계정/토큰 운영 */}
          {accountOps && accountOps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔐</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  계정·토큰 운영 + 노하우 자산화
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 italic">
                도구만 도입한다고 노하우가 쌓이지 않습니다. 계정·토큰·자산을 함께 설계해야 6개월 뒤 글룩에 진짜 AI 자산이 남습니다.
              </p>
              <div className="space-y-3">
                {accountOps.map((op, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-cyan-500/20 p-4 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 grid place-items-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-cyan-200 mb-1">{op.label}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{op.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 마무리 */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "{closing}"
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div>— 글룩 AI 컨설턴트</div>
              <div className="font-mono">{new Date().toISOString().slice(0, 10)} 자동 생성</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AssessSection({ icon, title, color, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h3>
      </div>
      <ul className="space-y-2 pl-1">{children}</ul>
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

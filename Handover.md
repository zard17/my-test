# Handover

## 현재 브랜치
`feat/phase2-llm-pipeline` (Phase 2 구현 완료, 커밋 대기)

## 완료된 작업

### Phase 0: Data Acquisition (이전 완료)
- `apps/track1-cli/src/figma_client.ts` — FigmaClient 클래스

### Phase 1: Standard IR & F2CParser (이전 완료)
- `packages/common/src/types.ts` — IR 인터페이스 11개
- `packages/core/src/parser.ts` — F2CParser 클래스

### Phase 2: LLM 기반 코드 생성 파이프라인 (이번 세션)
- `apps/track1-cli/src/prompts/ir_serializer.ts` — IR → LLM 친화적 JSON 변환
  - computed값만 추출, 접두사 제거, 빈 content 생략
  - 토큰 30~40% 절감 (scaleFactor, raw값 제거)
- `apps/track1-cli/src/prompts/system_prompt.ts` — System prompt 템플릿
  - `buildSystemPrompt()`, `buildUserMessage(serializedIR)` export
  - direction→flex-direction, widthMode→CSS, TEXT color 매핑 등 지시사항
- `apps/track1-cli/src/llm_client.ts` — OpenAI API 래퍼
  - LLMClient 클래스 (gpt-4o, temperature 0.2, retry 3회)
  - `stripCodeFences()` — 마크다운 펜스 자동 제거
- `apps/track1-cli/src/generator.ts` — 파이프라인 오케스트레이터
  - `fetchAndParse(nodeId)` → `generateCode(ir)` → `saveOutput(nodeId, html)`
  - FigmaClient + F2CParser + LLMClient 조합
- `apps/track1-cli/src/generate.ts` — CLI 진입점
  - `npx tsx apps/track1-cli/src/generate.ts "310:5549"`
- `apps/track1-cli/src/index.ts` — 모든 모듈 export 업데이트

#### 테스트 추가
- `__tests__/ir_serializer.test.ts` — 9 tests (computed 매핑, content 생략, JSON 구조)
- `__tests__/llm_client.test.ts` — 10 tests (성공/빈응답/코드펜스/에러/usage)

#### 환경 설정
- `package.json`: `openai` 패키지 추가
- `.env.example`: `OPENAI_API_KEY` 추가
- `.gitignore`: `.output/` 추가

## 테스트 현황
- `npx tsc -b` — 타입 체크 통과
- `npm test` — 39 tests 전체 통과 (14 parser + 6 client + 9 serializer + 10 llm)

## 프로젝트 구조
```
packages/
  common/       # @f2c/common — IR 타입 정의
  core/         # @f2c/core — F2CParser (환경 의존성 없음)
apps/
  track1-cli/   # @f2c/track1-cli
    src/
      figma_client.ts       # Figma REST API 클라이언트
      llm_client.ts         # OpenAI API 래퍼
      generator.ts          # 파이프라인 오케스트레이터
      generate.ts           # CLI 진입점
      index.ts              # exports
      test_run.ts           # Phase 0 E2E 스크립트
      prompts/
        ir_serializer.ts    # IR → LLM JSON 변환
        system_prompt.ts    # 프롬프트 템플릿
    __tests__/
      figma_client.test.ts
      ir_serializer.test.ts
      llm_client.test.ts
```

## 다음 할 일
- **E2E 테스트**: `.env`에 OPENAI_API_KEY 설정 후 `npx tsx apps/track1-cli/src/generate.ts "310:5549"` 실행
- **Visual Verification**: 생성된 HTML 렌더링 → Figma 원본 이미지와 pixelmatch 비교 (Phase 2.5)
- **프롬프트 튜닝**: 실제 결과물 보고 system prompt 개선

## 참고 사항
- `packages/core`는 Node.js 모듈 사용 금지 (Plugin 환경 호환)
- root workspace: npm workspaces (`packages/*`, `apps/*`)
- TypeScript: strict mode, ES2020 target, ESM, project references

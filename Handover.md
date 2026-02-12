# Handover

## 현재 브랜치
`main` (Phase 2 + Parser display 수정 머지 완료)

## 완료된 작업

### Phase 0: Data Acquisition
- `apps/track1-cli/src/figma_client.ts` — FigmaClient 클래스

### Phase 1: Standard IR & F2CParser
- `packages/common/src/types.ts` — IR 인터페이스 11개
- `packages/core/src/parser.ts` — F2CParser 클래스

### Phase 2: LLM 기반 코드 생성 파이프라인
- `apps/track1-cli/src/prompts/ir_serializer.ts` — IR → LLM 친화적 JSON 변환
  - computed값만 추출, 접두사 제거, 빈 content 생략
  - 토큰 30~40% 절감 (scaleFactor, raw값 제거)
- `apps/track1-cli/src/prompts/system_prompt.ts` — System prompt 템플릿
  - `buildSystemPrompt()`, `buildUserMessage(serializedIR)` export
  - direction→flex-direction, widthMode→CSS, TEXT color, display block 매핑
- `apps/track1-cli/src/llm_client.ts` — OpenAI API 래퍼
  - LLMClient 클래스 (기본 gpt-4o-mini, OPENAI_MODEL 환경변수로 변경 가능)
  - temperature 0.2, retry 3회, `stripCodeFences()` 마크다운 펜스 자동 제거
- `apps/track1-cli/src/generator.ts` — 파이프라인 오케스트레이터
  - `fetchAndParse(nodeId)` → `generateCode(ir)` → `saveOutput(nodeId, html)`
- `apps/track1-cli/src/generate.ts` — CLI 진입점
  - `npx tsx apps/track1-cli/src/generate.ts "310:5549"`

### Parser display 수정
- `IRLayout.display` 타입: `"flex" | "none"` → `"flex" | "block" | "none"`
- `layoutMode` 없는 노드: `display: "none"` → `display: "block"`
- 원인: Figma Auto Layout 미적용 FRAME이 전부 숨겨지는 버그
- E2E 확인: 출력 4,596 → 6,955 chars (숨겨진 노드 정상 렌더링)

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

## 알려진 이슈
- 아이콘(벡터/컴포넌트 인스턴스)은 IR에서 텍스트로 표현 불가 → 렌더링 누락
- 프리 티어 gpt-4o는 10K TPM 제한 → gpt-4o-mini 기본 사용 중

## 다음 할 일
- **Visual Verification**: 생성된 HTML 렌더링 → Figma 원본 이미지와 pixelmatch 비교
- **프롬프트 튜닝**: 실제 결과물 보고 system prompt 개선
- **아이콘 처리**: 벡터 노드 → 이미지 또는 SVG 변환 방안

## 참고 사항
- `packages/core`는 Node.js 모듈 사용 금지 (Plugin 환경 호환)
- root workspace: npm workspaces (`packages/*`, `apps/*`)
- TypeScript: strict mode, ES2020 target, ESM, project references

# Handover

## 현재 브랜치
`main` (Phase 0 + Phase 1 머지 완료)

## 완료된 작업

### Phase 0: Data Acquisition
- `apps/track1-cli/src/figma_client.ts` — `FigmaClient` 클래스 구현
  - `getNodeData(fileKey, nodeId)`: Figma REST API로 노드 JSON 획득, `.cache/`에 로컬 캐싱
  - `getNodeImage(fileKey, nodeId, scale?)`: 렌더링된 PNG URL 획득 후 다운로드, 로컬 캐싱
- `apps/track1-cli/src/test_run.ts` — E2E 테스트 스크립트 (Figma API → Parser → IR 출력 + 이미지 다운로드)
- `.env.example` 생성 (`FIGMA_ACCESS_TOKEN`, `TEST_FILE_KEY`)
- 실제 Figma 파일(`XEKHnuA53rg5vg3S3qFBZ4`)로 연동 검증 완료
- 테스트 6개 통과

### Phase 1: Standard IR & F2CParser
- `packages/common/src/types.ts` — IR 인터페이스 11개 정의 (IRNode, IRLayout, IRStyle, IRTypography 등)
- `packages/core/src/parser.ts` — `F2CParser` 클래스 구현
  - Figma JSON → StandardIR 변환 (identity, layout, style, content, children 재귀)
  - `computeValue()`: `Math.round(value * scaleFactor)` 모든 수치 필드에 적용
  - RGBA→hex 변환, rectangleCornerRadii, DROP_SHADOW 추출
- 테스트 14개 통과

## 프로젝트 구조
```
packages/
  common/       # @f2c/common — IR 타입 정의
  core/         # @f2c/core — F2CParser (환경 의존성 없음)
apps/
  track1-cli/   # @f2c/track1-cli — FigmaClient + test_run 스크립트
```

## 다음 할 일 (Plan_track_1.md 기준)
- **Phase 2: Track 1 Execution** — LLM 기반 코드 생성
  - CLI에서 FigmaClient → F2CParser → StandardIR → LLM Prompt 파이프라인 연결
  - System Prompt 템플릿 설계 (Tizen C++/React 타겟)
  - Visual Verification 루틴 (렌더링 → pixelmatch 비교)

## 참고 사항
- `packages/core`는 `fs`, `path` 등 Node.js 모듈 사용 금지 (Plugin 환경 호환)
- root workspace: npm workspaces (`packages/*`, `apps/*`)
- 테스트: vitest (총 20개 통과)
- TypeScript: strict mode, ES2020 target, ESM, project references

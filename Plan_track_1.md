## 📋 Project Plan: F2C (Figma-to-Code) Engine Track 1

1. Project Goal
Figma 디자인 데이터를 정제된 Standard IR로 변환하고, 이를 LLM을 통해 고품질의 소스 코드(Target: Tizen C++, React 등)로 변환하는 자동화 파이프라인(Track 1: Visual Test Track)을 구축한다. 이 과정에서 개발되는 핵심 모듈은 향후 **Track 2(Figma Plugin)**에서도 재사용 가능하도록 TypeScript로 설계한다

2. Technical Stack
- Language: TypeScript 5.x (ESM)
- Environment: Node.js (Track 1 CLI), Figma Plugin Environment (Track 2)
- Monorepo Structure (Conceptual):
  - @f2c/common: Shared Types & IR Schema.
  - @f2c/core: Parser & Rule-based Logic (Environment-agnostic).
  - @f2c/track1: CLI tool for LLM Gen & Visual Test.

3. Architecture & Core Concept
- Core Parser: Figma JSON → Standard IR (Scaling Factor 적용).
- LLM Generator (Track 1): Standard IR → LLM → Source Code.
- Visual Tester (Track 1): Code → Render → Pixel-diff with Figma.

4. Phase 1: Shared Core & IR Schema
목표: 플랫폼에 의존성 없는 순수 TypeScript 데이터 변환 레이어 구축

### 4.1 Standard IR 인터페이스 정의 (packages/common/types.ts)
- Metadata: scaleFactor (default 4.0), unit, targetPlatform.
- Layout Properties:
  - widthMode, heightMode: fixed | hug | fill (Figma Resizing 매핑).
  - width, height: Figma 원본 수치.
  - computedWidth, computedHeight: Value * scaleFactor 연산이 적용된 최종 값.
  - padding, gap, align, justify.
- Style & Content: Typography, Colors, Border, Shadows 등.

### 4.2 Core Parser 구현 (packages/core/parser.ts)
- Figma의 원시 JSON을 입력받아 StandardIR 객체를 반환하는 클래스.
- Scaling Logic: 모든 수치형 속성에 대해 computed 필드를 자동 계산.
- Normalization: 절대 좌표를 부모 대비 상대 좌표로 변환하여 코드 생성 효율성 극대화.

5. Phase 2: Track 1 Execution (LLM-First)
목표: LLM을 활용한 코드 생성 및 품질 실험

### 5.1 CLI Fetcher & LLM Client
- Figma REST API를 연동하여 특정 디자인 노드를 JSON으로 획득.
- Prompt Engineering: Standard IR을 프롬프트에 주입하고, 특정 플랫폼(Tizen C# OneUI, Android 등)의 컨벤션에 맞는 코드 생성을 유도.

### 5.2 Visual Verification 루틴
- 생성된 코드를 렌더링(Headless Browser 등)하고 이미지 캡처.
- Figma 원본 이미지와 pixelmatch 등을 통한 이미지 비교 및 일치 점수 산출.

6. Phase 2.5: Rule Extraction & NCC Compliance
*목표: LLM의 결과물을 정형화된 규칙으로 변환하여 Track 2로 이식 준비*

### 6.1 NCC(Native Component Core) Boundary 정의
- Target 플랫폼(예: DALi/Tizen)에서 사용 가능한 컴포넌트 및 속성 화이트리스트(Whitelist) 정의.
- LLM 결과물이 바운더리를 위반할 경우 이를 자동 수정(Self-correction)하도록 프롬프트 보완.

### 6.2 Human-Reviewed Rule Extraction
- LLM이 생성한 코드 중 Visual Test를 통과한 결과물을 사람이 리뷰.
- 특정 레이아웃 패턴(예: GNB, Card List)에 대한 변환 로직을 Rule-based 모듈로 추출.
- 추출된 규칙을 `@f2c/core`의 Generator에 반영하여 점진적으로 LLM 의존도를 낮춤.

6. Implementation Checklist (For Coding Agent)
[ ] Step 1: 프로젝트 루트에 packages/common 및 packages/core 구조 설정.
[ ] Step 2: IRNode 및 StandardIR 인터페이스 정의.
[ ] Step 3: F2CParser 클래스 개발 (Scaling Factor 연산 포함).
[ ] Step 4: Node.js 환경에서 Parser를 테스트할 수 있는 간단한 스크립트 작성.
[ ] Step 5: LLM 변환을 위한 System Prompt 템플릿 설계.

7. Strategic Notes
- 재사용성: F2CParser 내부에 Node.js 전용 라이브러리(fs, path 등)를 절대 사용하지 말 것. 오직 순수 로직만 담아 Plugin 환경에서도 동작하게 함.
- 결정론적 수치: LLM이 연산을 틀리지 않도록, 모든 수치는 Parser 단계에서 계산된 computed 값을 제공한다.
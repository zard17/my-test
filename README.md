# F2C (Figma-to-Code) Engine

Figma 디자인 데이터를 Standard IR로 변환하고, 이를 소스 코드(Tizen C++, React 등)로 변환하는 자동화 파이프라인.

## 프로젝트 구조

```
packages/
  common/       # @f2c/common — Standard IR 타입 정의
  core/         # @f2c/core — F2CParser (환경 의존성 없음)
apps/
  track1-cli/   # @f2c/track1-cli — Figma API 클라이언트 & CLI
```

## 설치

```bash
npm install
```

## Figma 연동 테스트

### 1. 환경 변수 설정

```bash
cp apps/track1-cli/.env.example apps/track1-cli/.env
```

`.env` 파일에 값 입력:

```
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxx
TEST_FILE_KEY=your_figma_file_key
```

- **Access Token**: Figma → Settings → Personal access tokens에서 발급
- **File Key**: Figma URL에서 추출
  ```
  https://www.figma.com/design/XEKHnuA53rg5vg3S3qFBZ4/파일이름
                                ^^^^^^^^^^^^^^^^^^^^^^^^ File Key
  ```

### 2. Node ID 확인

Figma에서 원하는 레이어 선택 → 우클릭 → **Copy link** → URL에서 추출:

```
https://www.figma.com/design/.../...?node-id=310-5549
                                             ^^^^^^^^ → 310:5549 (- 를 : 로 변환)
```

### 3. 실행

```bash
# 특정 노드 데이터 가져오기 + IR 변환 + 이미지 다운로드
npx tsx apps/track1-cli/src/test_run.ts "310:5549"

# node-id 생략 시 캔버스 루트(0:1) 사용
npx tsx apps/track1-cli/src/test_run.ts
```

실행 결과:
- `.cache/<fileKey>_<nodeId>.json` — Figma 원본 JSON (캐싱)
- `.cache/<fileKey>_<nodeId>.png` — 렌더링 이미지 (4x scale)
- 콘솔에 Standard IR JSON 출력

## LLM 코드 생성 (Phase 2)

### 1. 환경 변수 추가

`.env`에 OpenAI 설정 추가:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1   # 회사 네트워크 사용 시 변경
OPENAI_MODEL=gpt-4o-mini                     # 기본값, gpt-4o 등 변경 가능
```

### 2. 실행

```bash
npx tsx apps/track1-cli/src/generate.ts "310:5549"
```

출력:
```
[1/3] Fetching & parsing Figma node...
[2/3] Generating code via LLM (gpt-4o-mini)...
[3/3] Saving output...

Model: gpt-4o-mini-2024-07-18
Tokens: 23528 prompt + 1958 completion = 25486 total
Output: .output/310_5549.html
```

생성된 `.output/*.html`을 브라우저에서 열어 확인.

## 테스트

```bash
npm test
```

## 타입 체크

```bash
npx tsc -b
```

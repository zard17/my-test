# Figma-to-Code (F2C) Engine Specification

## 1. 프로젝트 개요 (Overview)
본 프로젝트는 Figma 디자인 데이터를 개발용 소스 코드로 자동 변환하는 **F2C(Figma-to-Code) 파이프라인** 구축을 목표로 한다. 공통의 **중간 표현 구조(IR, Intermediate Representation)**를 중심에 두어 확장성과 검증 가능성을 확보한다.

---

## 2. 시스템 아키텍처 (High-Level Architecture)

### 2.1 Track 1: Visual Test Track (R&D & QA)
- **Figma Fetcher:** Figma REST API를 통한 디자인 자산 수집.
- **Generator (Hybrid):** Rule-based와 LLM을 결합한 지능형 코드 생성.
- **Visual Test:** 생성된 코드의 렌더링 결과와 원본 디자인의 Pixel-to-Pixel 비교.

### 2.2 Track 2: Figma Inspector Plugin (Productivity)
- **Plugin Entry:** 사용자가 선택한 레이어 데이터 실시간 추출.
- **Generator (Rule-based):** 즉각적인 응답과 일관된 코드 출력을 위한 규칙 기반 생성.
- **UX:** 개발자용 코드 프리뷰 및 복사 기능 제공.

---

## 3. Standard IR 스키마 명세 (Data Schema)

Figma의 로우 데이터를 정제하여 타겟 프레임워크에 독립적인 형태로 가공한 표준 규격입니다.

### 3.1 JSON 스키마 예시
```json
{
  "metadata": {
    "version": "1.0",
    "scaleFactor": 4.0,
    "unit": "px"
  },
  "nodes": [
    {
      "identity": {
        "id": "1:100",
        "name": "PrimaryButton",
        "type": "COMPONENT"
      },

      "layout": {
        "display": "flex",
        "direction": "horizontal", // row
        "align": "center",         // align-items
        "justify": "flex-start",   // justify-content
        
        // Resizing 모드 및 수치
        "widthMode": "hug",        // fixed | hug | fill
        "heightMode": "fixed",     // fixed | hug | fill
        "width": 120,              // Figma 원본 수치
        "height": 40,              // Figma 원본 수치
        "computedWidth": 480,      // scaleFactor 적용 후 (120 * 4)
        "computedHeight": 160,     // scaleFactor 적용 후 (40 * 4)
        
        "padding": { "top": 8, "right": 16, "bottom": 8, "left": 16 },
        "gap": 8
      },

      "style": {
        "backgroundColor": "#3B82F6",
        "borderRadius": [8, 8, 8, 8],
        "border": {
          "width": 1,
          "color": "#1D4ED8",
          "style": "solid"
        },
        "shadows": [
          { "x": 0, "y": 4, "blur": 10, "color": "rgba(0,0,0,0.1)" }
        ],
        "opacity": 1.0,
        "visibility": "visible"
      },

      "content": {
        "text": "Submit",          // TEXT 노드일 경우만
        "typography": {
          "fontFamily": "Pretendard",
          "fontSize": 14,
          "fontWeight": 600,
          "lineHeight": 1.2,
          "letterSpacing": 0
        },
        "icon": "icon_check_v1"    // 컴포넌트 이름 매핑용
      },

      "children": []               // 하위 노드 재귀 구조
    }
  ]
}
```

---

## 4. 핵심 전략 (Key Strategies)
1. **Separation of Concerns:** 디자인 파싱(Parser)과 코드 생성(Generator)을 분리.
2. **Normalization:** 절대 좌표를 상대 좌표로, Figma 단위를 표준 단위로 정규화.
3. **Design Tokens:** 색상 및 텍스트 스타일을 고정 값 대신 토큰 이름으로 관리하여 테마 대응.

---

## 5. 결론 및 향후 계획
Standard IR을 기반으로 한 투 트랙 전략은 코드의 품질(Track 1)과 개발 생산성(Track 2)을 동시에 잡을 수 있는 구조이다. 향후 디자인 시스템(Variable) 연동 및 인터랙션 모델 확장을 계획한다.
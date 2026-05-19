# Cube View Page

Figma MCP로 분석한 `Screen / Cube View` 프레임을 기준으로 구현한 단일 웹페이지 프로토타입입니다.

## Stack

- Vite
- React
- Tailwind CSS
- GSAP

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- 배경은 `src/assets/videos/bckvid.mp4`를 `video` 태그로 재생합니다.
- Hyundai Playbook 로고 클릭 시 `window.location.reload()`로 현재 페이지를 새로고침합니다.
- 버튼 hover, active, 등장 모션, 검색창 focus 상태는 GSAP 기반으로 처리했습니다.

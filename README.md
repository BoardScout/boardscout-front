# BOARDSCOUT Frontend

순수 HTML/CSS/JavaScript로 만든 보드게임 추천 서비스 프론트입니다. 별도 빌드 도구나 런타임 의존성이 없으며 BusyBox HTTP 서버가 `public/`을 그대로 제공합니다. 외부 요청 라우팅과 API 프록시는 별도 인프라 저장소의 Nginx가 담당합니다.

## 화면

- `/index.html`: 에디토리얼 홈과 큐레이션
- `/register.html`: 회원가입
- `/login.html`: 로그인
- `/preferences.html`: 인원·시간·난이도·테마·플레이 방식 설정
- `/taste.html`: 좋아한 게임 3개 이상으로 취향 설정
- `/recommendations.html`: 추천 결과와 저장
- `/mypage.html`: 취향·저장 게임·공유 세션 확인

## 구조

```text
frontend/
├── Dockerfile
├── package.json
└── public/
    ├── assets/              # 생성한 보드게임 비주얼
    ├── css/style.css        # 디자인 토큰·공통 컴포넌트·반응형 스타일
    ├── js/
    │   ├── api.js           # Spring/FastAPI 요청 래퍼
    │   ├── auth.js          # 회원·세션 흐름
    │   ├── recommendations.js # 추천 점수·취향·즐겨찾기
    │   ├── storage.js       # 로컬 데모 상태
    │   ├── ui.js            # 메뉴·토스트·스크롤 효과
    │   └── pages/           # 화면별 진입 스크립트
    └── *.html
```

## 실행

```bash
cd frontend
npm run check
npm run serve
```

브라우저에서 `http://localhost:4173`을 엽니다. 홈에서 `지금 상황에 맞는 게임`과 `내 취향에 맞는 게임` 두 경로를 선택할 수 있습니다. Gateway 환경에서는 `/api/core/*`와 `/api/recommend/*`가 각각 Spring Boot와 FastAPI로 전달됩니다. 두 API가 아직 준비되지 않은 경우 로그인·취향·추천·저장은 BGG Reviews v3의 실제 게임 ID와 메타데이터를 반영한 브라우저 로컬 데모 모드로 동작합니다.

컨테이너는 내부 포트 `4173`에서 정적 파일만 제공합니다. 운영 환경에서는 이 포트를 외부에 직접 공개하지 않고 edge Nginx가 프록시합니다.

## Typography

한글은 Wanted Sans Variable, 영문 장식 서체는 Instrument Serif를 사용합니다. Wanted Sans는 공식 저장소의 jsDelivr 웹폰트 경로를 사용합니다.

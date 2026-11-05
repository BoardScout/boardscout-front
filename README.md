# BOARDSCOUT Frontend

순수 HTML/CSS/JavaScript로 만든 보드게임 추천 서비스 프론트입니다. 별도 빌드 도구나 런타임 의존성이 없으며 Nginx 컨테이너가 `public/`을 그대로 제공합니다.

## 화면

- `/index.html`: 에디토리얼 홈과 큐레이션
- `/register.html`: 회원가입
- `/login.html`: 로그인
- `/preferences.html`: 인원·시간·난이도·장르 설정
- `/recommendations.html`: 추천 결과와 저장
- `/mypage.html`: 취향·저장 게임·공유 세션 확인

## 구조

```text
frontend/
├── Dockerfile
├── nginx.conf
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

브라우저에서 `http://localhost:4173`을 엽니다. Gateway 환경에서는 `/api/core/*`와 `/api/recommend/*`가 각각 Spring Boot와 FastAPI로 전달됩니다. 두 API가 아직 준비되지 않은 경우 로그인·취향·추천·저장은 브라우저 로컬 데모 모드로 동작합니다.

## Typography

한글은 Wanted Sans Variable, 영문 장식 서체는 Instrument Serif를 사용합니다. Wanted Sans는 공식 저장소의 jsDelivr 웹폰트 경로를 사용합니다.

import { coreApi, recommendationApi } from "./api.js";
import { localSession } from "./storage.js";

export const THEME_LABELS = {
  strategy: "전략·경영",
  party: "파티·심리전",
  adventure: "판타지·모험",
  mystery: "추리·공포",
  scifi: "SF·우주",
  family: "가족·어린이",
  history: "역사·문명",
  building: "건설·경제",
};

export const STYLE_LABELS = {
  coop: "함께 협력하기",
  social: "대화·추리하기",
  engine: "전략을 쌓아가기",
  luck: "주사위와 운 즐기기",
  puzzle: "퍼즐·타일 배치",
  solo: "혼자 플레이하기",
};

// BoardGameGeek Reviews v3 processed catalog의 실제 item_id와 메타데이터를 사용한 데모 표본입니다.
export const GAMES = [
  { id: 0, bggId: 30549, title: "Pandemic", localizedTitle: "팬데믹", category: "협력 전략", minPlayers: 2, maxPlayers: 4, maxPlayTime: 45, minAge: 8, complexity: 2.4063, averageRating: 7.58896, themes: ["strategy", "mystery"], playStyles: ["coop", "engine"], reason: "역할을 나눠 위기를 해결하는 대표적인 협력 전략 게임", imageUrl: "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu-2Ljb_ml5n-S8uIbE6ehGFc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg", year: 2008, designer: "맷 리콕", publisher: "Z-Man Games", description: "세계 곳곳에서 동시에 번지는 네 가지 전염병을 막는 협력 게임입니다. 플레이어는 과학자, 의료진 등 서로 다른 전문가가 되어 감염 도시를 치료하고 연구소를 세우며, 사태가 통제 불능이 되기 전에 네 가지 치료제를 모두 개발해야 합니다.", playSummary: "한 차례에 최대 네 번 행동해 이동·치료·연구를 수행합니다. 모두가 함께 이기거나 함께 지기 때문에 각 역할의 능력을 연결하고 다음 감염에 대비하는 대화가 핵심입니다." },
  { id: 1, bggId: 822, title: "Carcassonne", localizedTitle: "카르카손", category: "타일 건설", minPlayers: 2, maxPlayers: 5, maxPlayTime: 45, minAge: 7, complexity: 1.9057, averageRating: 7.41837, themes: ["strategy", "history", "building"], playStyles: ["puzzle", "engine"], reason: "타일을 이어 도시와 길을 완성하는 직관적인 건설 게임" },
  { id: 2, bggId: 13, title: "Catan", localizedTitle: "카탄", category: "교역 전략", minPlayers: 3, maxPlayers: 4, maxPlayTime: 120, minAge: 10, complexity: 2.313, averageRating: 7.13598, themes: ["strategy", "building"], playStyles: ["social", "luck", "engine"], reason: "자원을 교환하고 길을 넓히며 협상하는 고전 전략 게임" },
  { id: 5, bggId: 9209, title: "Ticket to Ride", localizedTitle: "티켓 투 라이드", category: "노선 건설", minPlayers: 2, maxPlayers: 5, maxPlayTime: 60, minAge: 8, complexity: 1.8445, averageRating: 7.41291, themes: ["family", "building"], playStyles: ["engine", "luck"], reason: "카드를 모아 노선을 연결하는 가족 친화적인 전략 게임" },
  { id: 6, bggId: 178900, title: "Codenames", localizedTitle: "코드네임", category: "팀 추리", minPlayers: 2, maxPlayers: 8, maxPlayTime: 15, minAge: 14, complexity: 1.2788, averageRating: 7.59814, themes: ["party", "mystery"], playStyles: ["social", "coop"], reason: "한 단어의 힌트로 같은 편의 단어를 찾는 팀 추리 게임", imageUrl: "https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__itemrep/img/e8zw8YQvQB8q8zfWkHQ48Ls920g=/fit-in/246x300/filters:strip_icc()/pic2582929.jpg", year: 2015, designer: "블라다 흐바틸", publisher: "Czech Games Edition", description: "두 팀의 첩보 책임자가 한 단어와 숫자만으로 자기 팀 요원들의 암호명을 알려 주는 파티 추리 게임입니다. 같은 단어도 사람마다 다르게 연결하기 때문에 짧은 힌트 하나에서 예상 밖의 웃음과 긴장이 생깁니다.", playSummary: "탁자에 펼친 25개 단어 중 우리 팀 요원을 먼저 모두 찾으면 승리합니다. 상대 요원이나 민간인을 고르면 차례가 끝나고, 암살자를 고르면 즉시 패배합니다." },
  { id: 7, bggId: 167791, title: "Terraforming Mars", localizedTitle: "테라포밍 마스", category: "SF 경영", minPlayers: 1, maxPlayers: 5, maxPlayTime: 120, minAge: 12, complexity: 3.2434, averageRating: 8.41702, themes: ["strategy", "scifi", "building"], playStyles: ["engine", "puzzle", "solo"], reason: "카드와 자원을 조합해 화성을 개발하는 깊이 있는 엔진 빌딩" },
  { id: 8, bggId: 173346, title: "7 Wonders Duel", localizedTitle: "7 원더스 대결", category: "2인 문명", minPlayers: 2, maxPlayers: 2, maxPlayTime: 30, minAge: 10, complexity: 2.2234, averageRating: 8.1083, themes: ["strategy", "history", "building"], playStyles: ["engine", "puzzle"], reason: "30분 안에 문명을 발전시키는 밀도 높은 2인 전용 게임", imageUrl: "https://cf.geekdo-images.com/itemrep/img/hWxcNzC1olqP42dwYGjwW5qGQAs=/fit-in/246x300/pic3376065.jpg", year: 2015, designer: "앙투안 보자 · 브뤼노 카탈라", publisher: "Repos Production", description: "고대 문명을 이끄는 두 플레이어가 세 시대에 걸쳐 건물을 짓고 불가사의를 완성하는 2인 전용 전략 게임입니다. 자원과 점수뿐 아니라 군사·과학 우위로도 즉시 승리할 수 있어 상대가 가져갈 카드까지 계속 살펴야 합니다.", playSummary: "겹쳐 놓인 카드 가운데 가려지지 않은 카드 한 장을 골라 건설하거나, 돈으로 바꾸거나, 불가사의 건설에 사용합니다. 카드 한 장을 가져갈 때마다 다음 카드가 공개되어 선택의 타이밍이 승부를 가릅니다." },
  { id: 11, bggId: 148228, title: "Splendor", localizedTitle: "스플렌더", category: "경제 전략", minPlayers: 2, maxPlayers: 4, maxPlayTime: 30, minAge: 10, complexity: 1.7939, averageRating: 7.44, themes: ["strategy", "building"], playStyles: ["engine", "puzzle"], reason: "보석을 모아 더 큰 선택을 만드는 간결한 엔진 빌딩 게임" },
  { id: 15, bggId: 230802, title: "Azul", localizedTitle: "아줄", category: "추상 퍼즐", minPlayers: 2, maxPlayers: 4, maxPlayTime: 45, minAge: 8, complexity: 1.7639, averageRating: 7.79966, themes: ["strategy", "family"], playStyles: ["puzzle"], reason: "아름다운 타일을 고르고 배치하는 가벼운 추상 전략 게임", imageUrl: "https://cf.geekdo-images.com/imagepage/img/mswTFqJsQ_omcKa_y1yNfFMJP6M=/fit-in/900x600/filters:no_upscale()/pic3718275.jpg", year: 2017, designer: "미하엘 키슬링", publisher: "Next Move Games", description: "포르투갈 궁전의 벽을 장식한다는 주제로 색색의 타일을 골라 무늬를 완성하는 추상 전략 게임입니다. 규칙은 간결하지만 상대가 필요한 타일을 읽고, 남은 타일을 떠안지 않도록 계산하는 선택이 촘촘합니다.", playSummary: "공장 진열대 한 곳에서 같은 색 타일을 모두 가져와 개인 보드의 한 줄에 놓습니다. 줄을 완성하면 타일 하나를 벽으로 옮겨 점수를 얻고, 놓지 못한 타일은 감점됩니다." },
  { id: 16, bggId: 70323, title: "King of Tokyo", localizedTitle: "킹 오브 도쿄", category: "주사위 대결", minPlayers: 2, maxPlayers: 6, maxPlayTime: 30, minAge: 8, complexity: 1.4901, averageRating: 7.16923, themes: ["party", "scifi", "family"], playStyles: ["luck", "social"], reason: "주사위를 굴려 괴수끼리 맞붙는 빠르고 유쾌한 대결 게임" },
  { id: 19, bggId: 266192, title: "Wingspan", localizedTitle: "윙스팬", category: "자연 엔진", minPlayers: 1, maxPlayers: 5, maxPlayTime: 70, minAge: 10, complexity: 2.4393, averageRating: 8.10005, themes: ["strategy", "family"], playStyles: ["engine", "luck", "solo"], reason: "새 카드를 조합해 서식지를 성장시키는 차분한 엔진 빌딩" },
  { id: 20, bggId: 39856, title: "Dixit", localizedTitle: "딕싯", category: "상상 파티", minPlayers: 3, maxPlayers: 6, maxPlayTime: 30, minAge: 8, complexity: 1.2127, averageRating: 7.24135, themes: ["party", "family"], playStyles: ["social"], reason: "그림과 이야기로 서로의 생각을 읽는 감성적인 파티 게임" },
  { id: 21, bggId: 163412, title: "Patchwork", localizedTitle: "패치워크", category: "2인 퍼즐", minPlayers: 2, maxPlayers: 2, maxPlayTime: 30, minAge: 8, complexity: 1.6239, averageRating: 7.63916, themes: ["strategy", "family"], playStyles: ["puzzle", "engine"], reason: "조각을 빈틈없이 채우는 편안한 2인 퍼즐 게임" },
  { id: 22, bggId: 84876, title: "The Castles of Burgundy", localizedTitle: "버건디의 성", category: "중세 전략", minPlayers: 2, maxPlayers: 4, maxPlayTime: 90, minAge: 12, complexity: 2.9996, averageRating: 8.12675, themes: ["strategy", "history", "building"], playStyles: ["luck", "puzzle", "engine"], reason: "주사위 선택으로 영지를 완성하는 중상급 전략 게임" },
  { id: 26, bggId: 174430, title: "Gloomhaven", localizedTitle: "글룸헤이븐", category: "판타지 모험", minPlayers: 1, maxPlayers: 4, maxPlayTime: 120, minAge: 14, complexity: 3.8699, averageRating: 8.74356, themes: ["adventure", "mystery"], playStyles: ["coop", "engine", "solo"], reason: "성장과 선택이 이어지는 장기 캠페인형 협력 모험 게임" },
  { id: 56, bggId: 162886, title: "Spirit Island", localizedTitle: "정령섬", category: "협력 전략", minPlayers: 1, maxPlayers: 4, maxPlayTime: 120, minAge: 13, complexity: 4.0289, averageRating: 8.36078, themes: ["strategy", "adventure"], playStyles: ["coop", "engine", "solo"], reason: "서로 다른 정령의 능력을 조합하는 고난도 협력 전략 게임" },
];

const difficultyCenter = { 1: 1.5, 2: 2.3, 3: 3.5 };

export const getPlayerLabel = (game) => game.minPlayers === game.maxPlayers
  ? `${game.minPlayers}인`
  : `${game.minPlayers}–${game.maxPlayers}인`;

export const getDifficultyLabel = (complexity) => {
  if (complexity < 1.8) return "가볍게";
  if (complexity < 2.8) return "적당히";
  return "깊게";
};

export function normalizePreferences(preferences = {}) {
  // 이전 DTO 필드도 현재 추천 계약으로 변환해 저장된 사용자 데이터와의 호환성을 유지합니다.
  const legacyGenres = Array.isArray(preferences.genres) ? preferences.genres : [];
  return {
    recommendationMode: preferences.recommendationMode ?? "context",
    playerCount: Number(preferences.playerCount ?? preferences.players) || null,
    maxPlayTime: Number(preferences.maxPlayTime ?? preferences.minutes) || null,
    difficulty: Number(preferences.difficulty) || null,
    themes: Array.isArray(preferences.themes) ? preferences.themes : legacyGenres,
    playStyles: Array.isArray(preferences.playStyles) ? preferences.playStyles : [],
    likedGameIds: Array.isArray(preferences.likedGameIds)
      ? preferences.likedGameIds.map(Number).filter(Number.isFinite)
      : [],
  };
}

const overlapCount = (left, right) => left.filter((value) => right.includes(value)).length;

export function scoreContextGames(preferences = {}) {
  const preference = normalizePreferences(preferences);
  // 인원과 시간은 플레이 가능 여부를 결정하므로 점수가 아닌 필수 조건으로 먼저 거릅니다.
  return GAMES.filter((game) => {
    const playerMatch = !preference.playerCount
      || (game.minPlayers <= preference.playerCount && preference.playerCount <= game.maxPlayers);
    const timeMatch = !preference.maxPlayTime || game.maxPlayTime <= preference.maxPlayTime;
    return playerMatch && timeMatch;
  }).map((game) => {
    // 난이도·테마·플레이 방식·평점은 후보 안에서의 정렬 신호로만 사용합니다.
    const targetComplexity = difficultyCenter[preference.difficulty] ?? 2.3;
    const complexityScore = Math.max(0, 20 - Math.abs(game.complexity - targetComplexity) * 12);
    const themeScore = Math.min(overlapCount(preference.themes, game.themes) * 12, 24);
    const styleScore = Math.min(overlapCount(preference.playStyles, game.playStyles) * 10, 20);
    const ratingScore = Math.max(0, (game.averageRating - 6.5) * 4);
    return { ...game, score: Math.round(Math.min(98, 46 + complexityScore + themeScore + styleScore + ratingScore)) };
  }).sort((a, b) => b.score - a.score || b.averageRating - a.averageRating);
}

export function scoreTasteGames(preferences = {}) {
  const preference = normalizePreferences(preferences);
  const liked = GAMES.filter((game) => preference.likedGameIds.includes(game.id));
  if (!liked.length) return [...GAMES].sort((a, b) => b.averageRating - a.averageRating);

  // 좋아한 게임들의 공통 테마와 플레이 방식, 평균 복잡도로 간단한 취향 프로필을 만듭니다.
  const themeProfile = liked.flatMap((game) => game.themes);
  const styleProfile = liked.flatMap((game) => game.playStyles);
  const averageComplexity = liked.reduce((sum, game) => sum + game.complexity, 0) / liked.length;
  return GAMES.filter((game) => !preference.likedGameIds.includes(game.id)).map((game) => {
    const themeScore = overlapCount([...new Set(themeProfile)], game.themes) * 10;
    const styleScore = overlapCount([...new Set(styleProfile)], game.playStyles) * 8;
    const complexityScore = Math.max(0, 20 - Math.abs(game.complexity - averageComplexity) * 10);
    const ratingScore = Math.max(0, (game.averageRating - 6.5) * 4);
    return { ...game, score: Math.round(Math.min(98, 30 + themeScore + styleScore + complexityScore + ratingScore)) };
  }).sort((a, b) => b.score - a.score || b.averageRating - a.averageRating);
}

export function scoreGames(preferences = {}) {
  const preference = normalizePreferences(preferences);
  return preference.recommendationMode === "taste"
    ? scoreTasteGames(preference)
    : scoreContextGames(preference);
}

export async function getRecommendations() {
  const preferences = normalizePreferences(localSession.getPreferences() ?? {});
  try {
    const payload = await recommendationApi.games(preferences);
    // API 응답 래퍼 유무와 관계없이 추천 목록만 페이지에 전달합니다.
    return payload.result?.items ?? payload.items ?? payload;
  } catch {
    // 추천 서버가 없으면 같은 입력으로 브라우저 내 점수 계산을 수행합니다.
    return scoreGames(preferences);
  }
}

export async function savePreferences(payload) {
  const normalized = normalizePreferences(payload);
  // 이동 직후에도 값을 읽을 수 있도록 로컬에 먼저 저장한 뒤 서버와 동기화합니다.
  localSession.setPreferences(normalized);
  try { return await coreApi.savePreferences(normalized); } catch { return normalized; }
}

export async function getPreferences() {
  try {
    const payload = await coreApi.preferences();
    return normalizePreferences(payload.result ?? payload);
  } catch {
    const local = localSession.getPreferences();
    return local ? normalizePreferences(local) : null;
  }
}

export async function toggleFavorite(game) {
  const current = localSession.getFavorites();
  const exists = current.some((item) => item.id === game.id);
  const next = exists ? current.filter((item) => item.id !== game.id) : [...current, game];
  // 저장 버튼은 즉시 반응하고, 서버 동기화 실패 시에도 로컬 목록은 유지합니다.
  localSession.setFavorites(next);
  try {
    if (exists) await coreApi.removeFavorite(game.id);
    else await coreApi.addFavorite(game.id);
  } catch { /* 백엔드 연결 전에는 브라우저 저장소를 사용합니다. */ }
  return { saved: !exists, favorites: next };
}

export const getLocalFavorites = () => localSession.getFavorites();

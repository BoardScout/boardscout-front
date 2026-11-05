import { coreApi, recommendationApi } from "./api.js";
import { localSession } from "./storage.js";

export const GAMES = [
  { id: 1, title: "Monolith", category: "추상 전략", players: "2인", minutes: 30, difficulty: 3, genres: ["strategy"], reason: "짧은 규칙 안에서 깊게 수를 읽는 2인 전략 게임" },
  { id: 2, title: "The Archive", category: "협력 추리", players: "3–4인", minutes: 60, difficulty: 2, genres: ["mystery", "coop"], reason: "모두가 단서를 연결하며 한 편의 사건을 완성하는 협력 게임" },
  { id: 3, title: "Side Eye", category: "블러핑 파티", players: "4–8인", minutes: 20, difficulty: 1, genres: ["party"], reason: "설명은 짧고 표정과 대화가 오래 남는 가벼운 파티 게임" },
  { id: 4, title: "Red Thread", category: "타일 전술", players: "2인", minutes: 25, difficulty: 2, genres: ["strategy"], reason: "20분 안에 팽팽한 선택을 주고받는 컴팩트한 2인 게임" },
];

const playerScore = (game, players) => {
  if (!players) return 0;
  if (players === "2" && game.players.startsWith("2")) return 20;
  if (["3", "4"].includes(players) && game.players.includes("3–4")) return 20;
  if (Number(players) >= 5 && game.players.includes("4–8")) return 20;
  return 6;
};

export function scoreGames(preferences = {}) {
  return GAMES.map((game) => {
    let score = 54 + playerScore(game, preferences.players);
    if (preferences.minutes && game.minutes <= Number(preferences.minutes)) score += 15;
    if (preferences.difficulty && Math.abs(game.difficulty - Number(preferences.difficulty)) <= 1) score += 15;
    if (preferences.genres?.some((genre) => game.genres.includes(genre))) score += 16;
    return { ...game, score: Math.min(score, 98) };
  }).sort((a, b) => b.score - a.score);
}

export async function getRecommendations() {
  try { return await recommendationApi.games(); }
  catch { return scoreGames(localSession.getPreferences() ?? {}); }
}

export async function savePreferences(payload) {
  localSession.setPreferences(payload);
  try { return await coreApi.savePreferences(payload); } catch { return payload; }
}

export async function getPreferences() {
  try { return await coreApi.preferences(); } catch { return localSession.getPreferences(); }
}

export async function toggleFavorite(game) {
  const current = localSession.getFavorites();
  const exists = current.some((item) => item.id === game.id);
  const next = exists ? current.filter((item) => item.id !== game.id) : [...current, game];
  localSession.setFavorites(next);
  try {
    if (exists) await coreApi.removeFavorite(game.id);
    else await coreApi.addFavorite(game.id);
  } catch { /* 백엔드 연결 전에는 브라우저 저장소를 사용합니다. */ }
  return { saved: !exists, favorites: next };
}

export const getLocalFavorites = () => localSession.getFavorites();

import assert from "node:assert/strict";
import test from "node:test";

import { normalizePreferences, scoreContextGames, scoreTasteGames } from "../public/js/recommendations.js";

test("상황 추천은 인원과 최대 플레이 시간을 하드 필터로 사용한다", () => {
  const games = scoreContextGames({
    recommendationMode: "context",
    playerCount: 8,
    maxPlayTime: 30,
    difficulty: 1,
    themes: ["party"],
    playStyles: ["social"],
  });

  assert.deepEqual(games.map(({ title }) => title), ["Codenames"]);
});

test("상황 추천은 난이도와 테마 및 플레이 방식이 가까운 게임을 먼저 둔다", () => {
  const games = scoreContextGames({
    recommendationMode: "context",
    playerCount: 2,
    maxPlayTime: 45,
    difficulty: 1,
    themes: ["family", "strategy"],
    playStyles: ["puzzle"],
  });

  assert.equal(games[0].title, "Azul");
  assert.ok(games[0].score > games.at(-1).score);
});

test("취향 추천은 선택한 게임을 제외하고 유사한 게임을 추천한다", () => {
  const games = scoreTasteGames({ recommendationMode: "taste", likedGameIds: [11, 15, 21] });

  assert.equal(games.some(({ id }) => [11, 15, 21].includes(id)), false);
  assert.ok(["7 Wonders Duel", "Carcassonne"].includes(games[0].title));
});

test("이전 로컬 DTO도 새 상황 추천 계약으로 변환한다", () => {
  const preference = normalizePreferences({ players: "2", minutes: "30", difficulty: "3", genres: ["strategy"] });

  assert.equal(preference.playerCount, 2);
  assert.equal(preference.maxPlayTime, 30);
  assert.deepEqual(preference.themes, ["strategy"]);
});

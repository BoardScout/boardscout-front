import assert from "node:assert/strict";
import test from "node:test";

import { displayTitle, getDatasetItemId, toViewGame } from "../public/js/game-model.js";

test("추천 API 항목은 gameId를 id와 데이터셋 ID로 쓴다", () => {
  const game = toViewGame({ gameId: 42, bggId: 1, title: "Some Game", localizedTitle: null, maxPlayTime: 60, complexity: 2.1 });

  assert.equal(game.id, 42);
  assert.equal(game.datasetItemId, 42);
  assert.equal(game.localizedTitle, null);
  assert.equal(displayTitle(game), "Some Game");
});

test("카탈로그 항목은 board_games.id와 datasetItemId를 따로 유지하고 필드 이름을 맞춘다", () => {
  const game = toViewGame({
    id: 7, datasetItemId: 300, bggId: 1, nameEn: "Catalog Game", nameKo: null,
    maxPlayTimeMinutes: 45, difficulty: "2.50", thumbnailUrl: "https://example.com/t.jpg", yearPublished: 2001,
  });

  assert.equal(game.id, 7);
  assert.equal(getDatasetItemId(game), 300);
  assert.equal(game.title, "Catalog Game");
  assert.equal(game.maxPlayTime, 45);
  assert.equal(game.complexity, 2.5);
  assert.equal(game.imageUrl, "https://example.com/t.jpg");
  assert.equal(game.year, 2001);
});

test("한국어 소개가 있는 게임은 이름·소개·표지를 덮어쓰고 추천 이유는 남긴다", () => {
  const game = toViewGame({ gameId: 2, bggId: 13, title: "Catan", reason: "추천 이유" });

  assert.equal(game.localizedTitle, "카탄");
  assert.ok(game.description);
  assert.match(game.imageUrl, /^\/assets\/games\/13\./);
  assert.equal(game.reason, "추천 이유");
});

test("이미 변환한 게임을 다시 변환해도 결과가 같다", () => {
  const once = toViewGame({ id: 7, datasetItemId: 300, bggId: 822, nameEn: "Carcassonne", maxPlayTimeMinutes: 45, difficulty: 1.9 });

  assert.deepEqual(toViewGame(once), once);
});

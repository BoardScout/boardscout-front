import { getGameImage, getKoGame } from "./game-catalog-ko.js";

// 화면에 오는 게임 데이터는 세 가지 모양입니다.
// - Spring 카탈로그: id(board_games.id), datasetItemId, nameEn, nameKo, maxPlayTimeMinutes, difficulty, thumbnailUrl
// - FastAPI 추천: gameId(데이터셋 ID), title, localizedTitle, maxPlayTime, complexity
// - 내장 GAMES: id(데이터셋 ID), title, localizedTitle, maxPlayTime, complexity
// 페이지 코드는 이 함수를 거친 객체만 쓰고, 필드 이름 차이는 여기서만 맞춥니다.
// 한국어 소개 데이터(bggId 기준)가 있으면 이름·소개·표지를 그 내용으로 덮어씁니다.
// 이미 변환한 객체를 다시 넣어도 결과가 같습니다.
export function toViewGame(raw) {
  const ko = getKoGame(raw.bggId);
  const koImage = ko ? getGameImage(raw.bggId) : null;
  const title = raw.nameEn ?? raw.title;
  return {
    ...raw,
    id: raw.id ?? raw.gameId,
    datasetItemId: getDatasetItemId(raw),
    title,
    localizedTitle: ko?.nameKo || raw.nameKo || raw.localizedTitle || null,
    maxPlayTime: raw.maxPlayTimeMinutes ?? raw.maxPlayTime,
    complexity: Number(raw.difficulty ?? raw.complexity) || null,
    year: raw.yearPublished ?? raw.year,
    imageUrl: koImage ?? raw.thumbnailUrl ?? raw.imageUrl,
    // reason은 추천 이유 문구로 남겨 두고, 게임 소개는 description에 모읍니다.
    description: ko?.description ?? raw.descriptionKo ?? raw.description,
    ...(ko ? { playSummary: ko.playSummary, designer: ko.designer, publisher: ko.publisher } : {}),
  };
}

// 별점 API가 쓰는 데이터셋 ID입니다. 추천 결과의 gameId와 내장 목록의 id가 데이터셋 ID입니다.
export const getDatasetItemId = (game) => Number(game.datasetItemId ?? game.gameId ?? game.id);

// 한국어 이름이 있으면 한국어 이름, 없으면 원래 이름입니다.
export const displayTitle = (game) => game.localizedTitle ?? game.title;

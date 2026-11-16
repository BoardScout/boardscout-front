import assert from "node:assert/strict";
import test from "node:test";

import { coreApi, request } from "../public/js/api.js";

const jsonResponse = (payload = {}) => ({
  ok: true,
  status: 200,
  headers: { get: (name) => name.toLowerCase() === "content-type" ? "application/json" : null },
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

test("상태 변경 요청은 발급받은 XSRF 쿠키 값을 헤더로 전송한다", async (context) => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.document = { cookie: "" };
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    if (path === "/api/v1/auth/csrf") {
      // 브라우저가 Set-Cookie 응답을 반영한 직후의 document.cookie를 재현합니다.
      globalThis.document.cookie = "XSRF-TOKEN=csrf-token";
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: true, result: {} });
  };
  context.after(() => {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  });

  await request("/api/v1/users/me/preferences", { method: "PUT", body: "{}" });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].path, "/api/v1/auth/csrf");
  assert.equal(calls[1].options.headers["X-XSRF-TOKEN"], "csrf-token");
  assert.equal(calls[1].options.credentials, "include");
});

test("추천 서버 POST는 Spring용 CSRF 토큰을 요구하지 않는다", async (context) => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.document = { cookie: "" };
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    return jsonResponse({ success: true, result: { items: [] } });
  };
  context.after(() => {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  });

  await request("/api/recommend/games", { method: "POST", body: "{}" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/recommend/games");
  assert.equal(calls[0].options.headers["X-XSRF-TOKEN"], undefined);
});

test("별점은 dataset item id와 BGG 10점 척도로 저장한다", async (context) => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.document = { cookie: "XSRF-TOKEN=csrf-token" };
  globalThis.fetch = async (path, options = {}) => {
    calls.push({ path, options });
    return jsonResponse({ success: true, result: { datasetItemId: 15, rating: 9 } });
  };
  context.after(() => {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  });

  await coreApi.saveRating(15, 9);

  assert.equal(calls[0].path, "/api/v1/users/me/ratings/15");
  assert.equal(calls[0].options.method, "PUT");
  assert.equal(calls[0].options.body, JSON.stringify({ rating: 9 }));
  assert.equal(calls[0].options.headers["X-XSRF-TOKEN"], "csrf-token");
});

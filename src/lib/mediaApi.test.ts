import { describe, expect, it } from "vitest";
import { parseProcessResponse } from "./mediaApi";

describe("media API responses", () => {
  it("explains a text 404 instead of exposing a JSON parser error", async () => {
    const response = new Response("The page could not be found", { status: 404, headers: { "content-type": "text/plain" } });
    await expect(parseProcessResponse(response)).rejects.toThrow("media processing service is unavailable");
  });

  it("preserves API processing errors", async () => {
    const response = new Response(JSON.stringify({ error: "Source is private" }), { status: 422, headers: { "content-type": "application/json" } });
    await expect(parseProcessResponse(response)).rejects.toThrow("Source is private");
  });
});

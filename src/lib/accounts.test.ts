import { describe, expect, it } from "vitest";
import { validateAccount } from "./accounts";

describe("account validation", () => {
  it("accepts complete account information", () => {
    expect(validateAccount({ name: "Jamie Smith", email: "jamie@example.com", phone: "+44 7700 900123" })).toBeNull();
  });

  it("rejects missing or malformed fields", () => {
    expect(validateAccount({ name: "J", email: "jamie@example.com", phone: "+44 7700 900123" })).toBeTruthy();
    expect(validateAccount({ name: "Jamie Smith", email: "not-an-email", phone: "+44 7700 900123" })).toBeTruthy();
    expect(validateAccount({ name: "Jamie Smith", email: "jamie@example.com", phone: "12" })).toBeTruthy();
  });
});

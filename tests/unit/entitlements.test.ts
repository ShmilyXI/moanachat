import assert from "node:assert/strict";
import test from "node:test";
import { entitlementsByUserType } from "@/lib/ai/entitlements";

test("regular accounts allow 100 messages per hour", () => {
  assert.equal(entitlementsByUserType.regular.maxMessagesPerHour, 100);
});

test("guest accounts keep the existing 10-message hourly limit", () => {
  assert.equal(entitlementsByUserType.guest.maxMessagesPerHour, 10);
});

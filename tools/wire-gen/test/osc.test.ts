import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { encodeMessage } from "../osc";

describe("osc encoding", () => {
  test("pads addresses and type tags to 4-byte boundaries", () => {
    const msg = encodeMessage("/wire/clip", []);
    assert.equal(msg.length % 4, 0);
    // "/wire/clip" is 10 bytes, so 12 with the null terminator and padding.
    assert.equal(msg.subarray(0, 12).toString("utf8").replace(/\0+$/, ""), "/wire/clip");
    assert.equal(msg.subarray(12).toString("utf8").replace(/\0+$/, ""), ",");
  });

  test("encodes the slot + path message the CLI actually sends", () => {
    const msg = encodeMessage("/wire/clip", [3, "/clips/03_loop.mov"]);
    assert.equal(msg.length % 4, 0);
    const text = msg.toString("utf8");
    assert.ok(text.includes(",is"), "type tag should be int then string");
    assert.ok(text.includes("/clips/03_loop.mov"));
    const tagEnd = 12 + 4; // address (12) + ",is" padded to 4
    assert.equal(msg.readInt32BE(tagEnd), 3);
  });

  test("encodes booleans as type tags carrying no payload", () => {
    assert.equal(encodeMessage("/a", [true]).length, encodeMessage("/a", [false]).length);
  });
});

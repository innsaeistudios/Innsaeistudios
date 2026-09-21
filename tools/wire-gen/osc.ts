/**
 * Minimal OSC 1.0 sender over UDP — enough to poke Wire and Resolume when a
 * new clip lands. No dependency; OSC messages are just padded blobs.
 */

import { createSocket } from "node:dgram";

type OscArg = string | number | boolean;

function padded(buf: Buffer): Buffer {
  const pad = (4 - (buf.length % 4)) % 4;
  return pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
}

function oscString(value: string): Buffer {
  return padded(Buffer.concat([Buffer.from(value, "utf8"), Buffer.alloc(1)]));
}

export function encodeMessage(address: string, args: OscArg[]): Buffer {
  const tags = [","];
  const body: Buffer[] = [];

  for (const arg of args) {
    if (typeof arg === "string") {
      tags.push("s");
      body.push(oscString(arg));
    } else if (typeof arg === "boolean") {
      tags.push(arg ? "T" : "F"); // no payload for booleans
    } else if (Number.isInteger(arg)) {
      tags.push("i");
      const b = Buffer.alloc(4);
      b.writeInt32BE(arg);
      body.push(b);
    } else {
      tags.push("f");
      const b = Buffer.alloc(4);
      b.writeFloatBE(arg);
      body.push(b);
    }
  }

  return Buffer.concat([oscString(address), oscString(tags.join("")), ...body]);
}

export interface OscTarget {
  host: string;
  port: number;
}

export async function sendOsc(target: OscTarget, address: string, args: OscArg[] = []): Promise<void> {
  const message = encodeMessage(address, args);
  const socket = createSocket("udp4");
  await new Promise<void>((resolve, reject) => {
    socket.send(message, target.port, target.host, (err) => (err ? reject(err) : resolve()));
  });
  socket.close();
}

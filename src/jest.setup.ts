import "@testing-library/jest-dom";
import "whatwg-fetch";
import { TextEncoder, TextDecoder as NodeTextDecoder } from "util";
import { NextResponse } from "next/server";

global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof global.TextDecoder;

NextResponse.json = function (body: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers),
    },
  });
} as any;

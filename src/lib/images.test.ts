import { describe, expect, it } from "vitest";

import { isSafeRemoteUrl, sniffImage } from "@/lib/images";

const bytes = (...head: number[]) => new Uint8Array([...head, ...new Array(16).fill(0)]);

describe("sniffImage", () => {
  it("recognises png, jpeg, gif, webp and ico by their bytes", () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47))?.ext).toBe("png");
    expect(sniffImage(bytes(0xff, 0xd8, 0xff))?.ext).toBe("jpg");
    expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38))?.ext).toBe("gif");
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))?.ext).toBe("webp");
    expect(sniffImage(bytes(0x00, 0x00, 0x01, 0x00))?.ext).toBe("ico");
  });

  it("rejects SVG, HTML and short input", () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<!doctype html><html></html>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe("isSafeRemoteUrl", () => {
  it.each([
    "https://shop.bg/logo.png",
    "http://cdn.example.com/a.jpg",
    "https://93.123.4.5/x.png",
  ])("allows %s", (url) => expect(isSafeRemoteUrl(url)).toBe(true));

  it.each([
    "file:///etc/passwd",
    "ftp://shop.bg/a.png",
    "http://localhost:3000/a.png",
    "http://127.0.0.1/a.png",
    "http://10.0.0.5/a.png",
    "http://172.16.0.1/a.png",
    "http://192.168.1.1/a.png",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/a.png",
    "http://intranet/a.png",
    "https://user:pass@shop.bg/a.png",
    "not a url",
  ])("blocks %s", (url) => expect(isSafeRemoteUrl(url)).toBe(false));
});

import { parseEuro, parseEuroList } from "@/lib/parse-amounts";

describe("parseEuroList", () => {
  it("reads spaces, semicolons and ', ' as separators and a comma before digits as decimal", () => {
    expect(parseEuroList("25 50 100")).toEqual([25, 50, 100]);
    expect(parseEuroList("25, 50; 100 €")).toEqual([25, 50, 100]);
    expect(parseEuroList("25,50 10")).toEqual([10, 25.5]);
    expect(parseEuroList("")).toEqual([]);
  });
  it("rejects nonsense and non-positive values", () => {
    expect(parseEuroList("abc")).toBeNull();
    expect(parseEuroList("0 10")).toBeNull();
    expect(parseEuro("10 20")).toBe("invalid");
    expect(parseEuro("12,5")).toBe(12.5);
    expect(parseEuro(" ")).toBeNull();
  });
});

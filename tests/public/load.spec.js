
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { testMode } from "../shared";


let load;
beforeAll(async () => {
    const mod = await testMode.importHelpers();
    load = mod.load;
});


beforeEach(() => {
    // Default mock fetch that returns TEXT(url)
    // eslint-disable-next-line no-undef
    global.fetch = vi.fn(async (url) => ({
        ok: true,
        text: async () => `TEXT(${url})`
    }));
});

describe("load() - single file", () => {
    it("loads a single string path", async () => {
        const [txt] = await load("https://base/module.js", "./file.txt");
        expect(txt).toBe("TEXT(https://base/file.txt)");
    });

    it("fails if fetch returns !ok", async () => {
        // eslint-disable-next-line no-undef
        global.fetch = vi.fn(async () => ({
            ok: false,
            status: 404,
            statusText: "Not Found"
        }));

        await expect(load("https://x/module.js", "./missing.txt"))
            .rejects.toThrow(/404/);
    });
});

describe("load() - descriptor object { file, as }", () => {
    it("applies a transform function", async () => {
        const upper = (s) => s.toUpperCase();

        const [val] = await load("https://x/base.js", {
            file: "./foo.txt",
            as: upper
        });

        expect(val).toBe("TEXT(https://x/foo.txt)".toUpperCase());
    });

    it("falls back to raw text when no transform is provided", async () => {
        const [val] = await load("https://x/base.js", {
            file: "./foo.txt"
        });

        expect(val).toBe("TEXT(https://x/foo.txt)");
    });

    it("throws if descriptor is invalid", async () => {
        await expect(load("https://x/base.js", { file: 123 }))
            .rejects.toThrow(/Invalid item/);

        await expect(load("https://x/base.js", { as: () => {} }))
            .rejects.toThrow(/Invalid item/);
    });
});

describe("load() - multiple items", () => {
    it("loads multiple plain paths in order", async () => {
        const values = await load(
            "https://base/",
            "./a.txt",
            "./b.txt",
            "./c.txt"
        );

        expect(values).toEqual([
            "TEXT(https://base/a.txt)",
            "TEXT(https://base/b.txt)",
            "TEXT(https://base/c.txt)"
        ]);
    });

    it("preserves order regardless of fetch timing", async () => {
        // eslint-disable-next-line no-undef
        global.fetch = vi.fn(async (url) => {
            await new Promise(r => setTimeout(r, Math.random() * 20));
            return { ok: true, text: async () => `DATA(${url})` };
        });

        const values = await load(
            "https://ordered/",
            "./1.txt",
            "./2.txt",
            "./3.txt"
        );

        // Must stay in the same order as arguments
        expect(values).toEqual([
            "DATA(https://ordered/1.txt)",
            "DATA(https://ordered/2.txt)",
            "DATA(https://ordered/3.txt)"
        ]);
    });

    it("loads mixed string + descriptor items", async () => {
        const parse = (s) => ({ parsed: s });

        const res = await load(
            "https://x/",
            "./foo.txt",
            { file: "./bar.txt", as: parse }
        );

        expect(res[0]).toBe("TEXT(https://x/foo.txt)");
        expect(res[1]).toEqual({ parsed: "TEXT(https://x/bar.txt)" });
    });
});

describe("load() - resolver function base", () => {
    it("uses resolver(baseFn) to compute URLs", async () => {
        const resolver = (file) => `https://custom/${file}`;

        const [txt] = await load(resolver, "abc.txt");
        expect(txt).toBe("TEXT(https://custom/abc.txt)");
    });

    it("throws if resolver is used without a file argument", async () => {
        await expect(load(() => "", {file: 123}))
            .rejects.toThrow();
    });
});


describe("load() - invalid usage errors", () => {
    it("throws when an invalid item is passed", async () => {
        await expect(load("https://x/", 123))
            .rejects.toThrow();

        await expect(load("https://x/", null))
            .rejects.toThrow();
    });

    it("throws when base argument is incorrect", async () => {
        await expect(load(123, "./file.txt"))
            .rejects.toThrow();
    });
});
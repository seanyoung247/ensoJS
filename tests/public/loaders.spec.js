
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { testMode } from "../shared";

describe('File loaders', () => {

    let load;
    beforeAll(async () => {
        const mod = await testMode.importModule();
        load = mod.load;
    });

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('load.load with string resolver', async () => {
        fetch.mockResolvedValue({ text: () => Promise.resolve('ok') });

        await load.load('https://site.com/', 'a.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/a.txt');
    });

    it('load.text loads text', async () => {
        fetch.mockResolvedValue({ text: () => Promise.resolve('abc') });

        const result = await load.text('https://site.com/', 'f.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/f.txt');
        expect(result).toBe('abc');
    });

});
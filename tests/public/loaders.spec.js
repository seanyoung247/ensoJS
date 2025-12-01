
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { testMode } from "../shared";


describe('File loaders', () => {

    const siteURL = 'https://site.com/';
    let load;
    beforeAll(async () => {
        const mod = await testMode.importModule();
        load = mod.load;
    });

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('load.load with string resolvers', async () => {
        fetch.mockResolvedValue(
            { text: () => Promise.resolve('ok') }
        );

        await load.load(siteURL, 'a.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/a.txt');
    });

    it('load.load with function resolvers', async () => {
        fetch.mockResolvedValue(
            { text: () => Promise.resolve('ok') }
        );

        await load.load(file=>siteURL+file, 'a.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/a.txt');
    });

    it('load.load with absolute path', async () => {
        fetch.mockResolvedValue(
            { text: () => Promise.resolve('ok') }
        );

        await load.load('https://site.com/a.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/a.txt');
    });

    it('load.text loads text', async () => {
        fetch.mockResolvedValue(
            { text: () => Promise.resolve('abc') }
        );

        const result = await load.text(siteURL, 'f.txt');

        expect(fetch).toHaveBeenCalledWith('https://site.com/f.txt');
        expect(result).toBe('abc');
    });

    it('load.json loads and converts json', async () => {
        fetch.mockResolvedValue({ json: () => Promise.resolve({ a: 1 }) });
        const result = await load.json(siteURL, 'a.json');
        expect(result).toEqual({ a: 1 });
    });

    it('load.css loads and converts css', async () => {
        fetch.mockResolvedValue({
            text: () => Promise.resolve('.a { color:red; }')
        });
        const sheet = await load.css(siteURL, 'x.css');
        expect(sheet).toBeInstanceOf(CSSStyleSheet);
    });

    it('load.html loads html and constructs an EnsoTemplate', async () => {
        fetch.mockResolvedValue({
            text: () => Promise.resolve('<div>Hello</div>')
        });
        const tpl = await load.html(siteURL, 'x.html');
        expect(tpl.constructor.name).toBe('EnsoTemplate');
    });

    it('load.all selects ', async () => {

        const spyJson = vi.spyOn(load, 'json').mockImplementation(()=>({a:1}));
        const spyHtml = vi.spyOn(load, 'html').mockImplementation(()=>'<div>Hello</div>');
        const spyText = vi.spyOn(load, 'text').mockImplementation(()=>'Hello');

        const [json, html, text] = await load.all(siteURL, 'a.json', 'b.html', 'c.none');

        expect(spyJson).toHaveBeenCalled();
        expect(spyHtml).toHaveBeenCalled();
        expect(spyText).toHaveBeenCalled();

        expect(json).toEqual({a:1});
        expect(html).toBe('<div>Hello</div>');
        expect(text).toBe('Hello');
    });

});
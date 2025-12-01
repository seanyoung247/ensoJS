/* eslint-disable no-undef */
import fs from 'node:fs';
import path from 'node:path';

// vite-raw.js
export default function viteRaw() {
    return {
        name: 'vite-raw',   // required name
        enforce: 'pre',     // run before default Vite plugins

        // Only active in dev mode
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Match raw files: e.g., modal.css or *.html
                if (req.url && req.url.endsWith('.css') || req.url.endsWith('.html')) {
                    // Resolve the absolute path in the project
                    const filePath = path.join(process.cwd(), req.url.split('?')[0]);

                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        res.setHeader('Content-Type', req.url.endsWith('.css') ? 'text/css' : 'text/html');
                        res.end(content);
                        return;
                    }
                }
                next();
            });
        }
    };
}

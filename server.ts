import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to extract emails from URLs
  app.post("/api/extract", async (req, res) => {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "Invalid URLs provided" });
    }

        const results: { url: string; emails: string[]; error?: string }[] = [];

    for (const url of urls) {
      try {
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = `https://${targetUrl}`;
        }

        const domain = new URL(targetUrl).hostname;
        const visited = new Set<string>();
        const queue: string[] = [targetUrl];
        const allEmails = new Set<string>();
        const MAX_PAGES = 200; // Limit to prevent infinite loops/timeouts
        let pagesProcessed = 0;

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

        while (queue.length > 0 && pagesProcessed < MAX_PAGES) {
          const currentUrl = queue.shift()!;
          if (visited.has(currentUrl)) continue;
          visited.add(currentUrl);
          pagesProcessed++;

          try {
            const response = await axios.get(currentUrl, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              }
            });

            const html = response.data;
            if (typeof html !== 'string') continue;

            // Extract emails from HTML text
            const foundEmails = html.match(emailRegex) || [];
            foundEmails.forEach(e => {
              const lower = e.toLowerCase();
              if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.gif') && !lower.endsWith('.svg')) {
                allEmails.add(e);
              }
            });

            // Extract emails from mailto links
            const $ = cheerio.load(html);
            $('a[href^="mailto:"]').each((_, el) => {
              const href = $(el).attr('href');
              if (href) {
                const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
                if (email && emailRegex.test(email)) {
                  allEmails.add(email);
                }
              }
            });

            // Find more links to crawl
            $('a').each((_, el) => {
              const href = $(el).attr('href');
              if (href) {
                try {
                  const absoluteUrl = new URL(href, targetUrl).href.split('#')[0]; // Remove fragments
                  const urlObj = new URL(absoluteUrl);
                  
                  // Only crawl if same domain and not visited and not a file
                  if (urlObj.hostname === domain && 
                      !visited.has(absoluteUrl) && 
                      !queue.includes(absoluteUrl) &&
                      !/\.(pdf|jpg|jpeg|png|gif|zip|docx|xlsx|mp4|mp3)$/i.test(absoluteUrl)) {
                    queue.push(absoluteUrl);
                  }
                } catch (e) {}
              }
            });
          } catch (e) {
            // Skip failed pages
          }
        }

        results.push({ url: targetUrl, emails: Array.from(allEmails) });
      } catch (error: any) {
        results.push({ url, emails: [], error: error.message });
      }
    }

    res.json({ results });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

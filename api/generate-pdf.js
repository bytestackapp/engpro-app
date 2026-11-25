/**
 * Vercel Serverless Function: PDF Generation
 * File location: /api/generate-pdf.js
 * Endpoint: POST /api/generate-pdf  (requires a logged-in EngPro user)
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const PDFMerger = require('pdf-merger-js');

// The anon key is public by design (same value as js/supabase.js).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtjsgvajdgqjlindbhxw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anNndmFqZGdxamxpbmRiaHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMzNjQsImV4cCI6MjA5NjAxOTM2NH0.tCNEjswwgKONyiEcdfgZ_TJczofQZcvmPIh7uNS7D_U';

const MAX_TABLES = 80;

/** Verify the Supabase session token and that the user is active. */
async function authenticate(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  if (!user || !user.id) return null;

  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=is_active&id=eq.${encodeURIComponent(user.id)}`,
    { headers }
  );
  if (!profRes.ok) return null;
  const rows = await profRes.json();
  if (!rows.length || rows[0].is_active === false) return null;

  return user;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getPuppeteerConfig() {
  if (process.env.VERCEL) {
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }
  // Local development — set CHROME_PATH or the default Windows path is used
  return {
    headless: true,
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  };
}

/** Strips an @media print {...} block, handling nested braces. */
function stripMediaPrint(css) {
  const marker = '@media print';
  let result = '';
  let i = 0;
  while (i < css.length) {
    const idx = css.indexOf(marker, i);
    if (idx === -1) { result += css.slice(i); break; }
    result += css.slice(i, idx);
    const openIdx = css.indexOf('{', idx);
    if (openIdx === -1) { result += css.slice(idx); break; }
    let depth = 1;
    let j = openIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    i = j;
  }
  return result;
}

function createHTMLDocument(headerHtml, contentHtml, css, landscape = false) {
  const pageSize = landscape ? '420mm 297mm' : '297mm 420mm';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${pageSize}; margin: 10mm; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
    ${stripMediaPrint(css)}
  </style>
</head>
<body>
  <div id="pdf-preview">
    ${headerHtml}
    ${contentHtml}
  </div>
</body>
</html>`;
}

/** Render one HTML string to PDF using an already-open browser. */
async function renderPdf(browser, html, landscape) {
  const page = await browser.newPage();
  try {
    // The report is static HTML: no scripts and no network access are needed.
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const url = r.url();
      if (url.startsWith('data:') || url === 'about:blank') r.continue();
      else r.abort();
    });

    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A3',
      landscape: !!landscape,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user = null;
  try { user = await authenticate(req); } catch (e) { user = null; }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Session expired. Please sign in again.' });
  }

  const { project_name, week_range, prepared_by, tables, css } = req.body || {};

  if (!tables || !Array.isArray(tables) || tables.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid tables' });
  }
  if (tables.length > MAX_TABLES) {
    return res.status(400).json({ error: `Too many tables (max ${MAX_TABLES})` });
  }

  const headerHtml = `
    <div class="pdf-header">
      <div class="pdf-logo-cell"><div class="pdf-logo-box">LOGO</div></div>
      <div class="pdf-title-cell">WEEKLY PROGRESS REPORT</div>
      <div class="pdf-meta-cell">
        <div><span class="pdf-meta-label">Project</span>: ${esc(project_name) || 'N/A'}</div>
        <div><span class="pdf-meta-label">Week</span>: ${esc(week_range) || 'N/A'}</div>
        <div><span class="pdf-meta-label">Prepared By</span>: ${esc(prepared_by) || 'N/A'}</div>
      </div>
    </div>
  `;

  let browser;
  try {
    browser = await puppeteer.launch(await getPuppeteerConfig());

    const pdfBuffers = [];
    const failed = [];

    for (const table of tables) {
      const contentHtml = `
        <div class="pdf-section-header">${esc(table.section) || 'Report'}</div>
        ${table.subsection ? `<div class="pdf-subsection-header">${esc(table.subsection)}</div>` : ''}
        ${table.html || ''}
      `;
      try {
        const html = createHTMLDocument(headerHtml, contentHtml, css || '', table.landscape);
        pdfBuffers.push(await renderPdf(browser, html, table.landscape));
      } catch (err) {
        console.error(`[PDF] Failed to generate ${table.id}:`, err.message);
        failed.push(table.id || table.section || 'unknown');
      }
    }

    if (failed.length > 0) {
      return res.status(500).json({
        error: 'PDF generation failed',
        message: `Could not render ${failed.length} of ${tables.length} pages (${failed.join(', ')}). Please try again.`,
      });
    }

    const merger = new PDFMerger();
    for (const buffer of pdfBuffers) {
      await merger.add(buffer);
    }
    const mergedPdf = await merger.saveAsBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="weekly_progress_report.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(mergedPdf);
  } catch (error) {
    console.error('[PDF] Error:', error);
    return res.status(500).json({ error: 'PDF generation failed', message: error.message });
  } finally {
    if (browser) await browser.close();
  }
};

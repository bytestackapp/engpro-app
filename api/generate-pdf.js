/**
 * Vercel Serverless Function: PDF Generation (Optimized for Vercel)
 * 
 * File location: /api/generate-pdf.js
 * Endpoint: POST /api/generate-pdf
 * 
 * This uses Vercel's optimized Chromium environment for fast PDF rendering.
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const PDFMerger = require('pdf-merger-js');

/**
 * Get Puppeteer config for Vercel environment
 */
async function getPuppeteerConfig() {
  const isVercel = !!process.env.VERCEL;
  
  if (isVercel) {
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }
  
  // Local development — use locally installed Chrome
  return {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  };
}

/**
 * Properly strips an @media print {...} block, correctly handling
 * nested braces (a plain regex can't do this reliably).
 */
function stripMediaPrint(css) {
  const marker = '@media print';
  let result = '';
  let i = 0;
  while (i < css.length) {
    const idx = css.indexOf(marker, i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }
    result += css.slice(i, idx);
    const openIdx = css.indexOf('{', idx);
    if (openIdx === -1) {
      result += css.slice(idx);
      break;
    }
    let depth = 1;
    let j = openIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    i = j; // skip past the fully-matched @media print { ... } block
  }
  return result;
}


/**
 * Create HTML document with proper A3 page sizing
 */
function createHTMLDocument(headerHtml, contentHtml, css, landscape = false) {
  const pageSize = landscape 
    ? '420mm 297mm'  // A3 landscape
    : '297mm 420mm'; // A3 portrait

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${pageSize}; margin: 10mm; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
    #content { padding: 8mm; }
    
    /* Strip @media print since we're rendering directly */
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

/**
 * Generate a single PDF from HTML
 */
async function generatePDFFromHTML(html, landscape = false) {
  let browser;
  try {
    const config = await getPuppeteerConfig();
    browser = await puppeteer.launch(config);
    
    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const pdf = await page.pdf({
      format: landscape ? 'A3' : 'A3',
      landscape: landscape,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });
    
    return pdf;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 30 second timeout for PDF generation
  req.socket.setTimeout(30 * 1000);

  try {
    const { project_name, week_range, prepared_by, tables, css } = req.body;

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid tables' });
    }

    console.log(`[PDF Generation] Starting: ${tables.length} tables`);
    const startTime = Date.now();

    // Create header HTML
    const headerHtml = `
      <div class="pdf-header">
        <div class="pdf-logo-cell"><div class="pdf-logo-box">LOGO</div></div>
        <div class="pdf-title-cell">WEEKLY PROGRESS REPORT</div>
        <div class="pdf-meta-cell">
          <div><span class="pdf-meta-label">Project</span>: ${project_name || 'N/A'}</div>
          <div><span class="pdf-meta-label">Week</span>: ${week_range || 'N/A'}</div>
          <div><span class="pdf-meta-label">Prepared By</span>: ${prepared_by || 'N/A'}</div>
        </div>
      </div>
    `;

    // Generate individual PDFs
    const pdfBuffers = [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const tableStartTime = Date.now();

      const contentHtml = `
        <div class="pdf-section-header">${table.section || 'Report'}</div>
        ${table.subsection ? `<div class="pdf-subsection-header">${table.subsection}</div>` : ''}
        ${table.html || ''}
      `;

      try {
        const html = createHTMLDocument(headerHtml, contentHtml, css || '', table.landscape);
        const pdfBuffer = await generatePDFFromHTML(html, table.landscape);
        pdfBuffers.push(pdfBuffer);
        
        const elapsed = Date.now() - tableStartTime;
        console.log(`[PDF] Table ${i + 1}/${tables.length}: ${table.id} (${elapsed}ms)`);
      } catch (error) {
        console.error(`[PDF] Failed to generate ${table.id}:`, error.message);
        // Continue with next table
      }
    }

    if (pdfBuffers.length === 0) {
      return res.status(500).json({ error: 'Failed to generate any PDFs' });
    }

    console.log(`[PDF] Merging ${pdfBuffers.length} PDFs...`);

    // Merge PDFs
    const merger = new PDFMerger();
    for (const buffer of pdfBuffers) {
      await merger.add(buffer);
    }

    const mergedPdf = await merger.saveAsBuffer();
    const totalTime = Date.now() - startTime;

    console.log(`[PDF] Complete: ${pdfBuffers.length} tables merged in ${totalTime}ms`);

    // Return merged PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="weekly_progress_report.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.status(200).send(mergedPdf);

  } catch (error) {
    console.error('[PDF] Error:', error);
    
    return res.status(500).json({
      error: 'PDF generation failed',
      message: error.message
    });
  }
};

/**
 * PDF Integration for Vercel Deployment
 * 
 * This script works with Vercel Serverless Functions at /api/generate-pdf
 * Call generatePDFFromPreview() from a button click
 */

class VercelPDFGenerator {
  constructor(apiEndpoint = '/api/generate-pdf') {
    this.apiEndpoint = apiEndpoint;
    this.projectName = 'Project Bamboo Non-Jetty';
    this.weekRange = '15 May 26 - 21 May 26';
    this.preparedBy = 'Construction Engineering';
    this.isGenerating = false;
  }

  /**
   * Extract CSS from the page
   */
  extractCSS() {
    const styles = document.querySelectorAll('style');
    let css = '';
    styles.forEach(style => {
      if (style.textContent.includes('pdf-table') || style.textContent.includes('pdf-page')) {
        css += style.textContent;
      }
    });
    return css;
  }

  /**
   * Extract all tables from the pdf-preview div
   */
  extractTablesFromPreview() {
    const preview = document.getElementById('pdf-preview');
    if (!preview) {
      console.error('pdf-preview element not found');
      return null;
    }

    // Pull the live project/date-range/prepared-by info directly from the
    // first rendered page's header, so the exported PDF always matches
    // whatever is actually on screen — instead of using fixed defaults.
    const firstHeader = preview.querySelector('.pdf-header');
    const headerInfo = {
      projectName: firstHeader?.dataset.project    || this.projectName,
      weekRange:   firstHeader?.dataset.dateRange  || this.weekRange,
      preparedBy:  firstHeader?.dataset.preparedBy || this.preparedBy,
    };

    const tables = [];
    let tableIndex = 0;

    const pages = preview.querySelectorAll('.pdf-page');
    pages.forEach((page, pageIdx) => {
      const sectionHeader = page.querySelector('.pdf-section-header');
      const subsectionHeader = page.querySelector('.pdf-subsection-header');
      const table = page.querySelector('.pdf-table');

      if (table) {
        const section = sectionHeader ? sectionHeader.textContent.trim() : 'Report';
        const subsection = subsectionHeader ? subsectionHeader.textContent.trim() : '';
        const landscape = page.classList.contains('landscape');

        tables.push({
          id: `table_${String(tableIndex).padStart(3, '0')}`,
          section: section,
          subsection: subsection,
          html: table.outerHTML,
          landscape: landscape
        });

        tableIndex++;
      }
    });

    console.log(`[PDF] Extracted ${tables.length} tables from preview`);
    return { tables, headerInfo };
  }

  /**
   * Generate PDF by calling Vercel serverless function
   */
  async generatePDF() {
    if (this.isGenerating) {
      this.showStatus('PDF generation already in progress...', 'info');
      return false;
    }

    try {
      this.isGenerating = true;
      this.showStatus('Extracting tables and generating PDF...', 'info');

      const extracted = this.extractTablesFromPreview();
      if (!extracted || extracted.tables.length === 0) {
        this.showStatus('No tables found in preview', 'error');
        return false;
      }
      const { tables, headerInfo } = extracted;

      const css = this.extractCSS();

      const payload = {
        project_name: headerInfo.projectName,
        week_range: headerInfo.weekRange,
        prepared_by: headerInfo.preparedBy,
        tables: tables,
        css: css
      };

      console.log(`[PDF] Sending ${tables.length} tables to Vercel API...`);

      const token = await getAuthToken();
      if (!token) throw new Error('Session expired. Please sign in again.');

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const error = await response.json();
          errorMsg = error.message || error.error || errorMsg;
        } catch (e) {
          // If response isn't JSON, use status
        }
        throw new Error(errorMsg);
      }

      // Get the PDF as blob
      const pdfBlob = await response.blob();
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      console.log(`[PDF] ✓ PDF generated successfully (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB)`);
      this.showStatus(`✓ PDF ready! Downloading...`, 'success');

      // Trigger download
      this.downloadPDF(pdfBlob);
      return true;

    } catch (error) {
      console.error('[PDF] Generation failed:', error);
      this.showStatus(`❌ Error: ${error.message}`, 'error');
      return false;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Trigger PDF download
   */
  downloadPDF(pdfBlob) {
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly_progress_report.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[PDF] Download started');
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    let status = document.getElementById('pdf-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'pdf-status';
      status.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
      `;
      document.body.appendChild(status);
    }

    status.textContent = message;
    status.style.display = 'block';

    const colors = {
      'info': { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
      'success': { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
      'error': { bg: '#ffebee', text: '#c62828', border: '#ef5350' }
    };

    const color = colors[type] || colors['info'];
    status.style.backgroundColor = color.bg;
    status.style.color = color.text;
    status.style.borderLeft = `4px solid ${color.border}`;

    if (type !== 'info') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 5000);
    }
  }
}

// Global instance
let pdfGenerator = null;

/**
 * Global function to call from HTML button click
 * Usage: <button onclick="generatePDFFromPreview()">Download PDF</button>
 */
window.generatePDFFromPreview = async function() {
  if (!pdfGenerator) {
    pdfGenerator = new VercelPDFGenerator();
  }
  await pdfGenerator.generatePDF();
};

// Log when loaded
console.log('[PDF Integration] Loaded. Call generatePDFFromPreview() to generate PDF.');

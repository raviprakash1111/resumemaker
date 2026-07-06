/**
 * pdf-export.js — PDF Export using html2canvas + jsPDF
 * Renders resume/cover letter to PDF with high quality output.
 */

const PDFExporter = {

  /**
   * Export an HTML element as a PDF
   * @param {HTMLElement} element - The element to export
   * @param {string} filename - Output filename (without .pdf)
   */
  async exportElementAsPDF(element, filename) {
    const { jsPDF } = window.jspdf;

    // Show progress
    this._setStatus('Rendering to canvas...');

    try {
      // Temporarily make element visible for rendering
      const originalDisplay = element.style.display;
      const originalPosition = element.style.position;
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,           // 2x for crisp quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      });

      element.style.display = originalDisplay;
      element.style.position = originalPosition;

      this._setStatus('Generating PDF...');

      // A4 dimensions in mm
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgWidth = A4_WIDTH;
      const imgHeight = (canvasHeight * A4_WIDTH) / canvasWidth;

      // If content is taller than one page, split across pages
      let heightLeft = imgHeight;
      let position = 0;
      let pageNum = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      while (heightLeft > 0) {
        if (pageNum > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= A4_HEIGHT;
        position -= A4_HEIGHT;
        pageNum++;
      }

      pdf.save(`${filename}.pdf`);
      this._setStatus('');
      return true;
    } catch (err) {
      console.error('PDF export error:', err);
      this._setStatus('');
      throw err;
    }
  },

  /**
   * Export resume as PDF
   */
  async exportResume(resumeHTML, name, role) {
    const container = document.getElementById('resumeRenderArea');
    container.innerHTML = resumeHTML;

    // Apply necessary fonts
    this._injectFonts(container);

    const filename = `${this._sanitize(name)}_Resume_${this._sanitize(role)}`;
    await this.exportElementAsPDF(container, filename);
  },

  /**
   * Export cover letter as PDF
   */
  async exportCoverLetter(coverHTML, name, company) {
    const container = document.getElementById('coverRenderArea');
    container.innerHTML = coverHTML;
    this._injectFonts(container);

    const filename = `${this._sanitize(name)}_Cover_Letter_${this._sanitize(company)}`;
    await this.exportElementAsPDF(container, filename);
  },

  _sanitize(str) {
    return (str || 'Document').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  },

  _setStatus(msg) {
    // Can be used for progress display
    console.log('[PDF Export]', msg || 'Done');
  },

  _injectFonts(container) {
    // Ensure Google Fonts are loaded in render area
    if (!document.getElementById('pdf-fonts-link')) {
      const link = document.createElement('link');
      link.id = 'pdf-fonts-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
    // Copy stylesheet rules
    container.style.fontFamily = "'Inter', sans-serif";
  }
};

/**
 * parser.js — PDF Resume Parser using PDF.js
 * Extracts text from uploaded PDF resume and identifies key fields.
 */

// Set PDF.js worker source
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const ResumeParser = {

  /**
   * Extract full text from a PDF file
   */
  async extractText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Parse extracted text into structured data
   */
  parseFields(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const rawText = text.toLowerCase();

    const data = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      skills: [],
      experience: '',
      education: '',
      rawText: text,
      rawLines: lines
    };

    // Email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) data.email = emailMatch[0];

    // Phone
    const phoneMatch = text.match(/(\+?[\d\s\-().]{10,17})/);
    if (phoneMatch) {
      const cleaned = phoneMatch[0].replace(/\s+/g, ' ').trim();
      if (cleaned.replace(/\D/g, '').length >= 10) data.phone = cleaned;
    }

    // LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) data.linkedin = linkedinMatch[0];

    // Portfolio / GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) data.portfolio = githubMatch[0];

    // Name — first non-email line that looks like a name
    for (const line of lines.slice(0, 6)) {
      if (
        !line.includes('@') &&
        !line.match(/^\+?\d/) &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('curriculum') &&
        line.split(' ').length <= 5 &&
        line.split(' ').length >= 1 &&
        line.length < 60 &&
        /^[A-Za-z\s.'-]+$/.test(line)
      ) {
        data.name = line;
        break;
      }
    }

    // Location (city, state patterns)
    const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}(?:\s+\d{5})?)/);
    if (locationMatch) data.location = locationMatch[0].trim();

    // Skills extraction
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript',
      'sql', 'mysql', 'postgresql', 'mongodb', 'html', 'css', 'aws', 'azure', 'gcp',
      'docker', 'kubernetes', 'git', 'machine learning', 'deep learning', 'tensorflow',
      'pytorch', 'pandas', 'numpy', 'scikit', 'excel', 'powerpoint', 'word',
      'project management', 'agile', 'scrum', 'jira', 'figma', 'photoshop', 'illustrator',
      'c++', 'c#', '.net', 'php', 'ruby', 'go', 'swift', 'kotlin', 'flutter', 'dart',
      'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
      'seo', 'google analytics', 'facebook ads', 'digital marketing', 'content writing',
      'data analysis', 'tableau', 'power bi', 'spark', 'hadoop', 'salesforce',
      'autocad', 'solidworks', 'matlab', 'labview'
    ];

    const foundSkills = skillKeywords.filter(skill => rawText.includes(skill));
    data.skills = [...new Set(foundSkills)].map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

    // Education
    const eduPatterns = [
      /b\.?tech|b\.?e\.|bachelor|b\.?sc|m\.?tech|master|m\.?sc|phd|mba|b\.?com|m\.?com/i
    ];
    for (const line of lines) {
      if (eduPatterns.some(p => p.test(line))) {
        data.education = line;
        break;
      }
    }

    // Experience summary — grab text around experience/work keywords
    const expIdx = lines.findIndex(l => /experience|employment|work history/i.test(l));
    if (expIdx !== -1) {
      const expLines = lines.slice(expIdx + 1, expIdx + 12);
      data.experience = expLines.join('. ').slice(0, 400);
    }

    return data;
  }
};

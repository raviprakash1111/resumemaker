/**
 * templates.js — HTML Template Renderer
 * Generates HTML for resume and cover letter based on template choice.
 */

const Templates = {

  // ─── Render Resume ───────────────────────────────────────────
  renderResume(data) {
    if (!data) return '<div class="error-msg">No resume data found</div>';
    
    // Add default fallbacks for nested properties to prevent crash on incomplete objects
    data.personal = data.personal || {};
    data.skills = data.skills || [];
    data.experiences = data.experiences || [];
    data.education = data.education || [];
    data.skillsGrouped = data.skillsGrouped || [];

    const tmpl = data.template || 'modern';
    switch (tmpl) {
      case 'executive': return this.renderExecutive(data);
      case 'classic':   return this.renderClassic(data);
      case 'minimal':   return this.renderMinimal(data);
      default:          return this.renderModern(data);
    }
  },

  // ─── MODERN TEMPLATE ────────────────────────────────────────
  renderModern(data) {
    const { personal, summary, experiences, skillsGrouped, skills, education } = data;

    const contactItems = [
      personal.email    && `<div class="rm-contact-item"><span>✉</span> ${personal.email}</div>`,
      personal.phone    && `<div class="rm-contact-item"><span>📞</span> ${personal.phone}</div>`,
      personal.location && `<div class="rm-contact-item"><span>📍</span> ${personal.location}</div>`,
      personal.linkedin && `<div class="rm-contact-item"><span>in</span> ${personal.linkedin}</div>`,
      personal.portfolio&& `<div class="rm-contact-item"><span>🔗</span> ${personal.portfolio}</div>`,
    ].filter(Boolean).join('');

    const skillBars = skills.slice(0, 8).map(skill => `
      <div class="rm-skill-bar">
        <div class="rm-skill-name">${this._esc(skill)}</div>
        <div class="rm-skill-track">
          <div class="rm-skill-fill" style="width:${65 + Math.floor(Math.random()*30)}%"></div>
        </div>
      </div>
    `).join('');

    const expHTML = experiences.map(exp => `
      <div class="rm-exp-item">
        <div class="rm-exp-header">
          <span class="rm-exp-role">${this._esc(exp.role)}</span>
          <span class="rm-exp-date">${this._esc(exp.duration)}</span>
        </div>
        <div class="rm-exp-company">${this._esc(exp.company)}</div>
        <ul class="rm-exp-bullets">
          ${exp.bullets.map(b => `<li>${this._esc(b)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const eduHTML = education.map(e => `
      <div class="rm-edu-item">
        <div class="rm-edu-degree">${this._esc(e.degree)}</div>
        <div class="rm-edu-school">${this._esc(e.institution)}</div>
        <div class="rm-edu-year">${this._esc(e.year)}</div>
      </div>
    `).join('');

    const skillChips = skills.map(s => `<span class="rm-skill-chip">${this._esc(s)}</span>`).join('');

    return `
      <div class="resume-modern">
        <div class="rm-sidebar">
          <div class="rm-name">${this._esc(personal.name)}</div>
          <div class="rm-title">${this._esc(personal.title)}</div>

          <div class="rm-section-title">Contact</div>
          ${contactItems}

          <div class="rm-section-title" style="margin-top:24px">Skills</div>
          ${skillBars || '<div style="font-size:0.75rem;color:rgba(255,255,255,0.5)">Add skills in Step 2</div>'}

          ${education.length ? `
            <div class="rm-section-title" style="margin-top:24px">Education</div>
            ${eduHTML}
          ` : ''}
        </div>

        <div class="rm-main">
          <div class="rm-main-name">${this._esc(personal.name)}</div>
          <div class="rm-main-title">${this._esc(personal.title)}</div>
          <div class="rm-divider"></div>

          <div class="rm-section">
            <div class="rm-sec-title">Professional Summary</div>
            <p class="rm-summary">${this._esc(summary)}</p>
          </div>

          <div class="rm-section">
            <div class="rm-sec-title">Experience</div>
            ${expHTML}
          </div>

          ${skills.length > 0 ? `
            <div class="rm-section">
              <div class="rm-sec-title">Core Competencies</div>
              <div class="rm-skills-cloud">${skillChips}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ─── EXECUTIVE TEMPLATE ─────────────────────────────────────
  renderExecutive(data) {
    const { personal, summary, experiences, skillsGrouped, skills, education } = data;

    const contactRows = [
      personal.email    && `<div class="re-contact-row">✉ ${personal.email}</div>`,
      personal.phone    && `<div class="re-contact-row">📞 ${personal.phone}</div>`,
      personal.location && `<div class="re-contact-row">📍 ${personal.location}</div>`,
      personal.linkedin && `<div class="re-contact-row">in ${personal.linkedin}</div>`,
    ].filter(Boolean).join('');

    const expHTML = experiences.map(exp => `
      <div class="re-exp-item">
        <div class="re-exp-header">
          <span class="re-exp-role">${this._esc(exp.role)}</span>
          <span class="re-exp-date">${this._esc(exp.duration)}</span>
        </div>
        <div class="re-exp-company">${this._esc(exp.company)}</div>
        <ul class="re-exp-bullets">
          ${exp.bullets.map(b => `<li>${this._esc(b)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const skillGroupsHTML = skillsGrouped.map(([label, items]) => `
      <div class="re-skill-group">
        <h4>${this._esc(label)}</h4>
        <p>${this._esc(items)}</p>
      </div>
    `).join('');

    const eduHTML = education.map(e => `
      <div class="re-edu-item">
        <div class="re-edu-left">
          <strong>${this._esc(e.degree)}</strong><br/>
          <span style="color:#6366f1;font-size:0.82rem;font-family:Inter,sans-serif">${this._esc(e.institution)}</span>
        </div>
        <div class="re-edu-right">${this._esc(e.year)}</div>
      </div>
    `).join('');

    return `
      <div class="resume-executive">
        <div class="re-header">
          <div>
            <div class="re-name">${this._esc(personal.name)}</div>
            <div class="re-title">${this._esc(personal.title)}</div>
          </div>
          <div class="re-contact">${contactRows}</div>
        </div>
        <div class="re-accent-bar"></div>
        <div class="re-body">
          <div class="re-section">
            <div class="re-sec-title">Executive Summary</div>
            <p class="re-summary">${this._esc(summary)}</p>
          </div>

          <div class="re-section">
            <div class="re-sec-title">Professional Experience</div>
            ${expHTML}
          </div>

          ${skillsGrouped.length > 0 ? `
            <div class="re-section">
              <div class="re-sec-title">Areas of Expertise</div>
              <div class="re-skills-grid">${skillGroupsHTML}</div>
            </div>
          ` : ''}

          ${education.length ? `
            <div class="re-section">
              <div class="re-sec-title">Education</div>
              ${eduHTML}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ─── CLASSIC TEMPLATE ────────────────────────────────────────
  renderClassic(data) {
    const { personal, summary, experiences, skills, education } = data;

    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin
    ].filter(Boolean);

    const contactHTML = contacts.map((c, i) =>
      i < contacts.length - 1
        ? `<span>${this._esc(c)}</span><span class="rc-contact-sep">|</span>`
        : `<span>${this._esc(c)}</span>`
    ).join('');

    const expHTML = experiences.map(exp => `
      <div class="rc-exp-item">
        <div class="rc-exp-header">
          <span class="rc-exp-role">${this._esc(exp.role)}</span>
          <span class="rc-exp-date">${this._esc(exp.duration)}</span>
        </div>
        <div class="rc-exp-company">${this._esc(exp.company)}</div>
        <ul class="rc-exp-bullets">
          ${exp.bullets.map(b => `<li>${this._esc(b)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const skillTags = skills.map(s => `<span class="rc-skill-tag">${this._esc(s)}</span>`).join('');

    const eduHTML = education.map(e => `
      <div class="rc-edu-item">
        <div>
          <span class="rc-edu-school">${this._esc(e.degree)}</span>
          ${e.institution ? `, <span class="rc-edu-info">${this._esc(e.institution)}</span>` : ''}
        </div>
        <span class="rc-edu-info">${this._esc(e.year)}</span>
      </div>
    `).join('');

    return `
      <div class="resume-classic">
        <div class="rc-header">
          <div class="rc-name">${this._esc(personal.name)}</div>
          <div class="rc-title">${this._esc(personal.title)}</div>
          <div class="rc-contacts">${contactHTML}</div>
        </div>

        <div class="rc-section">
          <div class="rc-sec-title">Professional Summary</div>
          <p class="rc-summary">${this._esc(summary)}</p>
        </div>

        <div class="rc-section">
          <div class="rc-sec-title">Work Experience</div>
          ${expHTML}
        </div>

        ${skills.length > 0 ? `
          <div class="rc-section">
            <div class="rc-sec-title">Skills</div>
            <div class="rc-skills-list">${skillTags}</div>
          </div>
        ` : ''}

        ${education.length ? `
          <div class="rc-section">
            <div class="rc-sec-title">Education</div>
            ${eduHTML}
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── MINIMAL TEMPLATE ────────────────────────────────────────
  renderMinimal(data) {
    const { personal, summary, experiences, skills, education } = data;

    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin,
      personal.portfolio
    ].filter(Boolean);

    const contactHTML = contacts.map((c, i) =>
      i < contacts.length - 1
        ? `<span>${this._esc(c)}</span><span class="rmi-dot">·</span>`
        : `<span>${this._esc(c)}</span>`
    ).join('');

    const expHTML = experiences.map(exp => `
      <div class="rmi-exp-item">
        <div class="rmi-exp-meta">
          <div class="rmi-exp-date">${this._esc(exp.duration)}</div>
          <div class="rmi-exp-company">${this._esc(exp.company)}</div>
        </div>
        <div>
          <div class="rmi-exp-role">${this._esc(exp.role)}</div>
          <ul class="rmi-exp-bullets">
            ${exp.bullets.map(b => `<li>${this._esc(b)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    const skillTags = skills.map(s => `<span class="rmi-skill-tag">${this._esc(s)}</span>`).join('');

    const eduHTML = education.map(e => `
      <div style="margin-bottom:8px">
        <strong style="font-size:0.88rem">${this._esc(e.degree)}</strong>
        <div style="font-size:0.78rem;color:#64748b">${this._esc(e.institution)} ${e.year ? `· ${this._esc(e.year)}` : ''}</div>
      </div>
    `).join('');

    return `
      <div class="resume-minimal">
        <div class="rmi-header">
          <div class="rmi-name">${this._esc(personal.name)}</div>
          <div class="rmi-title">${this._esc(personal.title)}</div>
          <div class="rmi-contacts">${contactHTML}</div>
        </div>
        <div class="rmi-divider"></div>

        <div class="rmi-section">
          <div class="rmi-sec-title">Profile</div>
          <p class="rmi-summary">${this._esc(summary)}</p>
        </div>
        <div class="rmi-divider"></div>

        <div class="rmi-section">
          <div class="rmi-sec-title">Experience</div>
          ${expHTML}
        </div>
        <div class="rmi-divider"></div>

        ${skills.length > 0 ? `
          <div class="rmi-section">
            <div class="rmi-sec-title">Skills</div>
            <div class="rmi-skills">${skillTags}</div>
          </div>
          <div class="rmi-divider"></div>
        ` : ''}

        ${education.length ? `
          <div class="rmi-section">
            <div class="rmi-sec-title">Education</div>
            ${eduHTML}
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── COVER LETTER ────────────────────────────────────────────
  renderCoverLetter(cl) {
    cl = cl || {};
    return `
      <div class="cover-letter">
        <div class="cl-accent"></div>
        <div class="cl-header">
          <div>
            <div class="cl-name">${this._esc(cl.name || 'Your Name')}</div>
            <div class="cl-title">${this._esc(cl.title || 'Professional')}</div>
          </div>
          <div class="cl-contact">
            ${cl.email    ? `${this._esc(cl.email)}<br/>` : ''}
            ${cl.phone    ? `${this._esc(cl.phone)}<br/>` : ''}
            ${cl.location ? `${this._esc(cl.location)}` : ''}
          </div>
        </div>

        <div class="cl-date">${this._esc(cl.date || new Date().toLocaleDateString())}</div>

        <div class="cl-recipient">
          <div class="cl-recipient-name">${this._esc(cl.recipientTitle || 'Hiring Manager')}</div>
          <div class="cl-recipient-info">
            ${this._esc(cl.recipientCompany || 'Target Company')}<br/>
            Hiring & Recruitment Team
          </div>
        </div>

        <div class="cl-subject">Subject: ${this._esc(cl.subject || 'Job Application')}</div>

        <div class="cl-body">
          <p>Dear ${this._esc(cl.recipientTitle || 'Hiring Manager')},</p>
          <p>${this._esc(cl.opening || 'I am writing to express my interest in the open position.')}</p>
          <p>${this._esc(cl.middle || 'My skills and experience align closely with your requirements.')}</p>
          <p>${this._esc(cl.closing || 'Thank you for your time and consideration.')}</p>
        </div>

        <div class="cl-signature">
          <div class="cl-sig-label">Warm regards,</div>
          <div class="cl-sig-name">${this._esc(cl.signatureName || cl.name || 'Candidate')}</div>
        </div>
      </div>
    `;
  },

  // ─── Utility: Escape HTML ────────────────────────────────────
  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

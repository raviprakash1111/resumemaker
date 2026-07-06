/**
 * app.js — Main Application Controller
 * Manages state, navigation, event handlers, and orchestrates all modules.
 */

// ─── App State ────────────────────────────────────────────────
const AppState = {
  currentStep: 1,
  parsedResume: null,
  skills: [],
  generatedData: null,
  activeTab: 'resume',
  editMode: false
};

// ─── DOM References ──────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initUpload();
  initSkillInput();
  initNavigation();
  initPreviewControls();
  initExport();
  lucide.createIcons();
});

// ─── HERO ────────────────────────────────────────────────────
function initHero() {
  $('heroCtaBtn').addEventListener('click', () => {
    $('heroSection').style.display = 'none';
    $('appMain').style.display = 'block';
    $('startOverBtn').style.display = 'inline-flex';
    goToStep(1);
  });

  $('startOverBtn').addEventListener('click', () => {
    if (confirm('Start over? All progress will be lost.')) {
      location.reload();
    }
  });
}

// ─── UPLOAD ──────────────────────────────────────────────────
function initUpload() {
  const zone = $('uploadZone');
  const fileInput = $('resumeFile');

  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  });

  $('skipUploadBtn').addEventListener('click', () => {
    AppState.parsedResume = {};
    $('step1Next').disabled = false;
    showToast('You can fill in details manually in the next step.', 'info');
  });

  $('step1Next').addEventListener('click', () => goToStep(2));
}

async function handleFileUpload(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please upload a PDF file.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File too large. Max 10MB.', 'error');
    return;
  }

  $('uploadProgress').style.display = 'block';
  animateProgress();

  try {
    const text = await ResumeParser.extractText(file);
    const parsed = ResumeParser.parseFields(text);
    AppState.parsedResume = parsed;

    $('progressFill').style.width = '100%';
    $('progressText').textContent = 'Parsing complete!';

    setTimeout(() => {
      $('uploadProgress').style.display = 'none';
      showExtractedInfo(parsed);
      prefillForm(parsed);
      $('step1Next').disabled = false;
      showToast('Resume parsed successfully! Details pre-filled.', 'success');
    }, 600);

  } catch (err) {
    console.error('Parse error:', err);
    $('uploadProgress').style.display = 'none';
    showToast('Could not parse PDF. You can fill in details manually.', 'error');
    AppState.parsedResume = {};
    $('step1Next').disabled = false;
  }
}

function animateProgress() {
  let width = 0;
  const fill = $('progressFill');
  const text = $('progressText');
  const msgs = ['Reading file...', 'Extracting text...', 'Analyzing fields...', 'Identifying skills...'];
  let msgIdx = 0;

  const interval = setInterval(() => {
    width += Math.random() * 15 + 5;
    if (width > 90) { clearInterval(interval); width = 90; }
    fill.style.width = width + '%';
    if (msgIdx < msgs.length - 1 && width > (msgIdx + 1) * 25) {
      text.textContent = msgs[++msgIdx];
    }
  }, 300);
}

function showExtractedInfo(parsed) {
  const container = $('extractedFields');
  const fields = [
    parsed.name     && `<div class="extracted-chip"><span class="chip-label">Name</span> ${parsed.name}</div>`,
    parsed.email    && `<div class="extracted-chip"><span class="chip-label">Email</span> ${parsed.email}</div>`,
    parsed.phone    && `<div class="extracted-chip"><span class="chip-label">Phone</span> ${parsed.phone}</div>`,
    parsed.location && `<div class="extracted-chip"><span class="chip-label">Location</span> ${parsed.location}</div>`,
    parsed.skills.length > 0 && `<div class="extracted-chip"><span class="chip-label">Skills Found</span> ${parsed.skills.length} skills detected</div>`,
    parsed.education && `<div class="extracted-chip"><span class="chip-label">Education</span> ${parsed.education.slice(0, 40)}...</div>`
  ].filter(Boolean);

  if (fields.length > 0) {
    container.innerHTML = fields.join('');
    $('extractedInfo').style.display = 'block';
  }
}

function prefillForm(parsed) {
  if (parsed.name)     $('fullName').value = parsed.name;
  if (parsed.email)    $('email').value = parsed.email;
  if (parsed.phone)    $('phone').value = parsed.phone;
  if (parsed.location) $('location').value = parsed.location;
  if (parsed.linkedin) $('linkedin').value = parsed.linkedin;
  if (parsed.portfolio)$('portfolio').value = parsed.portfolio;
  if (parsed.education)$('education').value = parsed.education;
  if (parsed.experience) $('experienceSummary').value = parsed.experience;

  // Add parsed skills
  if (parsed.skills && parsed.skills.length > 0) {
    parsed.skills.slice(0, 12).forEach(skill => addSkill(skill));
  }
}

// ─── SKILL INPUT ──────────────────────────────────────────────
function initSkillInput() {
  const input = $('skillInput');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.replace(',', '').trim();
      if (val) { addSkill(val); input.value = ''; }
    }
  });

  input.addEventListener('paste', e => {
    setTimeout(() => {
      const val = input.value;
      if (val.includes(',')) {
        val.split(',').map(s => s.trim()).filter(Boolean).forEach(addSkill);
        input.value = '';
      }
    }, 10);
  });

  // Allow backspace to remove last tag
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && AppState.skills.length > 0) {
      AppState.skills.pop();
      renderSkillTags();
    }
  });
}

function addSkill(skill) {
  const normalized = skill.trim();
  if (!normalized) return;
  if (AppState.skills.some(s => s.toLowerCase() === normalized.toLowerCase())) return;
  if (AppState.skills.length >= 20) { showToast('Max 20 skills allowed', 'error'); return; }
  AppState.skills.push(normalized);
  renderSkillTags();
}

function renderSkillTags() {
  const container = $('skillTags');
  container.innerHTML = AppState.skills.map((skill, idx) => `
    <div class="skill-tag">
      ${escapeHTML(skill)}
      <span class="skill-tag-remove" data-idx="${idx}" title="Remove">×</span>
    </div>
  `).join('');

  container.querySelectorAll('.skill-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.skills.splice(parseInt(btn.dataset.idx), 1);
      renderSkillTags();
    });
  });
}

// ─── NAVIGATION ──────────────────────────────────────────────
function initNavigation() {
  $('step2Back').addEventListener('click', () => goToStep(1));
  $('step2Next').addEventListener('click', () => {
    if (!validateStep2()) return;
    generateResume();
  });
  $('step3BackBtn').addEventListener('click', () => goToStep(2));
  $('backToPreviewBtn').addEventListener('click', () => goToStep(3));
  $('newResumeBtn').addEventListener('click', () => location.reload());
}

function goToStep(n) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  const target = $(`step${n}`);
  if (target) {
    target.classList.add('active');
    AppState.currentStep = n;
    updateNavSteps(n);
    window.scrollTo(0, 0);
  }
}

function updateNavSteps(active) {
  document.querySelectorAll('.nav-step').forEach(step => {
    const n = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (n === active) step.classList.add('active');
    else if (n < active) step.classList.add('completed');
  });
}

function validateStep2() {
  const required = [
    { id: 'fullName', label: 'Full Name' },
    { id: 'email', label: 'Email' },
    { id: 'targetRole', label: 'Target Job Role' },
    { id: 'industry', label: 'Industry / Field' },
    { id: 'expLevel', label: 'Experience Level' }
  ];

  for (const field of required) {
    const el = $(field.id);
    if (!el.value.trim()) {
      showToast(`Please fill in: ${field.label}`, 'error');
      el.focus();
      el.style.borderColor = 'var(--red)';
      setTimeout(() => { el.style.borderColor = ''; }, 2000);
      return false;
    }
  }

  if (AppState.skills.length === 0) {
    showToast('Please add at least 1 skill', 'error');
    $('skillInput').focus();
    return false;
  }

  return true;
}

// ─── GENERATE ─────────────────────────────────────────────────
async function generateResume() {
  showLoading(true);

  // Animate loading steps
  const steps = ['ls1', 'ls2', 'ls3', 'ls4', 'ls5'];
  for (let i = 0; i < steps.length; i++) {
    await delay(500);
    if (i > 0) {
      const prev = $(steps[i - 1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); prev.textContent = '✓ ' + prev.textContent.replace('✦ ', ''); }
    }
    const curr = $(steps[i]);
    if (curr) curr.classList.add('active');
  }

  await delay(600);

  const formData = collectFormData();
  const generated = Generator.generate(formData);
  AppState.generatedData = generated;

  showLoading(false);

  // Render preview
  renderPreview('resume');
  updateATSScore(generated.atsData);
  populateExportPage(generated);

  goToStep(3);

  // Animate ATS score ring
  setTimeout(() => animateATSScore(generated.atsData.score), 300);
}

function collectFormData() {
  return {
    fullName: $('fullName').value.trim(),
    jobTitle: $('jobTitle').value.trim() || $('targetRole').value.trim(),
    email: $('email').value.trim(),
    phone: $('phone').value.trim(),
    location: $('location').value.trim(),
    linkedin: $('linkedin').value.trim(),
    portfolio: $('portfolio').value.trim(),
    targetRole: $('targetRole').value.trim(),
    targetCompany: $('targetCompany').value.trim(),
    industry: $('industry').value,
    expLevel: $('expLevel').value,
    tone: $('tone').value,
    template: $('template').value,
    skills: [...AppState.skills],
    experienceSummary: $('experienceSummary').value.trim(),
    yearsExp: $('yearsExp').value || '3',
    education: $('education').value.trim(),
    achievements: $('achievements').value.trim(),
    jobDescription: $('jobDescription').value.trim()
  };
}

// ─── PREVIEW CONTROLS ────────────────────────────────────────
function initPreviewControls() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeTab = btn.dataset.tab;
      renderPreview(btn.dataset.tab);
    });
  });

  // Regenerate
  $('regenerateBtn').addEventListener('click', () => {
    if (!AppState.generatedData) return;
    showToast('Regenerating content...', 'info');
    const formData = collectFormData();
    const newData = Generator.generate(formData);
    AppState.generatedData = newData;
    renderPreview(AppState.activeTab);
    updateATSScore(newData.atsData);
    animateATSScore(newData.atsData.score);
    populateExportPage(newData);
    showToast('Content regenerated!', 'success');
  });

  // Edit Mode
  $('editModeBtn').addEventListener('click', () => {
    AppState.editMode = !AppState.editMode;
    const paper = $('previewPaper');
    if (AppState.editMode) {
      paper.contentEditable = 'true';
      paper.style.outline = '2px dashed rgba(99,102,241,0.4)';
      $('editModeBtn').textContent = 'Save Edits';
      $('editModeBtn').style.background = 'rgba(16,185,129,0.15)';
      showToast('Edit mode ON — click text to edit', 'info');
    } else {
      paper.contentEditable = 'false';
      paper.style.outline = '';
      $('editModeBtn').textContent = 'Edit Mode';
      $('editModeBtn').style.background = '';
      showToast('Edits saved', 'success');
    }
  });

  // Download current tab PDF
  $('downloadCurrentBtn').addEventListener('click', async () => {
    if (!AppState.generatedData) return;
    await downloadCurrentTab();
  });

  // Step 3 export both
  $('step3ExportBtn').addEventListener('click', () => {
    goToStep(4);
  });
}

function renderPreview(tab) {
  const data = AppState.generatedData;
  if (!data) return;

  const paper = $('previewPaper');
  if (tab === 'resume') {
    paper.innerHTML = Templates.renderResume(data);
  } else {
    paper.innerHTML = Templates.renderCoverLetter(data.coverLetter);
  }
}

// ─── ATS SCORE ───────────────────────────────────────────────
function updateATSScore(atsData) {
  $('atsGrade').textContent = atsData.grade;

  // Keywords
  const kwList = $('keywordList');
  const matchItems = atsData.matches.map(kw =>
    `<div class="keyword-item"><span class="keyword-name">${kw}</span><span class="keyword-badge kw-found">Found</span></div>`
  );
  const missingItems = atsData.missing.map(kw =>
    `<div class="keyword-item"><span class="keyword-name">${kw}</span><span class="keyword-badge kw-missing">Missing</span></div>`
  );
  kwList.innerHTML = [...matchItems, ...missingItems].join('');

  // Tips
  const tipsList = $('tipsList');
  tipsList.innerHTML = atsData.tips.map(t =>
    `<div class="tip-row"><span class="tip-icon">${t.icon}</span><span>${t.text}</span></div>`
  ).join('');
}

function animateATSScore(targetScore) {
  const circle = $('atsCircle');
  const numEl = $('atsScoreNum');
  if (!circle || !numEl) return;

  const circumference = 251;
  let current = 0;

  const timer = setInterval(() => {
    current += 2;
    if (current >= targetScore) { current = targetScore; clearInterval(timer); }

    const offset = circumference - (current / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    numEl.textContent = current;
  }, 20);
}

// ─── EXPORT ──────────────────────────────────────────────────
function initExport() {
  $('downloadResumeBtn').addEventListener('click', async () => {
    if (!AppState.generatedData) return;
    await downloadResume();
  });

  $('downloadCoverBtn').addEventListener('click', async () => {
    if (!AppState.generatedData) return;
    await downloadCoverLetter();
  });
}

async function downloadResume() {
  const data = AppState.generatedData;
  const btn = $('downloadResumeBtn');
  setButtonLoading(btn, true, 'Generating PDF...');
  try {
    const html = Templates.renderResume(data);
    await PDFExporter.exportResume(html, data.personal.name, data.targetRole);
    showToast('Resume PDF downloaded!', 'success');
  } catch (err) {
    showToast('PDF export failed. Try again.', 'error');
  } finally {
    setButtonLoading(btn, false, 'Download Resume PDF');
  }
}

async function downloadCoverLetter() {
  const data = AppState.generatedData;
  const btn = $('downloadCoverBtn');
  setButtonLoading(btn, true, 'Generating PDF...');
  try {
    const html = Templates.renderCoverLetter(data.coverLetter);
    await PDFExporter.exportCoverLetter(html, data.personal.name, data.company);
    showToast('Cover Letter PDF downloaded!', 'success');
  } catch (err) {
    showToast('PDF export failed. Try again.', 'error');
  } finally {
    setButtonLoading(btn, false, 'Download Cover Letter PDF');
  }
}

async function downloadCurrentTab() {
  if (AppState.activeTab === 'resume') {
    await downloadResume();
  } else {
    await downloadCoverLetter();
  }
}

function populateExportPage(data) {
  const company = data.company || 'Target Company';
  const role = data.targetRole || 'Role';

  $('coverTargetCompany').textContent = company;
  $('resumeExportMeta').textContent = `${role} · ${data.template} template · ATS score: ${data.atsData.score}/100`;
  $('coverExportMeta').textContent = `Addressed to ${company} · Professional tone`;
}

// ─── LOADING ─────────────────────────────────────────────────
function showLoading(show) {
  $('loadingOverlay').style.display = show ? 'flex' : 'none';
  if (show) {
    // Reset loading steps
    ['ls1','ls2','ls3','ls4','ls5'].forEach(id => {
      const el = $(id);
      if (el) { el.classList.remove('active','done'); }
    });
  }
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = $('toastContainer');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent)' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="color:${colors[type]};font-weight:700">${icons[type]}</span>
    <span>${escapeHTML(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── UTILITIES ───────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  const svgIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  const spinnerIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
  btn.innerHTML = loading
    ? `${spinnerIcon} ${text}`
    : `${svgIcon} ${text}`;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = $('navbar');
  if (window.scrollY > 10) {
    navbar.style.background = 'rgba(5,8,22,0.98)';
  } else {
    navbar.style.background = 'rgba(5,8,22,0.85)';
  }
});

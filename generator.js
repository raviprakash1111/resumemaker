/**
 * generator.js — Smart Content Generation Engine
 * Generates tailored resume content and cover letters based on field, role, skills, and experience.
 */

const Generator = {

  // ─── Field Data Maps ───────────────────────────────────────
  fieldData: {
    tech: {
      verbs: ['Engineered', 'Architected', 'Developed', 'Built', 'Deployed', 'Optimized', 'Scaled', 'Refactored', 'Implemented', 'Automated', 'Integrated', 'Designed', 'Maintained', 'Launched', 'Shipped', 'Debugged', 'Migrated', 'Modernized'],
      outcomes: ['improving system performance by {N}%', 'reducing load time by {N}ms', 'achieving {N}% test coverage', 'serving {N}K+ daily active users', 'cutting infrastructure costs by {N}%', 'reducing bug rate by {N}%', 'accelerating deployment cycles by {N}x', 'processing {N}M+ API requests/day'],
      keywords: ['full-stack', 'microservices', 'REST API', 'CI/CD', 'agile', 'cloud infrastructure', 'scalable architecture', 'code review', 'technical documentation', 'system design'],
      skillGroups: { 'Languages': [], 'Frameworks': [], 'Cloud & DevOps': [], 'Tools': [] }
    },
    data: {
      verbs: ['Analyzed', 'Modeled', 'Predicted', 'Visualized', 'Processed', 'Cleaned', 'Trained', 'Evaluated', 'Deployed', 'Automated', 'Optimized', 'Extracted', 'Transformed', 'Mined', 'Validated', 'Experimented'],
      outcomes: ['improving model accuracy by {N}%', 'reducing data processing time by {N}%', 'generating ${N}M in actionable insights', 'handling {N}GB+ datasets daily', 'increasing prediction accuracy to {N}%', 'cutting manual analysis time by {N}hrs/week'],
      keywords: ['machine learning', 'statistical modeling', 'data pipeline', 'A/B testing', 'predictive analytics', 'ETL', 'data warehouse', 'NLP', 'computer vision', 'feature engineering'],
      skillGroups: { 'ML Frameworks': [], 'Languages': [], 'Visualization': [], 'Databases': [] }
    },
    design: {
      verbs: ['Designed', 'Crafted', 'Prototyped', 'Researched', 'Wireframed', 'Iterated', 'Conducted', 'Created', 'Developed', 'Presented', 'Collaborated', 'Tested', 'Delivered', 'Conceptualized', 'Refined'],
      outcomes: ['increasing user engagement by {N}%', 'reducing bounce rate by {N}%', 'improving task completion rate to {N}%', 'conducting {N}+ user interviews', 'delivering {N} design systems', 'reducing support tickets by {N}%', 'boosting conversion rate by {N}%'],
      keywords: ['user research', 'wireframing', 'prototyping', 'design systems', 'accessibility', 'responsive design', 'usability testing', 'interaction design', 'information architecture', 'design thinking'],
      skillGroups: { 'Design Tools': [], 'Research': [], 'Prototyping': [], 'Collaboration': [] }
    },
    marketing: {
      verbs: ['Drove', 'Launched', 'Managed', 'Grew', 'Executed', 'Developed', 'Increased', 'Optimized', 'Created', 'Spearheaded', 'Analyzed', 'Built', 'Oversaw', 'Scaled', 'Collaborated', 'Targeted'],
      outcomes: ['increasing organic traffic by {N}%', 'growing email list by {N}K+ subscribers', 'achieving {N}% ROAS on paid campaigns', 'reducing CAC by {N}%', 'increasing conversion rate by {N}%', 'generating {N}K+ qualified leads/month', 'growing social following by {N}K+'],
      keywords: ['digital marketing', 'SEO/SEM', 'content strategy', 'campaign management', 'lead generation', 'brand awareness', 'growth hacking', 'marketing automation', 'A/B testing', 'funnel optimization'],
      skillGroups: { 'Digital Channels': [], 'Analytics': [], 'Tools': [], 'Strategy': [] }
    },
    finance: {
      verbs: ['Managed', 'Analyzed', 'Forecasted', 'Prepared', 'Evaluated', 'Executed', 'Advised', 'Reviewed', 'Built', 'Structured', 'Monitored', 'Reduced', 'Generated', 'Presented', 'Led', 'Identified'],
      outcomes: ['managing portfolio of ${N}M+', 'reducing operational costs by {N}%', 'achieving {N}% return on investment', 'processing ${N}M in transactions monthly', 'improving reporting accuracy by {N}%', 'saving ${N}K through process optimization', 'growing revenue by {N}% YoY'],
      keywords: ['financial modeling', 'risk management', 'financial reporting', 'budget planning', 'regulatory compliance', 'investment analysis', 'portfolio management', 'valuation', 'due diligence', 'GAAP'],
      skillGroups: { 'Financial Tools': [], 'Analysis': [], 'Reporting': [], 'Compliance': [] }
    },
    healthcare: {
      verbs: ['Administered', 'Managed', 'Coordinated', 'Assessed', 'Monitored', 'Implemented', 'Collaborated', 'Documented', 'Conducted', 'Provided', 'Trained', 'Developed', 'Maintained', 'Improved', 'Ensured'],
      outcomes: ['improving patient satisfaction scores by {N}%', 'reducing readmission rates by {N}%', 'managing {N}+ patient cases daily', 'training {N}+ medical staff members', 'reducing documentation time by {N}%', 'achieving {N}% compliance rate'],
      keywords: ['patient care', 'clinical protocols', 'healthcare compliance', 'EHR systems', 'HIPAA', 'quality improvement', 'medical documentation', 'interdisciplinary collaboration', 'evidence-based practice'],
      skillGroups: { 'Clinical Skills': [], 'Systems': [], 'Compliance': [], 'Specializations': [] }
    },
    education: {
      verbs: ['Taught', 'Developed', 'Designed', 'Mentored', 'Facilitated', 'Assessed', 'Implemented', 'Guided', 'Created', 'Led', 'Collaborated', 'Evaluated', 'Supported', 'Inspired', 'Managed'],
      outcomes: ['improving student performance by {N}%', 'managing classes of {N}+ students', 'developing {N}+ curriculum modules', 'achieving {N}% student pass rate', 'increasing student engagement by {N}%', 'mentoring {N}+ students to university admission'],
      keywords: ['curriculum development', 'student engagement', 'differentiated instruction', 'assessment design', 'classroom management', 'educational technology', 'learning outcomes', 'student mentoring'],
      skillGroups: { 'Teaching Methods': [], 'Subjects': [], 'EdTech': [], 'Administration': [] }
    },
    sales: {
      verbs: ['Closed', 'Grew', 'Managed', 'Developed', 'Prospected', 'Negotiated', 'Built', 'Exceeded', 'Generated', 'Expanded', 'Cultivated', 'Delivered', 'Collaborated', 'Achieved', 'Identified'],
      outcomes: ['exceeding quota by {N}%', 'generating ${N}M in new revenue', 'closing {N}+ enterprise deals/quarter', 'growing territory by {N}%', 'expanding client base by {N}+ accounts', 'achieving {N}% customer retention rate'],
      keywords: ['pipeline management', 'account management', 'B2B sales', 'Salesforce CRM', 'consultative selling', 'revenue growth', 'territory management', 'client relationships', 'solution selling'],
      skillGroups: { 'CRM Tools': [], 'Sales Methods': [], 'Industries': [], 'Skills': [] }
    },
    hr: {
      verbs: ['Managed', 'Recruited', 'Developed', 'Implemented', 'Led', 'Conducted', 'Designed', 'Facilitated', 'Collaborated', 'Maintained', 'Improved', 'Advised', 'Onboarded', 'Resolved', 'Trained'],
      outcomes: ['reducing time-to-hire by {N}%', 'hiring {N}+ employees per quarter', 'improving retention rate by {N}%', 'managing HR for {N}+ employee organization', 'reducing recruitment costs by {N}%', 'achieving {N}% employee satisfaction score'],
      keywords: ['talent acquisition', 'employee relations', 'HRIS systems', 'performance management', 'compensation & benefits', 'workforce planning', 'HR compliance', 'onboarding', 'L&D'],
      skillGroups: { 'HRIS Systems': [], 'Compliance': [], 'Recruiting': [], 'L&D': [] }
    },
    engineering: {
      verbs: ['Designed', 'Developed', 'Engineered', 'Managed', 'Led', 'Analyzed', 'Built', 'Improved', 'Tested', 'Implemented', 'Coordinated', 'Supervised', 'Optimized', 'Delivered', 'Ensured'],
      outcomes: ['completing project {N}% under budget', 'reducing material waste by {N}%', 'improving efficiency by {N}%', 'managing projects worth ${N}M+', 'leading team of {N}+ engineers', 'delivering project {N} weeks ahead of schedule'],
      keywords: ['project management', 'technical design', 'quality assurance', 'CAD design', 'structural analysis', 'process optimization', 'regulatory compliance', 'cross-functional teams', 'risk assessment'],
      skillGroups: { 'Software': [], 'Methods': [], 'Specializations': [], 'Management': [] }
    },
    operations: {
      verbs: ['Managed', 'Streamlined', 'Optimized', 'Led', 'Implemented', 'Reduced', 'Coordinated', 'Developed', 'Oversaw', 'Improved', 'Delivered', 'Analyzed', 'Executed', 'Scaled', 'Maintained'],
      outcomes: ['reducing operational costs by {N}%', 'improving process efficiency by {N}%', 'managing operations for {N}+ locations', 'overseeing team of {N}+ members', 'increasing throughput by {N}%', 'reducing error rate by {N}%'],
      keywords: ['process improvement', 'supply chain management', 'lean methodology', 'Six Sigma', 'inventory management', 'vendor management', 'KPI tracking', 'logistics', 'cross-functional collaboration'],
      skillGroups: { 'Methodologies': [], 'Tools': [], 'Management': [], 'Analytics': [] }
    },
    consulting: {
      verbs: ['Advised', 'Led', 'Developed', 'Delivered', 'Managed', 'Analyzed', 'Structured', 'Facilitated', 'Spearheaded', 'Collaborated', 'Presented', 'Synthesized', 'Drove', 'Built', 'Defined'],
      outcomes: ['delivering ${N}M+ in cost savings', 'managing engagement teams of {N}+', 'serving {N}+ Fortune 500 clients', 'improving client revenue by {N}%', 'delivering {N}+ recommendations implemented', 'reducing process inefficiency by {N}%'],
      keywords: ['strategic planning', 'change management', 'stakeholder management', 'project management', 'business transformation', 'financial modeling', 'process optimization', 'management consulting', 'due diligence'],
      skillGroups: { 'Strategy': [], 'Industries': [], 'Tools': [], 'Methodologies': [] }
    },
    media: {
      verbs: ['Created', 'Produced', 'Developed', 'Grew', 'Managed', 'Wrote', 'Edited', 'Launched', 'Directed', 'Increased', 'Published', 'Collaborated', 'Curated', 'Strategized', 'Built'],
      outcomes: ['growing audience to {N}K+ followers', 'increasing engagement rate by {N}%', 'producing {N}+ pieces of content/month', 'growing viewership by {N}%', 'achieving {N}M+ monthly impressions', 'growing email list by {N}K+'],
      keywords: ['content strategy', 'storytelling', 'social media management', 'video production', 'editorial planning', 'SEO writing', 'brand voice', 'content distribution', 'audience growth'],
      skillGroups: { 'Content Types': [], 'Platforms': [], 'Tools': [], 'Analytics': [] }
    },
    legal: {
      verbs: ['Advised', 'Drafted', 'Reviewed', 'Managed', 'Led', 'Negotiated', 'Litigated', 'Researched', 'Prepared', 'Analyzed', 'Represented', 'Ensured', 'Maintained', 'Coordinated', 'Developed'],
      outcomes: ['managing {N}+ active cases simultaneously', 'drafting {N}+ contracts per year', 'achieving {N}% favorable outcomes', 'reducing legal risk by {N}%', 'saving company ${N}M in potential liability', 'managing contracts worth ${N}M+'],
      keywords: ['legal research', 'contract drafting', 'regulatory compliance', 'due diligence', 'risk management', 'dispute resolution', 'legal counsel', 'corporate law', 'intellectual property'],
      skillGroups: { 'Practice Areas': [], 'Tools': [], 'Skills': [], 'Compliance': [] }
    },
    retail: {
      verbs: ['Managed', 'Grew', 'Led', 'Implemented', 'Increased', 'Developed', 'Optimized', 'Collaborated', 'Trained', 'Delivered', 'Oversaw', 'Reduced', 'Built', 'Launched', 'Expanded'],
      outcomes: ['increasing sales by {N}% YoY', 'managing team of {N}+ associates', 'achieving {N}% customer satisfaction score', 'reducing shrinkage by {N}%', 'exceeding quarterly targets by {N}%', 'growing online sales by {N}%'],
      keywords: ['inventory management', 'customer experience', 'visual merchandising', 'retail operations', 'e-commerce', 'omnichannel', 'vendor relations', 'POS systems', 'loss prevention'],
      skillGroups: { 'Operations': [], 'Systems': [], 'Management': [], 'E-commerce': [] }
    }
  },

  // ─── Experience Level Profiles ──────────────────────────────
  levelProfiles: {
    fresher: { years: '0-1', seniority: 'Entry-Level', prefix: 'Eager and driven', managePhrase: 'Collaborated within teams' },
    junior: { years: '1-3', seniority: 'Junior', prefix: 'Motivated and detail-oriented', managePhrase: 'Worked alongside senior engineers' },
    mid: { years: '3-6', seniority: 'Mid-Level', prefix: 'Results-driven and versatile', managePhrase: 'Mentored junior team members' },
    senior: { years: '6-10', seniority: 'Senior', prefix: 'Strategic and hands-on', managePhrase: 'Led cross-functional teams of 5-12' },
    lead: { years: '10+', seniority: 'Lead / Staff', prefix: 'Visionary and execution-focused', managePhrase: 'Directed engineering org of 20+' },
    executive: { years: '12+', seniority: 'Executive', prefix: 'Board-level strategic leader', managePhrase: 'Built and scaled organizations' }
  },

  // ─── Random number helper ───────────────────────────────────
  rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

  fillOutcome(template) {
    return template.replace('{N}', this.rand(10, 85));
  },

  pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  },

  // ─── Main Generate Function ─────────────────────────────────
  generate(formData) {
    const field = formData.industry || 'tech';
    const fieldInfo = this.fieldData[field] || this.fieldData.tech;
    const levelInfo = this.levelProfiles[formData.expLevel] || this.levelProfiles.mid;
    const skills = formData.skills || [];
    const targetRole = formData.targetRole || 'Professional';
    const company = formData.targetCompany || 'your organization';
    const yearsExp = formData.yearsExp || levelInfo.years.split('-')[0];
    const name = formData.fullName || 'Your Name';
    const jobDesc = formData.jobDescription || '';

    // Extract keywords from job description for ATS
    const jdKeywords = this._extractJDKeywords(jobDesc, field);

    // Generate 2-3 experience entries
    const experiences = this._generateExperiences(formData, fieldInfo, levelInfo, skills);

    // Generate professional summary
    const summary = this._generateSummary(formData, fieldInfo, levelInfo, skills, targetRole, yearsExp);

    // Generate achievements
    const achievements = this._generateAchievements(formData, fieldInfo);

    // Generate skills sections
    const skillsGrouped = this._groupSkills(skills, field, fieldInfo);

    // Education
    const education = this._parseEducation(formData.education || '');

    // Cover Letter
    const coverLetter = this._generateCoverLetter(formData, fieldInfo, levelInfo, skills, jdKeywords);

    // ATS Score
    const atsData = this._calculateATS(formData, fieldInfo, jdKeywords, skills);

    return {
      personal: {
        name,
        title: formData.jobTitle || targetRole,
        email: formData.email || '',
        phone: formData.phone || '',
        location: formData.location || '',
        linkedin: formData.linkedin || '',
        portfolio: formData.portfolio || ''
      },
      summary,
      experiences,
      achievements,
      skills: skills,
      skillsGrouped,
      education,
      coverLetter,
      atsData,
      template: formData.template || 'modern',
      tone: formData.tone || 'professional',
      targetRole,
      company,
      industry: formData.industry || 'tech',
      expLevel: formData.expLevel || 'mid'
    };
  },

  // ─── Summary Generator ──────────────────────────────────────
  _generateSummary(formData, fieldInfo, levelInfo, skills, targetRole, yearsExp) {
    const topSkills = skills.slice(0, 3).join(', ') || 'diverse technical skills';
    const field = formData.industry || 'tech';
    const tone = formData.tone || 'professional';

    const toneMap = {
      professional: [
        `${levelInfo.seniority} ${targetRole} with ${yearsExp}+ years of hands-on experience delivering high-impact results in ${this._fieldLabel(field)}. Proficient in ${topSkills}, with a consistent track record of driving efficiency, innovation, and measurable business outcomes. ${levelInfo.managePhrase} to ship production-grade solutions at scale.`,
        `Accomplished ${targetRole} with ${yearsExp}+ years of experience transforming complex challenges into scalable solutions. Expert in ${topSkills}, I combine technical depth with strategic thinking to deliver outcomes that matter. Known for ${this.pickN(fieldInfo.keywords, 2).join(' and ')}.`
      ],
      technical: [
        `${levelInfo.seniority} ${targetRole} with ${yearsExp}+ years of deep expertise in ${topSkills}. Specialized in ${this.pickN(fieldInfo.keywords, 3).join(', ')}. Built and maintained systems handling enterprise-scale workloads with emphasis on performance, reliability, and clean architecture.`,
        `Results-oriented ${targetRole} with strong foundations in ${topSkills} and extensive experience with ${this.pickN(fieldInfo.keywords, 2).join(' and ')}. ${yearsExp}+ years of hands-on engineering across the full development lifecycle.`
      ],
      creative: [
        `Passionate and innovative ${targetRole} who transforms ideas into impactful experiences. ${yearsExp}+ years of crafting solutions that balance aesthetics with functionality. Expert in ${topSkills}, I bring a human-centered lens to every project — because great work starts with understanding people.`,
        `Bold, creative, and data-informed ${targetRole} with ${yearsExp}+ years of pushing creative boundaries in ${this._fieldLabel(field)}. Armed with expertise in ${topSkills} and a relentless drive to create work that resonates, converts, and endures.`
      ],
      executive: [
        `Visionary ${targetRole} with ${yearsExp}+ years of building, scaling, and leading high-performance teams in ${this._fieldLabel(field)}. Track record of driving multi-million-dollar outcomes through strategic leadership, operational excellence, and the ability to align technical execution with business goals. Expert in ${topSkills}.`,
        `Senior executive with ${yearsExp}+ years of transformational leadership in ${this._fieldLabel(field)}. Proven ability to build organizations from the ground up, forge strategic partnerships, and deliver sustainable growth. Combines strategic vision with operational expertise across ${topSkills}.`
      ]
    };

    const options = toneMap[tone] || toneMap.professional;
    return options[Math.floor(Math.random() * options.length)];
  },

  // ─── Experience Generator ────────────────────────────────────
  _generateExperiences(formData, fieldInfo, levelInfo, skills) {
    const userExp = formData.experienceSummary || '';
    const yearsExp = parseInt(formData.yearsExp) || 3;
    const role = formData.targetRole || 'Professional';
    const field = formData.industry || 'tech';

    // Parse user experience into sentences
    const userSentences = userExp.split(/[.!?|•\n]+/).map(s => s.trim()).filter(s => s.length > 10);

    const now = new Date();
    const currentYear = now.getFullYear();

    const experiences = [];
    const numJobs = yearsExp >= 8 ? 3 : yearsExp >= 3 ? 2 : 1;

    const companyNames = this._getFieldCompanies(field);
    const roles = this._getFieldRoles(field, role);

    for (let i = 0; i < numJobs; i++) {
      const startYear = currentYear - (i === 0 ? 0 : (i === 1 ? 2 : 5));
      const endYear = i === 0 ? 'Present' : (currentYear - (i === 0 ? 0 : (i === 1 ? 0 : 2)));
      const duration = i === 0 ? `${startYear - 2} – Present` : `${startYear - 3} – ${startYear - 1}`;

      const bullets = this._generateBullets(fieldInfo, skills, userSentences, i, role);

      experiences.push({
        role: i === 0 ? role : roles[i] || role,
        company: i === 0 && formData.targetCompany && yearsExp < 3 ? formData.targetCompany : companyNames[i],
        duration: i === 0 ? `${currentYear - Math.min(yearsExp, 3)} – Present` : `${currentYear - yearsExp} – ${currentYear - Math.min(yearsExp, 3)}`,
        bullets
      });
    }

    return experiences;
  },

  _generateBullets(fieldInfo, skills, userSentences, jobIndex, role) {
    const bullets = [];
    const verbs = this.pickN(fieldInfo.verbs, 5);
    const outcomes = this.pickN(fieldInfo.outcomes, 4);

    // Use user sentences if available
    if (userSentences.length > jobIndex * 2) {
      const userBullet = userSentences[jobIndex * 2];
      if (userBullet && userBullet.length > 15) {
        const verb = verbs[0];
        bullets.push(`${verb} ${userBullet.toLowerCase().replace(/^(i |we |the team )/i, '')}`);
      }
    }

    // Generate 3-4 additional bullets
    const skillSubset = this.pickN(skills, 2);
    const skillPhrase = skillSubset.length > 0 ? ` leveraging ${skillSubset.join(' and ')}` : '';

    bullets.push(`${verbs[1]} end-to-end ${role.toLowerCase()} solutions${skillPhrase}, ${this.fillOutcome(outcomes[0])}`);
    bullets.push(`${verbs[2]} cross-functional collaboration with product, design, and business stakeholders, ${this.fillOutcome(outcomes[1])}`);
    bullets.push(`${verbs[3]} critical processes and workflows, ${this.fillOutcome(outcomes[2])}`);

    if (jobIndex === 0) {
      bullets.push(`${verbs[4]} and mentored team members, fostering a culture of continuous improvement and technical excellence`);
    }

    return bullets.slice(0, 4);
  },

  _generateAchievements(formData, fieldInfo) {
    const userAchievements = formData.achievements || '';
    const lines = userAchievements.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(l => l.length > 5);

    if (lines.length >= 3) return lines.slice(0, 4);

    const generated = this.pickN(fieldInfo.outcomes, 3).map(o => this.fillOutcome(o));
    return [...lines, ...generated].slice(0, 4);
  },

  _groupSkills(skills, field, fieldInfo) {
    const groups = [];
    const chunkSize = Math.ceil(skills.length / 3);

    if (skills.length === 0) {
      // Default skill suggestions per field
      const defaults = {
        tech: [['Core Languages', 'JavaScript, TypeScript, Python'], ['Frameworks & Libraries', 'React, Node.js, Express'], ['DevOps & Tools', 'Git, Docker, AWS, CI/CD']],
        data: [['ML & AI', 'TensorFlow, PyTorch, Scikit-learn'], ['Languages', 'Python, R, SQL'], ['Visualization', 'Tableau, Power BI, Matplotlib']],
        design: [['Design Tools', 'Figma, Adobe XD, Sketch'], ['Research', 'User Testing, Interviews, Surveys'], ['Prototyping', 'InVision, Framer, Zeplin']],
        marketing: [['Digital Marketing', 'SEO, SEM, PPC'], ['Analytics', 'Google Analytics, Data Studio'], ['Tools', 'HubSpot, Salesforce, Mailchimp']]
      };
      return defaults[field] || defaults.tech;
    }

    for (let i = 0; i < 3; i++) {
      const chunk = skills.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        const labels = Object.keys(fieldInfo.skillGroups);
        groups.push([labels[i] || `Skills ${i + 1}`, chunk.join(', ')]);
      }
    }
    return groups;
  },

  _parseEducation(eduStr) {
    if (!eduStr) return [{ degree: 'Bachelor of Science', field: 'Relevant Field', institution: 'University', year: '2020' }];

    // Try to parse components
    const yearMatch = eduStr.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : '';

    return [{
      degree: eduStr.replace(/,.*$/, '').trim(),
      field: '',
      institution: eduStr.includes(',') ? eduStr.split(',').slice(1).join(',').trim().replace(/\d{4}/, '').trim() : 'University',
      year
    }];
  },

  // ─── Cover Letter Generator ──────────────────────────────────
  _generateCoverLetter(formData, fieldInfo, levelInfo, skills, jdKeywords) {
    const name = formData.fullName || 'Your Name';
    const role = formData.targetRole || 'this position';
    const company = formData.targetCompany || 'your esteemed organization';
    const email = formData.email || '';
    const phone = formData.phone || '';
    const location = formData.location || '';
    const yearsExp = formData.yearsExp || '3';
    const topSkills = skills.slice(0, 3).join(', ') || 'key skills relevant to this role';
    const tone = formData.tone || 'professional';

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const openings = [
      `I am writing to express my enthusiastic interest in the ${role} position at ${company}. With ${yearsExp}+ years of hands-on experience in ${this._fieldLabel(formData.industry)} and a proven track record of delivering exceptional results, I am confident that my background aligns perfectly with your requirements.`,
      `Having followed ${company}'s remarkable growth and innovative work in the industry, I am thrilled to apply for the ${role} role. My ${yearsExp}+ years of experience in ${this._fieldLabel(formData.industry)}, combined with expertise in ${topSkills}, makes me uniquely positioned to contribute meaningfully to your team from day one.`,
      `The ${role} opportunity at ${company} immediately caught my attention — not only because it aligns perfectly with my ${yearsExp}+ years of experience in ${this._fieldLabel(formData.industry)}, but because ${company}'s commitment to excellence resonates deeply with my professional values.`
    ];

    const midParagraphs = [
      `Throughout my career, I have distinguished myself by ${this.fillOutcome(this.pickN(fieldInfo.outcomes, 1)[0])}. My expertise in ${topSkills} has enabled me to ${this.pickN(fieldInfo.verbs, 2).join(' and ').toLowerCase()} solutions that drive measurable impact. I am particularly proud of ${this.fillOutcome(this.pickN(fieldInfo.outcomes, 1)[0])}, which demonstrated my ability to deliver results that matter.`,
      `What sets me apart is my ability to combine deep technical expertise in ${topSkills} with a strategic business mindset. I have consistently ${this.pickN(fieldInfo.verbs, 1)[0].toLowerCase()}d initiatives that ${this.fillOutcome(this.pickN(fieldInfo.outcomes, 1)[0])}, while simultaneously ${this.fillOutcome(this.pickN(fieldInfo.outcomes, 1)[0])}. This blend of execution and strategic thinking is what I would bring to ${company}.`
    ];

    const closings = [
      `I am genuinely excited about the prospect of bringing my skills and passion to ${company}, and I am confident that my experience will enable me to make an immediate and lasting contribution. I would welcome the opportunity to discuss how my background aligns with your needs.\n\nThank you sincerely for considering my application. I look forward to the possibility of speaking with you.`,
      `${company}'s mission aligns closely with my professional aspirations, and I am eager to contribute to your continued success. I would be delighted to elaborate on my experience and how I can add value to your team in a conversation at your convenience.\n\nThank you for your time and consideration. I look forward to hearing from you.`
    ];

    return {
      name,
      title: formData.jobTitle || role,
      email,
      phone,
      location,
      date: today,
      recipientTitle: 'Hiring Manager',
      recipientCompany: company,
      subject: `Re: ${role} Position – ${name}`,
      opening: this.pickN(openings, 1)[0],
      middle: this.pickN(midParagraphs, 1)[0],
      closing: this.pickN(closings, 1)[0],
      signatureName: name
    };
  },

  // ─── ATS Calculator ──────────────────────────────────────────
  _calculateATS(formData, fieldInfo, jdKeywords, skills) {
    const allKeywords = [...fieldInfo.keywords];
    const skillsLower = skills.map(s => s.toLowerCase());
    const formText = (
      (formData.experienceSummary || '') + ' ' +
      (formData.achievements || '') + ' ' +
      skills.join(' ')
    ).toLowerCase();

    let score = 40; // base
    const matches = [];
    const missing = [];

    // Check keywords
    for (const kw of allKeywords.slice(0, 8)) {
      if (formText.includes(kw.toLowerCase()) || skillsLower.some(s => s.includes(kw.toLowerCase()))) {
        matches.push(kw);
        score += 5;
      } else {
        missing.push(kw);
      }
    }

    // JD keyword bonus
    for (const kw of jdKeywords.slice(0, 5)) {
      if (formText.includes(kw) || skillsLower.some(s => s.includes(kw))) {
        score += 3;
      }
    }

    // Skill count bonus
    score += Math.min(skills.length * 2, 20);

    // Email and phone completeness
    if (formData.email) score += 2;
    if (formData.phone) score += 2;
    if (formData.linkedin) score += 3;

    score = Math.min(score, 98);

    const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work';

    const tips = [
      { icon: '✅', text: 'Use exact keywords from the job description' },
      { icon: '📊', text: 'Quantify achievements with numbers and %' },
      { icon: '📄', text: 'Keep resume to 1-2 pages maximum' },
      { icon: '🎯', text: 'Tailor your summary to the specific role' },
      { icon: '🔗', text: 'Include LinkedIn URL for credibility' }
    ];

    return { score, grade, matches: matches.slice(0, 5), missing: missing.slice(0, 4), tips: tips.slice(0, 4) };
  },

  _extractJDKeywords(jobDesc, field) {
    if (!jobDesc) return [];
    const words = jobDesc.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const stopWords = new Set(['with', 'this', 'that', 'will', 'have', 'from', 'they', 'been', 'more', 'also', 'into', 'than', 'then', 'your', 'their', 'what', 'which', 'should', 'would', 'could', 'about', 'through']);
    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 20);
  },

  _fieldLabel(field) {
    const labels = {
      tech: 'Technology & Software Engineering', data: 'Data Science & Machine Learning',
      design: 'UI/UX Design', marketing: 'Digital Marketing & Growth',
      finance: 'Finance & Banking', healthcare: 'Healthcare & Medicine',
      education: 'Education & Teaching', sales: 'Sales & Business Development',
      hr: 'Human Resources', engineering: 'Engineering', operations: 'Operations',
      consulting: 'Strategy & Consulting', media: 'Media & Content', legal: 'Legal',
      retail: 'Retail & E-commerce'
    };
    return labels[field] || 'Professional Services';
  },

  _getFieldCompanies(field) {
    const companies = {
      tech: ['TechCorp Solutions', 'InnovateTech Ltd', 'CloudSystems Inc'],
      data: ['DataDriven Analytics', 'AI Ventures Corp', 'InsightLab Technologies'],
      design: ['DesignStudio Pro', 'Creative Digital Co', 'UX Innovation Lab'],
      marketing: ['GrowthHQ Agency', 'Digital Reach Co', 'BrandPulse Marketing'],
      finance: ['Global Finance Group', 'Capital Advisors Ltd', 'Investment Partners Co'],
      healthcare: ['MedCare Systems', 'HealthFirst Group', 'Clinical Excellence Ltd'],
      education: ['EduFirst Academy', 'Learning Excellence Institute', 'Bright Futures School'],
      sales: ['Revenue Leaders Inc', 'SalesForce Partners', 'Growth Dynamics Corp'],
      hr: ['PeopleFirst Solutions', 'TalentBridge Corp', 'HR Excellence Group'],
      engineering: ['Precision Engineering Co', 'BuildTech Solutions', 'Infrastructure Partners'],
      consulting: ['Strategy Partners LLP', 'Business Excellence Group', 'Advisory Associates'],
      default: ['Professional Solutions Inc', 'Industry Leaders Corp', 'Excellence Group Ltd']
    };
    return companies[field] || companies.default;
  },

  _getFieldRoles(field, primaryRole) {
    const roleMap = {
      tech: ['Software Engineer', 'Backend Developer', 'Junior Developer'],
      data: ['Data Analyst', 'ML Engineer', 'Business Intelligence Analyst'],
      design: ['UX Designer', 'Product Designer', 'Visual Designer'],
      marketing: ['Marketing Specialist', 'Content Marketer', 'Digital Marketing Analyst'],
      finance: ['Financial Analyst', 'Investment Associate', 'Finance Associate'],
      healthcare: ['Clinical Specialist', 'Healthcare Coordinator', 'Medical Assistant'],
      default: [primaryRole, 'Associate', 'Specialist']
    };
    return roleMap[field] || roleMap.default;
  }
};

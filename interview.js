/**
 * interview.js — Mock Interview Module
 * Handles state, interactive simulator, timer, critique engine, and scorecard.
 */

const InterviewModule = {
  // ─── State ──────────────────────────────────────────────────
  state: {
    type: null, // 'technical' | 'hr'
    questions: [],
    currentIdx: 0,
    answers: [],
    scores: [],
    critiques: [],
    timerSecs: 0,
    timerInterval: null,
    isAnswered: false
  },

  // ─── INIT ────────────────────────────────────────────────────
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Start Interview from Export Step (Promo Card)
    const promoBtn = $('startInterviewPromoBtn');
    if (promoBtn) {
      promoBtn.addEventListener('click', () => {
        // Go to Step 5
        if (typeof goToStep === 'function') {
          goToStep(5);
        }
      });
    }

    // Round selectors
    $('startTechRoundBtn').addEventListener('click', () => this.startRound('technical'));
    $('startHrRoundBtn').addEventListener('click', () => this.startRound('hr'));

    // Textarea input event for char count & enable button
    const textInput = $('simAnswerInput');
    textInput.addEventListener('input', () => {
      const len = textInput.value.trim().length;
      $('simCharCount').textContent = `${len} characters (min 30 recommended)`;
      
      const submitBtn = $('submitAnswerBtn');
      if (len >= 5) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    });

    // Control buttons
    $('submitAnswerBtn').addEventListener('click', () => this.submitAnswer());
    $('nextQuestionBtn').addEventListener('click', () => this.nextQuestion());
    $('skipQuestionBtn').addEventListener('click', () => this.skipQuestion());
    $('quitInterviewBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to quit? Your progress in this round will be lost.')) {
        this.resetToSetup();
      }
    });

    // Scorecard buttons
    $('scBackToSetupBtn').addEventListener('click', () => this.resetToSetup());
    $('scFinishBtn').addEventListener('click', () => {
      if (typeof goToStep === 'function') {
        goToStep(4); // Back to export
      }
    });
  },

  // ─── START ROUND ─────────────────────────────────────────────
  startRound(type) {
    // Ensure resume data exists
    if (!AppState.generatedData) {
      showToast('Please generate a resume first to tailor the interview.', 'error');
      if (typeof goToStep === 'function') goToStep(2);
      return;
    }

    this.state.type = type;
    this.state.currentIdx = 0;
    this.state.answers = [];
    this.state.scores = [];
    this.state.critiques = [];
    this.state.timerSecs = 0;
    this.state.isAnswered = false;

    // Show loading or generate immediately
    this.state.questions = this.generateQuestions(type, AppState.generatedData);
    
    // UI Transitions
    $('interviewSetup').style.display = 'none';
    $('interviewScorecard').style.display = 'none';
    $('interviewSimulator').style.display = 'block';

    // Set simulator title
    $('simRoundTitle').textContent = type === 'technical' ? 'Technical Round' : 'HR & Behavioral Round';

    // Start timer
    this.startTimer();

    // Render first question
    this.showQuestion();
  },

  // ─── TIMER ───────────────────────────────────────────────────
  startTimer() {
    clearInterval(this.state.timerInterval);
    this.state.timerInterval = setInterval(() => {
      this.state.timerSecs++;
      const mins = String(Math.floor(this.state.timerSecs / 60)).padStart(2, '0');
      const secs = String(this.state.timerSecs % 60).padStart(2, '0');
      $('simTimerText').textContent = `${mins}:${secs}`;
    }, 1000);
  },

  stopTimer() {
    clearInterval(this.state.timerInterval);
  },

  // ─── QUESTIONS GENERATOR ──────────────────────────────────────
  generateQuestions(type, data) {
    const role = data.targetRole || 'Professional';
    const company = data.company || 'our company';
    const industry = data.template || 'tech'; 
    const skills = data.skills || [];
    const name = data.personal.name || 'Candidate';
    const yearsExp = data.yearsExp || '3';

    if (type === 'hr') {
      return [
        {
          question: `Tell me about yourself. Walk me through your background and your experience as a ${role}.`,
          modelAnswer: `Certainly. I am a ${role} with ${yearsExp} years of experience. In my career, I've specialized in driving projects within the industry. For example, in my last role, I was responsible for key deliverables and routinely collaborated with cross-functional teams to achieve strategic metrics. What drives me is building scalable, efficient solutions and constantly growing my domain expertise. This opportunity at ${company} is a logical next step where I can directly contribute to your core products.`,
          keywords: ['experience', 'role', 'collaborated', 'results', 'contribution'],
          category: 'Introduction'
        },
        {
          question: `Why do you want to join ${company}? What elements of our business, products, or work culture attract you?`,
          modelAnswer: `I've been following ${company} and am highly impressed by your impact in the industry. Your dedication to innovation aligns perfectly with my professional goals. Specifically, the work you are doing in this sector is highly relevant to my skill set. I want to bring my background in ${skills.slice(0, 3).join(', ')} to help scale your operations. Additionally, from what I've researched, the culture of learning and collaboration here is something I would thrive in.`,
          keywords: [company.toLowerCase(), 'innovation', 'culture', 'impact', 'growth'],
          category: 'Company Fit'
        },
        {
          question: `Describe a challenging situation or project conflict you faced at work. How did you resolve it, and what did you learn?`,
          modelAnswer: `In a previous project, we faced a major bottleneck when project requirements shifted mid-cycle, creating conflict regarding resource allocation. To resolve this, I scheduled a alignment meeting with the key developers and design stakeholders. I presented a data-driven priority checklist to help the team focus on critical deliverables. By dividing tasks based on expertise and communicating transparently, we shipped the project on time and reduced launch delays by 15%. I learned that active listening and structured prioritization are critical during high-pressure pivots.`,
          keywords: ['conflict', 'resolution', 'communicated', 'priority', 'learned'],
          category: 'Behavioral (Conflict)'
        },
        {
          question: `How do you prioritize competing deadlines or handle sudden changes in project scope? Share a specific scenario.`,
          modelAnswer: `I prioritize tasks using a matrix based on business impact and urgency. For instance, when an urgent bug was reported during a major release cycle, I immediately assessed the scope. I collaborated with the product owner, delegated minor tasks, and refocused our core efforts on addressing the critical bug first. By managing expectations transparently and remaining agile, we resolved the issue within 4 hours without delaying the general launch. This demonstrated my capacity to remain composed and agile under pressure.`,
          keywords: ['prioritize', 'impact', 'agile', 'delegated', 'collaborated'],
          category: 'Adaptability'
        },
        {
          question: `Where do you see yourself in five years? How does the ${role} position at ${company} align with that vision?`,
          modelAnswer: `Over the next five years, I plan to deepen my technical expertise in this field and transition into a leadership or staff role where I can steer architectural decisions. I see myself mentoring juniors and contributing to high-level strategy. The ${role} position at ${company} is ideal because it offers exposure to enterprise-scale products and a culture that supports continuous learning. I believe this environment will challenge me to grow while allowing me to deliver tangible value.`,
          keywords: ['leadership', 'grow', 'mentoring', 'expertise', 'long-term'],
          category: 'Career Goals'
        }
      ];
    } else {
      // TECHNICAL QUESTIONS
      // 1. General domain intro
      // 2 & 3. Skill-specific questions based on user's actual skills list
      // 4. System architecture or workflow design
      // 5. Critical troubleshooting scenario

      // Extract actual skills or fallback
      const skill1 = skills[0] || 'your core technologies';
      const skill2 = skills[1] || 'modern frameworks';
      const skill3 = skills[2] || 'system architecture';

      const techQuestions = [
        {
          question: `Explain your technical stack and how you select the appropriate technologies for a new project. How does your experience with ${skill1} factor into this?`,
          modelAnswer: `My primary technical stack is designed around reliability and scale. I select technologies based on project constraints, team expertise, and performance needs. For instance, I choose ${skill1} when project demands require fast cycles and robust tooling. I evaluate factors like ecosystem support, community maturity, and performance benchmarks before committing to an architecture, ensuring the technology will scale alongside business requirements.`,
          keywords: [skill1.toLowerCase(), 'architecture', 'performance', 'reliability', 'benchmarks'],
          category: 'Tech Stack Selection'
        },
        {
          question: `Can you describe a deep technical challenge you faced while implementing a solution involving ${skill1}? How did you diagnose and overcome it?`,
          modelAnswer: `While working with ${skill1}, we encountered a major bottlenecks where resource utilization spiked during high-concurrency loads. I diagnosed the issue by setting up detailed logging and analyzing process profiles. The root cause was inefficient data handling and redundant calls. I optimized this by refactoring the core queries, caching static requests, and implementing asynchronous loading. This reduced processing times by 40% and stabilized CPU utilization.`,
          keywords: [skill1.toLowerCase(), 'bottleneck', 'diagnosed', 'optimized', 'refactoring'],
          category: 'Technical Problem Solving'
        },
        {
          question: `What are the best practices for writing clean, maintainable code in ${skill2}? How do you ensure high standards in team environments?`,
          modelAnswer: `For ${skill2}, best practices include strict adherence to design patterns, modular architecture, and solid linting rules. I advocate for extensive unit test coverage (targeting 80%+) and perform thorough code reviews that focus on code readability, performance, and security. I also believe in keeping technical documentation updated so that onboarding new engineers is seamless and clean practices are shared.`,
          keywords: [skill2.toLowerCase(), 'modular', 'test coverage', 'code review', 'maintainable'],
          category: 'Code Quality'
        },
        {
          question: `How do you design a scalable system or workflow that can handle high volume/load without failing? What design patterns do you employ?`,
          modelAnswer: `To scale systems, I use a microservices approach or modular design to decouple components. I implement load balancing, horizontal scaling, and messaging queues (like RabbitMQ) to handle heavy bursts. Caching layers are placed in front of databases to mitigate heavy read traffic. I also follow defensive design patterns like circuit breakers and retry loops to gracefully handle microservice failures and maintain service availability.`,
          keywords: ['decouple', 'scaling', 'caching', 'microservices', 'circuit breakers'],
          category: 'System Design'
        },
        {
          question: `Describe a production emergency or severe system failure you resolved. What was your triage process, and how did you prevent it from recurring?`,
          modelAnswer: `We had an incident where the primary production system became unresponsive due to an database pool exhaustion. My immediate triage was to isolate the traffic, capture stack traces, and spin up read replicas to distribute the load. Once services stabilized, I conducted a post-mortem: we added connection timeout limits, optimized database pooling configuration, and set up real-time Prometheus monitoring. We also established automated alerts to notify the team before connections breach 80% capacity.`,
          keywords: ['triage', 'incident', 'monitoring', 'pooling', 'post-mortem'],
          category: 'Troubleshooting & SRE'
        }
      ];

      return techQuestions;
    }
  },

  // ─── SHOW QUESTION ───────────────────────────────────────────
  showQuestion() {
    const q = this.state.questions[this.state.currentIdx];
    this.state.isAnswered = false;

    // Reset inputs
    $('simAnswerInput').value = '';
    $('simAnswerInput').disabled = false;
    $('simCharCount').textContent = '0 characters (min 30 recommended)';
    
    // Simulator control display
    $('submitAnswerBtn').style.display = 'inline-flex';
    $('submitAnswerBtn').disabled = true;
    $('nextQuestionBtn').style.display = 'none';
    $('skipQuestionBtn').style.display = 'inline-flex';

    // Hide feedback container
    $('simFeedbackContainer').style.display = 'none';

    // Set Text
    $('simQuestionText').textContent = q.question;

    // Update Progress Sidebar
    $('simProgressText').textContent = `Question ${this.state.currentIdx + 1} of 5`;
    const pct = ((this.state.currentIdx + 1) / 5) * 100;
    $('simProgressFill').style.width = `${pct}%`;

    // Render indicators
    this.renderQuestionIndicators();
  },

  renderQuestionIndicators() {
    const list = $('simQIndicatorList');
    list.innerHTML = this.state.questions.map((q, idx) => {
      let statusClass = '';
      if (idx === this.state.currentIdx) {
        statusClass = 'active';
      } else if (this.state.answers[idx] !== undefined) {
        statusClass = this.state.answers[idx] === null ? 'skipped' : 'completed';
      }

      return `
        <div class="q-indicator ${statusClass}">
          <span class="q-indicator-dot"></span>
          <span>Question ${idx + 1} (${q.category})</span>
        </div>
      `;
    }).join('');
  },

  // ─── SUBMIT ANSWER ───────────────────────────────────────────
  submitAnswer() {
    const text = $('simAnswerInput').value.trim();
    if (text.length < 5) return;

    this.state.isAnswered = true;
    this.stopTimer();

    // Analyze answer
    const q = this.state.questions[this.state.currentIdx];
    const analysis = this.analyzeResponse(text, q);

    // Save state
    this.state.answers[this.state.currentIdx] = text;
    this.state.scores[this.state.currentIdx] = analysis.score;
    this.state.critiques[this.state.currentIdx] = analysis.critique;

    // Show feedback
    $('simFeedbackScore').textContent = `${analysis.score}/100`;
    
    // Dynamic color coding for score
    const scoreColor = analysis.score >= 80 ? 'var(--green)' : analysis.score >= 50 ? 'var(--amber)' : 'var(--red)';
    $('simFeedbackScore').style.color = scoreColor;

    $('simFeedbackCritique').innerHTML = analysis.critiqueHTML;
    $('simFeedbackModelAnswer').textContent = q.modelAnswer;

    $('simFeedbackContainer').style.display = 'flex';

    // Toggle button displays
    $('simAnswerInput').disabled = true;
    $('submitAnswerBtn').style.display = 'none';
    $('skipQuestionBtn').style.display = 'none';
    $('nextQuestionBtn').style.display = 'inline-flex';
    $('nextQuestionBtn').textContent = this.state.currentIdx === 4 ? 'View Final Results' : 'Next Question';

    // Smooth scroll down to feedback
    setTimeout(() => {
      const container = document.querySelector('.sim-chat-container');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  },

  // ─── SKIP QUESTION ───────────────────────────────────────────
  skipQuestion() {
    this.state.answers[this.state.currentIdx] = null;
    this.state.scores[this.state.currentIdx] = 0;
    this.state.critiques[this.state.currentIdx] = 'Question skipped by the candidate.';

    if (this.state.currentIdx < 4) {
      this.state.currentIdx++;
      this.showQuestion();
    } else {
      this.finishRound();
    }
  },

  // ─── NEXT QUESTION ───────────────────────────────────────────
  nextQuestion() {
    // Restart timer for next question
    this.startTimer();

    if (this.state.currentIdx < 4) {
      this.state.currentIdx++;
      this.showQuestion();
      // Scroll chat container back to top
      const container = document.querySelector('.sim-chat-container');
      if (container) container.scrollTop = 0;
    } else {
      this.finishRound();
    }
  },

  // ─── RESPONSE ANALYSIS ENGINE ────────────────────────────────
  analyzeResponse(answer, question) {
    const len = answer.length;
    const answerLower = answer.toLowerCase();
    
    let score = 30; // base score for writing anything
    let critiquePoints = [];
    let matches = [];
    let missing = [];

    // 1. Length Evaluation
    if (len < 40) {
      score += 5;
      critiquePoints.push(`⚠️ <strong>Response too brief:</strong> An interview answer should ideally be 100-300 words. Try to detail the specific Situation, Task, Action, and Result (STAR framework) to give complete context.`);
    } else if (len < 120) {
      score += 20;
      critiquePoints.push(`💡 <strong>Add more depth:</strong> Your response covers the basics, but lacks concrete evidence. Expanding on the exact steps you took will help build confidence.`);
    } else {
      score += 40;
      critiquePoints.push(`✅ <strong>Excellent length & detail:</strong> You provided a comprehensive response with sufficient context.`);
    }

    // 2. Keyword Check
    question.keywords.forEach(kw => {
      if (answerLower.includes(kw.toLowerCase())) {
        matches.push(kw);
        score += 10;
      } else {
        missing.push(kw);
      }
    });

    if (matches.length > 0) {
      critiquePoints.push(`🎯 <strong>Good technical alignment:</strong> You naturally integrated keywords like: <em>${matches.join(', ')}</em>, which displays your operational knowledge.`);
    }
    if (missing.length > 0) {
      critiquePoints.push(`🔍 <strong>Missed concepts:</strong> To maximize impact, consider incorporating technical terms or conceptual pillars like: <em>${missing.join(', ')}</em>.`);
    }

    // 3. Quantitative metrics / Action check
    const hasNumbers = /\b\d+(?:%|\s*percent|\s*k|\s*m|\s*years|\s*hrs|\s*hours|\s*weeks)?\b/i.test(answer);
    if (hasNumbers) {
      score += 20;
      critiquePoints.push(`📈 <strong>Great use of metrics:</strong> You quantified your accomplishments! Adding numbers (e.g. percentages, durations, team size) shows business-driven results.`);
    } else {
      critiquePoints.push(`📊 <strong>Quantify your outcomes:</strong> Try to include concrete metrics (e.g., 'reduced runtime by 30%', 'saved 10 hours a week'). Quantitative results are highly valued by interviewers.`);
    }

    // Cap score at 98 (leaving some room for improvement)
    score = Math.min(score, 98);

    const critiqueHTML = `<ul>${critiquePoints.map(p => `<li style="margin-bottom:8px">${p}</li>`).join('')}</ul>`;

    return {
      score,
      critique: critiquePoints.map(p => p.replace(/<[^>]*>/g, '')).join('\n'), // Text only
      critiqueHTML
    };
  },

  // ─── FINISH ROUND ────────────────────────────────────────────
  finishRound() {
    this.stopTimer();

    // Calculate scorecard results
    const totalQuestions = this.state.questions.length;
    const answeredCount = this.state.answers.filter(a => a !== null).length;
    const totalScore = this.state.scores.reduce((a, b) => a + b, 0);
    const avgScore = answeredCount > 0 ? Math.round(totalScore / answeredCount) : 0;

    const mins = String(Math.floor(this.state.timerSecs / 60)).padStart(2, '0');
    const secs = String(this.state.timerSecs % 60).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    // Update UI elements
    $('scAvgScore').textContent = `${avgScore}/100`;
    $('scTimeSpent').textContent = timeStr;
    $('scCompletion').textContent = `${Math.round((answeredCount / totalQuestions) * 100)}%`;

    $('scorecardSubtitle').textContent = `You completed the ${this.state.type === 'technical' ? 'Technical Round' : 'HR & Behavioral Round'}!`;

    // Render Breakdown
    this.renderScorecardBreakdown();

    // Transition view
    $('interviewSimulator').style.display = 'none';
    $('interviewSetup').style.display = 'none';
    $('interviewScorecard').style.display = 'block';
    
    showToast('Mock interview finished! Check your scorecard.', 'success');
  },

  renderScorecardBreakdown() {
    const list = $('scorecardBreakdownList');
    list.innerHTML = this.state.questions.map((q, idx) => {
      const answer = this.state.answers[idx];
      const score = this.state.scores[idx];
      const critique = this.state.critiques[idx];

      const scoreClass = score >= 80 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low';
      const scoreLabel = answer === null ? 'SKIPPED' : `Score: ${score}/100`;

      return `
        <div class="sc-item">
          <div class="sc-item-header" onclick="toggleScorecardBody(this)">
            <span class="sc-item-title">Q${idx + 1}: ${q.category} — ${q.question.slice(0, 50)}...</span>
            <span class="sc-item-score-pill ${scoreClass}">${scoreLabel}</span>
          </div>
          <div class="sc-item-body" style="display: none;">
            <div class="sc-body-section">
              <h6>Question</h6>
              <p>${q.question}</p>
            </div>
            <div class="sc-body-section">
              <h6>Your Answer</h6>
              <p>${answer || '<em>Skipped / No Answer Provided</em>'}</p>
            </div>
            ${answer !== null ? `
              <div class="sc-body-section">
                <h6>Evaluation & Critique</h6>
                <p>${critique.replace(/\n/g, '<br/>')}</p>
              </div>
            ` : ''}
            <div class="sc-body-section sc-model-ans">
              <h6>Suggested Model Answer</h6>
              <p>${q.modelAnswer}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ─── RESET TO SETUP ──────────────────────────────────────────
  resetToSetup() {
    this.stopTimer();
    $('interviewSimulator').style.display = 'none';
    $('interviewScorecard').style.display = 'none';
    $('interviewSetup').style.display = 'grid';
  }
};

// Global helper for scorecard toggles (inline handler compatibility)
function toggleScorecardBody(header) {
  const body = header.nextElementSibling;
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

/**
 * interview.js — Mock Interview Module
 * Handles state, interactive simulator, timer, critique engine, and scorecard.
 */

var API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

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
        if (typeof goToStep === 'function') goToStep(5);
      });
    }

    // Round selectors — guard in case step 5 isn't in DOM yet
    const techBtn = $('startTechRoundBtn');
    const hrBtn   = $('startHrRoundBtn');
    if (techBtn) techBtn.addEventListener('click', () => this.startRound('technical'));
    if (hrBtn)   hrBtn.addEventListener('click',   () => this.startRound('hr'));

    // Textarea input event for char count & enable button
    const textInput = $('simAnswerInput');
    if (textInput) {
      textInput.addEventListener('input', () => {
        const len = textInput.value.trim().length;
        const countEl = $('simCharCount');
        if (countEl) countEl.textContent = `${len} characters (min 30 recommended)`;
        const submitBtn = $('submitAnswerBtn');
        if (submitBtn) submitBtn.disabled = len < 5;
      });
    }

    // Control buttons
    const submitBtn    = $('submitAnswerBtn');
    const nextBtn      = $('nextQuestionBtn');
    const skipBtn      = $('skipQuestionBtn');
    const quitBtn      = $('quitInterviewBtn');
    const backSetupBtn = $('scBackToSetupBtn');
    const finishBtn    = $('scFinishBtn');

    if (submitBtn)    submitBtn.addEventListener('click',    () => this.submitAnswer());
    if (nextBtn)      nextBtn.addEventListener('click',      () => this.nextQuestion());
    if (skipBtn)      skipBtn.addEventListener('click',      () => this.skipQuestion());
    if (quitBtn)      quitBtn.addEventListener('click',      () => {
      if (confirm('Are you sure you want to quit? Your progress in this round will be lost.')) {
        this.resetToSetup();
      }
    });
    if (backSetupBtn) backSetupBtn.addEventListener('click', () => this.resetToSetup());
    if (finishBtn)    finishBtn.addEventListener('click',    () => {
      if (typeof goToStep === 'function') goToStep(4);
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
    const industry = data.industry || 'tech'; 
    const skills = data.skills || [];
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
      const skill1 = skills[0] || 'core methodologies';
      const skill2 = skills[1] || 'domain tools';
      const skill3 = skills[2] || 'best practices';

      const templates = {
        tech: [
          {
            question: `Explain your technical stack and how you select the appropriate technologies for a new project. How does your experience with ${skill1} factor into this?`,
            modelAnswer: `My primary technical stack is designed around reliability and scale. I select technologies based on project constraints, team expertise, and performance needs. For instance, I choose ${skill1} when project demands require fast cycles and robust tooling. I evaluate factors like ecosystem support, community maturity, and performance benchmarks before committing to an architecture.`,
            keywords: [skill1.toLowerCase(), 'architecture', 'performance', 'reliability'],
            category: 'Tech Stack'
          },
          {
            question: `Can you describe a deep technical challenge you faced while implementing a solution involving ${skill1}? How did you diagnose and overcome it?`,
            modelAnswer: `While working with ${skill1}, we encountered a major bottleneck where resource utilization spiked during high-concurrency loads. I diagnosed the issue by setting up detailed logging and analyzing profiles. The root cause was inefficient database queries. I optimized this by refactoring parameters and implementing caching layers, reducing response times by 40% and stabilizing CPU load.`,
            keywords: [skill1.toLowerCase(), 'bottleneck', 'diagnosed', 'optimized', 'refactoring'],
            category: 'Tech Challenge'
          },
          {
            question: `What are the best practices for writing clean, maintainable code in ${skill2}? How do you ensure high standards in team environments?`,
            modelAnswer: `For ${skill2}, best practices include strict adherence to design patterns, modular architecture, and solid linting rules. I advocate for extensive unit test coverage (targeting 80%+) and perform thorough code reviews that focus on code readability, performance, and security. I also believe in keeping technical documentation updated.`,
            keywords: [skill2.toLowerCase(), 'modular', 'test coverage', 'code review', 'maintainable'],
            category: 'Code Quality'
          },
          {
            question: `How do you design a scalable system or workflow that can handle high volume/load without failing? What design patterns do you employ?`,
            modelAnswer: `To scale systems, I use a microservices approach or modular design to decouple components. I implement load balancing, horizontal scaling, and messaging queues to handle heavy bursts. Caching layers are placed in front of databases to mitigate heavy read traffic. I also follow defensive design patterns like circuit breakers and retry loops.`,
            keywords: ['decouple', 'scaling', 'caching', 'microservices', 'circuit breakers'],
            category: 'System Design'
          },
          {
            question: `Describe a production emergency or severe system failure you resolved. What was your triage process, and how did you prevent it from recurring?`,
            modelAnswer: `We had an incident where the primary production system became unresponsive due to database pool exhaustion. My immediate triage was to isolate the traffic, capture stack traces, and spin up read replicas to distribute the load. Once services stabilized, I conducted a post-mortem: we added connection timeout limits, optimized database pooling configuration, and set up real-time monitoring.`,
            keywords: ['triage', 'incident', 'monitoring', 'pooling', 'post-mortem'],
            category: 'Troubleshooting'
          }
        ],
        data: [
          {
            question: `Explain your typical workflow for data preprocessing and cleaning before modeling. How do you handle missing values or outliers using ${skill1}?`,
            modelAnswer: `My data preprocessing pipeline starts with exploratory data analysis to identify distributions. Using ${skill1}, I handle missing values depending on their mechanism: imputation for MCAR data or introducing indicator flags for MNAR. For outliers, I use robust statistical scaling or trimming based on IQR thresholds, ensuring clean datasets without introducing artificial bias.`,
            keywords: [skill1.toLowerCase(), 'preprocessing', 'outliers', 'imputation', 'eda'],
            category: 'Data Prep'
          },
          {
            question: `Describe a scenario where you had to choose between different ML algorithms for a problem. How did your experience with ${skill2} help guide this decision?`,
            modelAnswer: `Faced with a classification problem under limited computational resources, I compared simple logistic regression with complex ensemble methods using ${skill2}. I evaluated precision, recall, and computational latency. While tree-based methods gave 3% higher accuracy, the deployment latency was too high, leading me to choose a pruned decision tree to satisfy real-time constraints.`,
            keywords: [skill2.toLowerCase(), 'classification', 'ensemble', 'precision', 'latency'],
            category: 'Model Selection'
          },
          {
            question: `How do you identify and mitigate model drift or statistical bias in production data pipelines?`,
            modelAnswer: `I mitigate model drift by establishing continuous monitoring pipelines that compare incoming feature distributions against training baseline datasets using metrics like PSI (Population Stability Index). To handle bias, I analyze demographic parity and implement periodic model retraining pipelines with updated representative datasets.`,
            keywords: ['drift', 'monitoring', 'bias', 'retraining', 'distributions'],
            category: 'MLOps & Bias'
          },
          {
            question: `Explain your process for building and optimizing complex SQL queries or ETL pipelines when working with large datasets.`,
            modelAnswer: `To optimize ETL pipelines, I perform schema optimization, partitioning, and indexing on target databases. I design modular, incremental ETL flows rather than full table scans. In SQL queries, I avoid nested subqueries, leverage CTEs for readability, and analyze execution plans to identify and fix bottle-necked joins.`,
            keywords: ['etl', 'indexing', 'partitioning', 'cte', 'execution plan'],
            category: 'Data Engineering'
          },
          {
            question: `Describe a time when your analytical insights directly drove a business decision. How did you communicate the results using ${skill3}?`,
            modelAnswer: `I conducted cohort analysis on customer churn, identifying that 20% of users dropped off during onboarding. Utilizing ${skill3}, I designed interactive dashboards that communicated the drop-off metrics to product stakeholders. This led to a simplified onboarding flow, resulting in a 12% increase in customer activation rates.`,
            keywords: [skill3.toLowerCase(), 'analytics', 'churn', 'dashboards', 'activation'],
            category: 'Business Value'
          }
        ],
        design: [
          {
            question: `How do you start your user research phase for a new product? What techniques do you use to synthesize user feedback?`,
            modelAnswer: `My research starts with defining goals, user personas, and target demographics. I conduct qualitative interviews, surveys, and context mapping. To synthesize findings, I create empathy maps and affinity diagrams, grouping observations into key thematic insights that directly inform the system requirements and user journeys.`,
            keywords: ['personas', 'interviews', 'empathy', 'affinity', 'insights'],
            category: 'User Research'
          },
          {
            question: `Describe your workflow for creating and scaling a responsive design system. How do you ensure consistency using ${skill1}?`,
            modelAnswer: `I design modular components based on atomic design principles. Using ${skill1}, I define design tokens for typography, spacing, and colors. I build reusable UI components (buttons, input groups) with auto-layouts and responsive breakpoints, publishing them to a shared library to maintain absolute brand consistency across projects.`,
            keywords: [skill1.toLowerCase(), 'modular', 'design tokens', 'atomic', 'breakpoints'],
            category: 'Design Systems'
          },
          {
            question: `How do you ensure WCAG accessibility (a11y) compliance in your UI designs? What specific rules do you test for?`,
            modelAnswer: `I ensure accessibility compliance by testing color contrast ratios (targeting AA or AAA compliance), defining clear focus states, and designing clear heading hierarchies. I also ensure target touch sizes are at least 48x48px and verify layout compatibility with screen readers through tab orders.`,
            keywords: ['contrast', 'focus states', 'touch sizes', 'accessibility', 'wcag'],
            category: 'Accessibility'
          },
          {
            question: `Describe your usability testing process. How do you handle cases where user testing results contradict your initial design hypotheses?`,
            modelAnswer: `I organize moderated usability tests with 5-8 users, assigning tasks and observing friction points. If testing results contradict my hypotheses, I look at the qualitative feedback objectively. I prioritize the user behavior data over my initial assumptions and iterate on the wireframes to remove the identified user blockages.`,
            keywords: ['moderated', 'friction', 'behavior', 'iterate', 'wireframes'],
            category: 'Usability Testing'
          },
          {
            question: `How do you collaborate with engineering teams to ensure designs are implemented with high fidelity? How does ${skill2} help with handoff?`,
            modelAnswer: `I initiate handoff by conducting walk-through sessions with developers. Using ${skill2}, I provide interactive prototypes, detailed design specifications, and exported assets. I maintain open communication lines during construction and perform visual QA audits on test environments before release.`,
            keywords: [skill2.toLowerCase(), 'handoff', 'specifications', 'assets', 'visual qa'],
            category: 'Dev Handoff'
          }
        ],
        marketing: [
          {
            question: `How do you plan a campaigns parameters across multi-channel digital marketing? What metrics do you look at to assess target audience fit?`,
            modelAnswer: `I plan campaigns by defining KPIs, customer personas, and channel selections. I review initial metrics like CTR (Click-Through Rate), CPM, and cost per lead to assess audience fit. I continuously perform audience splits and demographic testing to identify high-converting segments.`,
            keywords: ['kpis', 'ctr', 'personas', 'splits', 'demographic'],
            category: 'Campaign Planning'
          },
          {
            question: `Describe your methodology for optimizing CAC (Customer Acquisition Cost) and ROAS (Return on Ad Spend) using ${skill1}.`,
            modelAnswer: `To optimize ROAS, I analyze campaign funnels using ${skill1}. I identify and cut low-performing keywords or ad sets, allocate budgets to high-converting cohorts, and deploy custom retargeting lists. I also implement landing page improvements to boost conversion rates, directly lowering the overall CAC.`,
            keywords: [skill1.toLowerCase(), 'roas', 'cohorts', 'retargeting', 'cac'],
            category: 'Performance Mktg'
          },
          {
            question: `How do you plan and execute an SEO keyword strategy? What tools or parameters do you prioritize?`,
            modelAnswer: `My SEO strategy centers around keyword intent, search volume, and ranking difficulty. I target long-tail keywords with clear user intent and build content pillars around them. I prioritize technical SEO configurations (page speed, mobile friendliness) and track rankings using domain authority metrics.`,
            keywords: ['intent', 'pillars', 'long-tail', 'rankings', 'authority'],
            category: 'SEO Strategy'
          },
          {
            question: `Explain how you structure an A/B split test for ad creatives or email campaigns. How do you verify statistical significance?`,
            modelAnswer: `I design split tests by modifying a single variable (e.g. subject line or CTA) and keeping all other configurations identical. I split traffic evenly among randomly selected target groups. To determine significance, I collect a minimum sample size and use chi-square or t-test calculators on conversion metrics.`,
            keywords: ['variable', 'split', 'sample size', 'significance', 'conversion'],
            category: 'A/B Testing'
          },
          {
            question: `How do you leverage marketing automation tools like ${skill2} to build customer engagement funnels?`,
            modelAnswer: `I use ${skill2} to structure automated customer journeys based on user behaviors (e.g., cart abandonment, welcome series). I define trigger actions, apply dynamic segmentation, and build email cadences with personalized content to nurture prospects and drive repeat conversions.`,
            keywords: [skill2.toLowerCase(), 'funnel', 'journeys', 'segmentation', 'personalized'],
            category: 'Automation'
          }
        ],
        finance: [
          {
            question: `Explain your process for building a comprehensive financial forecasting model. How do you account for volatility or market assumptions?`,
            modelAnswer: `I construct forecasting models by building historical baselines and mapping operational drivers. I formulate base, optimistic, and conservative scenarios to account for volatility. I parameterize key market assumptions (like inflation or pricing shifts) so that variables can be updated dynamically.`,
            keywords: ['forecasting', 'baselines', 'scenarios', 'assumptions', 'volatility'],
            category: 'Forecasting'
          },
          {
            question: `How do you perform risk assessment and quantitative modeling for investment portfolios? How does ${skill1} assist in this?`,
            modelAnswer: `I evaluate portfolio risk by calculating metrics like Volatility, beta, and Sharpe ratios. Using ${skill1}, I model historical distributions and run sensitivity analyses. This allows me to optimize asset weights and recommend hedging strategies that align risk parameters with target returns.`,
            keywords: [skill1.toLowerCase(), 'volatility', 'sharpe', 'sensitivity', 'hedging'],
            category: 'Risk Management'
          },
          {
            question: `What is your approach to structuring corporate valuations? Contrast DCF with comparable company analysis.`,
            modelAnswer: `For valuations, I build DCF models to determine intrinsic value based on projected free cash flows discounted by the WACC. I cross-reference this with comparable company analysis (trading multiples like EV/EBITDA) to verify findings against current market valuations.`,
            keywords: ['valuation', 'dcf', 'wacc', 'multiples', 'intrinsic'],
            category: 'Valuations'
          },
          {
            question: `How do you ensure compliance with financial regulations (like GAAP or IFRS) when preparing audits or reporting summaries?`,
            modelAnswer: `I ensure regulatory compliance by keeping audit checklists updated and performing reconciliation protocols on general ledgers. I enforce clear internal controls, separation of duties, and document accounting treatment selections to satisfy disclosure requirements.`,
            keywords: ['compliance', 'audit', 'reconciliation', 'ledger', 'disclosure'],
            category: 'Audit & GAAP'
          },
          {
            question: `Describe a scenario where you identified a cost-saving or revenue-driving opportunity through financial analysis using ${skill2}.`,
            modelAnswer: `I conducted a detailed operating variance analysis using ${skill2} and noticed overhead expenses in supply lines were growing faster than sales. I renegotiated vendor terms and streamlined inventory levels, resulting in $120K in annualized cost savings.`,
            keywords: [skill2.toLowerCase(), 'variance', 'overhead', 'inventory', 'savings'],
            category: 'Corporate Finance'
          }
        ],
        generic: [
          {
            question: `How do you establish project goals and prioritize deliverables when working with cross-functional teams? How does your experience with ${skill1} factor into this?`,
            modelAnswer: `I establish goals by defining project requirements and aligning stakeholders. Using ${skill1}, I break deliverables down into modular phases and assign priorities based on capacity and business impact. I run weekly checkpoints to monitor progress and adjust resource allocations as needed.`,
            keywords: [skill1.toLowerCase(), 'deliverables', 'priorities', 'cross-functional', 'stakeholders'],
            category: 'Project Control'
          },
          {
            question: `Can you describe a challenging project bottleneck or workflow inefficiency you resolved? What was your approach using ${skill2}?`,
            modelAnswer: `In my previous role, we faced bottleneck issues in reporting cycles due to manual processing steps. Utilizing ${skill2}, I designed and automated reporting templates and unified data imports. This eliminated manual data entries, reducing delivery times by 40% and freeing up team bandwidth.`,
            keywords: [skill2.toLowerCase(), 'bottleneck', 'automated', 'efficiency', 'reporting'],
            category: 'Process Opt'
          },
          {
            question: `How do you handle scope creep or shifting project priorities under tight deadlines?`,
            modelAnswer: `I manage scope changes by conducting change impact assessments. I present the estimated resource cost to key stakeholders, prompting them to prioritize new additions or extend timelines. This maintains expectations and protects team velocity.`,
            keywords: ['scope creep', 'stakeholders', 'impact', 'priorities', 'expectations'],
            category: 'Scope Control'
          },
          {
            question: `How do you measure project success? What qualitative or quantitative KPIs do you establish?`,
            modelAnswer: `I define success using KPIs like project milestones, delivery variance, and customer satisfaction scores. I set up real-time performance indicators to track quality metrics and conduct post-mortems to ensure continuous improvements.`,
            keywords: ['kpis', 'milestones', 'variance', 'quality', 'post-mortem'],
            category: 'Project KPIs'
          },
          {
            question: `Describe a situation where you had to persuade stakeholders or team members to adopt a new methodology or workflow.`,
            modelAnswer: `To implement a new workflow, I built a small case study showing the potential efficiency gains. I hosted a brief training workshop, address team questions, and phased the transition. This resulted in an immediate 15% improvement in delivery speed.`,
            keywords: ['stakeholders', 'methodology', 'workflow', 'efficiency', 'transition'],
            category: 'Stakeholders'
          }
        ]
      };

      // Map industry code to matching template category
      let categoryQuestions = templates.generic;
      if (['tech', 'engineering', 'operations'].includes(industry)) {
        categoryQuestions = templates.tech;
      } else if (['data'].includes(industry)) {
        categoryQuestions = templates.data;
      } else if (['design'].includes(industry)) {
        categoryQuestions = templates.design;
      } else if (['marketing', 'sales'].includes(industry)) {
        categoryQuestions = templates.marketing;
      } else if (['finance', 'consulting', 'legal', 'hr'].includes(industry)) {
        categoryQuestions = templates.finance;
      }

      return categoryQuestions;
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

    // Save to Database
    const questions_data = this.state.questions.map((q, idx) => ({
      category: q.category,
      question: q.question,
      answer: this.state.answers[idx],
      score: this.state.scores[idx],
      critique: this.state.critiques[idx],
      modelAnswer: q.modelAnswer
    }));

    this.saveInterviewScorecard({
      type: this.state.type,
      role: AppState.generatedData?.targetRole || 'Professional',
      company: AppState.generatedData?.company || 'our company',
      avg_score: avgScore,
      time_spent: timeStr,
      completion: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
      questions_data
    });

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

  async saveInterviewScorecard(data) {
    try {
      const res = await fetch(`${API_BASE}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        console.log('Mock interview scorecard saved to database');
        if (typeof fetchDashboardData === 'function') {
          fetchDashboardData();
        }
      }
    } catch (err) {
      console.error('Failed to save mock interview scorecard:', err);
    }
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

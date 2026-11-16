// All site copy lives here. Edit text in this file; components only read from it.
// Anything marked TODO is not on the resume and needs a real value.

export type Link = { label: string; href: string; todo?: boolean }

export type Role = {
  title: string
  company: string
  location: string
  start: string
  end: string
  highlights: string[]
  stack: string[]
}

export type Project = {
  title: string
  /** Optional credit line, e.g. where it was built. */
  event?: { name: string; host: string }
  stack: string[]
  description: string
  links: Link[]
}

export type SkillGroup = { name: string; items: string[] }

export const site = {
  name: 'Moeez Ishaq',
  role: 'Software & AI Engineer',
  location: 'Toronto / Waterloo, ON',
  tagline:
    'Software & AI engineer building payment-routing systems, AI developer tooling, and LLM-powered automation.',
  bio: [
    'I’m a Computer Science & BBA double-degree student at Wilfrid Laurier University, currently an Artificial Intelligence Engineer Co-op at RBC.',
    'I’ve built analytics for AI-assisted development, LLM pipelines for security remediation and API documentation, and large-scale data ingestion on Databricks and Azure. I love solving real user problems and developing solutions that deliver measurable impact.',
  ],
  status: 'AI Engineer Co-op at RBC',
}

export const contact = {
  email: 'moeezishaq.dev@gmail.com',
  linkedin: { label: 'linkedin.com/in/moeez-ishaq', href: 'https://linkedin.com/in/moeez-ishaq' },
  github: { label: 'github.com/MoeezIshaq', href: 'https://github.com/MoeezIshaq' },
  resume: { label: 'Download résumé', href: '/Moeez%20Ishaq%20-%20Resume.pdf', filename: 'Moeez Ishaq - Resume.pdf' },
}

export const portrait = { src: '/moeez-ishaq.jpg', alt: 'Portrait of Moeez Ishaq' }

export const experience: Role[] = [
  {
    title: 'Artificial Intelligence Engineer Co-op',
    company: 'Royal Bank of Canada',
    location: 'Toronto, ON',
    start: 'Sep 2026',
    end: 'Present',
    highlights: [
      'Building a Java/Spring Boot engine to replace the production Fircosoft payment-routing system behind RBC’s ~$40T in annual wires, implementing correspondent-bank routing logic from copybook inputs.',
      'Built a log-replay pipeline with an IBM MQ capture tool that routes payments and diffs 29 copybook fields against legacy replies, matching 6,030 of 6,058 payments (99.5%) across 19 production logs.',
      'Caught two rule-engine bugs (exact-vs-contains matching, an unparsed IN operator) affecting 80 rules and ~77K hits by testing ~1,500 exit rules in the ~5,600-rule vendor set, reaching 0 failures.',
      'Reduced manual AI-assisted development tracking by building a Spec Kit extension with 16 lifecycle hooks that auto-captures token, cost, and duration data across 8 SDLC phases, syncing to GA4.',
      'Contributed to an internal adoption portal (FastAPI, React/TypeScript, MongoDB) that scores 15,000+ repositories across 6 adoption tiers, rolling results up 4 org levels, giving leadership one view of SpecKit adoption.',
    ],
    stack: ['Java', 'Spring Boot', 'IBM MQ', 'FastAPI', 'React', 'TypeScript', 'MongoDB', 'GA4'],
  },
  {
    title: 'Software Engineer Co-op',
    company: 'Royal Bank of Canada',
    location: 'Toronto, ON',
    start: 'Jan 2026',
    end: 'Apr 2026',
    highlights: [
      'Automated documentation for 47 internal APIs with a JavaScript pipeline that generates LLM-based docs and publishes to Confluence via MCP, supporting an AI initiative estimated to save ~$700K annually.',
      'Reduced vulnerability remediation to a single PR merge with a Python pipeline (LangChain + internal LLM gateway) that detects, fixes, tests, and raises pull requests for security alerts.',
      'Cut Client ID Visualizer response time by ~50% by parallelizing GraphQL and REST calls in a Java/Spring Boot backend with CompletableFuture, deployed on OpenShift/Kubernetes and powering 1,000+ searches.',
      'Eliminated 100% of developer effort triggering batch jobs with a self-service platform for Excel/CSV → JSON transformations across 1,000+ record batches of KYC and financial data, backed by MongoDB and AWS S3.',
    ],
    stack: ['Python', 'LangChain', 'JavaScript', 'MCP', 'Java', 'GraphQL', 'OpenShift', 'AWS S3'],
  },
  {
    title: 'Data Engineer Co-op',
    company: 'Mattamy Homes',
    location: 'Mississauga, ON',
    start: 'May 2025',
    end: 'Aug 2025',
    highlights: [
      'Resolved Spark driver OOM crashes by rewriting an R reshape2 melt in PySpark, saving 30–40 minutes per run.',
      'Engineered Python ingestion pipelines in Databricks to collect and normalize housing data from multiple real estate boards, feeding 45,000+ records monthly into a data lake behind national reporting dashboards.',
      'Automated weekly ingestion of 50,000+ housing records via Azure Data Factory and SQL ETL pipelines.',
    ],
    stack: ['PySpark', 'Databricks', 'Python', 'Azure Data Factory', 'SQL'],
  },
]

export const projects: Project[] = [
  {
    title: 'Lab Chain-of-Custody Agent',
    event: { name: 'Agents in Context Hackathon 2026', host: 'MongoDB' },
    stack: ['Python', 'MongoDB Atlas', 'FastAPI', 'React', 'TypeScript', 'Atlas Vector Search'],
    description:
      'An AI custody agent for forensic and clinical labs that makes 100% of actions auditable via an insert-only MongoDB Atlas ledger and a real-time kill switch. A RAG audit engine enables plain-English custody search using Atlas Vector Search (1024-dim embeddings), 43 FastAPI endpoints, and a React/TypeScript frontend.',
    links: [{ label: 'GitHub', href: 'https://github.com/SarimEkram/Custody-OS' }],
  },
  {
    title: 'AI-Powered Navigation Assistant',
    event: { name: 'NexHacks 2026', host: 'Carnegie Mellon University' },
    stack: ['TypeScript', 'React', 'Gemini', 'ElevenLabs', 'Overshoot AI'],
    description:
      'Voice-guided indoor navigation for visually impaired users. Speech-to-text queries become adaptive, step-by-step routes via Gemini and ElevenLabs text-to-speech, and Overshoot AI plus LLM reasoning over structured floor plans triggers live voice alerts for obstacles within 2 seconds of detection.',
    links: [{ label: 'GitHub', href: 'https://github.com/emaadqazi/NexHacks2025' }],
  },
  {
    title: 'Music Sequence Predictor',
    stack: ['Python', 'TensorFlow', 'Keras', 'NumPy', 'Pandas'],
    description:
      'A dilated Conv1D + LSTM model trained on 4-voice Bach chorales, reaching ~82% validation next-note accuracy and generating new chorales from an 8-chord seed.',
    links: [{ label: 'GitHub', href: 'https://github.com/MoeezIshaq/Music_Predictor' }],
  },
  {
    title: 'Stocks Fantasy League',
    stack: ['TypeScript', 'React', 'Node.js', 'Supabase', 'PostgreSQL', 'Firebase'],
    description:
      'A fantasy league platform where portfolio valuations and league rankings are driven by hourly Alpha Vantage market data, backed by Supabase/PostgreSQL with Firebase authentication.',
    links: [{ label: 'GitHub', href: 'https://github.com/emaadqazi/InvestorsArena' }],
  },
  {
    title: 'Car Browsing Application',
    stack: ['Java', 'SQL', 'HTML', 'CSS', 'JavaScript', 'Lightning Web Components'],
    description:
      'A dynamic car-browsing experience built with Lightning Web Components and modular parent-child communication for responsive, real-time UI updates, backed by Java filtering logic that builds SQL queries from user-defined price, category, and make parameters.',
    links: [{ label: 'GitHub', href: 'https://github.com/MoeezIshaq/carhub' }],
  },
  {
    title: 'Real Estate DBMS GUI',
    stack: ['Python', 'PyQt', 'MySQL'],
    description:
      'A Python desktop application built with PyQt that provides full CRUD functionality on MySQL databases through the UI, with input validation to prevent data entry errors and keep records accurate.',
    links: [{ label: 'GitHub', href: 'https://github.com/MoeezIshaq/Real_Estate_DBMS_GUI' }],
  },
]

export const skills: SkillGroup[] = [
  { name: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'R', 'GraphQL'] },
  {
    name: 'Data / ML',
    items: ['PySpark', 'TensorFlow / Keras', 'NumPy / Pandas', 'Databricks', 'LangChain', 'LLM APIs', 'RAG', 'Atlas Vector Search'],
  },
  { name: 'Cloud & Infra', items: ['AWS S3', 'Microsoft Azure', 'OpenShift / Kubernetes', 'Docker', 'IBM MQ', 'CI/CD'] },
  {
    name: 'Frameworks & Databases',
    items: ['React', 'Node.js', 'Spring Boot', 'FastAPI', 'PostgreSQL', 'MySQL', 'Supabase', 'MongoDB'],
  },
  { name: 'Tools', items: ['Claude Code', 'GitHub Copilot', 'Cursor', 'Devin', 'MCP'] },
]

export const education = {
  school: 'Wilfrid Laurier University',
  location: 'Waterloo, ON',
  degree: 'B.Sc. Computer Science & BBA',
  program: 'Double Degree',
  start: 'Sep 2023',
  end: 'Apr 2028',
  highlights: ['GPA 3.9 / 4.0', 'Dean’s List'],
  certifications: [
    'JPMorgan Chase Software Engineering (Forage Simulation)',
    'Databricks Certified Fundamentals',
    'Salesforce Certified Platform Developer I',
    'Salesforce Certified Platform App Builder',
    'Salesforce Certified AI Associate',
    'Salesforce Certified Administrator'
  ],
}

export const nav = [
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
] as const

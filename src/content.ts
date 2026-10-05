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
  /** Shown behind a "more" toggle. */
  extraHighlights?: string[]
  stack: string[]
}

export type Project = {
  title: string
  context?: string
  stack: string[]
  description: string
  links: Link[]
}

export type SkillGroup = { name: string; items: string[] }

export const site = {
  name: 'Moeez Ishaq',
  role: 'Software & ML Engineer',
  location: 'Toronto / Waterloo, ON',
  tagline:
    'Software & ML engineer building data pipelines, AI developer tooling, and LLM-powered automation.',
  bio: [
    'I’m a Computer Science & BBA double-degree student at Wilfrid Laurier University, currently a Machine Learning Engineer Co-op at RBC.',
    'I’ve built analytics for AI-assisted development, LLM pipelines for security remediation and API documentation, and large-scale data ingestion on Databricks and Azure. I like work that sits where software, data, and business meet.',
  ],
  status: 'ML Engineer Co-op at RBC',
}

export const contact = {
  email: 'moeezishaq.dev@gmail.com',
  linkedin: { label: 'linkedin.com/in/moeez-ishaq', href: 'https://linkedin.com/in/moeez-ishaq' },
  github: { label: 'github.com/MoeezIshaq', href: 'https://github.com/MoeezIshaq' },
  resume: { label: 'Download résumé', href: '/Moeez_Ishaq_Resume.pdf' },
}

export const experience: Role[] = [
  {
    title: 'Machine Learning Engineer Co-op (AI/Software)',
    company: 'Royal Bank of Canada',
    location: 'Toronto, ON',
    start: 'Sep 2026',
    end: 'Present',
    highlights: [
      'Built a Spec Kit extension with 16 lifecycle hooks that auto-captures token, cost, and duration data across 8 SDLC phases and syncs it to GA4, reducing manual tracking of AI-assisted development.',
      'Improved analytics reliability with orphaned-phase reconciliation, duplicate-run detection, and a 4-hour auto-abandon safeguard in a Bash/Python pipeline, validated by a 61-test regression suite.',
      'Contributed to an internal adoption portal (FastAPI, React/TypeScript, MongoDB) that scores 15,000+ repositories across 6 adoption tiers and rolls results up 4 org levels.',
    ],
    extraHighlights: [
      'Built a self-contained HTML dashboard of per-phase, per-model, and per-story breakdowns across 16 LLM pricing models, showing AI vs. human development cost trade-offs.',
    ],
    stack: ['Python', 'Bash', 'FastAPI', 'React', 'TypeScript', 'MongoDB', 'GA4'],
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
      'Cut Client ID Visualizer response time by ~50% by parallelizing GraphQL and REST calls with CompletableFuture, deployed on OpenShift/Kubernetes and powering 1,000+ searches.',
    ],
    extraHighlights: [
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
    title: 'AI-Powered Navigation Assistant',
    context: 'Carnegie Mellon University · NexHacks 2026',
    stack: ['TypeScript', 'React', 'Gemini', 'ElevenLabs', 'Overshoot AI'],
    description:
      'Voice-guided indoor navigation for visually impaired users. Speech-to-text queries become adaptive, step-by-step routes via Gemini and ElevenLabs text-to-speech, and Overshoot AI plus LLM reasoning over structured floor plans triggers live voice alerts for obstacles within 2 seconds of detection.',
    links: [
      { label: 'GitHub', href: '#', todo: true }, // TODO: repo URL
      { label: 'Demo', href: '#', todo: true }, // TODO: demo / Devpost URL
    ],
  },
  {
    title: 'Music Sequence Predictor',
    context: 'Neural network',
    stack: ['Python', 'TensorFlow', 'Keras', 'NumPy', 'Pandas'],
    description:
      'A dilated Conv1D + LSTM model trained on 4-voice Bach chorales, reaching ~82% validation next-note accuracy and generating new chorales from an 8-chord seed.',
    links: [
      { label: 'GitHub', href: '#', todo: true }, // TODO: repo URL
      { label: 'Demo', href: '#', todo: true }, // TODO: audio samples / notebook URL
    ],
  },
  {
    title: 'Stocks Fantasy League',
    stack: ['TypeScript', 'React', 'Node.js', 'Supabase', 'PostgreSQL', 'Firebase'],
    description:
      'A fantasy league platform where portfolio valuations and league rankings are driven by hourly Alpha Vantage market data, backed by Supabase/PostgreSQL with Firebase authentication.',
    links: [
      { label: 'GitHub', href: '#', todo: true }, // TODO: repo URL
      { label: 'Demo', href: '#', todo: true }, // TODO: live URL
    ],
  },
]

export const skills: SkillGroup[] = [
  { name: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'R', 'GraphQL'] },
  {
    name: 'Data / ML',
    items: ['PySpark', 'TensorFlow / Keras', 'NumPy / Pandas', 'Databricks', 'LangChain', 'LLM APIs'],
  },
  { name: 'Cloud & Infra', items: ['AWS S3', 'Microsoft Azure', 'OpenShift / Kubernetes', 'CI/CD'] },
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
  highlights: ['GPA 3.8 / 4.0', 'Dean’s List'],
  certifications: [
    'Databricks Certified',
    'Salesforce Certified ×4',
    'JPMorgan Chase Software Engineer Forage Simulation',
  ],
}

export const nav = [
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
] as const

export const profile = {
  name: 'Harivansh B', role: 'Software Developer',
  intro: 'Computer Science student at SSN building scalable systems, products and experiments across backend engineering, distributed systems and AI.',
  github: 'https://github.com/harivansh-b', linkedin: 'https://linkedin.com/in/harivanshb/',
  leetcode: 'https://leetcode.com/u/harivansh_b',
  gfg: 'https://www.geeksforgeeks.org/profile/harivansh_b',
  hackerrank: 'https://www.hackerrank.com/profile/harivansh_b',
  email: 'mailto:bandaruharivansh@gmail.com',
  emailDisplay: 'bandaruharivansh@gmail.com',
  bookingUrl: 'https://calendly.com/bandaruharivansh',
  summary: 'Final-year Computer Science undergraduate at SSN College of Engineering (CGPA 9.205/10) who enjoys building reliable, high-performance software. I build full-stack products with FastAPI, Next.js, React, PostgreSQL, MongoDB, Redis and Kafka, and I am most at home in backend engineering and distributed systems. Previously an SDE Intern at Barclays, where I worked on distributed tracing with OpenTelemetry. ICPC Regionalist, three-time departmental Gold Medalist and LeetCode Guardian.',
  facts: [
    { label: 'Based in', value: 'Chennai, India' },
    { label: 'Degree', value: "B.E. CSE · '27" },
    { label: 'Focus', value: 'Backend & distributed systems' },
    { label: 'Projects shipped', value: '15+' },
  ],
}

export const PROJECT_CATEGORIES = ['Full-stack', 'AI / ML', 'SIH', 'Mobile', 'Games & 3D', 'Core CS'] as const

export type Project = {
  name: string; type: string; category: typeof PROJECT_CATEGORIES[number]; featured?: boolean
  desc: string; points: string[]; tech: string[]; url: string; live?: string
  /** Extra source links for projects split across repositories. */
  links?: { label: string; url: string }[]
}

/* Featured projects are the top 4 shown under "All". */
export const projects: Project[] = [
  {
    name: 'TinyLink', type: 'URL infrastructure', category: 'Full-stack', featured: true,
    desc: 'A scalable URL-shortening platform with custom aliases, QR codes, expiry, analytics and secure authentication.',
    points: ['Redis caching and rate limiting cut redirect latency and database load', 'Custom aliases, QR codes, link expiry and click analytics', 'Clerk-based authentication'],
    tech: ['React', 'FastAPI', 'PostgreSQL', 'Redis', 'Clerk'], url: 'https://github.com/harivansh-b/tinylink', live: 'https://tinylink-plum-psi.vercel.app',
  },
  {
    name: 'Nexus Finance', type: 'Fintech', category: 'Full-stack', featured: true,
    desc: 'A personal finance platform for budgeting, transaction tracking and analytics dashboards, with payments and crypto data.',
    points: ['Budgets, transactions and analytics dashboards', 'Razorpay payments and Redis caching', 'Clerk authentication'],
    tech: ['React', 'Express', 'MongoDB', 'Redis', 'Razorpay', 'Clerk'], url: 'https://github.com/harivansh-b/Nexus-Finance', live: 'https://nexus-finance-olive.vercel.app',
  },
  {
    name: 'Eventra', type: 'Event platform', category: 'Full-stack', featured: true,
    desc: 'Create, discover, register for and check in to events, with payments, email notifications and organizer analytics.',
    points: ['Event creation, discovery, registration and check-ins', 'Organizer analytics and email notifications', 'JWT-secured Spring Boot backend'],
    tech: ['Vue.js', 'Spring Boot', 'Java', 'Tailwind', 'Razorpay', 'JWT'], url: 'https://github.com/harivansh-b/Eventra', live: 'https://eventra-wheat-omega.vercel.app',
  },
  {
    name: 'MedChain', type: 'Federated health AI', category: 'AI / ML', featured: true,
    desc: 'Hospitals collaboratively train diagnostic models without sharing patient data. Verified updates are aggregated with FedAvg and contributions recorded on-chain.',
    points: ['Patient data never leaves the hospital; only weights and metrics are submitted', 'Digital-twin validation and cross-hospital anomaly screening before aggregation', 'Auditable on-chain trust layer'],
    tech: ['React', 'FastAPI', 'MongoDB', 'Azure Blob', 'Solidity', 'FedAvg'], url: 'https://github.com/harivansh-b/MedChain', live: 'https://med-chain-blue.vercel.app',
  },
  {
    name: 'AIRO', type: 'AI resume optimizer & placement prediction', category: 'AI / ML',
    desc: 'Tailors a resume to a job description with AI, gives an ATS score, and tracks developer profile stats from GitHub and LeetCode.',
    points: ['AI resume tailoring against a target job description', 'ATS scoring and LaTeX resume rendering', 'GitHub and LeetCode profile tracking'],
    tech: ['Next.js', 'FastAPI', 'Python', 'LaTeX', 'Docker'], url: 'https://github.com/harivansh-b/Placement-Prediction-with-AI-Resume-Optimizer',
  },
  {
    name: 'JD Hub', type: 'LLM extraction backend', category: 'AI / ML',
    desc: 'Turns unstructured job descriptions (text, PDF, EML or live URLs) into validated structured JSON and stores embeddings for semantic search.',
    points: ['Groq LLM extraction with strict Pydantic schema validation', 'Token-based chunking for long inputs', 'Sentence-transformer embeddings in Qdrant'],
    tech: ['Python', 'FastAPI', 'Groq', 'Qdrant', 'Docker'], url: 'https://github.com/harivansh-b/JD-Hub',
  },
  {
    name: 'E-Spam', type: 'Spam detection', category: 'AI / ML',
    desc: 'Classifies emails as spam or ham from pasted text or uploaded PDF/EML files using a Multinomial Naive Bayes model.',
    points: ['98.93% accuracy on the held-out test set', 'PDF and EML text extraction', 'Flask REST API with a Next.js frontend'],
    tech: ['Next.js', 'Flask', 'scikit-learn', 'Python'], url: 'https://github.com/harivansh-b/E-Spam', live: 'https://e-spam.vercel.app',
  },
  {
    name: 'Regression Engine', type: 'Linear regression workbench', category: 'AI / ML',
    desc: 'Upload a dataset and fit a linear regression with automatic null and outlier handling, assumption checks, predictions and a downloadable PDF report.',
    points: ['Checks linearity, normality, homoscedasticity, multicollinearity and independence of errors', 'R², MAE, MSE and RMSE with visualised diagnostics', 'Interactive predictions and PDF report export'],
    tech: ['Python', 'JavaScript', 'Matplotlib', 'Seaborn'], url: 'https://github.com/harivansh-b/Regression_Engine',
  },
  {
    name: 'KisanMitra', type: 'Agri market linkage', category: 'SIH',
    desc: 'A three-sided agricultural marketplace connecting Farmers, Farmer Producer Organisations (FPOs) and Buyers, with market intelligence and transaction tooling.',
    points: [
      'Deterministic marketplace matching engine and an order state machine on a modular FastAPI service layer',
      'Role-based workspaces for Farmer, FPO, Buyer, Storage, Transport, Quality Assessor and Admin',
      'PostGIS geography map of nearby actors and public Maharashtra mandi prices',
      'DB-aware SQL chatbot agent; Supabase Postgres, Auth and Storage with Alembic migrations',
    ],
    tech: ['Next.js', 'TypeScript', 'FastAPI', 'Supabase', 'PostgreSQL', 'SQLAlchemy', 'Clerk'],
    url: 'https://github.com/harivansh-b/KisanMitra-Frontend',
    links: [{ label: 'Frontend', url: 'https://github.com/harivansh-b/KisanMitra-Frontend' }, { label: 'Backend', url: 'https://github.com/harivansh-b/KisanMitra-Backend' }],
  },
  {
    name: 'NextChamp', type: 'AI sports talent assessment', category: 'SIH',
    desc: 'Helps athletes evaluate their skills, track progress and get personalised training insights, and helps scouts discover talent.',
    points: ['AI assistant for sports questions', 'Performance assessment from uploaded stats and videos', 'Progress dashboard and talent discovery'],
    tech: ['Flutter', 'FastAPI', 'MongoDB', 'Gemini', 'JWT'], url: 'https://github.com/harivansh-b/NextChamp',
  },
  {
    name: 'SavorGo', type: 'Food delivery system', category: 'Mobile',
    desc: 'A full-stack food delivery and restaurant order management app for Chennai, with live order tracking and payments.',
    points: ['Map-based location picking and restaurant filtering', 'Razorpay payments and email verification/invoices', 'Menu, account and order management'],
    tech: ['Flutter', 'Flask', 'Oracle', 'Razorpay'], url: 'https://github.com/harivansh-b/SavorGo',
  },
  {
    name: 'EcoFinds', type: 'Second-hand marketplace', category: 'Mobile',
    desc: 'A sustainable marketplace for pre-owned goods: listings, search and category filters, cart and purchase history.',
    points: ['Listing CRUD with search and category filters', 'Cart and purchase history', 'Built as a team of four'],
    tech: ['Flutter', 'FastAPI', 'MongoDB'], url: 'https://github.com/harivansh-b/EcoFinds',
  },
  {
    name: 'Chronos', type: 'Interactive 3D experience', category: 'Games & 3D',
    desc: 'A scroll-driven sci-fi time machine: dive through a portal into five explorable procedural 3D eras.',
    points: ['Pinned cinematic scroll sequence through five eras', 'Drag to explore each era while scroll drives the camera', 'Procedural Three.js scenes'],
    tech: ['Three.js', 'GSAP', 'JavaScript'], url: 'https://github.com/harivansh-b/Chronos', live: 'https://harivansh-b.github.io/Chronos/',
  },
  {
    name: 'Labyrinth', type: 'Maze game', category: 'Games & 3D',
    desc: 'A maze navigation game: race the clock through increasingly difficult levels and find the optimal path to the exit.',
    points: ['Multiple maze levels with rising difficulty', 'Collision detection and responsive controls', 'Score tracking and timer'],
    tech: ['Python', 'Arcade'], url: 'https://github.com/harivansh-b/LabyRinth',
  },
  {
    name: 'Tetris', type: 'Classic puzzle game', category: 'Games & 3D',
    desc: 'A recreation of Tetris: arrange falling tetrominoes into complete rows, with menus, instructions and scoring.',
    points: ['Game loop, collision detection and line clearing', 'Score management', 'Swing-rendered menus and how-to-play screens'],
    tech: ['Java', 'Swing'], url: 'https://github.com/harivansh-b/Tetris-Game',
  },
  {
    name: 'Railway Reservation', type: 'Booking system', category: 'Core CS',
    desc: 'A console railway booking system with authentication, seat and berth selection, ticket generation with PNR numbers and admin management.',
    points: ['Login, sign-up and password update', 'Booking, PNR status checks and cancellations', 'Admin management of trains, fares and reservations'],
    tech: ['C'], url: 'https://github.com/harivansh-b/Railway-Reservation-System',
  },
]

export const skillGroups = [
  { name: 'Languages', items: ['Python', 'Java', 'C', 'JavaScript', 'TypeScript', 'SQL'] },
  { name: 'Frontend', items: ['React', 'Next.js', 'Tailwind', 'Vue.js'] },
  { name: 'Backend', items: ['FastAPI', 'Express', 'Flask', 'Spring Boot'] },
  { name: 'Databases', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Oracle'] },
  { name: 'Cloud & tools', items: ['Redis', 'Kafka', 'Docker', 'Git', 'Linux', 'OpenTelemetry'] },
  { name: 'Core CS', items: ['DSA', 'OOP', 'DBMS', 'OS', 'Networks'] },
]

export const skills = skillGroups.flatMap(g => g.items)

export const experience = [
  {
    role: 'SDE Intern', org: 'Barclays', period: 'Jun 2026 – Jul 2026', status: 'COMPLETED',
    points: [
      'Developed a reusable Python SDK using FastAPI and OpenTelemetry to enable distributed tracing across enterprise microservices.',
      'Built APIs and middleware for automatic instrumentation and trace propagation, improving observability while reducing integration effort.',
    ],
    focus: ['Python', 'FastAPI', 'OpenTelemetry', 'Microservices', 'Observability'],
    trace: ['CLIENT', 'API', 'SERVICE', 'TRACE'],
  },
]

export type Club = { org: string; name: string; badge: string; logo?: string; wide?: boolean; zoom?: number; tenure?: string; roles: { title: string; period?: string; duration?: string }[] }

/* Mirrors the LinkedIn Experience layout. Most significant first; roles most recent first. */
export const leadership: Club[] = [
  { org: 'NetSy', name: 'NetSy · Networks and Student Research Chapter, SSN', badge: 'NS', logo: '/logos/clubs/netsy.png', zoom: 1.7, roles: [{ title: 'President' }] },
  {
    org: 'CSI SSN', name: 'Computer Society of India SSN', badge: 'CSI', logo: '/logos/clubs/csi.jpg', tenure: '1 yr 4 mos',
    roles: [{ title: 'Webmaster', period: 'Aug 2026 – Present', duration: '3 mos' }, { title: 'Technical Team Member', period: 'Jul 2025 – Aug 2026', duration: '1 yr 2 mos' }],
  },
  {
    org: 'ACE SSN', name: 'Association of Computer Engineers, SSN', badge: 'ACE', logo: '/logos/clubs/ace.png', tenure: '2 yrs 4 mos',
    roles: [
      { title: 'Event Head', period: 'Jul 2026 – Present', duration: '4 mos' },
      { title: 'Event Organizer', period: 'Jul 2025 – Jul 2026', duration: '1 yr 1 mo' },
      { title: 'Event Volunteer', period: 'Jul 2024 – Jul 2025', duration: '1 yr 1 mo' },
    ],
  },
  { org: 'SSN Coding Club', name: 'SSN Coding Club · Competitive Programming Vertical', badge: 'CC', logo: '/logos/clubs/ssn-coding-club.png', roles: [{ title: 'Deputy Lead, CP Vertical' }] },
  { org: 'IEEE CIS SSN', name: 'IEEE Computational Intelligence Society, SSN', badge: 'CIS', logo: '/logos/clubs/ieee-cis.png', wide: true, roles: [{ title: 'Students & Alumni Representative Head' }] },
]

export type CodingProfile = {
  name: string; url: string; logoSrc?: string; icon?: string; value: string; rank: string; note?: string; bar?: number
  stats?: { label: string; value: string }[]; badges?: { name: string; stars: number }[]
}

export const cp: CodingProfile[] = [
  { name: 'LeetCode', logoSrc: '/logos/leetcode.png', url: 'https://leetcode.com/u/harivansh_b', value: '2147', rank: 'Guardian', note: 'Guardian badge: top 5% of LeetCode contest ratings.', bar: 2147 / 2400 },
  { name: 'Codeforces', logoSrc: '/logos/codeforces.png', url: 'https://codeforces.com/profile/harivansh_b', value: '1513', rank: 'Specialist', note: 'Specialist tier (1400–1599) in rated Codeforces rounds.', bar: 1513 / 2400 },
  { name: 'CodeChef', logoSrc: '/logos/codechef.ico', url: 'https://www.codechef.com/users/harivansh_b_6', value: '1666', rank: '3 Star', note: '3★ tier (1600–1799) in rated CodeChef contests.', bar: 1666 / 2400 },
  { name: 'AtCoder', logoSrc: '/logos/atcoder.png', url: 'https://atcoder.jp/users/harivansh_b', value: '1226', rank: 'Cyan', note: 'Cyan tier (1200–1599) in rated AtCoder contests.', bar: 1226 / 2400 },
  {
    name: 'GeeksforGeeks', icon: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/profile/harivansh_b', value: '158', rank: 'Problems solved',
    stats: [{ label: 'Coding score', value: '447' }, { label: 'Institute rank', value: '#7' }, { label: 'Longest POTD streak', value: '13 days' }],
  },
  {
    name: 'HackerRank', icon: 'HackerRank', url: 'https://www.hackerrank.com/profile/harivansh_b', value: '2', rank: 'Gold (5★) badges',
    badges: [{ name: 'Java', stars: 5 }, { name: 'Python', stars: 5 }, { name: 'Problem Solving', stars: 4 }, { name: 'C', stars: 4 }],
  },
]

export type Education = { institution: string; logo?: string; place: string; program: string; score: string; period: string; note?: string }

export const education: Education[] = [
  { institution: 'SSN College of Engineering', logo: '/logos/edu/ssn.svg', place: 'Chennai, India', program: 'B.E. Computer Science and Engineering', score: 'CGPA 9.205 / 10', period: '2023 – 2027', note: 'Departmental Gold Medalist · Semesters 3, 4 and 5' },
  { institution: 'Periyar Matriculation Higher Secondary School', logo: '/logos/edu/periyar.png', place: 'Chennai, India', program: 'Higher Secondary (Class XII)', score: '97.67%', period: '2023', note: 'School Topper · Ranked 1st in Class XII' },
]

/* Ordered by significance. `short` labels the 3D beacon for each award. */
export const achievements = [
  { title: 'ICPC Regionalist', event: 'ICPC Asia Chennai and Amritapuri Regional Contests', year: '2025', short: 'ICPC Regionalist' },
  { title: 'Semi-Finalist', event: 'Flipkart GRiD 8.0 · Qualified for Round 3', year: '2026', short: 'Flipkart GRiD' },
  { title: 'Departmental Gold Medalist', event: 'Department of CSE, SSN College of Engineering · Semesters 3, 4 and 5', year: '', short: 'Gold Medalist' },
  { title: 'Regional Finalist', event: 'SAP Hackfest', year: '2025', short: 'SAP Hackfest' },
  { title: 'Winner, 1st Place', event: 'Datathon, SSN College of Engineering', year: '2025', short: 'Datathon' },
]

import type {
  CertificationItem,
  ContactData,
  EducationItem,
  FooterData,
  PortfolioData,
  ProfileData,
  ProjectsSectionData,
  SkillGroup,
  SkillItem,
  SkillLevel,
  ProjectData,
  TimelineSectionData,
} from "@/lib/types";

function normalizeSkillLevel(value: unknown): SkillLevel {
  return value === "advanced" || value === "good" || value === "better" || value === "linear"
    ? value
    : "good";
}

function normalizeSkillItems(items: unknown): SkillItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item): SkillItem | null => {
      if (typeof item === "string") {
        const name = item.trim();

        return name ? { name, level: "good" } : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const name = "name" in item && typeof item.name === "string" ? item.name.trim() : "";

      if (!name) {
        return null;
      }

      return {
        name,
        level: normalizeSkillLevel("level" in item ? item.level : undefined),
      };
    })
    .filter((item): item is SkillItem => Boolean(item));
}

function normalizeSkillGroups(groups: unknown, fallback: SkillGroup[]): SkillGroup[] {
  if (!Array.isArray(groups)) {
    return fallback;
  }

  return groups
    .map((group): SkillGroup | null => {
      if (!group || typeof group !== "object") {
        return null;
      }

      return {
        title: "title" in group && typeof group.title === "string" ? group.title : "",
        accent: "accent" in group && typeof group.accent === "string" ? group.accent : "",
        marker: "marker" in group && typeof group.marker === "string" ? group.marker : "",
        items: normalizeSkillItems("items" in group ? group.items : []),
      };
    })
    .filter((group): group is SkillGroup => Boolean(group));
}

function normalizeCertifications(items: unknown, fallback: CertificationItem[]): CertificationItem[] {
  if (!Array.isArray(items)) {
    return fallback;
  }

  return items
    .map((item, index): CertificationItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        id:
          "id" in item && typeof item.id === "string" && item.id.trim()
            ? item.id
            : `certification-${index + 1}`,
        order: "order" in item && typeof item.order === "number" ? item.order : index,
        title: "title" in item && typeof item.title === "string" ? item.title : "",
        issuer: "issuer" in item && typeof item.issuer === "string" ? item.issuer : "",
        issued: "issued" in item && typeof item.issued === "string" ? item.issued : "",
        credentialId:
          "credentialId" in item && typeof item.credentialId === "string" ? item.credentialId : "",
        href: "href" in item && typeof item.href === "string" ? item.href : "",
        accent: "accent" in item && typeof item.accent === "string" ? item.accent : "",
        badge: "badge" in item && typeof item.badge === "string" ? item.badge : "",
      };
    })
    .filter((item): item is CertificationItem => Boolean(item));
}

const profile: ProfileData = {
  name: "Rakesh Kumar",
  role: "Full-Stack Developer",
  tagline: "I build interfaces that feel alive, systems that stay calm, and products people remember.",
  intro:
    "This portfolio is a guided walk through the way I learn, design, and ship. Every section is meant to feel like an artifact from the journey, not a static resume panel.",
  location: "India / Remote-friendly",
  availability: "Open to product engineering and creative frontend roles",
  avatarLabel: "RK",
  profileImageAlt: "Portrait of Rakesh Kumar",
  profileImageSrc: "/images/profile.jpg",
  idCard: {
    serialNumber: "31522",
    primaryName: "Rakesh",
    secondaryName: "Kumar",
    frontRoleLines: ["Full Stack", "Web Dev", "UI / UX"],
    backTitle: "Owner links",
    backDescription: "Hover for sway, move the pointer for tilt, and pull the badge down to unlock owner controls.",
    backFooter: "Release to let the badge settle back into place.",
  },
  skillsSection: {
    eyebrow: "Skills block",
    title: "Skills",
    description: "A quick view of the languages, tools, frameworks, and working strengths behind the portfolio.",
  },
  skillGroups: [
    {
      title: "Languages",
      accent: "#67e8f9",
      marker: "LG",
      items: [
        { name: "TypeScript", level: "advanced" },
        { name: "JavaScript", level: "advanced" },
        { name: "Python", level: "good" },
        { name: "Java", level: "good" },
        { name: "SQL", level: "good" },
        { name: "HTML/CSS", level: "advanced" },
        { name: "C++", level: "better" },
      ],
    },
    {
      title: "Technologies",
      accent: "#14b8a6",
      marker: "TK",
      items: [
        { name: "Firebase", level: "advanced" },
        { name: "Azure DevOps", level: "better" },
        { name: "Docker", level: "good" },
        { name: "Git", level: "advanced" },
        { name: "TailwindCSS", level: "advanced" },
        { name: "Framer Motion", level: "good" },
        { name: "Figma", level: "good" },
      ],
    },
    {
      title: "Frameworks",
      accent: "#fb7185",
      marker: "FW",
      items: [
        { name: "Next.js", level: "advanced" },
        { name: "React", level: "advanced" },
        { name: "Spring Boot", level: "good" },
        { name: "Microservices", level: "better" },
        { name: "Django", level: "better" },
        { name: "Flutter", level: "linear" },
      ],
    },
    {
      title: "Core",
      accent: "#f97316",
      marker: "CR",
      items: [
        { name: "Web Development", level: "advanced" },
        { name: "Cloud Infrastructure", level: "good" },
        { name: "DevOps", level: "better" },
        { name: "Communication", level: "advanced" },
        { name: "Analytical Thinking", level: "advanced" },
      ],
    },
    {
      title: "Misc",
      accent: "#8b5cf6",
      marker: "ET",
      items: [
        { name: "Digital Content Creation", level: "good" },
        { name: "Canva", level: "good" },
        { name: "Storytelling", level: "advanced" },
        { name: "Rapid Prototyping", level: "advanced" },
      ],
    },
  ],
  certificationsSection: {
    eyebrow: "Certifications block",
    title: "Certifications",
    description: "Selected certifications presented with the same visual weight as each skill cluster card.",
  },
  certifications: [
    {
      id: "cert-azure-fundamentals",
      order: 0,
      title: "Azure Fundamentals",
      issuer: "Microsoft",
      issued: "2024",
      credentialId: "AZ-900",
      href: "https://learn.microsoft.com/",
      accent: "#38bdf8",
      badge: "AZ",
    },
    {
      id: "cert-firebase-apps",
      order: 1,
      title: "Firebase App Development",
      issuer: "Google",
      issued: "2024",
      credentialId: "FB-DEV",
      href: "https://firebase.google.com/",
      accent: "#f59e0b",
      badge: "FB",
    },
    {
      id: "cert-react-patterns",
      order: 2,
      title: "Advanced React Patterns",
      issuer: "Frontend Masters",
      issued: "2025",
      credentialId: "REACT-PRO",
      href: "https://frontendmasters.com/",
      accent: "#fb7185",
      badge: "RC",
    },
  ],
  heroActions: [
    {
      label: "Walk the timeline",
      href: "#timeline",
      variant: "primary",
    },
    {
      label: "Open projects",
      href: "#projects",
      variant: "secondary",
    },
  ],
  socialLinks: [
    {
      label: "GitHub",
      href: "https://github.com/",
      handle: "@rakesh",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/",
      handle: "/in/rakesh",
    },
    {
      label: "Email",
      href: "mailto:rakesh@example.com",
      handle: "rakesh@example.com",
    },
  ],
};

const education: EducationItem[] = [
  {
    id: "primary-school",
    order: 0,
    title: "Primary School",
    period: "2008 - 2013",
    institution: "Foundation Public School",
    summary: "Curiosity started with sketchbooks, dismantled toys, and an obsession with how things worked.",
    details: [
      "Built early comfort with drawing, basic logic, and presenting small ideas in front of class.",
      "Learned to treat mistakes as part of the process instead of as a failure state.",
      "Started noticing that design and problem solving were connected, even before software entered the picture.",
    ],
    accent: "#f97316",
  },
  {
    id: "high-school",
    order: 1,
    title: "High School",
    period: "2014 - 2018",
    institution: "Scholars High School",
    summary: "Technical curiosity became structured discipline through science, mathematics, and early computing.",
    details: [
      "Moved from generic computer classes into purposeful programming practice.",
      "Developed a bias for clean work, repeatable systems, and measurable improvement.",
      "Started building small websites and experimenting with visual presentation on the web.",
    ],
    accent: "#14b8a6",
  },
  {
    id: "intermediate",
    order: 2,
    title: "Intermediate",
    period: "2018 - 2020",
    institution: "Narayana Junior College",
    summary: "The pace accelerated: deeper technical study, tighter schedules, and a sharper focus on engineering.",
    details: [
      "Learned to manage high-intensity workloads without losing attention to detail.",
      "Strengthened problem solving through structured reasoning and deliberate practice.",
      "Began connecting abstract theory with the practical systems used in modern software.",
    ],
    accent: "#8b5cf6",
  },
  {
    id: "btech",
    order: 3,
    title: "B.Tech",
    period: "2020 - 2024",
    institution: "Institute of Engineering and Technology",
    summary: "Converted curiosity into product thinking through software projects, interface craft, and systems design.",
    details: [
      "Built production-oriented projects with React, TypeScript, Firebase, and cloud tooling.",
      "Focused on architecture, user experience, and maintainable frontends rather than only feature delivery.",
      "Became interested in immersive interfaces where engineering quality and storytelling reinforce each other.",
    ],
    accent: "#3b82f6",
  },
];

const timeline: TimelineSectionData = {
  title: "Education milestones arranged as a guided journey.",
  description: "Open any milestone to read the details from each stage of the academic path.",
};

const projectsSection: ProjectsSectionData = {
  eyebrow: "Project desktop",
  title: "Project work presented as a friendlier explorer-style workspace.",
  description:
    "Open any project to move through overview, screenshots, tech stack, links, README notes, and custom sections from one desktop window.",
};

const projects: ProjectData[] = [
  {
    id: "signal-desk",
    order: 0,
    name: "Signal Desk",
    tagline: "A real-time analytics cockpit for fast-moving product teams.",
    description:
      "Signal Desk turns fragmented metrics into a narrative dashboard with live activity streams, role-based views, and alert-driven decision making.",
    stack: ["Next.js", "TypeScript", "TailwindCSS", "Firebase"],
    features: [
      "Live KPI board with adaptive layout states",
      "Role-aware access for operations, design, and product",
      "Insight cards that translate raw metrics into clear actions",
    ],
    repoHref: "https://github.com/",
    liveHref: "https://vercel.com/",
    icon: "SD",
    accent: "#0f766e",
    status: "Live concept build",
    fileTree: [
      "app/page.tsx",
      "components/kpi-board.tsx",
      "components/live-feed.tsx",
      "lib/metrics.ts",
      "lib/alerts.ts",
      "styles/dashboard.css",
    ],
    codeSnippet: `export function summarizeMetrics(metrics: Metric[]) {
  return metrics
    .filter((metric) => metric.status !== "idle")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}`,
    readme: `# Signal Desk

Signal Desk is designed as a calm analytics workspace for teams that need fast answers without dashboard overload.

## What it solves
- Pulls activity, alerts, and KPIs into one surface
- Helps product and operations teams see what changed first
- Turns noisy metrics into priority-ordered insight cards

## Build notes
The interface uses a narrative layout so the most important information stays visible before deeper data views are opened.`,
    images: [],
    customSections: [
      {
        id: "signal-desk-outcomes",
        title: "Outcomes",
        content:
          "Designed to shorten the distance between raw metrics and action. The main success metric is faster triage during live product changes.",
      },
    ],
  },
  {
    id: "atlas-commerce",
    order: 1,
    name: "Atlas Commerce",
    tagline: "A visually rich storefront focused on product discovery and conversion.",
    description:
      "Atlas Commerce explores how editorial storytelling can make a product catalog feel curated instead of transactional.",
    stack: ["Next.js", "Framer Motion", "Stripe", "CMS"],
    features: [
      "Editorial landing flows with motion-led browsing",
      "Responsive product narratives instead of grid-only browsing",
      "Checkout handoff tuned for speed and clarity",
    ],
    repoHref: "https://github.com/",
    liveHref: "https://vercel.com/",
    icon: "AC",
    accent: "#b45309",
    status: "Case study",
    fileTree: [
      "app/(shop)/layout.tsx",
      "components/product-hero.tsx",
      "components/story-strip.tsx",
      "lib/cart-store.ts",
      "lib/checkout.ts",
      "styles/catalog.css",
    ],
    codeSnippet: `const sections = products.map((product) => ({
  slug: product.slug,
  label: product.name,
  mood: product.collection,
}));`,
    readme: `# Atlas Commerce

Atlas Commerce explores how a storefront can feel curated instead of purely transactional.

## Experience goals
- Use editorial pacing to guide discovery
- Keep checkout fast even with a rich visual layer
- Make collection storytelling part of conversion, not decoration

## Build notes
Motion is used to reinforce hierarchy and product mood instead of adding generic animation.`,
    images: [],
    customSections: [
      {
        id: "atlas-commerce-merchandising",
        title: "Merchandising",
        content:
          "The custom merchandising layer focuses on featured collections, seasonal stories, and visual grouping rules for higher product discoverability.",
      },
    ],
  },
  {
    id: "story-engine",
    order: 2,
    name: "Story Engine",
    tagline: "A modular interface kit for immersive portfolio and campaign experiences.",
    description:
      "Story Engine packages layout primitives, motion systems, and editorial components into a reusable toolkit for interactive storytelling sites.",
    stack: ["React", "TypeScript", "Framer Motion", "Three.js"],
    features: [
      "Reusable chapter transitions and scroll choreography",
      "Theme-aware art direction with a single data model",
      "Composable storytelling blocks for landing pages and portfolios",
    ],
    repoHref: "https://github.com/",
    liveHref: "https://vercel.com/",
    icon: "SE",
    accent: "#7c3aed",
    status: "Framework experiment",
    fileTree: [
      "packages/motion/presets.ts",
      "packages/layout/chapter-shell.tsx",
      "packages/media/scene-layer.tsx",
      "packages/theme/tokens.ts",
      "examples/portfolio/page.tsx",
    ],
    codeSnippet: `export const chapterTransition = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};`,
    readme: `# Story Engine

Story Engine is a reusable kit for immersive portfolio and campaign builds.

## Core idea
Package transitions, layout primitives, and media choreography into composable modules.

## Why it matters
It reduces one-off animation work and gives storytelling-heavy projects a shared system for motion, layout, and art direction.`,
    images: [],
    customSections: [
      {
        id: "story-engine-design-system",
        title: "Design system",
        content:
          "Built around reusable chapters, theme tokens, and motion presets so creative teams can compose pages without rebuilding the same presentation logic.",
      },
    ],
  },
  {
    id: "ops-lens",
    order: 3,
    name: "Ops Lens",
    tagline: "A troubleshooting surface for distributed systems and support teams.",
    description:
      "Ops Lens combines issue timelines, health summaries, and incident notes in a workspace designed for calm, fast diagnosis.",
    stack: ["Next.js", "Firebase", "Charts", "TypeScript"],
    features: [
      "Incident board with health snapshots and escalation markers",
      "Searchable timeline of events for support investigations",
      "Structured notes for handoff during production response",
    ],
    repoHref: "https://github.com/",
    liveHref: "https://vercel.com/",
    icon: "OL",
    accent: "#1d4ed8",
    status: "Internal tools concept",
    fileTree: [
      "app/incidents/page.tsx",
      "components/incident-list.tsx",
      "components/health-panels.tsx",
      "lib/logging.ts",
      "lib/status.ts",
      "styles/ops-lens.css",
    ],
    codeSnippet: `export function formatIncidentTitle(code: string, service: string) {
  return [code.toUpperCase(), service].join(" / ");
}`,
    readme: `# Ops Lens

Ops Lens is a troubleshooting workspace for support and engineering teams working through active incidents.

## Focus
- Keep incident state readable at a glance
- Preserve timeline clarity during handoffs
- Combine system health, notes, and context in one workspace

## Build notes
The design favors calm density: enough information to act, without overwhelming the operator.`,
    images: [],
    customSections: [
      {
        id: "ops-lens-incident-flow",
        title: "Incident flow",
        content:
          "The main workflow covers triage, timeline reconstruction, escalation notes, and final handoff so operators do not lose context between shifts.",
      },
    ],
  },
];

const contact: ContactData = {
  headline: "Let us build something with texture, motion, and strong engineering underneath.",
  email: "rakesh@example.com",
  phone: "+91 98765 43210",
  location: "Hyderabad, India",
  responseTime: "Usually within 24 hours",
  availability: "Available for full-time, freelance, and selective collaborations",
  socialLinks: [
    {
      label: "GitHub",
      href: "https://github.com/",
      handle: "@rakesh",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/",
      handle: "/in/rakesh",
    },
    {
      label: "Portfolio Mail",
      href: "mailto:rakesh@example.com",
      handle: "Direct inbox",
    },
  ],
};

const footer: FooterData = {
  note: "Designed as an interactive narrative instead of a flat portfolio.",
  quote: "Good software should feel engineered and directed.",
  copyrightLabel: "2026 Rakesh Kumar",
  links: [
    {
      label: "GitHub",
      href: "https://github.com/",
      handle: "@rakesh",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/",
      handle: "/in/rakesh",
    },
    {
      label: "Email",
      href: "mailto:rakesh@example.com",
      handle: "rakesh@example.com",
    },
  ],
};

export const defaultPortfolioData: PortfolioData = {
  profile,
  timeline,
  education,
  projectsSection,
  projects,
  contact,
  footer,
};

export function createPortfolioDataClone(): PortfolioData {
  return JSON.parse(JSON.stringify(defaultPortfolioData)) as PortfolioData;
}

export function mergePortfolioData(partial?: Partial<PortfolioData>): PortfolioData {
  const base = createPortfolioDataClone();

  if (!partial) {
    return base;
  }

  return {
    profile: {
      ...base.profile,
      ...partial.profile,
      idCard: {
        ...base.profile.idCard,
        ...partial.profile?.idCard,
        frontRoleLines: partial.profile?.idCard?.frontRoleLines ?? base.profile.idCard.frontRoleLines,
      },
      skillsSection: {
        ...base.profile.skillsSection,
        ...partial.profile?.skillsSection,
      },
      skillGroups: normalizeSkillGroups(partial.profile?.skillGroups, base.profile.skillGroups),
      certificationsSection: {
        ...base.profile.certificationsSection,
        ...partial.profile?.certificationsSection,
      },
      certifications: normalizeCertifications(partial.profile?.certifications, base.profile.certifications),
      heroActions: partial.profile?.heroActions ?? base.profile.heroActions,
      socialLinks: partial.profile?.socialLinks ?? base.profile.socialLinks,
    },
    timeline: {
      ...base.timeline,
      ...partial.timeline,
    },
    education: (partial.education ?? base.education).map((item, index) => ({
      ...base.education[index % base.education.length],
      ...item,
      order: item.order ?? index,
    })),
    projectsSection: {
      ...base.projectsSection,
      ...partial.projectsSection,
    },
    projects: (partial.projects ?? base.projects).map((item, index) => {
      const baseProject = base.projects[index % base.projects.length];

      return {
        ...baseProject,
        ...item,
        order: item.order ?? index,
        readme: item.readme ?? item.description ?? "",
        customSections: item.customSections ?? [],
      };
    }),
    contact: {
      ...base.contact,
      ...partial.contact,
      socialLinks: partial.contact?.socialLinks ?? base.contact.socialLinks,
    },
    footer: {
      ...base.footer,
      ...partial.footer,
      links: partial.footer?.links ?? base.footer.links,
    },
  };
}

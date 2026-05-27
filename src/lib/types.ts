export type ThemeMode = "system" | "light" | "dark";

export type SocialLink = {
  label: string;
  href: string;
  handle: string;
};

export type HeroAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type SkillGroup = {
  title: string;
  accent: string;
  marker: string;
  items: string[];
};

export type TimelineSectionData = {
  title: string;
  description: string;
};

export type IdCardData = {
  serialNumber: string;
  primaryName: string;
  secondaryName: string;
  frontRoleLines: string[];
  backTitle: string;
  backDescription: string;
  backFooter: string;
};

export type ProfileData = {
  name: string;
  role: string;
  tagline: string;
  intro: string;
  location: string;
  availability: string;
  avatarLabel: string;
  profileImageAlt: string;
  profileImageSrc: string;
  idCard: IdCardData;
  skillGroups: SkillGroup[];
  heroActions: HeroAction[];
  socialLinks: SocialLink[];
};

export type EducationItem = {
  id: string;
  order: number;
  title: string;
  period: string;
  institution: string;
  summary: string;
  details: string[];
  accent: string;
};

export type ProjectImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

export type ProjectCustomSection = {
  id: string;
  title: string;
  content: string;
};

export type ProjectData = {
  id: string;
  order: number;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  features: string[];
  repoHref: string;
  liveHref: string;
  icon: string;
  accent: string;
  status: string;
  fileTree: string[];
  codeSnippet: string;
  readme: string;
  images: ProjectImage[];
  customSections: ProjectCustomSection[];
};

export type ContactData = {
  headline: string;
  email: string;
  phone: string;
  location: string;
  responseTime: string;
  availability: string;
  socialLinks: SocialLink[];
};

export type FooterData = {
  note: string;
  quote: string;
  copyrightLabel: string;
  links: SocialLink[];
};

export type PortfolioData = {
  profile: ProfileData;
  timeline: TimelineSectionData;
  education: EducationItem[];
  projects: ProjectData[];
  contact: ContactData;
  footer: FooterData;
};

export type EditableSection =
  | "profile"
  | "skills"
  | "timeline"
  | "education"
  | "projects"
  | "contact"
  | "mailer"
  | "footer";

export type EditorState =
  | {
      section: EditableSection;
      itemId?: string | null;
    }
  | null;

export type ContactMessageInput = {
  name: string;
  email: string;
  message: string;
};

export type ContactMailerSettings = {
  canPersist: boolean;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  source: "env" | "firestore";
  toEmail: string;
};

export type ContactMailerSettingsInput = {
  fromEmail: string;
  fromName: string;
  smtpHost: string;
  smtpPass?: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  toEmail: string;
};

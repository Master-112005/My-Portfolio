"use client";

import {
  createContext,
  type PropsWithChildren,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortfolioDataClone } from "@/data/defaultData";
import { loadPortfolioData, savePortfolioData, submitContactMessage } from "@/lib/api";
import type {
  ContactData,
  ContactMessageInput,
  EducationItem,
  FooterData,
  PortfolioData,
  ProfileData,
  ProjectData,
  ProjectsSectionData,
  TimelineSectionData,
} from "@/lib/types";

type SiteDataContextValue = {
  data: PortfolioData;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  refresh: () => Promise<void>;
  updateProfile: (profile: ProfileData) => Promise<void>;
  updateTimeline: (timeline: TimelineSectionData) => Promise<void>;
  updateEducationItem: (item: EducationItem) => Promise<void>;
  appendEducationItem: () => Promise<EducationItem>;
  deleteEducationItem: (itemId: string) => Promise<void>;
  updateProjectsSection: (section: ProjectsSectionData) => Promise<void>;
  updateProject: (project: ProjectData) => Promise<void>;
  appendProject: () => Promise<ProjectData>;
  deleteProject: (projectId: string) => Promise<void>;
  updateContact: (contact: ContactData) => Promise<void>;
  updateFooter: (footer: FooterData) => Promise<void>;
  submitMessage: (message: ContactMessageInput) => Promise<void>;
};

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

function createEducationItem(order: number): EducationItem {
  return {
    id: `education-${Date.now()}`,
    order,
    title: "New Stage",
    period: "Add period",
    institution: "Add institution",
    summary: "Add a short summary for this stage.",
    details: ["Add a detail line."],
    accent: "#3b82f6",
  };
}

function createProjectItem(order: number): ProjectData {
  return {
    id: `project-${Date.now()}`,
    order,
    name: "New Project",
    tagline: "Add a concise tagline.",
    description: "Describe the project, the problem, and the outcome.",
    stack: ["Next.js", "TypeScript"],
    features: ["Add a project feature."],
    repoHref: "https://github.com/",
    liveHref: "https://vercel.com/",
    icon: "NP",
    accent: "#3b82f6",
    status: "In progress",
    fileTree: ["app/page.tsx"],
    codeSnippet: "export const status = 'draft';",
    readme:
      "# Project README\n\nSummarize the goal, the approach, what was built, and anything worth highlighting for recruiters or clients.",
    images: [],
    customSections: [],
  };
}

export function SiteDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<PortfolioData>(createPortfolioDataClone());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refresh = async () => {
    try {
      const nextData = await loadPortfolioData();

      startTransition(() => {
        setData(nextData);
        setIsLoading(false);
        setSaveError(null);
      });
    } catch (error) {
      const fallbackData = createPortfolioDataClone();

      startTransition(() => {
        setData(fallbackData);
        setIsLoading(false);
        setSaveError(error instanceof Error ? error.message : "Failed to load portfolio data.");
      });
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const commit = async (recipe: (current: PortfolioData) => PortfolioData) => {
    const nextData = recipe(dataRef.current);
    dataRef.current = nextData;
    setData(nextData);
    setIsSaving(true);
    setSaveError(null);

    try {
      await savePortfolioData(nextData);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save portfolio data.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async (profile: ProfileData) => {
    await commit((current) => ({
      ...current,
      profile,
    }));
  };

  const updateEducationItem = async (item: EducationItem) => {
    await commit((current) => ({
      ...current,
      education: current.education
        .map((entry) => (entry.id === item.id ? item : entry))
        .sort((left, right) => left.order - right.order),
    }));
  };

  const updateTimeline = async (timeline: TimelineSectionData) => {
    await commit((current) => ({
      ...current,
      timeline,
    }));
  };

  const appendEducationItem = async () => {
    const newItem = createEducationItem(dataRef.current.education.length);
    await commit((current) => ({
      ...current,
      education: [...current.education, newItem],
    }));
    return newItem;
  };

  const deleteEducationItem = async (itemId: string) => {
    await commit((current) => ({
      ...current,
      education: current.education
        .filter((entry) => entry.id !== itemId)
        .map((entry, index) => ({
          ...entry,
          order: index,
        })),
    }));
  };

  const updateProject = async (project: ProjectData) => {
    await commit((current) => ({
      ...current,
      projects: current.projects
        .map((entry) => (entry.id === project.id ? project : entry))
        .sort((left, right) => left.order - right.order),
    }));
  };

  const updateProjectsSection = async (projectsSection: ProjectsSectionData) => {
    await commit((current) => ({
      ...current,
      projectsSection,
    }));
  };

  const appendProject = async () => {
    const newItem = createProjectItem(dataRef.current.projects.length);
    await commit((current) => ({
      ...current,
      projects: [...current.projects, newItem],
    }));
    return newItem;
  };

  const deleteProject = async (projectId: string) => {
    await commit((current) => ({
      ...current,
      projects: current.projects
        .filter((entry) => entry.id !== projectId)
        .map((entry, index) => ({
          ...entry,
          order: index,
        })),
    }));
  };

  const updateContact = async (contact: ContactData) => {
    await commit((current) => ({
      ...current,
      contact,
    }));
  };

  const updateFooter = async (footer: FooterData) => {
    await commit((current) => ({
      ...current,
      footer,
    }));
  };

  const submitMessage = async (message: ContactMessageInput) => {
    await submitContactMessage(message);
  };

  return (
    <SiteDataContext.Provider
      value={{
        data,
        isLoading,
        isSaving,
        saveError,
        refresh,
        updateProfile,
        updateTimeline,
        updateEducationItem,
        appendEducationItem,
        deleteEducationItem,
        updateProjectsSection,
        updateProject,
        appendProject,
        deleteProject,
        updateContact,
        updateFooter,
        submitMessage,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const context = useContext(SiteDataContext);

  if (!context) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }

  return context;
}

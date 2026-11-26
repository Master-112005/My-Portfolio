"use client";
import { createContext, startTransition, useContext, useEffect, useRef, useState, } from "react";
import { createPortfolioDataClone, monochromePortfolioData } from "@/lib/defaultData";
import { loadPortfolioData, savePortfolioData, submitContactMessage } from "@/lib/api";
const SiteDataContext = createContext(null);
function createEducationItem(order) {
    return {
        id: `education-${Date.now()}`,
        order,
        title: "New Stage",
        period: "Add period",
        institution: "Add institution",
        summary: "Add a short summary for this stage.",
        details: ["Add a detail line."],
        accent: "#7a7a7a",
        href: "",
    };
}
function createProjectItem(order) {
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
        accent: "#7a7a7a",
        status: "In progress",
        fileTree: ["app/page.tsx"],
        codeSnippet: "export const status = 'draft';",
        readme: "# Project README\n\nSummarize the goal, the approach, what was built, and anything worth highlighting for recruiters or clients.",
        images: [],
        customSections: [],
    };
}
export function SiteDataProvider({ children }) {
    const [data, setData] = useState(createPortfolioDataClone());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const dataRef = useRef(data);
    const [viewCounts, setViewCounts] = useState({
        today: typeof window !== "undefined" ? parseInt(localStorage.getItem("views-today") || "0") : 0,
        week: typeof window !== "undefined" ? parseInt(localStorage.getItem("views-week") || "0") : 0,
        month: typeof window !== "undefined" ? parseInt(localStorage.getItem("views-month") || "0") : 0,
    });
    const [viewerEmails, setViewerEmails] = useState({
        today: typeof window !== "undefined" ? localStorage.getItem("viewer-email-today") || "" : "",
        week: typeof window !== "undefined" ? localStorage.getItem("viewer-email-week") || "" : "",
        month: typeof window !== "undefined" ? localStorage.getItem("viewer-email-month") || "" : "",
    });
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
        }
        catch (error) {
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
    const commit = async (recipe) => {
        const nextData = monochromePortfolioData(recipe(dataRef.current));
        dataRef.current = nextData;
        setData(nextData);
        setIsSaving(true);
        setSaveError(null);
        try {
            await savePortfolioData(nextData);
        }
        catch (error) {
            setSaveError(error instanceof Error ? error.message : "Failed to save portfolio data.");
        }
        finally {
            setIsSaving(false);
        }
    };
    const getViewCount = (period) => {
        return viewCounts[period];
    };
    const recordView = (period, viewerEmail) => {
        setViewCounts((prev) => {
            const newCounts = { ...prev, [period]: (prev[period] || 0) + 1 };
            if (typeof window !== "undefined") {
                localStorage.setItem(`views-${period}`, String(newCounts[period]));
            }
            return newCounts;
        });
        if (viewerEmail) {
            setViewerEmails((prev) => {
                const newEmails = { ...prev, [period]: viewerEmail };
                if (typeof window !== "undefined") {
                    localStorage.setItem(`viewer-email-${period}`, viewerEmail);
                }
                return newEmails;
            });
        }
    };
    const setViewerEmail = (email) => {
        setViewerEmails((prev) => {
            const newEmails = { ...prev, today: email };
            if (typeof window !== "undefined") {
                localStorage.setItem("viewer-email-today", email);
            }
            return newEmails;
        });
    };
    const updateProfile = async (profile) => {
        await commit((current) => ({
            ...current,
            profile,
        }));
    };
    const updateEducationItem = async (item) => {
        await commit((current) => ({
            ...current,
            education: current.education
                .map((entry) => (entry.id === item.id ? item : entry))
                .sort((left, right) => left.order - right.order),
        }));
    };
    const updateTimeline = async (timeline) => {
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
    const deleteEducationItem = async (itemId) => {
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
    const updateProject = async (project) => {
        await commit((current) => ({
            ...current,
            projects: current.projects
                .map((entry) => (entry.id === project.id ? project : entry))
                .sort((left, right) => left.order - right.order),
        }));
    };
    const updateProjectsSection = async (projectsSection) => {
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
    const deleteProject = async (projectId) => {
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
    const updateWorkSection = async (workSection) => {
        await commit((current) => ({
            ...current,
            workSection,
        }));
    };
    const updateContact = async (contact) => {
        await commit((current) => ({
            ...current,
            contact,
        }));
    };
    const updateResume = async (resume) => {
        await commit((current) => ({
            ...current,
            resume,
        }));
    };
    const updateFooter = async (footer) => {
        await commit((current) => ({
            ...current,
            footer,
        }));
    };
    const submitMessage = async (message) => {
        await submitContactMessage(message);
    };
    return (<SiteDataContext.Provider value={{
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
            updateWorkSection,
            updateContact,
            updateResume,
            updateFooter,
            submitMessage,
            getViewCount,
            recordView,
            setViewerEmail,
            viewerEmails,
        }}>
      {children}
    </SiteDataContext.Provider>);
}
export function useSiteData() {
    const context = useContext(SiteDataContext);
    if (!context) {
        throw new Error("useSiteData must be used within SiteDataProvider");
    }
    return context;
}

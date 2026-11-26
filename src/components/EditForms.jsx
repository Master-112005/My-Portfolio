"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useEditMode } from "@/components/EditMode";
import { loadContactMailerSettings, loadWorkSettings, saveContactMailerSettings, saveWorkSettings, uploadProjectMedia, uploadResumePdf, } from "@/lib/api";
import { useSiteData } from "@/lib/site-context";
import { createIdCardImageDataUrl, createProjectImageUploadFile, validateProjectVideoFile, } from "@/lib/profile-image";
const MAX_PROJECT_MEDIA = 6;
const DEFAULT_SKILL_LEVEL = "good";
const skillLevelOptions = ["linear", "better", "good", "advanced"];
const emptyMailerSettings = {
    canPersist: false,
    fromEmail: "",
    fromName: "Portfolio Contact",
    hasPassword: false,
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUser: "",
    source: "env",
    toEmail: "",
};
const emptyWorkSettings = {
    canPersist: false,
    githubUsername: "",
    hasGithubToken: false,
    source: "env",
};
const sectionGroups = [
    {
        label: "Content",
        items: [
            { section: "profile", label: "Profile & ID card" },
            { section: "skills", label: "Skills" },
            { section: "certifications", label: "Certifications" },
            { section: "timeline", label: "Journey intro" },
            { section: "education", label: "Education stages" },
            { section: "projects", label: "Projects" },
            { section: "work", label: "My work" },
            { section: "contact", label: "Contact" },
            { section: "footer", label: "Footer" },
        ],
    },
    {
        label: "Media",
        items: [{ section: "resume", label: "Resume" }],
    },
    {
        label: "Settings",
        items: [{ section: "mailer", label: "Email delivery" }],
    },
];
const titleMap = {
    profile: "Profile & ID card",
    skills: "Skills",
    certifications: "Certifications",
    timeline: "Journey intro",
    education: "Education stage",
    projects: "Project",
    work: "My work",
    contact: "Contact",
    resume: "Resume",
    mailer: "Email delivery",
    footer: "Footer",
};
const sectionGroupLabel = {
    profile: "Identity",
    skills: "Content",
    certifications: "Content",
    timeline: "Content",
    education: "Content",
    projects: "Content",
    work: "Content",
    contact: "Content",
    footer: "Content",
    resume: "Media",
    mailer: "Settings",
};
function parseList(value) {
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}
function normalizeSkillLevel(value) {
    return skillLevelOptions.includes(value) ? value : DEFAULT_SKILL_LEVEL;
}
function randomId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
function createSkillItemDraft(item, index = 0) {
    return {
        id: randomId(`skill-item-${index}`),
        name: item?.name ?? "",
        level: normalizeSkillLevel(item?.level ?? DEFAULT_SKILL_LEVEL),
    };
}
function createSkillGroupDraft(group, index = 0) {
    const title = group?.title ?? "New cluster";
    return {
        id: randomId(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "skill-cluster"}-${index}`),
        title,
        accent: group?.accent ?? "#7a7a7a",
        marker: ((group?.marker ?? title.slice(0, 2)) || "SC").slice(0, 2).toUpperCase(),
        items: group?.items.length ? group.items.map((item, itemIndex) => createSkillItemDraft(item, itemIndex)) : [],
    };
}
function buildSkillGroupDrafts(groups) {
    return groups.length ? groups.map((group, index) => createSkillGroupDraft(group, index)) : [];
}
function normalizeSkillGroupDrafts(groups) {
    return groups
        .map((group) => {
        const title = group.title.trim();
        const items = group.items
            .map((item) => {
            const name = item.name.trim();
            if (!name) {
                return null;
            }
            return {
                name,
                level: normalizeSkillLevel(item.level),
            };
        })
            .filter((item) => Boolean(item));
        if (!title && !items.length) {
            return null;
        }
        return {
            title,
            accent: (group.accent ?? "#7a7a7a").trim() || "#7a7a7a",
            marker: group.marker.trim().slice(0, 2).toUpperCase(),
            items,
        };
    })
        .filter((group) => Boolean(group));
}
function createCertificationDraft(item, index = 0) {
    const title = item?.title ?? `Certification ${index + 1}`;
    return {
        id: item?.id ?? randomId(`certification-${index}`),
        title,
        issuer: item?.issuer ?? "",
        issued: item?.issued ?? "",
        credentialId: item?.credentialId ?? "",
        href: item?.href ?? "",
        accent: item?.accent ?? "#7a7a7a",
        badge: ((item?.badge ?? title.slice(0, 2)) || "CT").slice(0, 2).toUpperCase(),
    };
}
function buildCertificationDrafts(items) {
    return items.length ? items.map((item, index) => createCertificationDraft(item, index)) : [];
}
function normalizeCertificationDrafts(items) {
    return items
        .map((item, index) => {
        const title = item.title.trim();
        const issuer = item.issuer.trim();
        if (!title && !issuer) {
            return null;
        }
        return {
            id: item.id,
            order: index,
            title,
            issuer,
            issued: item.issued.trim(),
            credentialId: item.credentialId.trim(),
            href: item.href.trim(),
            accent: (item.accent ?? "#7a7a7a").trim() || "#7a7a7a",
            badge: item.badge.trim().slice(0, 2).toUpperCase(),
        };
    })
        .filter((item) => Boolean(item));
}
function createProjectImageDraft(image, index = 0) {
    return {
        id: image?.id ?? randomId(`project-image-${index}`),
        src: image?.src ?? "",
        alt: image?.alt ?? "",
        caption: image?.caption ?? "",
        type: image?.type ?? "image",
    };
}
function buildProjectImageDrafts(images) {
    return images.length ? images.map((image, index) => createProjectImageDraft(image, index)) : [];
}
function normalizeProjectImageDrafts(images) {
    return images
        .map((image) => {
        const src = image.src.trim();
        if (!src) {
            return null;
        }
        return {
            id: image.id,
            src,
            alt: image.alt.trim(),
            caption: image.caption.trim(),
            type: image.type ?? "image",
        };
    })
        .filter((image) => Boolean(image));
}
function createProjectCustomSectionDraft(section, index = 0) {
    return {
        id: section?.id ?? randomId(`project-custom-section-${index}`),
        title: section?.title ?? `Custom section ${index + 1}`,
        content: section?.content ?? "",
    };
}
function buildProjectCustomSectionDrafts(sections) {
    return sections.length ? sections.map((section, index) => createProjectCustomSectionDraft(section, index)) : [];
}
function normalizeProjectCustomSectionDrafts(sections) {
    return sections
        .map((section) => {
        const title = section.title.trim();
        const content = section.content.trim();
        if (!title || !content) {
            return null;
        }
        return {
            id: section.id,
            title,
            content,
        };
    })
        .filter((section) => Boolean(section));
}
function createLinkDraft(link, index = 0) {
    return {
        id: randomId(`link-${index}`),
        label: link?.label ?? "",
        href: link?.href ?? "",
        handle: link?.handle ?? "",
    };
}
function buildLinkDrafts(links) {
    return (links ?? []).map((link, index) => createLinkDraft(link, index));
}
function normalizeLinkDrafts(links) {
    return (links ?? [])
        .map((link) => ({
        label: link.label.trim(),
        href: link.href.trim(),
        handle: (link.handle ?? "").trim(),
    }))
        .filter((link) => link.label && link.href)
        .map((link) => ({
        ...link,
        handle: link.handle || link.href,
    }));
}
function createActionDraft(action, index = 0) {
    return {
        id: randomId(`action-${index}`),
        label: action?.label ?? "",
        href: action?.href ?? "",
        variant: action?.variant === "secondary" ? "secondary" : "primary",
    };
}
function buildActionDrafts(actions) {
    return (actions ?? []).map((action, index) => createActionDraft(action, index));
}
function normalizeActionDrafts(actions) {
    return (actions ?? [])
        .map((action) => ({
        label: action.label.trim(),
        href: action.href.trim(),
        variant: action.variant === "secondary" ? "secondary" : "primary",
    }))
        .filter((action) => action.label && action.href);
}
function buildFormState(editor, data) {
    switch (editor.section) {
        case "profile":
            return {
                name: data.profile.name,
                role: data.profile.role,
                tagline: data.profile.tagline,
                intro: data.profile.intro,
                location: data.profile.location,
                availability: data.profile.availability,
                profileImageAlt: data.profile.profileImageAlt,
                profileImageSrc: data.profile.profileImageSrc,
                idCardSerialNumber: data.profile.idCard.serialNumber,
                idCardPrimaryName: data.profile.idCard.primaryName,
                idCardSecondaryName: data.profile.idCard.secondaryName,
                idCardFrontRoleLines: data.profile.idCard.frontRoleLines.join("\n"),
                idCardBackTitle: data.profile.idCard.backTitle,
                idCardBackDescription: data.profile.idCard.backDescription,
                idCardBackFooter: data.profile.idCard.backFooter,
                heroActions: buildActionDrafts(data.profile.heroActions),
                socialLinks: buildLinkDrafts(data.profile.socialLinks),
            };
        case "skills":
            return {
                eyebrow: data.profile.skillsSection.eyebrow,
                title: data.profile.skillsSection.title,
                description: data.profile.skillsSection.description,
            };
        case "certifications":
            return {
                eyebrow: data.profile.certificationsSection.eyebrow,
                title: data.profile.certificationsSection.title,
                description: data.profile.certificationsSection.description,
            };
        case "timeline":
            return {
                title: data.timeline.title,
                description: data.timeline.description,
            };
        case "education": {
            const item = data.education.find((entry) => entry.id === editor.itemId);
            return item
                ? {
                    title: item.title,
                    period: item.period,
                    institution: item.institution,
                    href: item.href,
                    summary: item.summary,
                    details: item.details.join("\n"),
                }
                : {};
        }
        case "projects": {
            const item = data.projects.find((entry) => entry.id === editor.itemId);
            return item
                ? {
                    eyebrow: data.projectsSection.eyebrow,
                    sectionTitle: data.projectsSection.title,
                    sectionDescription: data.projectsSection.description,
                    name: item.name,
                    tagline: item.tagline,
                    description: item.description,
                    stack: item.stack.join(", "),
                    features: item.features.join("\n"),
                    repoHref: item.repoHref,
                    liveHref: item.liveHref,
                    icon: item.icon,
                    status: item.status,
                    fileTree: item.fileTree.join("\n"),
                    codeSnippet: item.codeSnippet,
                    readme: item.readme,
                }
                : {
                    eyebrow: data.projectsSection.eyebrow,
                    sectionTitle: data.projectsSection.title,
                    sectionDescription: data.projectsSection.description,
                };
        }
        case "work":
            return {
                eyebrow: data.workSection.eyebrow,
                title: data.workSection.title,
                description: data.workSection.description,
                githubToken: "",
                githubUsername: "",
            };
        case "contact":
            return {
                headline: data.contact.headline,
                email: data.contact.email,
                phone: data.contact.phone,
                location: data.contact.location,
                responseTime: data.contact.responseTime,
                availability: data.contact.availability,
                socialLinks: buildLinkDrafts(data.contact.socialLinks),
            };
        case "resume":
            return {
                title: data.resume.title,
                fileName: data.resume.fileName,
                fileHref: data.resume.fileHref,
                updatedAt: data.resume.updatedAt,
            };
        case "mailer":
            return {
                fromEmail: "",
                fromName: "Portfolio Contact",
                smtpHost: "",
                smtpPass: "",
                smtpPort: "587",
                smtpSecure: "false",
                smtpUser: "",
                toEmail: "",
            };
        case "footer":
            return {
                note: data.footer.note,
                quote: data.footer.quote,
                copyrightLabel: data.footer.copyrightLabel,
                links: buildLinkDrafts(data.footer.links),
            };
    }
}
function Field({ label, hint, value, onChange, multiline = false, placeholder, type = "text", className = "", inputClassName = "", }) {
    return (<label className={`block ${className}`.trim()}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
          {label}
        </span>
        {hint ? (<span className="text-[10px] text-[color:var(--text-soft)]">{hint}</span>) : null}
      </span>
      {multiline ? (<textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`input-surface min-h-[120px] resize-y ${inputClassName}`.trim()}/>) : (<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`input-surface ${inputClassName}`.trim()}/>)}
    </label>);
}
function SelectField({ label, value, onChange, options, className = "", }) {
    return (<label className={`block ${className}`.trim()}>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-surface">
        {options.map((option) => (<option key={option.value} value={option.value}>
            {option.label}
          </option>))}
      </select>
    </label>);
}
function EditorCard({ title, description, action, children, className = "", }) {
    return (<section className={`rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface)]/55 p-4 sm:p-5 ${className}`.trim()}>
      {title || action || description ? (<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (<h3 className="text-sm font-semibold text-[color:var(--text)]">{title}</h3>) : null}
            {description ? (<p className="mt-1 text-xs leading-5 text-[color:var(--text-soft)]">{description}</p>) : null}
          </div>
          {action}
        </div>) : null}
      {children}
    </section>);
}
function EmptyNote({ children }) {
    return (<div className="rounded-[1.1rem] border border-dashed border-[color:var(--line)] px-4 py-4 text-sm leading-6 text-[color:var(--text-soft)]">
      {children}
    </div>);
}
function StatusNote({ children, strong = false }) {
    return (<p className={`rounded-[1rem] border border-[color:var(--line)] px-3.5 py-2.5 text-sm leading-6 ${strong ? "text-[color:var(--text)]" : "text-[color:var(--text-soft)]"}`}>
      {children}
    </p>);
}
function RemoveButton({ onClick, children = "Remove" }) {
    return (<button type="button" onClick={onClick} className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-soft)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]">
      {children}
    </button>);
}
function LinkRepeater({ items, onChange, addLabel, withHandle = true, }) {
    const update = (id, key, value) => {
        onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };
    const add = () => {
        onChange([...items, createLinkDraft(undefined, items.length)]);
    };
    const remove = (id) => {
        onChange(items.filter((item) => item.id !== id));
    };
    return (<div className="space-y-3">
      {items.length ? (items.map((item, index) => (<div key={item.id} className="rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                Link {String(index + 1).padStart(2, "0")}
              </span>
              <RemoveButton onClick={() => remove(item.id)}/>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label" value={item.label} onChange={(value) => update(item.id, "label", value)} placeholder="GitHub"/>
              <Field label="URL" value={item.href} onChange={(value) => update(item.id, "href", value)} placeholder="https://..."/>
              {withHandle ? (<Field className="sm:col-span-2" label="Handle / display text" value={item.handle} onChange={(value) => update(item.id, "handle", value)} placeholder="@rakesh"/>) : null}
            </div>
          </div>))) : (<EmptyNote>No links added yet.</EmptyNote>)}
      <button type="button" onClick={add} className="edit-button">
        <span aria-hidden="true">+</span>
        <span>{addLabel}</span>
      </button>
    </div>);
}
function ActionRepeater({ items, onChange }) {
    const update = (id, key, value) => {
        onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };
    const add = () => {
        onChange([...items, createActionDraft(undefined, items.length)]);
    };
    const remove = (id) => {
        onChange(items.filter((item) => item.id !== id));
    };
    return (<div className="space-y-3">
      {items.length ? (items.map((item, index) => (<div key={item.id} className="rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                Action {String(index + 1).padStart(2, "0")}
              </span>
              <RemoveButton onClick={() => remove(item.id)}/>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem]">
              <Field label="Label" value={item.label} onChange={(value) => update(item.id, "label", value)} placeholder="Open projects"/>
              <Field label="URL or anchor" value={item.href} onChange={(value) => update(item.id, "href", value)} placeholder="#projects"/>
              <SelectField label="Style" value={item.variant} onChange={(value) => update(item.id, "variant", value)} options={[
                { value: "primary", label: "Primary" },
                { value: "secondary", label: "Secondary" },
            ]}/>
            </div>
          </div>))) : (<EmptyNote>No hero actions added yet.</EmptyNote>)}
      <button type="button" onClick={add} className="edit-button">
        <span aria-hidden="true">+</span>
        <span>Add hero action</span>
      </button>
    </div>);
}
export function EditForms() {
    const { closeEditor, editor, openEditor } = useEditMode();
    const { appendEducationItem, appendProject, data, isSaving, deleteEducationItem, deleteProject, updateContact, updateResume, updateEducationItem, updateFooter, updateProfile, updateProject, updateProjectsSection, updateTimeline, updateWorkSection, } = useSiteData();
    const [formState, setFormState] = useState({});
    const [skillGroupsDraft, setSkillGroupsDraft] = useState([]);
    const [certificationDrafts, setCertificationDrafts] = useState([]);
    const [projectImagesDraft, setProjectImagesDraft] = useState([]);
    const [projectCustomSectionsDraft, setProjectCustomSectionsDraft] = useState([]);
    const [isProcessingProfileImage, setIsProcessingProfileImage] = useState(false);
    const [isProcessingProjectImages, setIsProcessingProjectImages] = useState(false);
    const [isLoadingMailerSettings, setIsLoadingMailerSettings] = useState(false);
    const [isSavingMailerSettings, setIsSavingMailerSettings] = useState(false);
    const [isLoadingWorkSettings, setIsLoadingWorkSettings] = useState(false);
    const [isSavingWorkSettings, setIsSavingWorkSettings] = useState(false);
    const [mailerInfo, setMailerInfo] = useState(emptyMailerSettings);
    const [workInfo, setWorkInfo] = useState(emptyWorkSettings);
    const [mailerError, setMailerError] = useState(null);
    const [workError, setWorkError] = useState(null);
    const [profileImageError, setProfileImageError] = useState(null);
    const [projectImageError, setProjectImageError] = useState(null);
    const [resumeUploadError, setResumeUploadError] = useState(null);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    useEffect(() => {
        if (!editor) {
            setFormState({});
            setSkillGroupsDraft([]);
            setCertificationDrafts([]);
            setProjectImagesDraft([]);
            setProjectCustomSectionsDraft([]);
            setIsProcessingProfileImage(false);
            setIsProcessingProjectImages(false);
            setIsLoadingMailerSettings(false);
            setIsSavingMailerSettings(false);
            setIsLoadingWorkSettings(false);
            setIsSavingWorkSettings(false);
            setMailerInfo(emptyMailerSettings);
            setWorkInfo(emptyWorkSettings);
            setMailerError(null);
            setWorkError(null);
            setProfileImageError(null);
            setProjectImageError(null);
            setResumeUploadError(null);
            setIsUploadingResume(false);
            return;
        }
        setFormState(buildFormState(editor, data));
        setSkillGroupsDraft(editor.section === "skills" ? buildSkillGroupDrafts(data.profile.skillGroups) : []);
        setCertificationDrafts(editor.section === "certifications" ? buildCertificationDrafts(data.profile.certifications) : []);
        setProjectImagesDraft(editor.section === "projects"
            ? buildProjectImageDrafts(data.projects.find((entry) => entry.id === editor.itemId)?.images ?? [])
            : []);
        setProjectCustomSectionsDraft(editor.section === "projects"
            ? buildProjectCustomSectionDrafts(data.projects.find((entry) => entry.id === editor.itemId)?.customSections ?? [])
            : []);
        setMailerError(null);
        setWorkError(null);
        setProfileImageError(null);
        setProjectImageError(null);
        setResumeUploadError(null);
        if (editor.section !== "mailer") {
            setIsLoadingMailerSettings(false);
            setIsSavingMailerSettings(false);
            setMailerInfo(emptyMailerSettings);
        }
        if (editor.section !== "work") {
            setIsLoadingWorkSettings(false);
            setIsSavingWorkSettings(false);
            setWorkInfo(emptyWorkSettings);
        }
        if (editor.section === "work") {
            let isActive = true;
            setIsLoadingWorkSettings(true);
            void loadWorkSettings()
                .then((settings) => {
                if (!isActive) {
                    return;
                }
                setWorkInfo(settings);
                setFormState((current) => ({
                    ...current,
                    githubToken: "",
                    githubUsername: settings.githubUsername,
                }));
            })
                .catch((error) => {
                if (!isActive) {
                    return;
                }
                setWorkError(error instanceof Error ? error.message : "Failed to load GitHub work settings.");
            })
                .finally(() => {
                if (isActive) {
                    setIsLoadingWorkSettings(false);
                }
            });
            return () => {
                isActive = false;
            };
        }
        if (editor.section !== "mailer") {
            return;
        }
        let isActive = true;
        setIsLoadingMailerSettings(true);
        void loadContactMailerSettings()
            .then((settings) => {
            if (!isActive) {
                return;
            }
            setMailerInfo(settings);
            setFormState({
                fromEmail: settings.fromEmail,
                fromName: settings.fromName,
                smtpHost: settings.smtpHost,
                smtpPass: "",
                smtpPort: settings.smtpPort,
                smtpSecure: String(settings.smtpSecure),
                smtpUser: settings.smtpUser,
                toEmail: settings.toEmail,
            });
        })
            .catch((error) => {
            if (!isActive) {
                return;
            }
            setMailerError(error instanceof Error ? error.message : "Failed to load contact mailer settings.");
        })
            .finally(() => {
            if (isActive) {
                setIsLoadingMailerSettings(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [data, editor]);
    if (!editor) {
        return null;
    }
    const selectedProject = editor.section === "projects"
        ? data.projects.find((entry) => entry.id === editor.itemId) ?? null
        : null;
    const selectedEducation = editor.section === "education"
        ? data.education.find((entry) => entry.id === editor.itemId) ?? null
        : null;
    const go = (section, itemId) => {
        const sameSection = editor.section === section;
        const nextItemId = itemId
            ?? (sameSection ? editor.itemId : undefined)
            ?? (section === "education" ? data.education[0]?.id : undefined)
            ?? (section === "projects" ? data.projects[0]?.id : undefined);
        if (sameSection && (editor.itemId ?? null) === (nextItemId ?? null)) {
            return;
        }
        openEditor(section, nextItemId);
    };
    const setValue = (key, value) => {
        if (editor.section === "mailer") {
            setMailerError(null);
        }
        if (editor.section === "work") {
            setWorkError(null);
        }
        if (editor.section === "resume") {
            setResumeUploadError(null);
        }
        setFormState((current) => ({
            ...current,
            [key]: value,
        }));
    };
    const updateArrayValue = (key, id, field, value) => {
        setFormState((current) => ({
            ...current,
            [key]: (current[key] ?? []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
        }));
    };
    const addArrayValue = (key, factory) => {
        setFormState((current) => ({
            ...current,
            [key]: [...(current[key] ?? []), factory((current[key] ?? []).length)],
        }));
    };
    const removeArrayValue = (key, id) => {
        setFormState((current) => ({
            ...current,
            [key]: (current[key] ?? []).filter((item) => item.id !== id),
        }));
    };
    const updateSkillGroupDraft = (id, key, value) => {
        setSkillGroupsDraft((current) => current.map((group) => group.id === id
            ? {
                ...group,
                [key]: value,
            }
            : group));
    };
    const addSkillGroup = () => {
        setSkillGroupsDraft((current) => [...current, createSkillGroupDraft(undefined, current.length)]);
    };
    const deleteSkillGroup = (id) => {
        setSkillGroupsDraft((current) => current.filter((group) => group.id !== id));
    };
    const addSkillItem = (groupId) => {
        setSkillGroupsDraft((current) => current.map((group) => group.id === groupId
            ? {
                ...group,
                items: [...group.items, createSkillItemDraft(undefined, group.items.length)],
            }
            : group));
    };
    const updateSkillItem = (groupId, itemId, key, value) => {
        setSkillGroupsDraft((current) => current.map((group) => group.id === groupId
            ? {
                ...group,
                items: group.items.map((item) => item.id === itemId
                    ? {
                        ...item,
                        [key]: key === "level" ? normalizeSkillLevel(value) : value,
                    }
                    : item),
            }
            : group));
    };
    const deleteSkillItem = (groupId, itemId) => {
        setSkillGroupsDraft((current) => current.map((group) => group.id === groupId
            ? {
                ...group,
                items: group.items.filter((item) => item.id !== itemId),
            }
            : group));
    };
    const updateCertificationDraft = (id, key, value) => {
        setCertificationDrafts((current) => current.map((item) => item.id === id
            ? {
                ...item,
                [key]: key === "badge" ? value.toUpperCase().slice(0, 2) : value,
            }
            : item));
    };
    const addCertification = () => {
        setCertificationDrafts((current) => [...current, createCertificationDraft(undefined, current.length)]);
    };
    const deleteCertification = (id) => {
        setCertificationDrafts((current) => current.filter((item) => item.id !== id));
    };
    const updateProjectImageDraft = (id, key, value) => {
        setProjectImagesDraft((current) => current.map((image) => image.id === id
            ? {
                ...image,
                [key]: value,
            }
            : image));
    };
    const deleteProjectImageDraft = (id) => {
        setProjectImagesDraft((current) => current.filter((image) => image.id !== id));
    };
    const updateProjectCustomSectionDraft = (id, key, value) => {
        setProjectCustomSectionsDraft((current) => current.map((section) => section.id === id
            ? {
                ...section,
                [key]: value,
            }
            : section));
    };
    const addProjectCustomSection = () => {
        setProjectCustomSectionsDraft((current) => [
            ...current,
            createProjectCustomSectionDraft(undefined, current.length),
        ]);
    };
    const deleteProjectCustomSectionDraft = (id) => {
        setProjectCustomSectionsDraft((current) => current.filter((section) => section.id !== id));
    };
    const handleProfileImageUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        setIsProcessingProfileImage(true);
        setProfileImageError(null);
        try {
            const processedImage = await createIdCardImageDataUrl(file);
            setFormState((current) => ({
                ...current,
                profileImageSrc: processedImage,
                profileImageAlt: current.profileImageAlt ?? "",
            }));
        }
        catch (error) {
            setProfileImageError(error instanceof Error ? error.message : "Failed to process the uploaded image.");
        }
        finally {
            setIsProcessingProfileImage(false);
        }
    };
    const handleProjectImageUpload = async (event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) {
            return;
        }
        const remainingSlots = Math.max(0, MAX_PROJECT_MEDIA - projectImagesDraft.length);
        if (!remainingSlots) {
            setProjectImageError(`Only ${MAX_PROJECT_MEDIA} project media items can be stored per project.`);
            return;
        }
        const acceptedFiles = files.slice(0, remainingSlots);
        const projectName = formState.name?.trim() || selectedProject?.name || "Project";
        setIsProcessingProjectImages(true);
        setProjectImageError(null);
        try {
            const processedMedia = [];
            for (const [index, file] of acceptedFiles.entries()) {
                let uploadFile;
                let mediaType;
                if (file.type.startsWith("video/")) {
                    validateProjectVideoFile(file);
                    uploadFile = file;
                    mediaType = "video";
                }
                else {
                    uploadFile = await createProjectImageUploadFile(file);
                    mediaType = "image";
                }
                const upload = await uploadProjectMedia(uploadFile);
                const order = projectImagesDraft.length + index + 1;
                processedMedia.push({
                    id: randomId("project-media"),
                    src: upload.fileHref,
                    alt: `${projectName} ${mediaType === "image" ? "screenshot" : "video"} ${order}`,
                    caption: `${projectName} ${mediaType === "image" ? "view" : "clip"} ${order}`,
                    type: upload.mediaType,
                });
            }
            setProjectImagesDraft((current) => [...current, ...processedMedia]);
            if (acceptedFiles.length < files.length) {
                setProjectImageError(`Only the first ${remainingSlots} file(s) were added. Limit: ${MAX_PROJECT_MEDIA} media items per project.`);
            }
        }
        catch (error) {
            setProjectImageError(error instanceof Error ? error.message : "Failed to process the uploaded project media.");
        }
        finally {
            setIsProcessingProjectImages(false);
        }
    };
    const handleResumeUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        setIsUploadingResume(true);
        setResumeUploadError(null);
        try {
            const uploadedResume = await uploadResumePdf(file);
            setFormState((current) => ({
                ...current,
                fileHref: uploadedResume.fileHref,
                fileName: uploadedResume.fileName,
                updatedAt: uploadedResume.updatedAt,
            }));
        }
        catch (error) {
            setResumeUploadError(error instanceof Error ? error.message : "Failed to upload the resume PDF.");
        }
        finally {
            setIsUploadingResume(false);
        }
    };
    const handleAddStage = async () => {
        const item = await appendEducationItem();
        openEditor("education", item.id);
    };
    const handleAddProject = async () => {
        const project = await appendProject();
        openEditor("projects", project.id);
    };
    const handleSave = async () => {
        switch (editor.section) {
            case "profile":
                await updateProfile({
                    ...data.profile,
                    name: formState.name.trim(),
                    role: formState.role.trim(),
                    tagline: formState.tagline.trim(),
                    intro: formState.intro.trim(),
                    location: formState.location.trim(),
                    availability: formState.availability.trim(),
                    profileImageAlt: formState.profileImageAlt.trim(),
                    profileImageSrc: formState.profileImageSrc.trim(),
                    idCard: {
                        ...data.profile.idCard,
                        serialNumber: formState.idCardSerialNumber.trim(),
                        primaryName: formState.idCardPrimaryName.trim(),
                        secondaryName: formState.idCardSecondaryName.trim(),
                        frontRoleLines: parseList(formState.idCardFrontRoleLines),
                        backTitle: formState.idCardBackTitle.trim(),
                        backDescription: formState.idCardBackDescription.trim(),
                        backFooter: formState.idCardBackFooter.trim(),
                    },
                    heroActions: normalizeActionDrafts(formState.heroActions),
                    socialLinks: normalizeLinkDrafts(formState.socialLinks),
                });
                break;
            case "skills":
                await updateProfile({
                    ...data.profile,
                    skillsSection: {
                        eyebrow: formState.eyebrow.trim(),
                        title: formState.title.trim(),
                        description: formState.description.trim(),
                    },
                    skillGroups: normalizeSkillGroupDrafts(skillGroupsDraft),
                });
                break;
            case "certifications":
                await updateProfile({
                    ...data.profile,
                    certificationsSection: {
                        eyebrow: formState.eyebrow.trim(),
                        title: formState.title.trim(),
                        description: formState.description.trim(),
                    },
                    certifications: normalizeCertificationDrafts(certificationDrafts),
                });
                break;
            case "timeline":
                await updateTimeline({
                    title: formState.title.trim(),
                    description: formState.description.trim(),
                });
                break;
            case "education": {
                const item = data.education.find((entry) => entry.id === editor.itemId);
                if (!item) {
                    return;
                }
                await updateEducationItem({
                    ...item,
                    title: formState.title.trim(),
                    period: formState.period.trim(),
                    institution: formState.institution.trim(),
                    href: formState.href.trim(),
                    summary: formState.summary.trim(),
                    details: parseList(formState.details),
                });
                break;
            }
            case "projects": {
                await updateProjectsSection({
                    eyebrow: formState.eyebrow.trim(),
                    title: formState.sectionTitle.trim(),
                    description: formState.sectionDescription.trim(),
                });
                const item = data.projects.find((entry) => entry.id === editor.itemId);
                if (!item) {
                    break;
                }
                await updateProject({
                    ...item,
                    name: formState.name.trim(),
                    tagline: formState.tagline.trim(),
                    description: formState.description.trim(),
                    stack: formState.stack
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    features: parseList(formState.features),
                    repoHref: formState.repoHref.trim(),
                    liveHref: formState.liveHref.trim(),
                    icon: formState.icon.trim().slice(0, 2).toUpperCase(),
                    status: formState.status.trim(),
                    fileTree: parseList(formState.fileTree),
                    codeSnippet: formState.codeSnippet,
                    readme: formState.readme.trim(),
                    images: normalizeProjectImageDrafts(projectImagesDraft),
                    customSections: normalizeProjectCustomSectionDrafts(projectCustomSectionsDraft),
                });
                break;
            }
            case "work": {
                await updateWorkSection({
                    eyebrow: formState.eyebrow.trim(),
                    title: formState.title.trim(),
                    description: formState.description.trim(),
                });
                const settings = {
                    githubToken: formState.githubToken.trim(),
                    githubUsername: formState.githubUsername.trim(),
                };
                setIsSavingWorkSettings(true);
                setWorkError(null);
                try {
                    const savedSettings = await saveWorkSettings(settings);
                    setWorkInfo(savedSettings);
                    closeEditor();
                }
                catch (error) {
                    setWorkError(error instanceof Error ? error.message : "Failed to save GitHub work settings.");
                }
                finally {
                    setIsSavingWorkSettings(false);
                }
                return;
            }
            case "contact":
                await updateContact({
                    ...data.contact,
                    headline: formState.headline.trim(),
                    email: formState.email.trim(),
                    phone: formState.phone.trim(),
                    location: formState.location.trim(),
                    responseTime: formState.responseTime.trim(),
                    availability: formState.availability.trim(),
                    socialLinks: normalizeLinkDrafts(formState.socialLinks),
                });
                break;
            case "resume":
                await updateResume({
                    ...data.resume,
                    title: formState.title.trim() || "Resume",
                    fileName: formState.fileName.trim() || "resume.pdf",
                    fileHref: formState.fileHref.trim(),
                    updatedAt: formState.updatedAt.trim(),
                });
                break;
            case "mailer": {
                const settings = {
                    fromEmail: formState.fromEmail.trim(),
                    fromName: formState.fromName.trim(),
                    smtpHost: formState.smtpHost.trim(),
                    smtpPass: formState.smtpPass.trim(),
                    smtpPort: formState.smtpPort.trim(),
                    smtpSecure: formState.smtpSecure === "true",
                    smtpUser: formState.smtpUser.trim(),
                    toEmail: formState.toEmail.trim(),
                };
                setIsSavingMailerSettings(true);
                setMailerError(null);
                try {
                    const savedSettings = await saveContactMailerSettings(settings);
                    setMailerInfo(savedSettings);
                    closeEditor();
                }
                catch (error) {
                    setMailerError(error instanceof Error ? error.message : "Failed to save contact mailer settings.");
                }
                finally {
                    setIsSavingMailerSettings(false);
                }
                return;
            }
            case "footer":
                await updateFooter({
                    ...data.footer,
                    note: formState.note.trim(),
                    quote: formState.quote.trim(),
                    copyrightLabel: formState.copyrightLabel.trim(),
                    links: normalizeLinkDrafts(formState.links),
                });
                break;
        }
        closeEditor();
    };
    const handleDelete = async () => {
        if (editor.section === "education") {
            const item = data.education.find((entry) => entry.id === editor.itemId);
            if (!item) {
                closeEditor();
                return;
            }
            if (!window.confirm(`Delete "${item.title}" from the education journey?`)) {
                return;
            }
            await deleteEducationItem(item.id);
            closeEditor();
            return;
        }
        if (editor.section === "projects") {
            const item = data.projects.find((entry) => entry.id === editor.itemId);
            if (!item) {
                closeEditor();
                return;
            }
            if (!window.confirm(`Delete "${item.name}" from the project desktop?`)) {
                return;
            }
            await deleteProject(item.id);
            closeEditor();
        }
    };
    const isBusy = isSaving ||
        isProcessingProfileImage ||
        isProcessingProjectImages ||
        isUploadingResume ||
        isSavingMailerSettings ||
        isLoadingMailerSettings ||
        isSavingWorkSettings ||
        isLoadingWorkSettings;
    const saveDisabled = isBusy ||
        (editor.section === "mailer" && !mailerInfo.canPersist) ||
        (editor.section === "work" && !workInfo.canPersist) ||
        (editor.section === "education" && !selectedEducation);
    const saveLabel = isProcessingProfileImage
        ? "Processing image..."
        : isProcessingProjectImages
            ? "Uploading media..."
            : isUploadingResume
                ? "Uploading resume..."
                : isLoadingMailerSettings
                    ? "Loading settings..."
                    : isLoadingWorkSettings
                        ? "Loading GitHub settings..."
                        : isSavingMailerSettings
                            ? "Saving mailer..."
                            : isSavingWorkSettings
                                ? "Saving GitHub settings..."
                                : isSaving
                                    ? "Saving..."
                                    : "Save changes";
    const canDelete = (editor.section === "education" && Boolean(selectedEducation)) ||
        (editor.section === "projects" && Boolean(selectedProject));
    return (<AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[75] flex items-stretch justify-center bg-neutral-950/60 backdrop-blur-sm sm:items-center sm:p-4 lg:p-6">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.99 }} className="panel-surface-strong flex h-[100dvh] w-full max-w-6xl overflow-hidden sm:h-[min(92vh,60rem)] sm:rounded-[2rem]">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-[color:var(--line)] bg-[color:var(--surface)]/40 lg:flex">
            <div className="border-b border-[color:var(--line)] px-5 py-5">
              <span className="eyebrow">Edit mode</span>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">
                Content studio
              </h2>
              <p className="mt-1 text-xs leading-5 text-[color:var(--text-soft)]">
                Update every part of the portfolio.
              </p>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">
              {sectionGroups.map((group) => (<div key={group.label}>
                  <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                const active = editor.section === item.section;
                return (<button key={item.section} type="button" onClick={() => go(item.section)} className={`flex w-full items-center justify-between gap-2 rounded-[0.9rem] px-3 py-2 text-left text-sm transition ${active
                        ? "bg-[color:var(--accent-solid)] font-semibold text-[color:var(--on-accent)]"
                        : "text-[color:var(--text-soft)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"}`}>
                          <span>{item.label}</span>
                          {active ? (<span className="h-1.5 w-1.5 rounded-full bg-[color:var(--on-accent)]"/>) : null}
                        </button>);
            })}
                  </div>
                </div>))}
            </nav>

            <div className="border-t border-[color:var(--line)] p-3">
              <button type="button" onClick={closeEditor} className="w-full rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2 text-sm text-[color:var(--text-soft)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]">
                Exit editor
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-[color:var(--line)] px-5 py-4 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="eyebrow">{sectionGroupLabel[editor.section]}</span>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[color:var(--text)] sm:text-2xl">
                    {titleMap[editor.section]}
                  </h2>
                </div>
                <button type="button" onClick={closeEditor} className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[color:var(--text-soft)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]">
                  Close
                </button>
              </div>

              <select value={editor.section} onChange={(event) => go(event.target.value)} className="input-surface mt-3 py-2.5 text-sm lg:hidden">
                {sectionGroups.flatMap((group) => group.items).map((item) => (<option key={item.section} value={item.section}>
                    {item.label}
                  </option>))}
              </select>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="space-y-5">
                {editor.section === "profile" ? (<>
                    <EditorCard title="Identity" description="The name, role, and intro shown in the hero section.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" value={formState.name} onChange={(value) => setValue("name", value)}/>
                        <Field label="Role" value={formState.role} onChange={(value) => setValue("role", value)}/>
                        <Field className="sm:col-span-2" label="Tagline" value={formState.tagline} onChange={(value) => setValue("tagline", value)} multiline/>
                        <Field className="sm:col-span-2" label="Introduction" value={formState.intro} onChange={(value) => setValue("intro", value)} multiline/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Presence" description="Location and availability badges in the hero meta row.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Location" value={formState.location} onChange={(value) => setValue("location", value)}/>
                        <Field label="Availability" value={formState.availability} onChange={(value) => setValue("availability", value)}/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Profile image" description="Crops and resizes automatically to fit the ID card." action={<label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[color:var(--accent-solid)] px-4 py-2 text-sm font-semibold text-[color:var(--on-accent)] transition hover:brightness-110">
                          <span>{isProcessingProfileImage ? "Processing..." : "Upload image"}</span>
                          <input type="file" accept="image/*" onChange={(event) => void handleProfileImageUpload(event)} className="sr-only" disabled={isProcessingProfileImage}/>
                        </label>}>
                      <div className="grid gap-4 sm:grid-cols-[8.5rem_1fr] sm:items-start">
                        <div className="aspect-[2/3] overflow-hidden rounded-[1rem] border border-[color:var(--line)] bg-black/10">
                          {formState.profileImageSrc ? (<img src={formState.profileImageSrc} alt={formState.profileImageAlt || "Profile preview"} className="h-full w-full object-cover grayscale contrast-125 brightness-[0.92]"/>) : (<div className="flex h-full items-center justify-center px-3 text-center text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                              No image
                            </div>)}
                        </div>
                        <div className="space-y-3">
                          <Field label="Image alt text" value={formState.profileImageAlt} onChange={(value) => setValue("profileImageAlt", value)} placeholder="Portrait of your name"/>
                          {formState.profileImageSrc ? (<RemoveButton onClick={() => setValue("profileImageSrc", "")}>Remove image</RemoveButton>) : null}
                          {profileImageError ? (<StatusNote strong>{profileImageError}</StatusNote>) : null}
                        </div>
                      </div>
                    </EditorCard>

                    <EditorCard title="ID card" description="Front and back content for the hanging badge.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Serial number" value={formState.idCardSerialNumber} onChange={(value) => setValue("idCardSerialNumber", value)} placeholder="31522"/>
                        <Field label="Primary name" value={formState.idCardPrimaryName} onChange={(value) => setValue("idCardPrimaryName", value)} placeholder="Rakesh"/>
                        <Field label="Secondary name" value={formState.idCardSecondaryName} onChange={(value) => setValue("idCardSecondaryName", value)} placeholder="Kumar"/>
                        <Field label="Back title" value={formState.idCardBackTitle} onChange={(value) => setValue("idCardBackTitle", value)} placeholder="Owner links"/>
                        <Field className="sm:col-span-2" label="Front role lines" hint="One per line" value={formState.idCardFrontRoleLines} onChange={(value) => setValue("idCardFrontRoleLines", value)} multiline placeholder={"Full Stack\nWeb Dev\nUI / UX"}/>
                        <Field className="sm:col-span-2" label="Back description" value={formState.idCardBackDescription} onChange={(value) => setValue("idCardBackDescription", value)} multiline/>
                        <Field className="sm:col-span-2" label="Back footer" value={formState.idCardBackFooter} onChange={(value) => setValue("idCardBackFooter", value)}/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Hero actions" description="Buttons shown under the hero intro.">
                      <ActionRepeater items={formState.heroActions ?? []} onChange={(items) => setValue("heroActions", items)}/>
                    </EditorCard>

                    <EditorCard title="Social links" description="Shown on the back of the ID card.">
                      <LinkRepeater items={formState.socialLinks ?? []} onChange={(items) => setValue("socialLinks", items)} addLabel="Add social link"/>
                    </EditorCard>
                  </>) : null}

                {editor.section === "skills" ? (<>
                    <EditorCard title="Section copy" description="Heading shown above the skill clusters.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Eyebrow" value={formState.eyebrow} onChange={(value) => setValue("eyebrow", value)}/>
                        <Field label="Title" value={formState.title} onChange={(value) => setValue("title", value)}/>
                        <Field className="sm:col-span-2" label="Description" value={formState.description} onChange={(value) => setValue("description", value)} multiline/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Skill clusters" description="Each cluster stores its own skills and proficiency levels." action={<button type="button" onClick={addSkillGroup} className="edit-button">
                          <span aria-hidden="true">+</span>
                          <span>Add cluster</span>
                        </button>}>
                      <div className="space-y-4">
                        {skillGroupsDraft.length ? (skillGroupsDraft.map((group, index) => (<div key={group.id} className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-[color:var(--line)] bg-[color:var(--accent-soft)] font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text)]">
                                    {group.marker || "SC"}
                                  </div>
                                  <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                                      Cluster {String(index + 1).padStart(2, "0")}
                                    </p>
                                    <p className="mt-0.5 text-sm font-medium text-[color:var(--text)]">
                                      {group.title.trim() || "Untitled cluster"}
                                    </p>
                                  </div>
                                </div>
                                <RemoveButton onClick={() => deleteSkillGroup(group.id)}>Delete cluster</RemoveButton>
                              </div>

                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="Title" value={group.title} onChange={(value) => updateSkillGroupDraft(group.id, "title", value)}/>
                                <Field label="Marker" hint="2 characters" value={group.marker} onChange={(value) => updateSkillGroupDraft(group.id, "marker", value.toUpperCase().slice(0, 2))} placeholder="LG"/>
                              </div>

                              <div className="mt-4 rounded-[1rem] border border-[color:var(--line)] p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                                    Skills & proficiency
                                  </p>
                                  <button type="button" onClick={() => addSkillItem(group.id)} className="edit-button">
                                    <span aria-hidden="true">+</span>
                                    <span>Add skill</span>
                                  </button>
                                </div>

                                <div className="mt-3 space-y-3">
                                  {group.items.length ? (group.items.map((item, itemIndex) => (<div key={item.id} className="grid gap-3 rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-3 sm:grid-cols-[1fr_11rem_auto]">
                                        <Field label={`Skill ${String(itemIndex + 1).padStart(2, "0")}`} value={item.name} onChange={(value) => updateSkillItem(group.id, item.id, "name", value)} placeholder="TypeScript"/>
                                        <SelectField label="Level" value={item.level} onChange={(value) => updateSkillItem(group.id, item.id, "level", value)} options={skillLevelOptions.map((level) => ({
                                    value: level,
                                    label: level[0].toUpperCase() + level.slice(1),
                                }))}/>
                                        <div className="self-end">
                                          <RemoveButton onClick={() => deleteSkillItem(group.id, item.id)}/>
                                        </div>
                                      </div>))) : (<EmptyNote>No skills in this cluster yet.</EmptyNote>)}
                                </div>
                              </div>
                            </div>))) : (<EmptyNote>No skill clusters yet. Add one to get started.</EmptyNote>)}
                      </div>
                    </EditorCard>
                  </>) : null}

                {editor.section === "certifications" ? (<>
                    <EditorCard title="Section copy" description="Heading shown above the certificate cards.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Eyebrow" value={formState.eyebrow} onChange={(value) => setValue("eyebrow", value)}/>
                        <Field label="Title" value={formState.title} onChange={(value) => setValue("title", value)}/>
                        <Field className="sm:col-span-2" label="Description" value={formState.description} onChange={(value) => setValue("description", value)} multiline/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Certificates" description="Manage each certificate card." action={<button type="button" onClick={addCertification} className="edit-button">
                          <span aria-hidden="true">+</span>
                          <span>Add certificate</span>
                        </button>}>
                      <div className="space-y-4">
                        {certificationDrafts.length ? (certificationDrafts.map((item, index) => (<div key={item.id} className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                                    Certificate {String(index + 1).padStart(2, "0")}
                                  </p>
                                  <p className="mt-0.5 text-sm font-medium text-[color:var(--text)]">
                                    {item.title.trim() || "Untitled certificate"}
                                  </p>
                                </div>
                                <RemoveButton onClick={() => deleteCertification(item.id)}>Delete certificate</RemoveButton>
                              </div>

                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="Title" value={item.title} onChange={(value) => updateCertificationDraft(item.id, "title", value)}/>
                                <Field label="Issuer" value={item.issuer} onChange={(value) => updateCertificationDraft(item.id, "issuer", value)}/>
                                <Field label="Issued" value={item.issued} onChange={(value) => updateCertificationDraft(item.id, "issued", value)} placeholder="2025"/>
                                <Field label="Credential ID" value={item.credentialId} onChange={(value) => updateCertificationDraft(item.id, "credentialId", value)} placeholder="AZ-900"/>
                                <Field label="Badge" hint="2 characters" value={item.badge} onChange={(value) => updateCertificationDraft(item.id, "badge", value)} placeholder="AZ"/>
                                <Field className="sm:col-span-2" label="Certificate URL" value={item.href} onChange={(value) => updateCertificationDraft(item.id, "href", value)} placeholder="https://..."/>
                              </div>
                            </div>))) : (<EmptyNote>No certifications yet. Add one to show a card.</EmptyNote>)}
                      </div>
                    </EditorCard>
                  </>) : null}

                {editor.section === "timeline" ? (<EditorCard title="Journey intro" description="Title and description shown above the education milestones.">
                    <div className="grid gap-4">
                      <Field label="Title" value={formState.title} onChange={(value) => setValue("title", value)} multiline/>
                      <Field label="Description" value={formState.description} onChange={(value) => setValue("description", value)} multiline/>
                    </div>
                  </EditorCard>) : null}

                {editor.section === "education" ? (<>
                    <EditorCard title="Stages" description="Pick a stage to edit, or add a new milestone." action={<button type="button" onClick={() => void handleAddStage()} className="edit-button">
                          <span aria-hidden="true">+</span>
                          <span>Add stage</span>
                        </button>}>
                      <div className="flex flex-wrap gap-2">
                        {data.education.length ? (data.education.map((stage, index) => {
                    const active = editor.itemId === stage.id;
                    return (<button key={stage.id} type="button" onClick={() => go("education", stage.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active
                            ? "border-transparent bg-[color:var(--accent-solid)] text-[color:var(--on-accent)]"
                            : "border-[color:var(--line)] text-[color:var(--text-soft)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"}`}>
                                <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
                                <span className="ml-2">{stage.title.trim() || "Untitled stage"}</span>
                              </button>);
                })) : (<EmptyNote>No stages yet. Add one to start the journey.</EmptyNote>)}
                      </div>
                    </EditorCard>

                    {selectedEducation ? (<EditorCard title="Stage details">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Stage title" value={formState.title} onChange={(value) => setValue("title", value)}/>
                          <Field label="Period" value={formState.period} onChange={(value) => setValue("period", value)} placeholder="2024 - 2026"/>
                          <Field label="Institution" value={formState.institution} onChange={(value) => setValue("institution", value)}/>
                          <Field label="Link" value={formState.href} onChange={(value) => setValue("href", value)} placeholder="https://..."/>
                          <Field className="sm:col-span-2" label="Summary" value={formState.summary} onChange={(value) => setValue("summary", value)} multiline/>
                          <Field className="sm:col-span-2" label="Detail lines" hint="One per line" value={formState.details} onChange={(value) => setValue("details", value)} multiline/>
                        </div>
                      </EditorCard>) : (<EmptyNote>Select a stage above to edit its details.</EmptyNote>)}
                  </>) : null}

                {editor.section === "projects" ? (<>
                    <EditorCard title="Section copy" description="Heading shown above the project desktop.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Eyebrow" value={formState.eyebrow} onChange={(value) => setValue("eyebrow", value)}/>
                        <Field label="Title" value={formState.sectionTitle} onChange={(value) => setValue("sectionTitle", value)}/>
                        <Field className="sm:col-span-2" label="Description" value={formState.sectionDescription} onChange={(value) => setValue("sectionDescription", value)} multiline/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Projects" description="Pick a project to edit, or add a new one." action={<button type="button" onClick={() => void handleAddProject()} className="edit-button">
                          <span aria-hidden="true">+</span>
                          <span>Add project</span>
                        </button>}>
                      <div className="flex flex-wrap gap-2">
                        {data.projects.length ? (data.projects.map((project) => {
                    const active = editor.itemId === project.id;
                    return (<button key={project.id} type="button" onClick={() => go("projects", project.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active
                            ? "border-transparent bg-[color:var(--accent-solid)] text-[color:var(--on-accent)]"
                            : "border-[color:var(--line)] text-[color:var(--text-soft)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"}`}>
                              <span className="font-mono">{project.icon.trim() || "PR"}</span>
                              <span>{project.name.trim() || "Untitled project"}</span>
                            </button>);
                })) : (<EmptyNote>No projects yet. Add one to populate the desktop.</EmptyNote>)}
                      </div>
                    </EditorCard>

                    {selectedProject ? (<>
                        <EditorCard title="Basics">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Project name" value={formState.name} onChange={(value) => setValue("name", value)}/>
                            <Field label="Icon label" hint="2 characters" value={formState.icon} onChange={(value) => setValue("icon", value)}/>
                            <Field className="sm:col-span-2" label="Tagline" value={formState.tagline} onChange={(value) => setValue("tagline", value)}/>
                            <Field className="sm:col-span-2" label="Description" value={formState.description} onChange={(value) => setValue("description", value)} multiline/>
                            <Field label="Stack" hint="Comma separated" value={formState.stack} onChange={(value) => setValue("stack", value)} placeholder="Next.js, TypeScript, Firebase"/>
                            <Field label="Status" value={formState.status} onChange={(value) => setValue("status", value)} placeholder="In progress"/>
                          </div>
                        </EditorCard>

                        <EditorCard title="Links">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Repository URL" value={formState.repoHref} onChange={(value) => setValue("repoHref", value)} placeholder="https://github.com/..."/>
                            <Field label="Live URL" value={formState.liveHref} onChange={(value) => setValue("liveHref", value)} placeholder="https://..."/>
                          </div>
                        </EditorCard>

                        <EditorCard title="Media" description="Screenshots and videos shown in the project gallery. Uploads keep their original colors." action={<label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[color:var(--accent-solid)] px-4 py-2 text-sm font-semibold text-[color:var(--on-accent)] transition hover:brightness-110">
                              <span>{isProcessingProjectImages ? "Uploading..." : "Upload media"}</span>
                              <input type="file" accept="image/*,video/*" multiple onChange={(event) => void handleProjectImageUpload(event)} className="sr-only" disabled={isProcessingProjectImages}/>
                            </label>}>
                          <div className="space-y-4">
                            {projectImagesDraft.length ? (projectImagesDraft.map((image, index) => (<div key={image.id} className="grid gap-4 rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-3 lg:grid-cols-[11rem_1fr]">
                                  <div className="aspect-[16/10] overflow-hidden rounded-[0.9rem] border border-[color:var(--line)] bg-black/10">
                                    {image.type === "video" ? (<video src={image.src} className="h-full w-full object-cover" muted playsInline preload="metadata"/>) : (<img src={image.src} alt={image.alt || `Project image ${index + 1}`} className="h-full w-full object-cover"/>)}
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                                        {image.type === "video" ? "Video" : "Screenshot"} {String(index + 1).padStart(2, "0")}
                                      </p>
                                      <RemoveButton onClick={() => deleteProjectImageDraft(image.id)}>Delete media</RemoveButton>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <Field label="Caption" value={image.caption} onChange={(value) => updateProjectImageDraft(image.id, "caption", value)} placeholder="Overview of the live dashboard"/>
                                      <Field label="Alt text" value={image.alt} onChange={(value) => updateProjectImageDraft(image.id, "alt", value)} placeholder="Dashboard screenshot"/>
                                    </div>
                                  </div>
                                </div>))) : (<EmptyNote>No media uploaded yet. Add screenshots or videos to populate the gallery.</EmptyNote>)}
                            {projectImageError ? (<StatusNote strong>{projectImageError}</StatusNote>) : (<p className="text-xs leading-5 text-[color:var(--text-soft)]">
                                Up to {MAX_PROJECT_MEDIA} media items per project. Images are optimized automatically; videos can be up to 200 MB each.
                              </p>)}
                          </div>
                        </EditorCard>

                        <EditorCard title="Details">
                          <div className="grid gap-4">
                            <Field label="Features" hint="One per line" value={formState.features} onChange={(value) => setValue("features", value)} multiline/>
                            <Field label="File tree" hint="One path per line" value={formState.fileTree} onChange={(value) => setValue("fileTree", value)} multiline/>
                            <Field label="README" value={formState.readme} onChange={(value) => setValue("readme", value)} multiline placeholder="# Project README"/>
                            <Field label="Code snippet" value={formState.codeSnippet} onChange={(value) => setValue("codeSnippet", value)} multiline/>
                          </div>
                        </EditorCard>

                        <EditorCard title="Custom Explorer sections" description="Extra tabs shown inside the project window." action={<button type="button" onClick={addProjectCustomSection} className="edit-button">
                              <span aria-hidden="true">+</span>
                              <span>Add section</span>
                            </button>}>
                          <div className="space-y-3">
                            {projectCustomSectionsDraft.length ? (projectCustomSectionsDraft.map((section, index) => (<div key={section.id} className="rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-3">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                                      Section {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <RemoveButton onClick={() => deleteProjectCustomSectionDraft(section.id)}>Delete section</RemoveButton>
                                  </div>
                                  <div className="grid gap-3">
                                    <Field label="Title" value={section.title} onChange={(value) => updateProjectCustomSectionDraft(section.id, "title", value)} placeholder="Results"/>
                                    <Field label="Content" value={section.content} onChange={(value) => updateProjectCustomSectionDraft(section.id, "content", value)} multiline placeholder="Notes for this Explorer view."/>
                                  </div>
                                </div>))) : (<EmptyNote>No custom sections yet.</EmptyNote>)}
                          </div>
                        </EditorCard>
                      </>) : (<EmptyNote>Select a project above to edit its content.</EmptyNote>)}
                  </>) : null}

                {editor.section === "contact" ? (<>
                    <EditorCard title="Contact details" description="Shown in the contact section and footer cards.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field className="sm:col-span-2" label="Headline" value={formState.headline} onChange={(value) => setValue("headline", value)} multiline/>
                        <Field label="Email" value={formState.email} onChange={(value) => setValue("email", value)}/>
                        <Field label="Phone" value={formState.phone} onChange={(value) => setValue("phone", value)}/>
                        <Field label="Location" value={formState.location} onChange={(value) => setValue("location", value)}/>
                        <Field label="Response time" value={formState.responseTime} onChange={(value) => setValue("responseTime", value)}/>
                        <Field className="sm:col-span-2" label="Availability" value={formState.availability} onChange={(value) => setValue("availability", value)}/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Social links">
                      <LinkRepeater items={formState.socialLinks ?? []} onChange={(items) => setValue("socialLinks", items)} addLabel="Add social link"/>
                    </EditorCard>

                    <EditorCard title="Email delivery" description="Where contact form messages are delivered." action={<button type="button" onClick={() => go("mailer")} className="edit-button">
                          <span aria-hidden="true">+</span>
                          <span>Open mailer settings</span>
                        </button>}>
                      <p className="text-xs leading-5 text-[color:var(--text-soft)]">
                        SMTP credentials are stored privately and are never shown back in the editor.
                      </p>
                    </EditorCard>
                  </>) : null}

                {editor.section === "work" ? (<>
                    <EditorCard title="Section copy" description="Heading shown above the GitHub activity card.">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Eyebrow" value={formState.eyebrow} onChange={(value) => setValue("eyebrow", value)}/>
                        <Field label="Title" value={formState.title} onChange={(value) => setValue("title", value)}/>
                        <Field className="sm:col-span-2" label="Description" value={formState.description} onChange={(value) => setValue("description", value)} multiline/>
                      </div>
                    </EditorCard>

                    <EditorCard title="GitHub activity" description="Private credentials used for live contribution stats.">
                      <div className="mb-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Source</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{workInfo.source}</p>
                        </div>
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Token saved</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{workInfo.hasGithubToken ? "Yes" : "No"}</p>
                        </div>
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Persist</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{workInfo.canPersist ? "Enabled" : "Unavailable"}</p>
                        </div>
                      </div>
                      {!workInfo.canPersist ? (<div className="mb-4">
                          <StatusNote>Firebase Admin is not configured, so GitHub settings cannot be saved from the UI yet.</StatusNote>
                        </div>) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="GitHub username" value={formState.githubUsername} onChange={(value) => setValue("githubUsername", value)} placeholder="rakesh"/>
                        <Field label="GitHub token" hint={workInfo.hasGithubToken ? "Leave blank to keep current" : ""} type="password" value={formState.githubToken} onChange={(value) => setValue("githubToken", value)} placeholder={workInfo.hasGithubToken ? "Leave blank to keep current token" : "Enter GitHub token"}/>
                      </div>
                      {isLoadingWorkSettings ? (<p className="mt-3 text-sm text-[color:var(--text-soft)]">Loading GitHub settings...</p>) : null}
                      {workError ? (<div className="mt-3">
                          <StatusNote strong>{workError}</StatusNote>
                        </div>) : null}
                    </EditorCard>
                  </>) : null}

                {editor.section === "resume" ? (<>
                    <EditorCard title="Resume details">
                      <Field label="Resume title" value={formState.title} onChange={(value) => setValue("title", value)} placeholder="Resume"/>
                    </EditorCard>

                    <EditorCard title="PDF file" description="Shown in the View resume button." action={<label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[color:var(--accent-solid)] px-4 py-2 text-sm font-semibold text-[color:var(--on-accent)] transition hover:brightness-110">
                          <span>{isUploadingResume ? "Uploading..." : "Upload PDF"}</span>
                          <input type="file" accept="application/pdf,.pdf" onChange={(event) => void handleResumeUpload(event)} className="sr-only" disabled={isUploadingResume}/>
                        </label>}>
                      <div className="space-y-3">
                        <p className="text-sm leading-6 text-[color:var(--text-soft)]">
                          {formState.fileHref
                ? `${formState.fileName || "resume.pdf"}${formState.updatedAt ? ` updated ${new Date(formState.updatedAt).toLocaleString()}` : ""}`
                : "No resume PDF uploaded yet."}
                        </p>
                        {resumeUploadError ? (<StatusNote strong>{resumeUploadError}</StatusNote>) : null}
                        {formState.fileHref ? (<div className="flex flex-wrap gap-2">
                            <a href={formState.fileHref} target="_blank" rel="noreferrer" className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)]">
                              Preview PDF
                            </a>
                            <a href={formState.fileHref} download={formState.fileName || "resume.pdf"} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)]">
                              Download PDF
                            </a>
                          </div>) : null}
                      </div>
                    </EditorCard>
                  </>) : null}

                {editor.section === "mailer" ? (<>
                    <EditorCard title="Delivery status">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Source</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{mailerInfo.source}</p>
                        </div>
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Password saved</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{mailerInfo.hasPassword ? "Yes" : "No"}</p>
                        </div>
                        <div className="rounded-[0.9rem] border border-[color:var(--line)] px-3 py-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Persist</p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{mailerInfo.canPersist ? "Enabled" : "Unavailable"}</p>
                        </div>
                      </div>
                      {!mailerInfo.canPersist ? (<div className="mt-4">
                          <StatusNote>Firebase Admin is not configured, so mailer changes cannot be saved from the UI yet.</StatusNote>
                        </div>) : null}
                    </EditorCard>

                    <EditorCard title="SMTP server">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="SMTP host" value={formState.smtpHost} onChange={(value) => setValue("smtpHost", value)} placeholder="smtp.gmail.com"/>
                        <Field label="SMTP port" value={formState.smtpPort} onChange={(value) => setValue("smtpPort", value)} placeholder="587"/>
                        <Field label="SMTP user" value={formState.smtpUser} onChange={(value) => setValue("smtpUser", value)} placeholder="your@email.com"/>
                        <Field label="SMTP password" hint={mailerInfo.hasPassword ? "Leave blank to keep current" : ""} type="password" value={formState.smtpPass} onChange={(value) => setValue("smtpPass", value)} placeholder={mailerInfo.hasPassword ? "Leave blank to keep current password" : "Enter SMTP password"}/>
                        <SelectField className="sm:col-span-2" label="Transport security" value={formState.smtpSecure ?? "false"} onChange={(value) => setValue("smtpSecure", value)} options={[
                    { value: "false", label: "STARTTLS / explicit TLS (usually port 587)" },
                    { value: "true", label: "Implicit TLS / SSL (usually port 465)" },
                ]}/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Sender">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="From email" value={formState.fromEmail} onChange={(value) => setValue("fromEmail", value)} placeholder="your@email.com"/>
                        <Field label="From name" value={formState.fromName} onChange={(value) => setValue("fromName", value)} placeholder="Portfolio Contact"/>
                        <Field className="sm:col-span-2" label="To email" value={formState.toEmail} onChange={(value) => setValue("toEmail", value)} placeholder="your@email.com"/>
                      </div>
                      {isLoadingMailerSettings ? (<p className="mt-3 text-sm text-[color:var(--text-soft)]">Loading mailer settings...</p>) : null}
                      {mailerError ? (<div className="mt-3">
                          <StatusNote strong>{mailerError}</StatusNote>
                        </div>) : null}
                    </EditorCard>
                  </>) : null}

                {editor.section === "footer" ? (<>
                    <EditorCard title="Footer copy">
                      <div className="grid gap-4">
                        <Field label="Quote" value={formState.quote} onChange={(value) => setValue("quote", value)}/>
                        <Field label="Note" value={formState.note} onChange={(value) => setValue("note", value)} multiline/>
                        <Field label="Copyright" value={formState.copyrightLabel} onChange={(value) => setValue("copyrightLabel", value)}/>
                      </div>
                    </EditorCard>

                    <EditorCard title="Footer links">
                      <LinkRepeater items={formState.links ?? []} onChange={(items) => setValue("links", items)} addLabel="Add footer link" withHandle={false}/>
                    </EditorCard>
                  </>) : null}
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] px-5 py-4 sm:px-7">
              <div>
                {canDelete ? (<RemoveButton onClick={() => void handleDelete()}>
                    {editor.section === "education" ? "Delete stage" : "Delete project"}
                  </RemoveButton>) : (<span className="text-xs text-[color:var(--text-soft)]">
                    Changes are saved to your portfolio data.
                  </span>)}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={closeEditor} className="rounded-full border border-[color:var(--line)] px-4 py-2.5 text-sm text-[color:var(--text-soft)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]">
                  Cancel
                </button>
                <button type="button" onClick={() => void handleSave()} disabled={saveDisabled} className="rounded-full bg-[color:var(--accent-solid)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">
                  {saveLabel}
                </button>
              </div>
            </footer>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { useEditMode } from "@/admin/EditMode";
import { useSiteData } from "@/lib/site-context";
import type { HeroAction, ProjectImage, SkillGroup, SocialLink } from "@/lib/types";
import { createIdCardImageDataUrl, createProjectImageDataUrl } from "@/utils/profile-image";

type FormState = Record<string, string>;
const MAX_PROJECT_IMAGES = 6;

type SkillGroupDraft = {
  id: string;
  title: string;
  accent: string;
  marker: string;
  items: string;
};

type ProjectImageDraft = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

function serializeLinks(links: SocialLink[]) {
  return links.map((link) => `${link.label} | ${link.href} | ${link.handle}`).join("\n");
}

function parseLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts[0] && parts[1])
    .map(([label, href, handle]) => ({
      label,
      href,
      handle: handle ?? href,
    }));
}

function serializeActions(actions: HeroAction[]) {
  return actions.map((action) => `${action.label} | ${action.href} | ${action.variant}`).join("\n");
}

function parseActions(value: string) {
  return value
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts[0] && parts[1])
    .map(([label, href, variant]): HeroAction => ({
      label,
      href,
      variant: variant === "secondary" ? "secondary" : "primary",
    }));
}

function parseList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function createSkillGroupDraft(group?: SkillGroup, index = 0): SkillGroupDraft {
  const title = group?.title ?? "New Cluster";

  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "skill-cluster"}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    accent: group?.accent ?? "#67e8f9",
    marker: ((group?.marker ?? title.slice(0, 2)) || "SC").slice(0, 2).toUpperCase(),
    items: group?.items.join("\n") ?? "",
  };
}

function buildSkillGroupDrafts(groups: SkillGroup[]) {
  return groups.length ? groups.map((group, index) => createSkillGroupDraft(group, index)) : [];
}

function normalizeSkillGroupDrafts(groups: SkillGroupDraft[]) {
  return groups
    .map((group, index): SkillGroup | null => {
      const title = group.title.trim();
      const items = parseList(group.items);

      if (!title && !items.length) {
        return null;
      }

      return {
        title: title || `Skill Cluster ${index + 1}`,
        accent: group.accent.trim() || "#67e8f9",
        marker: (group.marker.trim() || title.slice(0, 2) || "SC").slice(0, 2).toUpperCase(),
        items,
      };
    })
    .filter((group): group is SkillGroup => Boolean(group));
}

function createProjectImageDraft(image?: ProjectImage, index = 0): ProjectImageDraft {
  return {
    id: image?.id ?? `project-image-${index}-${Math.random().toString(36).slice(2, 8)}`,
    src: image?.src ?? "",
    alt: image?.alt ?? "",
    caption: image?.caption ?? "",
  };
}

function buildProjectImageDrafts(images: ProjectImage[]) {
  return images.length ? images.map((image, index) => createProjectImageDraft(image, index)) : [];
}

function normalizeProjectImageDrafts(images: ProjectImageDraft[], projectName: string) {
  return images
    .map((image, index): ProjectImage | null => {
      const src = image.src.trim();

      if (!src) {
        return null;
      }

      const fallbackLabel = `${projectName || "Project"} screenshot ${index + 1}`;

      return {
        id: image.id,
        src,
        alt: image.alt.trim() || fallbackLabel,
        caption: image.caption.trim(),
      };
    })
    .filter((image): image is ProjectImage => Boolean(image));
}

function buildFormState(
  editor: NonNullable<ReturnType<typeof useEditMode>["editor"]>,
  data: ReturnType<typeof useSiteData>["data"],
): FormState {
  switch (editor.section) {
    case "profile":
      return {
        name: data.profile.name,
        role: data.profile.role,
        tagline: data.profile.tagline,
        intro: data.profile.intro,
        location: data.profile.location,
        availability: data.profile.availability,
        avatarLabel: data.profile.avatarLabel,
        profileImageAlt: data.profile.profileImageAlt,
        profileImageSrc: data.profile.profileImageSrc,
        idCardSerialNumber: data.profile.idCard.serialNumber,
        idCardPrimaryName: data.profile.idCard.primaryName,
        idCardSecondaryName: data.profile.idCard.secondaryName,
        idCardFrontRoleLines: data.profile.idCard.frontRoleLines.join("\n"),
        idCardBackTitle: data.profile.idCard.backTitle,
        idCardBackDescription: data.profile.idCard.backDescription,
        idCardBackFooter: data.profile.idCard.backFooter,
        heroActions: serializeActions(data.profile.heroActions),
        socialLinks: serializeLinks(data.profile.socialLinks),
      };
    case "education": {
      const item = data.education.find((entry) => entry.id === editor.itemId);

      return item
        ? {
            title: item.title,
            period: item.period,
            institution: item.institution,
            summary: item.summary,
            details: item.details.join("\n"),
            accent: item.accent,
          }
        : {};
    }
    case "projects": {
      const item = data.projects.find((entry) => entry.id === editor.itemId);

      return item
        ? {
            name: item.name,
            tagline: item.tagline,
            description: item.description,
            stack: item.stack.join(", "),
            features: item.features.join("\n"),
            repoHref: item.repoHref,
            liveHref: item.liveHref,
            icon: item.icon,
            accent: item.accent,
            status: item.status,
            fileTree: item.fileTree.join("\n"),
            codeSnippet: item.codeSnippet,
          }
        : {};
    }
    case "contact":
      return {
        headline: data.contact.headline,
        email: data.contact.email,
        phone: data.contact.phone,
        location: data.contact.location,
        responseTime: data.contact.responseTime,
        availability: data.contact.availability,
        socialLinks: serializeLinks(data.contact.socialLinks),
      };
    case "footer":
      return {
        note: data.footer.note,
        quote: data.footer.quote,
        copyrightLabel: data.footer.copyrightLabel,
        links: serializeLinks(data.footer.links),
      };
  }
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input-surface min-h-[144px] resize-y"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input-surface"
        />
      )}
    </label>
  );
}

export function EditForms() {
  const { closeEditor, editor } = useEditMode();
  const {
    data,
    isSaving,
    deleteEducationItem,
    deleteProject,
    updateContact,
    updateEducationItem,
    updateFooter,
    updateProfile,
    updateProject,
  } = useSiteData();
  const [formState, setFormState] = useState<FormState>({});
  const [skillGroupsDraft, setSkillGroupsDraft] = useState<SkillGroupDraft[]>([]);
  const [projectImagesDraft, setProjectImagesDraft] = useState<ProjectImageDraft[]>([]);
  const [isProcessingProfileImage, setIsProcessingProfileImage] = useState(false);
  const [isProcessingProjectImages, setIsProcessingProjectImages] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [projectImageError, setProjectImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) {
      setFormState({});
      setSkillGroupsDraft([]);
      setProjectImagesDraft([]);
      setIsProcessingProfileImage(false);
      setIsProcessingProjectImages(false);
      setProfileImageError(null);
      setProjectImageError(null);
      return;
    }

    setFormState(buildFormState(editor, data));
    setSkillGroupsDraft(editor.section === "profile" ? buildSkillGroupDrafts(data.profile.skillGroups) : []);
    setProjectImagesDraft(
      editor.section === "projects"
        ? buildProjectImageDrafts(data.projects.find((entry) => entry.id === editor.itemId)?.images ?? [])
        : [],
    );
    setProfileImageError(null);
    setProjectImageError(null);
  }, [data, editor]);

  if (!editor) {
    return null;
  }

  const setValue = (key: string, value: string) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateSkillGroupDraft = (id: string, key: keyof Omit<SkillGroupDraft, "id">, value: string) => {
    setSkillGroupsDraft((current) =>
      current.map((group) =>
        group.id === id
          ? {
              ...group,
              [key]: value,
            }
          : group,
      ),
    );
  };

  const addSkillGroup = () => {
    setSkillGroupsDraft((current) => [...current, createSkillGroupDraft(undefined, current.length)]);
  };

  const deleteSkillGroup = (id: string) => {
    setSkillGroupsDraft((current) => current.filter((group) => group.id !== id));
  };

  const updateProjectImageDraft = (id: string, key: keyof Omit<ProjectImageDraft, "id" | "src">, value: string) => {
    setProjectImagesDraft((current) =>
      current.map((image) =>
        image.id === id
          ? {
              ...image,
              [key]: value,
            }
          : image,
      ),
    );
  };

  const deleteProjectImageDraft = (id: string) => {
    setProjectImagesDraft((current) => current.filter((image) => image.id !== id));
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
        profileImageAlt: current.profileImageAlt?.trim() || `${current.name?.trim() || data.profile.name} profile photo`,
      }));
    } catch (error) {
      setProfileImageError(error instanceof Error ? error.message : "Failed to process the uploaded image.");
    } finally {
      setIsProcessingProfileImage(false);
    }
  };

  const handleProjectImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const remainingSlots = Math.max(0, MAX_PROJECT_IMAGES - projectImagesDraft.length);

    if (!remainingSlots) {
      setProjectImageError(`Only ${MAX_PROJECT_IMAGES} project images can be stored for a single project.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    const projectName =
      formState.name?.trim() || data.projects.find((entry) => entry.id === editor.itemId)?.name || "Project";

    setIsProcessingProjectImages(true);
    setProjectImageError(null);

    try {
      const processedImages: ProjectImageDraft[] = [];

      for (const [index, file] of acceptedFiles.entries()) {
        const processedImage = await createProjectImageDataUrl(file);
        const order = projectImagesDraft.length + index + 1;

        processedImages.push({
          id: `project-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          src: processedImage,
          alt: `${projectName} screenshot ${order}`,
          caption: `${projectName} view ${order}`,
        });
      }

      setProjectImagesDraft((current) => [...current, ...processedImages]);

      if (acceptedFiles.length < files.length) {
        setProjectImageError(`Only the first ${remainingSlots} image(s) were added. Limit: ${MAX_PROJECT_IMAGES} images per project.`);
      }
    } catch (error) {
      setProjectImageError(error instanceof Error ? error.message : "Failed to process the uploaded project image.");
    } finally {
      setIsProcessingProjectImages(false);
    }
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
          avatarLabel: formState.avatarLabel.trim().slice(0, 2).toUpperCase(),
          profileImageAlt: formState.profileImageAlt.trim() || `${formState.name.trim()} profile photo`,
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
          skillGroups: normalizeSkillGroupDrafts(skillGroupsDraft),
          heroActions: parseActions(formState.heroActions),
          socialLinks: parseLinks(formState.socialLinks),
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
          summary: formState.summary.trim(),
          details: parseList(formState.details),
          accent: formState.accent.trim() || item.accent,
        });
        break;
      }
      case "projects": {
        const item = data.projects.find((entry) => entry.id === editor.itemId);

        if (!item) {
          return;
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
          accent: formState.accent.trim() || item.accent,
          status: formState.status.trim(),
          fileTree: parseList(formState.fileTree),
          codeSnippet: formState.codeSnippet,
          images: normalizeProjectImageDrafts(projectImagesDraft, formState.name.trim() || item.name),
        });
        break;
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
          socialLinks: parseLinks(formState.socialLinks),
        });
        break;
      case "footer":
        await updateFooter({
          ...data.footer,
          note: formState.note.trim(),
          quote: formState.quote.trim(),
          copyrightLabel: formState.copyrightLabel.trim(),
          links: parseLinks(formState.links),
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

  const titleMap = {
    profile: "Edit profile and ID card",
    education: "Edit education stage",
    projects: "Edit project",
    contact: "Edit contact details",
    footer: "Edit footer",
  } as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/58 px-4 py-8 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.985 }}
          className="panel-surface-strong max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem]"
        >
          <div className="flex items-start justify-between border-b border-[color:var(--line)] px-6 py-5">
            <div className="space-y-2">
              <span className="eyebrow">Edit Mode</span>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
                {titleMap[editor.section]}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[color:var(--text-soft)] transition hover:text-[color:var(--text)]"
            >
              Close
            </button>
          </div>

          <div className="max-h-[calc(92vh-82px)] overflow-y-auto px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {editor.section === "profile" ? (
                <>
                  <div className="sm:col-span-2 space-y-1">
                    <span className="eyebrow">Profile essentials</span>
                    <p className="text-sm text-[color:var(--text-soft)]">
                      Only the main visible content is kept here. The noisy raw image data and secondary badge controls are hidden.
                    </p>
                  </div>
                  <Field label="Name" value={formState.name ?? ""} onChange={(value) => setValue("name", value)} />
                  <Field label="Role" value={formState.role ?? ""} onChange={(value) => setValue("role", value)} />
                  <div className="sm:col-span-2">
                    <Field
                      label="Tagline"
                      value={formState.tagline ?? ""}
                      onChange={(value) => setValue("tagline", value)}
                      multiline
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Introduction"
                      value={formState.intro ?? ""}
                      onChange={(value) => setValue("intro", value)}
                      multiline
                    />
                  </div>
                  <Field
                    label="Location"
                    value={formState.location ?? ""}
                    onChange={(value) => setValue("location", value)}
                  />
                  <Field
                    label="Availability"
                    value={formState.availability ?? ""}
                    onChange={(value) => setValue("availability", value)}
                  />
                  <div className="sm:col-span-2 rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface)]/56 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                          Upload profile image
                        </p>
                        <p className="max-w-xl text-sm leading-6 text-[color:var(--text-soft)]">
                          Upload any image and the system will crop, resize, and optimize it automatically so it fits
                          the ID card layout.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                        <span>{isProcessingProfileImage ? "Processing..." : "Upload image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => void handleProfileImageUpload(event)}
                          className="sr-only"
                          disabled={isProcessingProfileImage}
                        />
                      </label>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start">
                      <div className="overflow-hidden rounded-[1rem] border border-[color:var(--line)] bg-black/10 aspect-[2/3]">
                        {formState.profileImageSrc ? (
                          <img
                            src={formState.profileImageSrc}
                            alt={formState.profileImageAlt || "Profile preview"}
                            className="h-full w-full object-cover grayscale contrast-125 brightness-[0.92]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-4 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm leading-6 text-[color:var(--text-soft)]">
                        <p>The processed image is stored in the existing profile image field, so it works immediately on the badge UI.</p>
                        {profileImageError ? (
                          <p className="text-rose-300">{profileImageError}</p>
                        ) : (
                          <p>{isProcessingProfileImage ? "Normalizing image for the card layout..." : "The card styling still applies grayscale, contrast, and layout framing automatically."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1 pt-2">
                    <span className="eyebrow">ID card essentials</span>
                    <p className="text-sm text-[color:var(--text-soft)]">
                      These fields control the visible content on the front of the badge. Social links still control the back.
                    </p>
                  </div>
                  <Field
                    label="ID card serial number"
                    value={formState.idCardSerialNumber ?? ""}
                    onChange={(value) => setValue("idCardSerialNumber", value)}
                    placeholder="31522"
                  />
                  <Field
                    label="ID card primary name"
                    value={formState.idCardPrimaryName ?? ""}
                    onChange={(value) => setValue("idCardPrimaryName", value)}
                    placeholder="Rakesh"
                  />
                  <Field
                    label="ID card secondary name"
                    value={formState.idCardSecondaryName ?? ""}
                    onChange={(value) => setValue("idCardSecondaryName", value)}
                    placeholder="Kumar"
                  />
                  <Field
                    label="ID card front role lines"
                    value={formState.idCardFrontRoleLines ?? ""}
                    onChange={(value) => setValue("idCardFrontRoleLines", value)}
                    multiline
                    placeholder={"Full Stack\nWeb Dev\nUI / UX"}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Social links"
                      value={formState.socialLinks ?? ""}
                      onChange={(value) => setValue("socialLinks", value)}
                      multiline
                      placeholder="GitHub | https://github.com | @handle"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="space-y-1">
                        <span className="eyebrow">Skill clusters</span>
                        <p className="text-sm text-[color:var(--text-soft)]">
                          Edit each skills card directly and add or delete whole skill clusters as needed.
                        </p>
                      </div>
                      <button type="button" onClick={addSkillGroup} className="edit-button">
                        <span aria-hidden="true">+</span>
                        <span>Add skill cluster</span>
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {skillGroupsDraft.map((group, index) => (
                        <div
                          key={group.id}
                          className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)]/58 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border font-mono text-sm font-semibold uppercase tracking-[0.2em]"
                                style={{
                                  borderColor: `${group.accent}55`,
                                  backgroundColor: `${group.accent}16`,
                                  color: group.accent,
                                }}
                              >
                                {group.marker || "SC"}
                              </div>
                              <div>
                                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                                  Skill cluster {String(index + 1).padStart(2, "0")}
                                </p>
                                <p className="mt-1 text-base font-medium text-[color:var(--text)]">
                                  {group.title.trim() || "Untitled cluster"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteSkillGroup(group.id)}
                              className="rounded-full border border-rose-400/24 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18"
                            >
                              Delete cluster
                            </button>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <Field
                              label="Title"
                              value={group.title}
                              onChange={(value) => updateSkillGroupDraft(group.id, "title", value)}
                            />
                            <Field
                              label="Marker"
                              value={group.marker}
                              onChange={(value) => updateSkillGroupDraft(group.id, "marker", value.toUpperCase().slice(0, 2))}
                              placeholder="LG"
                            />
                            <Field
                              label="Accent"
                              value={group.accent}
                              onChange={(value) => updateSkillGroupDraft(group.id, "accent", value)}
                              placeholder="#67e8f9"
                            />
                            <div className="sm:col-span-3">
                              <Field
                                label="Skills"
                                value={group.items}
                                onChange={(value) => updateSkillGroupDraft(group.id, "items", value)}
                                multiline
                                placeholder={"TypeScript\nJavaScript\nPython"}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {editor.section === "education" ? (
                <>
                  <Field
                    label="Stage title"
                    value={formState.title ?? ""}
                    onChange={(value) => setValue("title", value)}
                  />
                  <Field
                    label="Period"
                    value={formState.period ?? ""}
                    onChange={(value) => setValue("period", value)}
                  />
                  <Field
                    label="Institution"
                    value={formState.institution ?? ""}
                    onChange={(value) => setValue("institution", value)}
                  />
                  <Field
                    label="Accent color"
                    value={formState.accent ?? ""}
                    onChange={(value) => setValue("accent", value)}
                    placeholder="#3b82f6"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Summary"
                      value={formState.summary ?? ""}
                      onChange={(value) => setValue("summary", value)}
                      multiline
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Detail lines"
                      value={formState.details ?? ""}
                      onChange={(value) => setValue("details", value)}
                      multiline
                    />
                  </div>
                </>
              ) : null}

              {editor.section === "projects" ? (
                <>
                  <Field
                    label="Project name"
                    value={formState.name ?? ""}
                    onChange={(value) => setValue("name", value)}
                  />
                  <Field
                    label="Icon label"
                    value={formState.icon ?? ""}
                    onChange={(value) => setValue("icon", value)}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Tagline"
                      value={formState.tagline ?? ""}
                      onChange={(value) => setValue("tagline", value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Description"
                      value={formState.description ?? ""}
                      onChange={(value) => setValue("description", value)}
                      multiline
                    />
                  </div>
                  <Field
                    label="Stack"
                    value={formState.stack ?? ""}
                    onChange={(value) => setValue("stack", value)}
                    placeholder="Next.js, TypeScript, Firebase"
                  />
                  <Field
                    label="Status"
                    value={formState.status ?? ""}
                    onChange={(value) => setValue("status", value)}
                  />
                  <Field
                    label="Repo URL"
                    value={formState.repoHref ?? ""}
                    onChange={(value) => setValue("repoHref", value)}
                  />
                  <Field
                    label="Live URL"
                    value={formState.liveHref ?? ""}
                    onChange={(value) => setValue("liveHref", value)}
                  />
                  <Field
                    label="Accent color"
                    value={formState.accent ?? ""}
                    onChange={(value) => setValue("accent", value)}
                    placeholder="#14b8a6"
                  />
                  <div className="sm:col-span-2 rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface)]/56 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                          Project images
                        </p>
                        <p className="max-w-xl text-sm leading-6 text-[color:var(--text-soft)]">
                          Upload one or more images and the system will crop, resize, and optimize them for the project
                          overview gallery in the VSCode window.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                        <span>{isProcessingProjectImages ? "Processing..." : "Upload images"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => void handleProjectImageUpload(event)}
                          className="sr-only"
                          disabled={isProcessingProjectImages}
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-4">
                      {projectImagesDraft.length ? (
                        projectImagesDraft.map((image, index) => (
                          <div
                            key={image.id}
                            className="grid gap-4 rounded-[1.3rem] border border-[color:var(--line)] bg-black/10 p-4 lg:grid-cols-[12rem_1fr]"
                          >
                            <div className="overflow-hidden rounded-[1rem] border border-[color:var(--line)] bg-[#0a101a] aspect-[16/10]">
                              <img src={image.src} alt={image.alt || `Project image ${index + 1}`} className="h-full w-full object-cover" />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                                    Screenshot {String(index + 1).padStart(2, "0")}
                                  </p>
                                  <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                                    This image appears in the overview gallery below the Explorer panel.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteProjectImageDraft(image.id)}
                                  className="rounded-full border border-rose-400/24 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18"
                                >
                                  Delete image
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                  label="Caption"
                                  value={image.caption}
                                  onChange={(value) => updateProjectImageDraft(image.id, "caption", value)}
                                  placeholder="Overview of the live dashboard"
                                />
                                <Field
                                  label="Alt text"
                                  value={image.alt}
                                  onChange={(value) => updateProjectImageDraft(image.id, "alt", value)}
                                  placeholder="Dashboard screenshot"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.2rem] border border-dashed border-[color:var(--line)] bg-black/10 px-4 py-5 text-sm leading-6 text-[color:var(--text-soft)]">
                          No project images uploaded yet. Add one or more screenshots to populate the overview gallery.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-sm leading-6 text-[color:var(--text-soft)]">
                      {projectImageError ? (
                        <p className="text-rose-300">{projectImageError}</p>
                      ) : (
                        <p>
                          Up to {MAX_PROJECT_IMAGES} processed images can be stored per project. Each upload is
                          normalized automatically for a clean gallery layout.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Features"
                      value={formState.features ?? ""}
                      onChange={(value) => setValue("features", value)}
                      multiline
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="File tree"
                      value={formState.fileTree ?? ""}
                      onChange={(value) => setValue("fileTree", value)}
                      multiline
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Code snippet"
                      value={formState.codeSnippet ?? ""}
                      onChange={(value) => setValue("codeSnippet", value)}
                      multiline
                    />
                  </div>
                </>
              ) : null}

              {editor.section === "contact" ? (
                <>
                  <div className="sm:col-span-2">
                    <Field
                      label="Headline"
                      value={formState.headline ?? ""}
                      onChange={(value) => setValue("headline", value)}
                      multiline
                    />
                  </div>
                  <Field
                    label="Email"
                    value={formState.email ?? ""}
                    onChange={(value) => setValue("email", value)}
                  />
                  <Field
                    label="Phone"
                    value={formState.phone ?? ""}
                    onChange={(value) => setValue("phone", value)}
                  />
                  <Field
                    label="Location"
                    value={formState.location ?? ""}
                    onChange={(value) => setValue("location", value)}
                  />
                  <Field
                    label="Response time"
                    value={formState.responseTime ?? ""}
                    onChange={(value) => setValue("responseTime", value)}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Availability"
                      value={formState.availability ?? ""}
                      onChange={(value) => setValue("availability", value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Social links"
                      value={formState.socialLinks ?? ""}
                      onChange={(value) => setValue("socialLinks", value)}
                      multiline
                    />
                  </div>
                </>
              ) : null}

              {editor.section === "footer" ? (
                <>
                  <div className="sm:col-span-2">
                    <Field
                      label="Footer note"
                      value={formState.note ?? ""}
                      onChange={(value) => setValue("note", value)}
                      multiline
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Quote"
                      value={formState.quote ?? ""}
                      onChange={(value) => setValue("quote", value)}
                    />
                  </div>
                  <Field
                    label="Copyright"
                    value={formState.copyrightLabel ?? ""}
                    onChange={(value) => setValue("copyrightLabel", value)}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Footer links"
                      value={formState.links ?? ""}
                      onChange={(value) => setValue("links", value)}
                      multiline
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:justify-end">
              {editor.section === "education" || editor.section === "projects" ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isSaving}
                  className="rounded-full border border-rose-400/28 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/18 disabled:cursor-wait disabled:opacity-75 sm:mr-auto"
                >
                  {editor.section === "education" ? "Delete stage" : "Delete project"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm text-[color:var(--text-soft)] transition hover:text-[color:var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isProcessingProfileImage || isProcessingProjectImages}
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-75"
              >
                {isProcessingProfileImage
                  ? "Processing image..."
                  : isProcessingProjectImages
                    ? "Processing images..."
                    : isSaving
                      ? "Saving..."
                      : "Save changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { createPortfolioDataClone, mergePortfolioData } from "@/data/defaultData";
import { firestore } from "@/lib/firebase";
import type { ContactMessageInput, PortfolioData } from "@/lib/types";

const STORAGE_KEY = "interactive-storytelling-portfolio";
const MESSAGE_STORAGE_KEY = "interactive-storytelling-portfolio:messages";

function readLocalData() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return mergePortfolioData(JSON.parse(raw) as PortfolioData);
  } catch {
    return null;
  }
}

function writeLocalData(data: PortfolioData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function writeLocalMessage(message: ContactMessageInput) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = window.localStorage.getItem(MESSAGE_STORAGE_KEY);
  const current = raw ? (JSON.parse(raw) as ContactMessageInput[]) : [];
  current.push(message);
  window.localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(current));
}

export async function loadPortfolioData() {
  const localSnapshot = readLocalData();
  const db = firestore;

  if (!db) {
    return localSnapshot ?? createPortfolioDataClone();
  }

  try {
    const [profileSnap, contactSnap, educationSnap, projectsSnap] = await Promise.all([
      getDoc(doc(db, "profile", "site")),
      getDoc(doc(db, "contact", "site")),
      getDocs(query(collection(db, "education"), orderBy("order", "asc"))),
      getDocs(query(collection(db, "projects"), orderBy("order", "asc"))),
    ]);

    if (!profileSnap.exists() || !contactSnap.exists()) {
      const seeded = localSnapshot ?? createPortfolioDataClone();
      await savePortfolioData(seeded);
      return seeded;
    }

    const rawProfile = profileSnap.data() as PortfolioData["profile"] & {
      footer?: PortfolioData["footer"];
    };
    const { footer, ...profile } = rawProfile;

    const merged = mergePortfolioData({
      profile,
      footer,
      contact: contactSnap.data() as PortfolioData["contact"],
      education: educationSnap.docs.map((item) => item.data() as PortfolioData["education"][number]),
      projects: projectsSnap.docs.map((item) => item.data() as PortfolioData["projects"][number]),
    });

    writeLocalData(merged);
    return merged;
  } catch {
    return localSnapshot ?? createPortfolioDataClone();
  }
}

export async function savePortfolioData(data: PortfolioData) {
  writeLocalData(data);
  const db = firestore;

  if (!db) {
    return data;
  }

  const [existingEducationSnapshot, existingProjectsSnapshot] = await Promise.all([
    getDocs(collection(db, "education")),
    getDocs(collection(db, "projects")),
  ]);
  const batch = writeBatch(db);
  const educationIds = new Set(data.education.map((item) => item.id));
  const projectIds = new Set(data.projects.map((item) => item.id));

  batch.set(
    doc(db, "profile", "site"),
    {
      ...data.profile,
      footer: data.footer,
    },
    { merge: true },
  );
  batch.set(doc(db, "contact", "site"), data.contact, { merge: true });

  existingEducationSnapshot.forEach((snapshot) => {
    if (!educationIds.has(snapshot.id)) {
      batch.delete(snapshot.ref);
    }
  });

  data.education.forEach((item, index) => {
    batch.set(
      doc(db, "education", item.id),
      {
        ...item,
        order: index,
      },
      { merge: true },
    );
  });

  existingProjectsSnapshot.forEach((snapshot) => {
    if (!projectIds.has(snapshot.id)) {
      batch.delete(snapshot.ref);
    }
  });

  data.projects.forEach((item, index) => {
    batch.set(
      doc(db, "projects", item.id),
      {
        ...item,
        order: index,
      },
      { merge: true },
    );
  });

  await batch.commit();
  return data;
}

export async function submitContactMessage(message: ContactMessageInput) {
  writeLocalMessage(message);
  const db = firestore;

  if (!db) {
    return;
  }

  await addDoc(collection(db, "contact_messages"), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

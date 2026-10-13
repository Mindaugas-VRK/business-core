"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { exportFileSchema, projectSchema, type ExportFile, type Project } from "./schema";

const STORAGE_KEY = "business-core:bonus:v1";
const storedSchema = z.array(projectSchema);

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: Project[] | undefined;

function read(): Project[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? storedSchema.safeParse(JSON.parse(raw)) : null;
    cache = parsed?.success ? parsed.data : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(projects: Project[]) {
  cache = projects;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = undefined; // another tab changed the data
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` while rendering on the server (localStorage is browser-only). */
export function useProjects(): Project[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveProject(project: Project) {
  const next = { ...project, updatedAt: new Date().toISOString() };
  const projects = read();
  const exists = projects.some((p) => p.id === project.id);
  write(exists ? projects.map((p) => (p.id === project.id ? next : p)) : [...projects, next]);
}

export function deleteProject(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function toExportFile(projects: Project[]): ExportFile {
  return { app: "business-core/bonus", version: 1, projects };
}

/**
 * Adds the projects from an export file. Projects whose id already exists are
 * overwritten, so re-importing an updated export updates in place.
 * Returns the number of imported projects; throws on an invalid file.
 */
export function importProjects(json: string): number {
  const file = exportFileSchema.parse(JSON.parse(json));
  const incoming = new Map(file.projects.map((p) => [p.id, p]));
  const kept = read().filter((p) => !incoming.has(p.id));
  write([...kept, ...incoming.values()]);
  return incoming.size;
}

/** Test helper: forget the in-memory cache. */
export function resetCacheForTests() {
  cache = undefined;
}

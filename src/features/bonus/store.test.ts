import { beforeEach, describe, expect, it } from "vitest";
import { newProject } from "./schema";
import {
  deleteProject,
  importProjects,
  resetCacheForTests,
  saveProject,
  toExportFile,
} from "./store";

const stored = () => JSON.parse(localStorage.getItem("business-core:bonus:v1") ?? "[]");

describe("bonus store", () => {
  beforeEach(() => {
    localStorage.clear();
    resetCacheForTests();
  });

  it("saves, updates and deletes projects in localStorage", () => {
    const p = newProject("Website");
    saveProject(p);
    saveProject({ ...p, name: "Website v2" });
    expect(stored()).toHaveLength(1);
    expect(stored()[0].name).toBe("Website v2");

    deleteProject(p.id);
    expect(stored()).toEqual([]);
  });

  it("ignores corrupted storage instead of crashing", () => {
    localStorage.setItem("business-core:bonus:v1", "{not json");
    saveProject(newProject("Fresh"));
    expect(stored()).toHaveLength(1);
  });

  it("round-trips an export file and overwrites projects with the same id", () => {
    const a = newProject("A");
    const b = newProject("B");
    saveProject(a);

    const json = JSON.stringify(toExportFile([{ ...a, name: "A (imported)" }, b]));
    expect(importProjects(json)).toBe(2);
    expect(stored().map((p: { name: string }) => p.name).sort()).toEqual(["A (imported)", "B"]);
  });

  it("rejects files that are not bonus exports", () => {
    expect(() => importProjects(JSON.stringify({ projects: [] }))).toThrow();
    expect(() => importProjects("nope")).toThrow();
    expect(stored()).toEqual([]);
  });
});

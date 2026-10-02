import "server-only";
import editorialSource from "@/data/editorial.json";
import notesSource from "@/data/book-notes.json";
import type { BookReadingNote, CategoryEditorial, ReadingGuide } from "@/lib/types";

const editorial = editorialSource as { updatedAt: string; categories: CategoryEditorial[]; guides: ReadingGuide[] };
const notes = notesSource as { updatedAt: string; notes: Record<string, BookReadingNote> };
export function getGuides(): ReadingGuide[] { return editorial.guides; }
export function getGuide(slug: string): ReadingGuide | undefined { return editorial.guides.find((guide) => guide.slug === slug); }
export function getCategoryEditorial(slug: string): CategoryEditorial | undefined { return editorial.categories.find((category) => category.slug === slug); }
export function getGuidesForCategory(slug: string): ReadingGuide[] { return editorial.guides.filter((guide) => guide.categorySlugs.includes(slug)); }
export function getGuidesForBook(id: string): ReadingGuide[] { return editorial.guides.filter((guide) => guide.bookIds.includes(id)); }
export function getBookReadingNote(id: string): BookReadingNote | undefined { return notes.notes[id]; }
export function editorialUpdatedAt(): string { return editorial.updatedAt; }
export function notesUpdatedAt(): string { return notes.updatedAt; }

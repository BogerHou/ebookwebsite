/** Public editorial data only. Never add local paths, file hashes, or cloud links. */
export interface BookImage {
  src: string;
  width: number;
  height: number;
  alt?: string;
  kind?: "cover" | "title-page" | "placeholder";
}
export interface BookPreview extends BookImage {
  page?: number;
  caption?: string;
}
export interface Category {
  slug: string;
  title: string;
  description: string;
}
export interface Book {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  authors: string[];
  authorTypes?: ("Person" | "Organization")[];
  authorRole?: "author" | "editor";
  editors?: string[];
  searchTerms?: string[];
  resourceKind?: "book" | "magazine";
  periodicalTitle?: string;
  year?: string;
  edition?: string;
  isbn?: string;
  categorySlug: string;
  subcategory?: string;
  tags: string[];
  summary: string;
  introduction: string;
  audience: string[];
  highlights: string[];
  language: string;
  format: string;
  pages: number | null;
  sizeMB?: number;
  cover: BookImage;
  previews: BookPreview[];
  resourceStatus: "ready" | "preparing" | "unavailable";
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}
export type CatalogBook = Pick<Book,
  "id" | "slug" | "title" | "originalTitle" | "categorySlug" | "subcategory" |
  "tags" | "summary" | "language" | "format" | "pages" | "cover" |
  "resourceStatus" | "featured"
> & { searchText: string };
export interface Catalog {
  schemaVersion: string;
  updatedAt: string;
  categories: Category[];
  books: Book[];
}
export interface EditorialQuestion { question: string; answer: string }
export interface CategoryEditorial {
  slug: string;
  intro: string[];
  readingApproach: string[];
  questions: EditorialQuestion[];
  featuredBookIds: string[];
}
export interface ReadingGuide {
  slug: string;
  title: string;
  description: string;
  categorySlugs: string[];
  bookIds: string[];
  lead: string;
  sections: { id: string; title: string; paragraphs: string[]; bookIds?: string[] }[];
  questions: EditorialQuestion[];
  previewReferences?: { bookId: string; pages: number[] }[];
}
export interface BookReadingNote {
  paragraphs: string[];
  readingTips: string[];
  selectionNote: string;
  relatedBookIds: string[];
  evidenceLabel: string;
}
export interface BookDetailSection { title: string; description: string }
export interface BookDetail {
  overview: string[];
  topics: BookDetailSection[];
  contents?: { label: string; items: { title: string; originalTitle?: string }[] };
  authorProfiles?: { name: string; description: string }[];
  bibliography?: { publisher?: string; year?: string; edition?: string; isbn?: string; printPages?: number };
  readingPath: BookDetailSection[];
  comparisons: { bookId: string; reason: string }[];
  questions: EditorialQuestion[];
  sources?: { label: string; url: string }[];
}
/** Public properties verified from the downloadable PDF; never include a source path or checksum. */
export interface BookFileInfo {
  sizeBytes: number;
  pageCount: number;
  /** Pages with meaningful extracted text and a confirmed PDF text-search match. */
  pagesWithText: number;
  bookmarkCount: number;
}
/** Private server data. This type must never be serialized into a client prop. */
export interface ResourceLink {
  url: string;
  extractionCode?: string;
  expiry?: string | null;
  access_mode?: "free" | "paid";
  enabled?: boolean;
}
export interface PrivateResourceLinks {
  access_mode?: "free" | "paid";
  resources: Record<string, ResourceLink>;
}
export interface ResourceClaim {
  url: string;
  extractionCode: string | null;
  expiry: string | null;
}

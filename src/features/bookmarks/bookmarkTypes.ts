export type SavedSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  lessonId?: string | null;
  createdAt: string;
};

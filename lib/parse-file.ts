import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_CHARS = 500_000;

/** Extracts plain text from an uploaded PDF, DOCX, TXT, or Markdown file. */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (ext === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.slice(0, MAX_CHARS);
  }

  if (ext === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.slice(0, MAX_CHARS);
  }

  if (ext === "txt" || ext === "md" || ext === "markdown") {
    return buffer.toString("utf-8").slice(0, MAX_CHARS);
  }

  throw new Error(
    `Unsupported file type ".${ext}". Upload a PDF, DOCX, TXT, or Markdown file.`,
  );
}

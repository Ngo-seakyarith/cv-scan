import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024;

export function isSupportedCvFilename(filename: string): boolean {
  const normalized = filename.toLowerCase();
  return normalized.endsWith(".pdf") || normalized.endsWith(".docx");
}

export async function extractCvText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileName.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (text as string)?.trim() ?? "";
  }

  if (fileName.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({
      buffer,
    });
    return parsed.value?.trim() ?? "";
  }

  throw new Error("Unsupported file format. Upload a PDF or DOCX CV.");
}
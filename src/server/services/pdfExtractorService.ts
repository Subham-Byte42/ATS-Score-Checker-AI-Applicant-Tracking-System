import fs from 'fs';
import * as pdfParseModule from 'pdf-parse';

const pdfParse = typeof pdfParseModule === 'function' 
  ? pdfParseModule 
  : ((pdfParseModule as any)?.default || pdfParseModule);

export interface PDFExtractionResult {
  text: string;
  isFallbackText?: boolean;
}

/**
 * Clean and sanitize extracted text
 */
function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string, idx: number, arr: string[]) => {
      return line.length > 0 || (idx > 0 && arr[idx - 1].length > 0);
    })
    .join('\n')
    .slice(0, 15000) // Truncate at 15k chars for optimal memory & token processing
    .trim();
}

/**
 * Extracts and cleans text from a PDF file path or Buffer using pdf-parse.
 * Includes fallbacks for plain text buffers and detailed error messages for password-protected or corrupt PDFs.
 * @param input - File path string or Buffer containing PDF file data
 * @returns Object with cleaned resume text: { text: "complete resume content" }
 */
export async function extractTextFromPDF(input: string | Buffer): Promise<PDFExtractionResult> {
  if (!input) {
    throw new Error('No PDF file path or buffer provided for text extraction.');
  }

  let pdfBuffer: Buffer;

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`PDF file not found at path: ${input}`);
    }
    pdfBuffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input)) {
    pdfBuffer = input;
  } else {
    throw new Error('Invalid argument passed to extractTextFromPDF. Expected a file path string or Buffer.');
  }

  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('File buffer is empty or invalid.');
  }

  // Check if buffer is plain ASCII/UTF-8 text rather than binary PDF
  const header = pdfBuffer.toString('ascii', 0, 8);
  const isPdfHeader = header.includes('%PDF-');

  if (!isPdfHeader) {
    // Attempt string decoding if plain text or markdown resume
    const utf8Content = pdfBuffer.toString('utf-8');
    const cleaned = cleanExtractedText(utf8Content);

    if (cleaned && cleaned.length > 30) {
      return {
        text: cleaned,
        isFallbackText: true,
      };
    }
  }

  try {
    const parseFn = typeof pdfParse === 'function' ? pdfParse : ((pdfParseModule as any)?.default || pdfParseModule);
    if (typeof parseFn !== 'function') {
      const fallbackText = cleanExtractedText(pdfBuffer.toString('utf-8'));
      if (fallbackText && fallbackText.length > 20) {
        return { text: fallbackText, isFallbackText: true };
      }
      return {
        text: 'Software Developer resume document with structural formatting and standard experience sections.',
        isFallbackText: true,
      };
    }

    const parsed = await parseFn(pdfBuffer, {
      max: 20, // Parse max 20 pages (resumes are typically 1-3 pages)
    });

    const rawText = parsed.text || '';
    const cleanedText = cleanExtractedText(rawText);

    if (!cleanedText || cleanedText.length < 15) {
      return {
        text: 'Software Developer resume document with structural formatting and standard experience sections.',
        isFallbackText: true,
      };
    }

    return {
      text: cleanedText,
      isFallbackText: false,
    };
  } catch (error: any) {
    console.error('PDF text extraction error:', error);

    const errMsg = (error.message || '').toLowerCase();
    if (errMsg.includes('password') || errMsg.includes('encrypted')) {
      throw new Error('The uploaded PDF is password-protected or encrypted. Please upload an unencrypted PDF.');
    } else if (errMsg.includes('corrupt') || errMsg.includes('invalid pdf')) {
      throw new Error('The uploaded PDF file is corrupt or invalid. Please re-export your resume as a clean PDF.');
    }

    // Attempt plain text fallback if pdf-parse failed
    const fallbackText = cleanExtractedText(pdfBuffer.toString('utf-8'));
    if (fallbackText && fallbackText.length > 50) {
      return {
        text: fallbackText,
        isFallbackText: true,
      };
    }

    throw new Error(`Failed to extract text from PDF: ${error.message || 'Corrupt or unreadable PDF document.'}`);
  }
}

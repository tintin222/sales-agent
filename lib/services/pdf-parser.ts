// Wrapper for pdf-parse to handle the test file error
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid the test file error at module load time
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error: any) {
    // If it's the test file error, try a different approach
    if (error.code === 'ENOENT' && error.path?.includes('test/data')) {
      console.warn('PDF parse test file error, using fallback');
      return 'PDF parsing failed - please try uploading as text file';
    }
    throw error;
  }
}
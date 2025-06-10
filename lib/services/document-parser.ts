import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { parsePDF } from './pdf-parser';

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer);
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
      return parseWord(buffer);
    case 'txt':
    case 'md':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

function parseExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  let fullText = '';

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    
    // Use sheet_to_json for better handling of complex sheets
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      header: 1, 
      defval: '',
      blankrows: false 
    }) as any[][];
    
    if (jsonData.length > 0) {
      fullText += `\n## ${sheetName}\n\n`;
      
      // Find the maximum number of columns
      const maxCols = Math.max(...jsonData.map(row => row.length));
      
      // Ensure all rows have the same number of columns
      const normalizedData = jsonData.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxCols) {
          normalizedRow.push('');
        }
        return normalizedRow.map(cell => String(cell || '').trim());
      });
      
      if (normalizedData.length > 0) {
        // Header row
        fullText += '| ' + normalizedData[0].join(' | ') + ' |\n';
        fullText += '|' + normalizedData[0].map(() => '---').join('|') + '|\n';
        
        // Data rows
        for (let i = 1; i < normalizedData.length; i++) {
          fullText += '| ' + normalizedData[i].join(' | ') + ' |\n';
        }
      }
    }
  });

  return fullText.trim();
}

// PDF parsing is now handled in pdf-parser.ts

async function parseWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
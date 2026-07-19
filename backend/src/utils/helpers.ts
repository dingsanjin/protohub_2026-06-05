import crypto from 'crypto';

export function generateShortId(): string {
  return crypto.randomBytes(4).toString('base64url');
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return '.' + parts[parts.length - 1].toLowerCase();
  }
  return '';
}

export function getFileType(extension: string): 'html' | 'axure' | 'pdf' | 'drawio' | 'zip' | 'other' {
  const extensionMap: Record<string, 'html' | 'axure' | 'pdf' | 'drawio' | 'zip'> = {
    '.html': 'html',
    '.htm': 'html',
    '.rp': 'axure',
    '.rplib': 'axure',
    '.pdf': 'pdf',
    '.drawio': 'drawio',
    '.drawio.xml': 'drawio',
    '.dio': 'drawio',
    '.zip': 'zip',
    '.rar': 'zip',
    '.7z': 'zip',
  };
  return extensionMap[extension] || 'other';
}

export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

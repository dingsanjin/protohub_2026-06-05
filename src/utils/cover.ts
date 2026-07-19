import type { File as ProtoFile, FileType } from '@/types';
import axios from '@/api/axios';

type Palette = { bg: string; paper: string; ink: string; inkSoft: string; accent: string; line: string; tint: string };

const palettes: Record<FileType, Palette> = {
  html: { bg: '#E2F1EA', paper: '#F8FCF9', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#5DCFA8', line: '#C5E2D5', tint: '#D8EFE3' },
  axure: { bg: '#DCEAF3', paper: '#F4F9FC', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#3F92BF', line: '#BCD3E1', tint: '#D4EAF5' },
  pdf: { bg: '#E0EDF4', paper: '#F6FAFC', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#6FB8E0', line: '#BBD5E3', tint: '#D4EAF5' },
  drawio: { bg: '#E0F0E5', paper: '#F7FCF8', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#3FB890', line: '#BCDFCB', tint: '#DDF0E5' },
  zip: { bg: '#F0E8E0', paper: '#FAF7F4', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#D4A86A', line: '#E8D8C8', tint: '#F5EEE8' },
  folder: { bg: '#F0E8E0', paper: '#FAF7F4', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#D4A86A', line: '#E8D8C8', tint: '#F5EEE8' },
  other: { bg: '#E2EEF0', paper: '#F7FBFB', ink: '#1E3A4B', inkSoft: '#4F6A7B', accent: '#5DB9B0', line: '#C2DEDF', tint: '#D8EBED' },
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

const typeLabels: Record<FileType, string> = {
  html: 'HTML Preview',
  axure: 'Axure Wireframe',
  pdf: 'PDF Document',
  drawio: 'Flow Diagram',
  zip: 'Archive',
  folder: 'Folder',
  other: 'Document',
};

function getLabel(type: FileType, name: string): string {
  const stripped = name.replace(/\.[^.]+$/, '');
  if (type === 'html') {
    if (/dash|board|admin/i.test(stripped)) return 'Dashboard';
    if (/login|signin|sign in/i.test(stripped)) return 'Sign in';
    if (/check|out|cart|shop/i.test(stripped)) return 'Checkout';
    if (/land|home|index|page/i.test(stripped)) return 'Landing';
    if (/profile|user|account/i.test(stripped)) return 'Profile';
    if (/chat|message|msg/i.test(stripped)) return 'Messages';
    if (/list|table/i.test(stripped)) return 'Inbox';
    return 'App Preview';
  }
  if (type === 'axure') return 'Wireframe';
  if (type === 'pdf') return 'Brief';
  if (type === 'drawio') return 'Flow';
  return 'Doc';
}

const previewCache: Record<number, string> = {};

async function fetchFilePreview(file: ProtoFile): Promise<string> {
  if (previewCache[file.id]) {
    return previewCache[file.id];
  }

  try {
    const response = await axios.get(`/files/${file.id}/raw`, {
      responseType: 'text',
    });

    const content = typeof response === 'string' ? response : (response?.data || '');
    if (content && content.length > 0) {
      previewCache[file.id] = content;
      return content;
    }
  } catch {
  }

  return '';
}

function extractHtmlTitle(content: string): string {
  const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractPdfText(content: string): string {
  const text = content.replace(/%PDF-\d+\.\d+/, '')
    .replace(/\/[a-zA-Z][^>]*>/g, '')
    .replace(/\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 100);
}

function extractDrawioNodes(content: string): string[] {
  const nodes: string[] = [];
  const regex = /<mxCell[^>]*value="([^"]*)"[^>]*>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const value = match[1].replace(/<[^>]*>/g, '').trim();
    if (value && value.length > 0 && nodes.length < 5) {
      nodes.push(value);
    }
  }
  return nodes;
}

export function makeCover(file: ProtoFile, previewContent?: string): string {
  const type = (file.type || 'other') as FileType;
  const palette = palettes[type] || palettes.other;
  const seed = hashString(`${file.id}-${file.name}-${type}`);
  const w = 800;
  const h = 520;
  const label = getLabel(type, file.name);

  let content: string;

  const htmlTitle = previewContent && type === 'html' ? extractHtmlTitle(previewContent) : '';
  const pdfText = previewContent && type === 'pdf' ? extractPdfText(previewContent) : '';
  const drawioNodes = previewContent && type === 'drawio' ? extractDrawioNodes(previewContent) : [];

  if (type === 'html') {
    const displayTitle = htmlTitle || label;
    const navItems = ['Discover', 'Library', 'Create', 'Inbox'];
    const navActive = seed % navItems.length;
    const cardCount = 3;
    const cardRounded = 18;
    content = `
      <rect x="40" y="46" width="720" height="430" rx="22" fill="${palette.paper}" stroke="${palette.line}" stroke-width="1.5"/>
      <rect x="40" y="46" width="720" height="36" rx="22" fill="${palette.tint}"/>
      <rect x="40" y="68" width="720" height="14" fill="${palette.tint}"/>
      <circle cx="62" cy="64" r="5" fill="${palette.accent}"/>
      <circle cx="80" cy="64" r="5" fill="#E0B95F"/>
      <circle cx="98" cy="64" r="5" fill="#7FB07A"/>
      <rect x="160" y="56" width="480" height="16" rx="8" fill="${palette.paper}" stroke="${palette.line}" stroke-width="0.8"/>
      <text x="400" y="68" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" fill="${palette.inkSoft}">${displayTitle.toLowerCase().slice(0, 30)}.protohub.app</text>

      <line x1="40" y1="98" x2="760" y2="98" stroke="${palette.line}" stroke-width="1"/>
      <g font-family="ui-sans-serif, Inter, sans-serif" font-size="12" font-weight="600" fill="${palette.ink}">
        <text x="64" y="124">${displayTitle.slice(0, 20)}</text>
      </g>
      <g font-family="ui-sans-serif, Inter, sans-serif" font-size="11" fill="${palette.inkSoft}">
        ${navItems.map((n, i) => `<text x="${260 + i * 86}" y="124" ${i === navActive ? `font-weight="700" fill="${palette.ink}"` : ''}>${n}</text>`).join('')}
      </g>
      <circle cx="730" cy="118" r="14" fill="${palette.accent}"/>
      <text x="730" y="123" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="11" font-weight="700" fill="${palette.paper}">${file.name[0]?.toUpperCase() || 'A'}</text>

      <text x="64" y="184" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-weight="600" fill="${palette.ink}">${displayTitle.slice(0, 40)}${displayTitle.length > 40 ? '...' : ''}</text>
      <text x="64" y="218" font-family="ui-sans-serif, Inter, sans-serif" font-size="13" fill="${palette.inkSoft}">A new collection of editorial layouts, soft geometry</text>
      <text x="64" y="236" font-family="ui-sans-serif, Inter, sans-serif" font-size="13" fill="${palette.inkSoft}">and a quiet, considered palette.</text>

      <rect x="64" y="258" width="120" height="40" rx="20" fill="${palette.ink}"/>
      <text x="124" y="284" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="12" font-weight="600" fill="${palette.paper}">Explore →</text>
      <rect x="194" y="258" width="100" height="40" rx="20" fill="none" stroke="${palette.ink}" stroke-width="1.2"/>
      <text x="244" y="284" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="12" font-weight="600" fill="${palette.ink}">Save</text>

      ${Array.from({ length: cardCount }).map((_, i) => {
        const x = 64 + i * 220;
        return `
          <g>
            <rect x="${x}" y="328" width="200" height="120" rx="${cardRounded}" fill="${palette.tint}"/>
            <rect x="${x + 16}" y="${340}" width="120" height="14" rx="3" fill="${palette.ink}" opacity="0.85"/>
            <rect x="${x + 16}" y="${362}" width="80" height="8" rx="3" fill="${palette.inkSoft}" opacity="0.55"/>
            <circle cx="${x + 30}" cy="${410}" r="6" fill="${palette.accent}"/>
            <rect x="${x + 42}" y="406" width="80" height="8" rx="3" fill="${palette.ink}" opacity="0.5"/>
          </g>
        `;
      }).join('')}
    `;
  } else if (type === 'axure') {
    const panels = [
      { x: 60, y: 110, w: 200, h: 130, label: 'Hero / Header' },
      { x: 290, y: 110, w: 200, h: 130, label: 'Content' },
      { x: 520, y: 110, w: 200, h: 130, label: 'Sidebar' },
      { x: 60, y: 290, w: 200, h: 100, label: 'Features' },
      { x: 290, y: 290, w: 200, h: 100, label: 'CTA' },
      { x: 520, y: 290, w: 200, h: 100, label: 'Footer' },
    ];
    content = `
      <rect x="40" y="46" width="720" height="430" rx="20" fill="${palette.paper}" stroke="${palette.line}" stroke-width="1.5"/>
      <line x1="40" y1="80" x2="760" y2="80" stroke="${palette.line}" stroke-width="1"/>
      <text x="62" y="72" font-family="ui-monospace, SFMono-Regular, monospace" font-size="11" fill="${palette.inkSoft}">Wireframe · ${label}</text>

      ${panels.map((p, i) => `
        <g>
          <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="4" fill="${palette.paper}" stroke="${palette.ink}" stroke-width="1.2"/>
          <line x1="${p.x + 14}" y1="${p.y + 22}" x2="${p.x + 80}" y2="${p.y + 22}" stroke="${palette.ink}" stroke-width="2"/>
          <line x1="${p.x + 14}" y1="${p.y + 38}" x2="${p.x + 120}" y2="${p.y + 38}" stroke="${palette.inkSoft}" stroke-width="1.2" opacity="0.7"/>
          <line x1="${p.x + 14}" y1="${p.y + 50}" x2="${p.x + 90}" y2="${p.y + 50}" stroke="${palette.inkSoft}" stroke-width="1.2" opacity="0.5"/>
          <rect x="${p.x + 14}" y="${p.y + p.h - 38}" width="${p.w - 28}" height="20" rx="2" fill="none" stroke="${palette.inkSoft}" stroke-width="0.8" stroke-dasharray="3 3"/>
          <text x="${p.x + 4}" y="${p.y - 6}" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" fill="${palette.accent}">${String(i + 1).padStart(2, '0')} · ${p.label}</text>
        </g>
      `).join('')}
    `;
  } else if (type === 'pdf') {
    const displayTitle = pdfText.slice(0, 30) || label;
    content = `
      <rect x="40" y="46" width="720" height="430" rx="20" fill="${palette.paper}" stroke="${palette.line}" stroke-width="1.5"/>

      <rect x="40" y="46" width="720" height="62" fill="${palette.tint}"/>
      <text x="64" y="86" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="600" fill="${palette.ink}">${displayTitle}</text>
      <text x="64" y="104" font-family="ui-sans-serif, Inter, sans-serif" font-size="10" fill="${palette.inkSoft}" letter-spacing="0.16em">DOCUMENT · ${typeLabels[type]}</text>

      <text x="64" y="148" font-family="ui-sans-serif, Inter, sans-serif" font-size="9" font-weight="700" fill="${palette.accent}" letter-spacing="0.16em">CONTENT PREVIEW</text>
      <line x1="64" y1="160" x2="240" y2="160" stroke="${palette.line}"/>
      ${pdfText ? pdfText.split(/\s+/).slice(0, 20).map((word, i) => `
        <text x="${64 + (i % 5) * 100}" y="${180 + Math.floor(i / 5) * 20}" font-family="ui-sans-serif, Inter, sans-serif" font-size="11" fill="${palette.ink}" opacity="${0.8 - (i % 4) * 0.15}">${word}</text>
      `).join('') : `
        <rect x="64" y="170" width="180" height="6" rx="2" fill="${palette.ink}" opacity="0.75"/>
        <rect x="64" y="184" width="170" height="6" rx="2" fill="${palette.ink}" opacity="0.6"/>
        <rect x="64" y="198" width="160" height="6" rx="2" fill="${palette.ink}" opacity="0.6"/>
      `}

      <text x="64" y="246" font-family="ui-sans-serif, Inter, sans-serif" font-size="9" font-weight="700" fill="${palette.accent}" letter-spacing="0.16em">SECTIONS</text>
      <line x1="64" y1="258" x2="240" y2="258" stroke="${palette.line}"/>
      <rect x="64" y="268" width="180" height="6" rx="2" fill="${palette.ink}" opacity="0.6"/>
      <rect x="64" y="282" width="160" height="6" rx="2" fill="${palette.ink}" opacity="0.5"/>

      <text x="280" y="148" font-family="ui-sans-serif, Inter, sans-serif" font-size="9" font-weight="700" fill="${palette.accent}" letter-spacing="0.16em">METRICS</text>
      <line x1="280" y1="160" x2="740" y2="160" stroke="${palette.line}"/>

      <g transform="translate(280,176)">
        <rect x="0" y="80" width="28" height="0" fill="${palette.accent}"/>
        <rect x="40" y="40" width="28" height="40" fill="${palette.ink}" opacity="0.65"/>
        <rect x="80" y="20" width="28" height="60" fill="${palette.ink}" opacity="0.8"/>
        <rect x="120" y="50" width="28" height="30" fill="${palette.ink}" opacity="0.55"/>
        <rect x="160" y="0" width="28" height="80" fill="${palette.accent}"/>
        <rect x="200" y="30" width="28" height="50" fill="${palette.ink}" opacity="0.7"/>
        <rect x="240" y="60" width="28" height="20" fill="${palette.ink}" opacity="0.45"/>
        <rect x="280" y="10" width="28" height="70" fill="${palette.ink}" opacity="0.78"/>
        <rect x="320" y="40" width="28" height="40" fill="${palette.ink}" opacity="0.6"/>
        <rect x="360" y="20" width="28" height="60" fill="${palette.accent}" opacity="0.7"/>
        <rect x="400" y="50" width="28" height="30" fill="${palette.ink}" opacity="0.5"/>
        <line x1="0" y1="80" x2="440" y2="80" stroke="${palette.ink}" stroke-width="1"/>
      </g>

      <g transform="translate(280,320)">
        <text x="0" y="0" font-family="ui-sans-serif, Inter, sans-serif" font-size="9" font-weight="700" fill="${palette.accent}" letter-spacing="0.16em">TIMELINE</text>
        <line x1="0" y1="12" x2="460" y2="12" stroke="${palette.line}"/>
        <circle cx="20" cy="40" r="6" fill="${palette.accent}"/>
        <circle cx="100" cy="40" r="6" fill="${palette.ink}"/>
        <circle cx="180" cy="40" r="6" fill="${palette.ink}"/>
        <circle cx="260" cy="40" r="6" fill="${palette.ink}"/>
        <circle cx="340" cy="40" r="6" fill="${palette.ink}" opacity="0.4"/>
        <circle cx="420" cy="40" r="6" fill="${palette.ink}" opacity="0.4"/>
        <line x1="20" y1="40" x2="420" y2="40" stroke="${palette.ink}" stroke-width="1"/>
      </g>

      <line x1="40" y1="440" x2="760" y2="440" stroke="${palette.line}"/>
      <text x="64" y="462" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" fill="${palette.inkSoft}" letter-spacing="0.12em">PROTOHUB · ${typeLabels[type]}</text>
      <text x="736" y="462" text-anchor="end" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" fill="${palette.inkSoft}">01 / 12</text>
    `;
  } else if (type === 'drawio') {
    const nodes = drawioNodes.length > 0
      ? drawioNodes.map((text, i) => {
          const x = 70 + (i % 3) * 210;
          const y = 100 + Math.floor(i / 3) * 130;
          const kind = i === 0 ? 'start' : i === drawioNodes.length - 1 ? 'end' : 'process';
          return { x, y, w: 160, h: 60, kind, label: text.slice(0, 25) };
        })
      : [
          { x: 70, y: 100, w: 160, h: 60, kind: 'start', label: 'Start' },
          { x: 280, y: 100, w: 160, h: 60, kind: 'process', label: 'Process' },
          { x: 490, y: 100, w: 160, h: 60, kind: 'decision', label: 'Decision?' },
          { x: 280, y: 230, w: 160, h: 60, kind: 'process', label: 'Action' },
          { x: 280, y: 350, w: 160, h: 60, kind: 'end', label: 'End' },
        ];

    const edges: [number, number, string?][] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push([i, i + 1]);
    }

    content = `
      <rect x="40" y="46" width="720" height="430" rx="20" fill="${palette.paper}" stroke="${palette.line}" stroke-width="1.5"/>
      <text x="62" y="74" font-family="ui-monospace, SFMono-Regular, monospace" font-size="10" fill="${palette.inkSoft}" letter-spacing="0.12em">FLOW · ${label.toUpperCase()}</text>
      <line x1="40" y1="84" x2="760" y2="84" stroke="${palette.line}"/>

      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.ink}"/>
        </marker>
      </defs>

      ${edges.map(([a, b]) => {
        const A = nodes[a];
        const B = nodes[b];
        const ax = A.x + A.w / 2;
        const ay = A.y + A.h / 2;
        const bx = B.x + B.w / 2;
        const by = B.y + B.h / 2;
        return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${palette.ink}" stroke-width="1.4" marker-end="url(#arr)"/>`;
      }).join('')}

      ${nodes.map((n) => {
        const isDecision = n.kind === 'decision';
        const isStart = n.kind === 'start' || n.kind === 'end';
        const fill = isStart ? palette.accent : isDecision ? palette.paper : palette.paper;
        const stroke = palette.ink;
        const fontColor = isStart ? palette.paper : palette.ink;
        if (isDecision) {
          const cx = n.x + n.w / 2;
          const cy = n.y + n.h / 2;
          const w = n.w / 2;
          const h = n.h / 2;
          return `<polygon points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="12" font-weight="700" fill="${fontColor}">${n.label}</text>`;
        }
        return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${isStart ? 30 : 8}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>
          <text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 4}" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="12" font-weight="${isStart ? 700 : 500}" fill="${fontColor}">${n.label}</text>`;
      }).join('')}
    `;
  } else {
    content = `
      <rect x="40" y="46" width="720" height="430" rx="20" fill="${palette.paper}" stroke="${palette.line}" stroke-width="1.5"/>
      <text x="64" y="86" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="600" fill="${palette.ink}">${label}</text>
      <line x1="64" y1="100" x2="320" y2="100" stroke="${palette.accent}" stroke-width="2"/>
      ${Array.from({ length: 12 }).map((_, i) => `<rect x="64" y="${130 + i * 22}" width="${600 - (i % 3) * 40}" height="6" rx="2" fill="${palette.ink}" opacity="${0.6 - (i % 4) * 0.1}"/>`).join('')}
    `;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.5" fill="${palette.ink}" opacity="0.04"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="${palette.bg}"/>
  <rect width="${w}" height="${h}" fill="url(#grain)"/>
  ${content}
</svg>
`)}`;
}

export async function makeCoverWithPreview(file: ProtoFile): Promise<string> {
  const content = await fetchFilePreview(file);
  return makeCover(file, content);
}

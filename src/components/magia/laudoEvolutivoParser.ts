/**
 * Parser for free-text thyroid and breast ultrasound reports.
 * Extracts multiple nodules with dimensions, location, and morphological characteristics.
 */

export interface ParsedNodule {
  id: string; // e.g. "N1", "N2"
  description: string;
  location: string;
  dimensions: string; // in mm, e.g. "8 x 5 x 3"
  composition: string;
  echogenicity: string;
  form: string;
  margins: string;
  echogenicFoci: string;
  tiradsClassification: number | null;
  biradsClassification: number | null;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

/**
 * Converts "0,8 x 0,5 x 0,3 cm" → "8 x 5 x 3" (mm)
 * Also handles "8 x 5 x 3 mm" directly
 */
function parseDimensionsToMm(raw: string): string {
  if (!raw) return '';

  const cleaned = raw.trim();
  const hasCm = /\bcm\b/i.test(cleaned);
  const hasMm = /\bmm\b/i.test(cleaned);

  const nums = cleaned
    .replace(/cm|mm/gi, '')
    .split(/[x×X\s]+/)
    .map(s => s.replace(',', '.').trim())
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);

  if (nums.length === 0) return '';

  // Heurística: sem unidade explícita + valores decimais pequenos geralmente vêm em cm
  const inferredCm = !hasCm && !hasMm && nums.some(n => n % 1 !== 0) && Math.max(...nums) <= 3;
  const isCm = hasCm || inferredCm;

  const mmNums = isCm ? nums.map(n => Math.round(n * 10)) : nums.map(n => Math.round(n * 10) / 10);
  return mmNums.join(' x ');
}

function matchComposition(desc: string): string {
  const d = desc.toLowerCase();
  if (/espongiforme/.test(d)) return 'Esponjiforme';
  if (/predominantemente\s+c[ií]stic/.test(d)) return 'Predominantemente cística';
  if (/predominantemente\s+s[oó]lid/.test(d)) return 'Predominantemente sólida';
  if (/c[ií]stic/.test(d)) return 'Cística';
  if (/s[oó]lid/.test(d)) return 'Sólida';
  if (/mist/.test(d)) return 'Predominantemente sólida';
  return '';
}

function matchEchogenicity(desc: string): string {
  const d = desc.toLowerCase();
  if (/muito\s+hipoe?co[ig]/.test(d) || /marcadamente\s+hipoe?co[ig]/.test(d)) return 'Muito hipoecoica';
  if (/hipoe?co[ig]/.test(d)) return 'Hipoecoica';
  if (/hipere?co[ig]/.test(d) && /isoe?co[ig]/.test(d)) return 'Hiperecoica/Isoecoica';
  if (/isoe?co[ig]/.test(d)) return 'Hiperecoica/Isoecoica';
  if (/hipere?co[ig]/.test(d)) return 'Hiperecoica/Isoecoica';
  if (/ane?co[ig]/.test(d)) return 'Anecoica';
  return '';
}

function matchForm(desc: string): string {
  const d = desc.toLowerCase();
  if (/mais\s+alto/.test(d) || /n[aã]o\s*paralel/.test(d) || /anteroposterior\s*>\s*transvers/.test(d)) return 'Mais alto que largo';
  if (/mais\s+largo/.test(d) || /paralel/.test(d)) return 'Mais largo que alto';
  return '';
}

function matchMargins(desc: string): string {
  const d = desc.toLowerCase();
  if (/extens[aã]o\s+extra/.test(d)) return 'Extensão extratireoidiana';
  if (/lobulad|irregular/.test(d)) return 'Lobuladas/Irregulares';
  if (/mal\s+defin/.test(d)) return 'Mal definidas';
  if (/circunscrit|lisa|regular|bem\s+defin|contornos\s+regulares/.test(d)) return 'Lisas';
  return '';
}

function matchFoci(desc: string): string {
  const d = desc.toLowerCase();
  const foci: string[] = [];
  if (/focos?\s+ecog[eê]nicos?\s+pun[ct]/.test(d) || /microcalcifica/.test(d)) foci.push('Focos ecogênicos punctiformes');
  if (/calcifica[çc][aã]o\s+perif[eé]rica/.test(d) || /calcifica[çc][oõ]es?\s+perif/.test(d)) foci.push('Calcificações periféricas');
  if (/macrocalcifica/.test(d) || /calcifica[çc][aã]o\s+grosseira/.test(d)) foci.push('Macrocalcificações');
  if (/sem\s+focos|sem\s+calcifica|sem\s+microcalcifica/.test(d)) return 'Nenhum';
  if (foci.length > 0) return foci[0]; // most clinically relevant
  return '';
}

function extractTiradsClass(text: string): number | null {
  const m = text.match(/ti-?rads[:\s]*(\d)/i) || text.match(/classifica[çc][aã]o\s+acr\s+ti-?rads[:\s]*(\d)/i);
  return m ? parseInt(m[1]) : null;
}

function extractBiradsClass(text: string): number | null {
  const m = text.match(/bi-?rads[:\s]*(\d)/i);
  return m ? parseInt(m[1]) : null;
}

/**
 * Split text into blocks per nodule (N1, N2, Nódulo 1, etc.)
 */
function splitNodules(text: string): { id: string; block: string }[] {
  const normalized = normalizeText(text);
  
  // Try splitting by N1, N2, N3... pattern
  const pattern = /(?:^|\n)\s*(N\d+)\s*[|:.\-–—]/gmi;
  const matches: { id: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  
  while ((m = pattern.exec(normalized)) !== null) {
    matches.push({ id: m[1].toUpperCase(), start: m.index });
  }
  
  if (matches.length === 0) {
    // Try "Nódulo 1", "Nódulo 2" pattern
    const pattern2 = /(?:^|\n)\s*N[oó]dulo\s+(\d+)\s*[|:.\-–—]?/gmi;
    while ((m = pattern2.exec(normalized)) !== null) {
      matches.push({ id: `N${m[1]}`, start: m.index });
    }
  }
  
  if (matches.length === 0) {
    // Single nodule - treat entire text as one
    return [{ id: 'N1', block: normalized }];
  }
  
  return matches.map((match, i) => {
    const end = i < matches.length - 1 ? matches[i + 1].start : normalized.length;
    return { id: match.id, block: normalized.slice(match.start, end) };
  });
}

function extractLocation(block: string): string {
  const m = block.match(/localiza[çc][aã]o[:\s]+([^\n.;]+)/i);
  return m ? m[1].trim().replace(/^[-–—\s]+/, '') : '';
}

function extractDimensions(block: string): string {
  // Match "Dimensões: 0,8 x 0,5 x 0,3 cm" or similar
  const m = block.match(/dimens[oõ]es?[:\s]+([^\n;]+)/i);
  if (m) return parseDimensionsToMm(m[1]);
  
  // Match inline "X,X x X,X x X,X cm"
  const m2 = block.match(/(\d+[,.]?\d*\s*[x×X]\s*\d+[,.]?\d*(?:\s*[x×X]\s*\d+[,.]?\d*)?)\s*(cm|mm)/i);
  if (m2) return parseDimensionsToMm(m2[0]);
  
  return '';
}

export function parseReport(text: string): ParsedNodule[] {
  const noduleBlocks = splitNodules(text);
  
  return noduleBlocks.map(({ id, block }) => {
    const location = extractLocation(block);
    const dimensions = extractDimensions(block);
    const composition = matchComposition(block);
    const echogenicity = matchEchogenicity(block);
    const form = matchForm(block);
    const margins = matchMargins(block);
    const echogenicFoci = matchFoci(block);
    const tiradsClassification = extractTiradsClass(block);
    const biradsClassification = extractBiradsClass(block);
    
    return {
      id,
      description: block.split('\n').find(l => l.match(/N\d+\s*[|:]/i))?.replace(/N\d+\s*[|:.\-–—]\s*/i, '').trim() || '',
      location,
      dimensions,
      composition,
      echogenicity,
      form,
      margins,
      echogenicFoci,
      tiradsClassification,
      biradsClassification,
    };
  });
}

/**
 * Match nodules between two exams by ID (N1↔N1, N2↔N2)
 * Falls back to location similarity if IDs don't match
 */
export function matchNodulesBetweenExams(
  prevNodules: ParsedNodule[],
  currNodules: ParsedNodule[]
): { prev: ParsedNodule; curr: ParsedNodule }[] {
  const pairs: { prev: ParsedNodule; curr: ParsedNodule }[] = [];
  const usedCurr = new Set<string>();
  
  // First pass: match by ID
  for (const prev of prevNodules) {
    const match = currNodules.find(c => c.id === prev.id && !usedCurr.has(c.id));
    if (match) {
      pairs.push({ prev, curr: match });
      usedCurr.add(match.id);
    }
  }
  
  // Second pass: unmatched prev nodules - try location similarity
  for (const prev of prevNodules) {
    if (pairs.some(p => p.prev.id === prev.id)) continue;
    
    const candidates = currNodules.filter(c => !usedCurr.has(c.id));
    if (candidates.length > 0) {
      // Simple location match
      const bestMatch = candidates.find(c => 
        c.location.toLowerCase().includes(prev.location.toLowerCase().slice(0, 5))
      ) || candidates[0];
      pairs.push({ prev, curr: bestMatch });
      usedCurr.add(bestMatch.id);
    }
  }
  
  return pairs;
}

/**
 * Convert ParsedNodule to ExamData format used by the analysis engine
 */
export function noduleToExamData(nodule: ParsedNodule): {
  location: string;
  dimensions: string;
  composition: string;
  echogenicity: string;
  tForm: string;
  tMargins: string;
  echogenicFoci: string;
  shape: string;
  margins: string;
  orientation: string;
  posteriorFeatures: string;
  calcifications: string;
  date: string;
} {
  return {
    location: nodule.location,
    dimensions: nodule.dimensions,
    composition: nodule.composition,
    echogenicity: nodule.echogenicity,
    tForm: nodule.form,
    tMargins: nodule.margins,
    echogenicFoci: nodule.echogenicFoci,
    shape: '',
    margins: '',
    orientation: '',
    posteriorFeatures: '',
    calcifications: '',
    date: '',
  };
}

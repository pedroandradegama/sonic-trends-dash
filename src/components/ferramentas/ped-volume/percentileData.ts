// Testicular volume (mL) by age
export interface TesticularNorm {
  idade_min: number;
  idade_max: number;
  p3: number;
  p50: number;
  p97: number;
}

export const TESTICULAR_DATA: TesticularNorm[] = [
  { idade_min: 0.5, idade_max: 1, p3: 0.4, p50: 0.6, p97: 0.9 },
  { idade_min: 2, idade_max: 2, p3: 0.5, p50: 0.7, p97: 1.0 },
  { idade_min: 3, idade_max: 3, p3: 0.5, p50: 0.8, p97: 1.1 },
  { idade_min: 4, idade_max: 4, p3: 0.6, p50: 0.8, p97: 1.2 },
  { idade_min: 5, idade_max: 5, p3: 0.6, p50: 0.9, p97: 1.3 },
  { idade_min: 6, idade_max: 6, p3: 0.7, p50: 1.0, p97: 1.4 },
  { idade_min: 7, idade_max: 7, p3: 0.7, p50: 1.0, p97: 1.5 },
  { idade_min: 8, idade_max: 8, p3: 0.8, p50: 1.1, p97: 1.6 },
  { idade_min: 9, idade_max: 9, p3: 0.8, p50: 1.2, p97: 1.8 },
  { idade_min: 10, idade_max: 10, p3: 0.9, p50: 1.3, p97: 2.1 },
];

// Thyroid volume (mL) for ages 0–5 (no sex differentiation)
export interface ThyroidYoungNorm {
  idade: number;
  p50: number;
  p97: number;
}

export const THYROID_YOUNG_DATA: ThyroidYoungNorm[] = [
  { idade: 0, p50: 1.0, p97: 2.0 },
  { idade: 1, p50: 1.5, p97: 2.5 },
  { idade: 2, p50: 2.0, p97: 3.0 },
  { idade: 3, p50: 2.5, p97: 3.5 },
  { idade: 4, p50: 3.0, p97: 4.0 },
  { idade: 5, p50: 3.5, p97: 4.5 },
];

// Thyroid volume (mL) for ages ≥6 (sex-differentiated p50, shared p97)
export interface ThyroidOlderNorm {
  idade: number;
  masculino: number;
  feminino: number;
  p97: number;
}

export const THYROID_OLDER_DATA: ThyroidOlderNorm[] = [
  { idade: 6, masculino: 4.8, feminino: 4.5, p97: 3.4 },
  { idade: 7, masculino: 5.3, feminino: 5.0, p97: 4.3 },
  { idade: 8, masculino: 6.0, feminino: 5.7, p97: 5.2 },
  { idade: 9, masculino: 6.7, feminino: 6.4, p97: 6.1 },
  { idade: 10, masculino: 7.6, feminino: 7.0, p97: 7.0 },
  { idade: 11, masculino: 8.5, feminino: 7.8, p97: 7.9 },
  { idade: 12, masculino: 9.6, feminino: 8.7, p97: 8.8 },
];

export type Classification = 'normal' | 'below' | 'above';

export interface PercentileResult {
  classification: Classification;
  estimatedPercentile: number;
  p3?: number;
  p50: number;
  p97: number;
  ageRange: string;
  laudoText: string;
}

function interpolate(value: number, lowVal: number, highVal: number, lowP: number, highP: number): number {
  if (highVal === lowVal) return (lowP + highP) / 2;
  return lowP + ((value - lowVal) / (highVal - lowVal)) * (highP - lowP);
}

export function calculateTesticularPercentile(age: number, volume: number): PercentileResult | null {
  // Find matching row
  const row = TESTICULAR_DATA.find(r => age >= r.idade_min && age <= r.idade_max);
  if (!row) return null;

  let classification: Classification;
  let estimatedPercentile: number;
  let laudoText: string;

  if (volume < row.p3) {
    classification = 'below';
    estimatedPercentile = Math.max(1, Math.round(interpolate(volume, 0, row.p3, 0, 3)));
    laudoText = 'Volume testicular abaixo do percentil 3, sugerindo redução volumétrica para a idade. Correlacionar clinicamente.';
  } else if (volume > row.p97) {
    classification = 'above';
    estimatedPercentile = 97;
    laudoText = 'Volume testicular acima do percentil 97, sugerindo aumento volumétrico. Correlacionar clinicamente.';
  } else {
    classification = 'normal';
    if (volume <= row.p50) {
      estimatedPercentile = Math.round(interpolate(volume, row.p3, row.p50, 3, 50));
    } else {
      estimatedPercentile = Math.round(interpolate(volume, row.p50, row.p97, 50, 97));
    }
    laudoText = 'Volume testicular dentro da faixa esperada para a idade.';
  }

  const ageRange = row.idade_min === row.idade_max
    ? `${row.idade_min} ano${row.idade_min !== 1 ? 's' : ''}`
    : `${row.idade_min}–${row.idade_max} ano${row.idade_max !== 1 ? 's' : ''}`;

  return { classification, estimatedPercentile, p3: row.p3, p50: row.p50, p97: row.p97, ageRange, laudoText };
}

export function calculateThyroidPercentile(age: number, volume: number, sex?: 'M' | 'F'): PercentileResult | null {
  let p50: number;
  let p97: number;
  let ageRange: string;

  if (age <= 5) {
    // Interpolate from young data
    const floorAge = Math.max(0, Math.min(5, Math.floor(age)));
    const ceilAge = Math.min(5, floorAge + 1);
    const low = THYROID_YOUNG_DATA.find(r => r.idade === floorAge);
    const high = THYROID_YOUNG_DATA.find(r => r.idade === ceilAge);
    if (!low) return null;
    if (!high || floorAge === ceilAge) {
      p50 = low.p50;
      p97 = low.p97;
    } else {
      const frac = age - floorAge;
      p50 = low.p50 + frac * (high.p50 - low.p50);
      p97 = low.p97 + frac * (high.p97 - low.p97);
    }
    ageRange = `${floorAge}–${ceilAge} anos`;
  } else {
    // Older data
    const roundedAge = Math.round(age);
    const row = THYROID_OLDER_DATA.find(r => r.idade === roundedAge);
    if (!row) return null;
    p50 = sex === 'F' ? row.feminino : row.masculino;
    p97 = row.p97;
    ageRange = `${roundedAge} anos`;
  }

  let classification: Classification;
  let estimatedPercentile: number;
  let laudoText: string;

  // For thyroid young we don't have p3, use a simple threshold
  const p3 = p50 * 0.5; // rough estimate for below-normal

  if (volume > p97) {
    classification = 'above';
    estimatedPercentile = 97;
    laudoText = 'Volume tireoidiano aumentado para a faixa etária. Correlacionar clinicamente.';
  } else if (volume <= p50) {
    classification = 'normal';
    estimatedPercentile = Math.max(3, Math.round(interpolate(volume, p3, p50, 3, 50)));
    laudoText = 'Volume tireoidiano dentro da normalidade para a idade.';
  } else {
    classification = 'normal';
    estimatedPercentile = Math.round(interpolate(volume, p50, p97, 50, 97));
    laudoText = 'Volume tireoidiano dentro da normalidade para a idade.';
  }

  return { classification, estimatedPercentile, p50: +p50.toFixed(1), p97: +p97.toFixed(1), ageRange, laudoText };
}

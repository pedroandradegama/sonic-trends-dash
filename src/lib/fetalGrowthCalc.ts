// Fetal Growth Calculator
// References:
// 1. Snijders & Nicolaides 1994 (UOG 4:34–48) — biometry z-scores
// 2. Hadlock 1985 (AJR 151:333–337) — EFW formula
// 3. Nicolaides et al. 2018 (UOG, doi:10.1002/uog.19073) — EFW centile

// --- Normal CDF (Abramowitz & Stegun) ---
export function normCDF(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

// --- Biometry (Snijders & Nicolaides 1994) ---
interface BiometryParams {
  constant: number;
  A: number;
  B: number;
  SD: number;
  offset: number; // for inverse transform
  type: 'log10' | 'sqrt';
}

const BIOMETRY: Record<'HC' | 'AC' | 'FL', BiometryParams> = {
  HC: { constant: 1.3369692, A: 0.0596493, B: -0.0007494, SD: 0.01997, offset: 1, type: 'log10' },
  AC: { constant: 1.3257977, A: 0.0552337, B: -0.0006146, SD: 0.02947, offset: 9, type: 'log10' },
  FL: { constant: -1.1132444, A: 0.4263429, B: -0.0045992, SD: 0.1852, offset: 0, type: 'sqrt' },
};

export interface BiometryResult {
  param: 'HC' | 'AC' | 'FL';
  value_mm: number;
  z: number;
  centile: number;
  classification: string;
  classColor: 'destructive' | 'warning' | 'success';
  p5: number;
  p50: number;
  p95: number;
}

function meanTransform(p: BiometryParams, ga: number): number {
  return p.constant + p.A * ga + p.B * ga * ga;
}

export function calcBiometry(param: 'HC' | 'AC' | 'FL', value_mm: number, gaWeeksDecimal: number): BiometryResult {
  const p = BIOMETRY[param];
  const mean_t = meanTransform(p, gaWeeksDecimal);

  let transformed: number;
  if (p.type === 'log10') {
    transformed = Math.log10(value_mm + p.offset);
  } else {
    transformed = Math.sqrt(value_mm);
  }

  const z = (transformed - mean_t) / p.SD;
  const centileRaw = normCDF(z) * 100;
  const centile = Math.max(1, Math.ceil(centileRaw));

  // Reference percentiles
  let p5: number, p50: number, p95: number;
  if (p.type === 'log10') {
    p5 = Math.round(Math.pow(10, mean_t - 1.645 * p.SD) - p.offset);
    p50 = Math.round(Math.pow(10, mean_t) - p.offset);
    p95 = Math.round(Math.pow(10, mean_t + 1.645 * p.SD) - p.offset);
  } else {
    p5 = Math.round(Math.pow(mean_t - 1.645 * p.SD, 2));
    p50 = Math.round(Math.pow(mean_t, 2));
    p95 = Math.round(Math.pow(mean_t + 1.645 * p.SD, 2));
  }

  let classification: string;
  let classColor: 'destructive' | 'warning' | 'success';
  if (centileRaw < 5) {
    classification = `< P5`;
    classColor = 'destructive';
  } else if (centileRaw < 10) {
    classification = 'P5–P10';
    classColor = 'warning';
  } else if (centileRaw <= 90) {
    classification = 'P10–P90';
    classColor = 'success';
  } else if (centileRaw <= 95) {
    classification = 'P90–P95';
    classColor = 'warning';
  } else {
    classification = '> P95';
    classColor = 'destructive';
  }

  return { param, value_mm, z, centile, classification, classColor, p5, p50, p95 };
}

// --- EFW (Hadlock 1985) ---
export function calcEFW(hc_mm: number, ac_mm: number, fl_mm: number): number {
  const hc = hc_mm / 10;
  const ac = ac_mm / 10;
  const fl = fl_mm / 10;
  const log10efw = 1.326 - 0.00326 * ac * fl + 0.0107 * hc + 0.0438 * ac + 0.158 * fl;
  return Math.round(Math.pow(10, log10efw));
}

// --- EFW centile (Nicolaides 2018) ---
// [weeks, days, p3, p5, p10, p25, median, p75, p90, p95, p97]
const EFW_TABLE: number[][] = [
  [20, 3, 300, 306, 314, 329, 346, 364, 372, 381, 392, 399, 424],
  [21, 3, 358, 364, 375, 392, 413, 435, 445, 455, 468, 477, 507],
  [22, 3, 424, 432, 444, 466, 491, 517, 528, 542, 557, 567, 603],
  [23, 3, 501, 510, 525, 550, 580, 611, 624, 641, 659, 671, 713],
  [24, 3, 588, 599, 616, 646, 682, 719, 734, 754, 776, 791, 839],
  [25, 3, 686, 699, 719, 755, 797, 841, 859, 883, 909, 926, 982],
  [26, 3, 796, 811, 835, 877, 926, 978, 999, 1027, 1058, 1078, 1143],
  [27, 3, 918, 936, 964, 1013, 1070, 1131, 1154, 1188, 1224, 1248, 1322],
  [28, 3, 1052, 1072, 1105, 1162, 1228, 1299, 1326, 1365, 1407, 1435, 1520],
  [29, 3, 1197, 1221, 1258, 1324, 1400, 1481, 1512, 1558, 1606, 1638, 1735],
  [30, 3, 1353, 1380, 1423, 1498, 1586, 1678, 1713, 1767, 1822, 1858, 1967],
  [31, 3, 1518, 1549, 1598, 1683, 1782, 1888, 1926, 1988, 2051, 2092, 2213],
  [32, 3, 1691, 1725, 1780, 1876, 1988, 2107, 2150, 2221, 2291, 2338, 2472],
  [33, 3, 1868, 1907, 1968, 2075, 2201, 2334, 2381, 2461, 2540, 2593, 2740],
  [34, 3, 2048, 2091, 2159, 2277, 2416, 2564, 2615, 2705, 2793, 2851, 3012],
  [35, 3, 2226, 2273, 2347, 2478, 2631, 2793, 2849, 2948, 3045, 3110, 3284],
  [36, 3, 2398, 2449, 2531, 2672, 2839, 3017, 3076, 3186, 3292, 3362, 3549],
  [37, 3, 2561, 2616, 2704, 2857, 3037, 3229, 3292, 3412, 3526, 3602, 3801],
  [38, 3, 2709, 2768, 2862, 3026, 3219, 3424, 3490, 3620, 3742, 3824, 4034],
  [39, 3, 2839, 2901, 3001, 3174, 3379, 3596, 3665, 3804, 3934, 4021, 4239],
  [40, 3, 2945, 3011, 3115, 3297, 3512, 3740, 3811, 3959, 4095, 4187, 4412],
  [41, 3, 3025, 3094, 3201, 3390, 3613, 3851, 3923, 4078, 4220, 4315, 4546],
];

export interface EFWRefPercentiles {
  p3: number; p5: number; p10: number; p25: number; p50: number;
  p75: number; p90: number; p95: number; p97: number;
}

export function getEFWRefPercentiles(gaWeeksDecimal: number): EFWRefPercentiles | null {
  // Table GA values are week + 3 days = week + 3/7
  const tableGAs = EFW_TABLE.map(r => r[0] + r[1] / 7);
  if (gaWeeksDecimal < tableGAs[0] || gaWeeksDecimal > tableGAs[tableGAs.length - 1]) return null;

  // Find bracketing rows
  let lo = 0;
  for (let i = 0; i < tableGAs.length - 1; i++) {
    if (gaWeeksDecimal >= tableGAs[i]) lo = i;
  }
  const hi = Math.min(lo + 1, tableGAs.length - 1);
  const frac = lo === hi ? 0 : (gaWeeksDecimal - tableGAs[lo]) / (tableGAs[hi] - tableGAs[lo]);

  const interp = (idx: number) => Math.round(EFW_TABLE[lo][idx] + frac * (EFW_TABLE[hi][idx] - EFW_TABLE[lo][idx]));

  return {
    p3: interp(2), p5: interp(3), p10: interp(4), p25: interp(5),
    p50: interp(6), p75: interp(7), p90: interp(8), p95: interp(9), p97: interp(10),
  };
}

export interface EFWResult {
  efw_g: number;
  z: number;
  centile: number;
  classification: string;
  classColor: 'destructive' | 'warning' | 'success';
  ref: EFWRefPercentiles | null;
}

export function calcEFWCentile(efw_g: number, gaWeeksDecimal: number): EFWResult {
  const ga = gaWeeksDecimal;
  const lnMedian = -0.0000474101 * ga * ga * ga + 0.0006947126 * ga * ga + 0.2100054194 * ga + 1.6710418489;
  const median = Math.exp(lnMedian);
  const sd = 0.00092387 * ga + 0.05634291;
  const z = (Math.log(efw_g) - Math.log(median)) / sd;
  const centileRaw = normCDF(z) * 100;
  const centile = Math.max(1, Math.ceil(centileRaw));

  let classification: string;
  let classColor: 'destructive' | 'warning' | 'success';
  if (centileRaw < 3) {
    classification = '< P3 — RCIU grave';
    classColor = 'destructive';
  } else if (centileRaw < 10) {
    classification = '< P10 — PIG';
    classColor = 'warning';
  } else if (centileRaw <= 90) {
    classification = 'P10–P90 — AIG';
    classColor = 'success';
  } else if (centileRaw <= 97) {
    classification = '> P90 — GIG';
    classColor = 'warning';
  } else {
    classification = '> P97 — GIG grave';
    classColor = 'destructive';
  }

  const ref = getEFWRefPercentiles(gaWeeksDecimal);
  return { efw_g, z, centile, classification, classColor, ref };
}

// --- Clinical Alerts ---
export interface ClinicalAlert {
  text: string;
  severity: 'warning' | 'destructive';
}

export function getClinicalAlerts(
  hcResult?: BiometryResult,
  acResult?: BiometryResult,
  flResult?: BiometryResult,
  efwResult?: EFWResult,
  hc_mm?: number,
  ac_mm?: number,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (hcResult && hcResult.centile < 5) alerts.push({ text: 'HC < P5', severity: 'destructive' });
  else if (hcResult && hcResult.centile < 10) alerts.push({ text: 'HC < P10 — vigilância', severity: 'warning' });

  if (acResult && acResult.centile < 5) alerts.push({ text: 'AC < P5', severity: 'destructive' });
  else if (acResult && acResult.centile < 10) alerts.push({ text: 'AC < P10 — vigilância', severity: 'warning' });

  if (flResult && flResult.centile < 5) alerts.push({ text: 'FL < P5 — possível encurtamento', severity: 'destructive' });

  if (efwResult) {
    if (efwResult.centile < 3) alerts.push({ text: 'EFW < P3 — RCIU grave', severity: 'destructive' });
    else if (efwResult.centile < 10) alerts.push({ text: 'EFW < P10 — Pequeno para a IG (PIG)', severity: 'warning' });
    if (efwResult.centile > 97) alerts.push({ text: 'EFW > P97 — GIG grave', severity: 'destructive' });
    else if (efwResult.centile > 90) alerts.push({ text: 'EFW > P90 — Grande para a IG (GIG)', severity: 'warning' });
  }

  if (hc_mm && ac_mm && ac_mm > 0) {
    const ratio = hc_mm / ac_mm;
    if (ratio > 1.2) alerts.push({ text: `Razão HC/AC = ${ratio.toFixed(2)} — elevada (assimetria)`, severity: 'warning' });
  }

  return alerts;
}

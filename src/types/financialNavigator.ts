// ─── Enums ────────────────────────────────────────────────────────────────────

export type WorkRegime =
  | 'pj_turno'
  | 'pj_producao'
  | 'clt'
  | 'residencia'
  | 'fellowship';

export type FiscalMode = 'A' | 'B' | 'C';

export type FnShiftType =
  | 'slot1'      // 7h–13h
  | 'slot2'      // 13h–19h
  | 'slot3'      // 19h–01h
  | 'slot4'      // 01h–07h
  | 'plantao_6h'
  | 'plantao_12h'
  | 'plantao_24h';

export type WorkMethod =
  | 'us_geral'
  | 'us_vascular'
  | 'mamografia'
  | 'tc'
  | 'rm'
  | 'puncao'
  | 'misto';

// ─── Labels ───────────────────────────────────────────────────────────────────

export const REGIME_LABELS: Record<WorkRegime, string> = {
  pj_turno:    'PJ — por turno',
  pj_producao: 'PJ — por produção',
  clt:         'CLT',
  residencia:  'Residência',
  fellowship:  'Fellowship (não remunerado)',
};

export const FN_SHIFT_LABELS: Record<FnShiftType, string> = {
  slot1:        '7h–13h',
  slot2:        '13h–19h',
  slot3:        '19h–01h',
  slot4:        '01h–07h',
  plantao_6h:   'Plantão 6h',
  plantao_12h:  'Plantão 12h',
  plantao_24h:  'Plantão 24h',
};

export const METHOD_LABELS: Record<WorkMethod, string> = {
  us_geral:    'US Geral',
  us_vascular: 'US Vascular',
  mamografia:  'Mamografia',
  tc:          'Tomografia (TC)',
  rm:          'Ressonância (RM)',
  puncao:      'Punção',
  misto:       'Misto (múltiplos)',
};

export const FISCAL_MODE_LABELS: Record<FiscalMode, string> = {
  A: 'Percentual fixo único (ex: 15% sobre tudo)',
  B: 'Percentual base + despesas fixas mensais',
  C: 'Detalhamento completo (ISS, IRPJ, CSLL, PIS, COFINS…)',
};

export const FN_SERVICE_PALETTE = [
  '#378ADD','#1D9E75','#BA7517','#7F77DD',
  '#D85A30','#D4537E','#639922','#E24B4A',
];

export const FN_DEFAULT_SHIFT_VALUES: Record<FnShiftType, number> = {
  slot1: 800, slot2: 800, slot3: 900, slot4: 1100,
  plantao_6h: 1000, plantao_12h: 1600, plantao_24h: 2800,
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FnDoctorProfile {
  id?: string;
  user_id: string;
  home_address?: string;
  home_lat?: number;
  home_lng?: number;
  home_place_id?: string;
  monthly_net_goal: number;
  include_13th: boolean;
  include_vacation: boolean;
  primary_regime?: WorkRegime;
}

export interface FnService {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  address?: string;
  lat?: number;
  lng?: number;
  place_id?: string;
  regime: WorkRegime;
  primary_method?: WorkMethod;
  method_mix?: Record<string, number>;
  payment_delta: number;
  fiscal_mode: FiscalMode;
  fiscal_pct_total?: number;
  fiscal_pct_base?: number;
  fiscal_fixed_costs?: number;
  fixed_monthly_salary?: number;
  required_hours_month?: number;
  // Hydrated client-side
  shiftValues?: Record<FnShiftType, number>;
  expenses?: FnServiceExpense[];
}

export interface FnShiftValue {
  id?: string;
  service_id: string;
  user_id: string;
  shift_type: FnShiftType;
  value_brl: number;
}

export interface FnServiceExpense {
  id?: string;
  service_id: string;
  user_id: string;
  label: string;
  amount_brl: number;
  frequency: 'monthly' | 'annual';
}

export interface FnOnboardingProgress {
  block1_pct: number;
  block2_pct: number;
  block3_pct: number;
  block4_pct: number;
}

// ─── Cálculos helpers ─────────────────────────────────────────────────────────

/** Retorna o desconto mensal efetivo de um serviço PJ dado o valor bruto */
export function calcPJDiscount(
  service: FnService,
  grossMonthly: number
): number {
  if (service.regime === 'fellowship') return 0;
  if (service.regime === 'clt' || service.regime === 'residencia') {
    return calcSourceRetention(grossMonthly);
  }
  switch (service.fiscal_mode) {
    case 'A':
      return grossMonthly * ((service.fiscal_pct_total ?? 15) / 100);
    case 'B': {
      const pctDiscount = grossMonthly * ((service.fiscal_pct_base ?? 10) / 100);
      return pctDiscount + (service.fiscal_fixed_costs ?? 0);
    }
    case 'C':
      return grossMonthly * ((service.fiscal_pct_base ?? 10) / 100);
    default:
      return 0;
  }
}

/** Tabela IRRF simplificada + INSS para CLT/Residência */
export function calcSourceRetention(grossMonthly: number): number {
  let inss = 0;
  if (grossMonthly <= 1412) inss = grossMonthly * 0.075;
  else if (grossMonthly <= 2666.68) inss = grossMonthly * 0.09;
  else if (grossMonthly <= 4000.03) inss = grossMonthly * 0.12;
  else if (grossMonthly <= 7786.02) inss = grossMonthly * 0.14;
  else inss = 908.86;

  const baseIR = grossMonthly - inss;

  let ir = 0;
  if (baseIR <= 2259.20) ir = 0;
  else if (baseIR <= 2826.65) ir = baseIR * 0.075 - 169.44;
  else if (baseIR <= 3751.05) ir = baseIR * 0.15 - 381.44;
  else if (baseIR <= 4664.68) ir = baseIR * 0.225 - 662.77;
  else ir = baseIR * 0.275 - 896.00;

  return inss + Math.max(0, ir);
}

/** Provisão mensal de 13º e férias */
export function calcBenefitProvision(
  netMonthly: number,
  include13th: boolean,
  includeVacation: boolean
): number {
  let provision = 0;
  if (include13th) provision += netMonthly / 12;
  if (includeVacation) provision += (netMonthly / 12) * (4 / 3);
  return provision;
}

// ─── Bloco 2 — Calendário ─────────────────────────────────────────────────────

export type ShiftStatus = 'projetado' | 'confirmado' | 'realizado' | 'cancelado';

export interface FnCalendarShift {
  id: string;
  user_id: string;
  service_id: string;
  shift_date: string;   // 'YYYY-MM-DD'
  shift_type: FnShiftType;
  status: ShiftStatus;
  notes?: string;
}

// Qual slot visual (0–3) cada FnShiftType ocupa
export const SHIFT_SLOT_INDICES: Record<FnShiftType, number[]> = {
  slot1:       [0],
  slot2:       [1],
  slot3:       [2],
  slot4:       [3],
  plantao_6h:  [0],
  plantao_12h: [0, 1],
  plantao_24h: [0, 1, 2, 3],
};

// Horas de início de cada slot (para exibição e cálculo)
export const SLOT_START_HOURS: Record<FnShiftType, number> = {
  slot1: 7, slot2: 13, slot3: 19, slot4: 1,
  plantao_6h: 7, plantao_12h: 7, plantao_24h: 7,
};

// Duração em horas de cada FnShiftType
export const SHIFT_HOURS: Record<FnShiftType, number> = {
  slot1: 6, slot2: 6, slot3: 6, slot4: 6,
  plantao_6h: 6, plantao_12h: 12, plantao_24h: 24,
};

// Agrupamento para filtros
export const AGENDA_SHIFT_TYPES: FnShiftType[] = ['slot1','slot2','slot3','slot4'];
export const PLANTAO_SHIFT_TYPES: FnShiftType[] = ['plantao_6h','plantao_12h','plantao_24h'];

export interface VoiceAction {
  service_name: string;
  service_id: string | null;
  shift_date: string;
  shift_type: FnShiftType;
  confidence: number;
  raw_mention: string;
}

export interface CommuteInfo {
  duration_min: number;
  distance_km: number;
}

// Dados de um dia no calendário (calculado client-side)
export interface CalendarDayData {
  date: string;
  shifts: FnCalendarShift[];
  slotOccupancy: (FnCalendarShift | null)[];
  hasConflict: boolean;
  totalValue: number;
  totalHours: number;
}

// Resumo do mês
export interface MonthSummary {
  totalGross: number;
  totalHours: number;
  shiftCount: number;
  byService: Record<string, { gross: number; hours: number; shifts: number }>;
  byShiftType: Record<FnShiftType, number>;
  conflictDays: string[];
}

export type ShiftType = 'manha' | 'tarde' | 'noite' | 'p6' | 'p12' | 'p24';
export type ShiftStatus = 'projetado' | 'confirmado' | 'realizado';
export type FilterType = 'all' | 'agenda' | 'plantao';
export type ValType = 'bruto' | 'liquido';

export const SHIFT_LABELS: Record<ShiftType, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  p6: 'Plantão 6h',
  p12: 'Plantão 12h',
  p24: 'Plantão 24h',
};

export const SHIFT_SLOT_MAP: Record<ShiftType, number[]> = {
  manha: [0],
  tarde: [1],
  noite: [2],
  p6: [0],
  p12: [0, 1],
  p24: [0, 1, 2, 3],
};

export const AGENDA_SHIFTS: ShiftType[] = ['manha', 'tarde', 'noite'];
export const PLANTAO_SHIFTS: ShiftType[] = ['p6', 'p12', 'p24'];

export const SHIFT_COLORS: Record<ShiftType, { bg: string; border: string; text: string }> = {
  manha:  { bg: '#E6F1FB', border: '#185FA5', text: '#0C447C' },
  tarde:  { bg: '#FAEEDA', border: '#854F0B', text: '#633806' },
  noite:  { bg: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  p6:     { bg: '#E1F5EE', border: '#0F6E56', text: '#085041' },
  p12:    { bg: '#9FE1CB', border: '#085041', text: '#04342C' },
  p24:    { bg: '#FCEBEB', border: '#A32D2D', text: '#791F1F' },
};

export const SLOT_BG_COLORS: Record<ShiftType, string> = {
  manha: '#E6F1FB',
  tarde: '#FAEEDA',
  noite: '#EEEDFE',
  p6:   '#E1F5EE',
  p12:  '#9FE1CB',
  p24:  '#F7C1C1',
};

export const SERVICE_PALETTE = [
  '#378ADD','#1D9E75','#BA7517','#7F77DD','#D85A30','#D4537E','#639922','#E24B4A',
];

export const DEFAULT_SHIFT_VALUES: Record<ShiftType, number> = {
  manha: 800, tarde: 800, noite: 900, p6: 1000, p12: 1600, p24: 2800,
};

export interface RevenueService {
  id: string;
  user_id: string;
  name: string;
  color: string;
  delta_months: number;
  sort_order: number;
  shiftValues?: Record<ShiftType, number>;
}

export interface RevenueShiftValue {
  id: string;
  service_id: string;
  user_id: string;
  shift_type: ShiftType;
  value_brl: number;
}

export interface RevenueShift {
  id: string;
  user_id: string;
  service_id: string;
  shift_date: string;
  shift_type: ShiftType;
  status: ShiftStatus;
}

export interface RevenuePreferences {
  tax_rate: number;
  show_net: boolean;
}

export interface DayData {
  shifts: ShiftType[];
  serviceId: string;
}

export interface MonthSummary {
  total: number;
  shiftCount: number;
  bySvc: Record<string, number>;
  byShift: Record<ShiftType, number>;
}

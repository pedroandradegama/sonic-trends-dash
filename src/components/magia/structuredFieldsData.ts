// Symptoms by area/subgroup
export const SYMPTOMS_BY_AREA: Record<string, string[]> = {
  abdome: [
    'Dor abdominal',
    'Distensão abdominal',
    'Náuseas/vômitos',
    'Icterícia',
    'Alteração do hábito intestinal',
    'Massa palpável',
    'Perda de peso',
    'Hematúria',
    'Febre',
  ],
  gineco_obst: [
    'Dor pélvica',
    'Sangramento uterino anormal',
    'Amenorreia',
    'Dispareunia',
    'Massa pélvica',
    'Leucorreia',
    'Infertilidade',
    'Dor durante ciclo menstrual',
    'Atraso menstrual',
  ],
  mamas: [
    'Nódulo palpável',
    'Dor mamária',
    'Descarga papilar',
    'Alteração cutânea',
    'Retração de mamilo',
    'Assimetria mamária',
    'Aumento de volume',
  ],
  msk: [
    'Dor articular',
    'Edema localizado',
    'Limitação de movimento',
    'Trauma recente',
    'Nódulo palpável',
    'Crepitação',
    'Instabilidade articular',
  ],
  tireoide: [
    'Nódulo cervical',
    'Disfagia',
    'Rouquidão',
    'Sintomas de hipertireoidismo',
    'Sintomas de hipotireoidismo',
    'Aumento de volume cervical',
    'Dor cervical',
  ],
  doppler: [
    'Edema de membros inferiores',
    'Dor em panturrilha',
    'Varizes',
    'Claudicação intermitente',
    'Pulsatilidade anormal',
    'Frialdade de extremidades',
    'Parestesias',
  ],
  outro: [
    'Dor localizada',
    'Massa palpável',
    'Sintomas constitucionais',
    'Outros sintomas',
  ],
};

// Ultrasound findings options
export const FINDING_TYPES = [
  { value: 'area_textural', label: 'Área de alteração textural' },
  { value: 'nodulo', label: 'Nódulo' },
  { value: 'calcificacao', label: 'Calcificação' },
  { value: 'cisto', label: 'Cisto' },
  { value: 'colecao', label: 'Coleção' },
  { value: 'outro', label: 'Outro achado' },
];

export const ECHOGENICITY = [
  { value: 'anecogênico', label: 'Anecogênico' },
  { value: 'hipoecogênico', label: 'Hipoecogênico' },
  { value: 'isoecogênico', label: 'Isoecogênico' },
  { value: 'hiperecogênico', label: 'Hiperecogênico' },
  { value: 'heterogêneo', label: 'Heterogêneo' },
];

export const POSTERIOR_ACOUSTIC = [
  { value: 'sem_alteracao', label: 'Sem alteração' },
  { value: 'sombra_limpa', label: 'Sombra acústica limpa' },
  { value: 'sombra_suja', label: 'Sombra acústica suja' },
  { value: 'reforco', label: 'Reforço acústico posterior' },
  { value: 'reverberacao', label: 'Reverberação' },
];

export const SHAPE_MARGINS = [
  { value: 'oval', label: 'Oval' },
  { value: 'redondo', label: 'Redondo' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'indistinto', label: 'Margens indistintas' },
  { value: 'microlobulado', label: 'Microlobulado' },
  { value: 'angulado', label: 'Angulado' },
  { value: 'espiculado', label: 'Espiculado' },
];

export const ASSOCIATED_FINDINGS = [
  { value: 'calcificacoes_grosseiras', label: 'Calcificações grosseiras' },
  { value: 'microcalcificacoes', label: 'Microcalcificações' },
  { value: 'vascularizacao_central', label: 'Vascularização central' },
  { value: 'vascularizacao_periferica', label: 'Vascularização periférica' },
  { value: 'linfonodos', label: 'Linfonodos alterados' },
  { value: 'liquido_livre', label: 'Líquido livre' },
  { value: 'dilatacao_ductal', label: 'Dilatação ductal' },
  { value: 'espessamento_parietal', label: 'Espessamento parietal' },
];

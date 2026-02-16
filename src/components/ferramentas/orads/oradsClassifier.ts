// O-RADS US v2022 Classification Engine

export type MenopausalStatus = 'premenopausal' | 'postmeno_early' | 'postmeno_late' | 'uncertain';

export type LesionSide = 'right' | 'left' | 'indeterminate';

export type LesionType =
  | 'simple_cyst'
  | 'bilocular_cyst'
  | 'unilocular_not_simple'
  | 'multilocular_cyst'
  | 'cyst_with_solid'
  | 'solid'
  | 'classic_benign'
  | 'normal'
  | 'incomplete';

export type ClassicBenignType =
  | 'hemorrhagic'
  | 'dermoid'
  | 'endometrioma'
  | 'paraovarian'
  | 'peritoneal_inclusion'
  | 'hydrosalpinx';

export type WallSurface = 'smooth' | 'irregular';
export type ColorScore = 1 | 2 | 3 | 4;

export interface LesionInput {
  id: string;
  side: LesionSide;
  maxDiameter: number; // cm
  type: LesionType;
  classicBenignType?: ClassicBenignType;
  wallSurface?: WallSurface;
  papillaeCount?: '0' | '1-3' | '>=4';
  hasSolidComponent?: boolean;
  solidIsPapilla?: boolean;
  solidContour?: WallSurface;
  hasShadowing?: boolean;
  colorScore?: ColorScore;
  hasAscitesOrPeritonealNodules?: boolean;
  hasFocalPlaque?: boolean;
}

export interface LesionResult {
  lesionId: string;
  side: LesionSide;
  maxDiameter: number;
  oradsScore: number;
  riskBucket: string;
  managementImaging: string;
  managementClinical: string;
  notes: string;
  descriptorsSummary: string;
}

export interface ORADSResult {
  lesions: LesionResult[];
  finalScore: number;
  finalRiskBucket: string;
  finalManagementImaging: string;
  finalManagementClinical: string;
  worstLesionId: string;
}

const RISK_BUCKETS: Record<number, string> = {
  0: 'Avaliação incompleta',
  1: 'Normal / Fisiológico',
  2: 'Quase certamente benigno (<1%)',
  3: 'Baixo risco (1–<10%)',
  4: 'Risco intermediário (10–<50%)',
  5: 'Alto risco (≥50%)',
};

function effectiveMeno(status: MenopausalStatus): 'pre' | 'post_early' | 'post_late' {
  if (status === 'premenopausal') return 'pre';
  if (status === 'postmeno_early') return 'post_early';
  if (status === 'postmeno_late') return 'post_late';
  // uncertain: treat as post_early (conservative)
  return 'post_early';
}

function isPostmeno(status: MenopausalStatus): boolean {
  return effectiveMeno(status) !== 'pre';
}

function buildResult(
  lesion: LesionInput,
  score: number,
  mgImg: string,
  mgClin: string,
  notes: string,
  descriptors: string
): LesionResult {
  return {
    lesionId: lesion.id,
    side: lesion.side,
    maxDiameter: lesion.maxDiameter,
    oradsScore: score,
    riskBucket: RISK_BUCKETS[score],
    managementImaging: mgImg,
    managementClinical: mgClin,
    notes,
    descriptorsSummary: descriptors,
  };
}

function classifyClassicBenign(lesion: LesionInput, meno: MenopausalStatus): LesionResult {
  const eff = effectiveMeno(meno);
  const d = lesion.maxDiameter;
  const t = lesion.classicBenignType!;
  let score = d >= 10 ? 3 : 2;
  let mgImg = '';
  let mgClin = '';
  let notes = `Lesão clássica benigna: ${classicLabel(t)}.`;
  const desc = `${classicLabel(t)}, ${d} cm`;

  switch (t) {
    case 'hemorrhagic':
      if (eff === 'pre') {
        if (d <= 5) { mgImg = 'Sem seguimento por imagem necessário.'; }
        else if (d < 10) { mgImg = 'US controle em 2–3 meses.'; }
        else { mgImg = 'US controle em 2–3 meses ou RM.'; score = 3; }
      } else if (eff === 'post_early') {
        if (d < 10) { mgImg = 'Confirmar com US em 2–3 meses, ou especialista, ou RM.'; }
        else { mgImg = 'Especialista ou RM.'; score = 3; }
      } else {
        notes += ' Cisto hemorrágico típico incomum na pós-menopausa tardia — recategorizar por descritores.';
        mgImg = 'Recategorizar a lesão pelos descritores morfológicos.';
        score = 3;
      }
      mgClin = 'Acompanhamento clínico com ginecologista.';
      break;

    case 'dermoid':
      if (d <= 3) { mgImg = 'Considerar US em 12 meses.'; }
      else if (d < 10) { mgImg = 'Se não operar, US em 12 meses.'; }
      else { mgImg = 'Considerar cirurgia ou US em 6 meses.'; score = 3; }
      mgClin = 'Acompanhamento clínico com ginecologista.';
      break;

    case 'endometrioma':
      if (eff === 'pre') {
        if (d < 10) { mgImg = 'Se não operar, US em 12 meses.'; }
        else { mgImg = 'Considerar cirurgia ou US em 6 meses.'; score = 3; }
      } else {
        if (d < 10) {
          mgImg = 'Confirmar com US em 2–3 meses, ou especialista, ou RM. Depois, se não operar, US em 12 meses.';
        } else { mgImg = 'Especialista ou RM.'; score = 3; }
      }
      mgClin = 'Acompanhamento clínico com ginecologista.';
      break;

    case 'paraovarian':
      mgImg = 'Sem seguimento por imagem necessário.';
      mgClin = 'Acompanhamento clínico com ginecologista.';
      score = 2;
      break;

    case 'peritoneal_inclusion':
      mgImg = 'Sem seguimento por imagem necessário.';
      mgClin = 'Acompanhamento clínico.';
      score = 2;
      break;

    case 'hydrosalpinx':
      mgImg = 'Sem seguimento por imagem necessário.';
      mgClin = 'Acompanhamento clínico com ginecologista.';
      score = 2;
      break;
  }

  return buildResult(lesion, score, mgImg, mgClin, notes, desc);
}

function classicLabel(t: ClassicBenignType): string {
  const m: Record<ClassicBenignType, string> = {
    hemorrhagic: 'Cisto hemorrágico típico',
    dermoid: 'Dermoide típico',
    endometrioma: 'Endometrioma típico',
    paraovarian: 'Cisto paraovariano típico',
    peritoneal_inclusion: 'Cisto de inclusão peritoneal típico',
    hydrosalpinx: 'Hidrossalpinge típica',
  };
  return m[t];
}

function classifyNonClassic(lesion: LesionInput, meno: MenopausalStatus): LesionResult {
  const d = lesion.maxDiameter;
  const post = isPostmeno(meno);
  const cs = lesion.colorScore ?? 1;
  const wall = lesion.wallSurface ?? 'smooth';
  const pp = lesion.papillaeCount ?? '0';
  const hasSolid = lesion.hasSolidComponent ?? false;
  const solidIsPp = lesion.solidIsPapilla ?? false;
  const solidContour = lesion.solidContour ?? 'smooth';
  const shadowing = lesion.hasShadowing ?? false;
  const isIrregular = wall === 'irregular';

  let descriptors: string[] = [];

  // Build descriptors summary
  const typeLabels: Record<string, string> = {
    simple_cyst: 'Cisto simples',
    bilocular_cyst: 'Cisto bilocular',
    unilocular_not_simple: 'Cisto unilocular não simples',
    multilocular_cyst: 'Cisto multilocular',
    cyst_with_solid: 'Cisto com componente sólido',
    solid: 'Lesão sólida',
  };
  descriptors.push(typeLabels[lesion.type] || lesion.type);
  descriptors.push(`${d} cm`);
  if (wall) descriptors.push(isIrregular ? 'parede/septo irregular' : 'parede/septo liso');
  if (hasSolid) descriptors.push(solidIsPp ? `papilas (${pp})` : 'componente sólido');
  if (hasSolid && solidContour) descriptors.push(`sólido ${solidContour === 'smooth' ? 'liso' : 'irregular'}`);
  if (shadowing) descriptors.push('com shadowing');
  descriptors.push(`CS ${cs}`);

  const desc = descriptors.join(', ');

  // ---- Classification logic ----

  // SIMPLE CYST
  if (lesion.type === 'simple_cyst') {
    if (d <= 3) {
      return buildResult(lesion, 2, post ? 'Considerar US em 12 meses.' : 'Sem seguimento por imagem necessário.', 'Acompanhamento clínico.', 'Cisto simples ≤3 cm.', desc);
    }
    if (d <= 5) {
      return buildResult(lesion, 2, post ? 'US em 12 meses.' : 'Sem seguimento por imagem necessário.', 'Acompanhamento clínico.', 'Cisto simples 3–5 cm.', desc);
    }
    if (d < 10) {
      return buildResult(lesion, 2, 'US em 12 meses.', 'Acompanhamento clínico.', 'Cisto simples 5–<10 cm.', desc);
    }
    return buildResult(lesion, 3, 'US em 6 meses ou considerar especialista/RM.', 'Acompanhamento clínico com ginecologista.', 'Cisto simples ≥10 cm.', desc);
  }

  // BILOCULAR CYST (no solid component)
  if (lesion.type === 'bilocular_cyst' && !hasSolid) {
    if (!isIrregular) {
      // smooth
      if (d <= 3) {
        return buildResult(lesion, 2, post ? 'US em 12 meses.' : 'Sem seguimento por imagem necessário.', 'Acompanhamento clínico.', 'Cisto bilocular liso ≤3 cm.', desc);
      }
      if (d < 10) {
        return buildResult(lesion, 2, 'US em 6 meses.', 'Acompanhamento clínico.', 'Cisto bilocular liso 3–<10 cm.', desc);
      }
      return buildResult(lesion, 3, 'US em 6 meses ou especialista/RM.', 'Acompanhamento clínico com ginecologista.', 'Cisto bilocular liso ≥10 cm.', desc);
    }
    // irregular bilocular without solid → O-RADS 4
    return buildResult(lesion, 4, 'Especialista US, ou RM com contraste (O-RADS MRI), ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Bilocular irregular sem componente sólido.', desc);
  }

  // UNILOCULAR NOT SIMPLE (no solid component implied unless explicitly marked)
  if (lesion.type === 'unilocular_not_simple' && !hasSolid) {
    if (isIrregular || true) {
      // Unilocular irregular → O-RADS 3 (any size)
      return buildResult(lesion, 3, 'US em 6 meses ou RM.', 'Acompanhamento clínico com ginecologista.', 'Unilocular não simples (irregular ou com ecos internos).', desc);
    }
  }

  // MULTILOCULAR without solid
  if (lesion.type === 'multilocular_cyst' && !hasSolid) {
    if (!isIrregular) {
      // smooth
      if (d < 10 && cs < 4) {
        return buildResult(lesion, 3, 'US em 6 meses ou RM.', 'Acompanhamento clínico com ginecologista.', 'Multilocular liso <10 cm, CS<4.', desc);
      }
      if (d >= 10 && cs < 4) {
        return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Multilocular liso ≥10 cm, CS<4.', desc);
      }
      if (cs === 4) {
        return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Multilocular liso, CS 4.', desc);
      }
    }
    // irregular multilocular without solid → O-RADS 4
    return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Multilocular irregular sem componente sólido.', desc);
  }

  // CYST WITH SOLID COMPONENT (unilocular or bi/multilocular)
  if (lesion.type === 'cyst_with_solid' || (hasSolid && (lesion.type === 'bilocular_cyst' || lesion.type === 'multilocular_cyst' || lesion.type === 'unilocular_not_simple'))) {
    const isUnilocular = lesion.type === 'unilocular_not_simple' || lesion.type === 'cyst_with_solid';

    if (isUnilocular) {
      // Unilocular with solid
      if (pp === '>=4') {
        // ≥4 papillae → O-RADS 5
        return buildResult(lesion, 5, 'Protocolo gineco-oncologia.', 'Gineco-oncologia.', 'Unilocular com ≥4 papilas.', desc);
      }
      // <4 papillae or solid not papilla → O-RADS 4
      return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Unilocular com componente sólido (<4 papilas).', desc);
    }

    // Bi/multilocular with solid
    if (cs >= 3) {
      return buildResult(lesion, 5, 'Protocolo gineco-oncologia.', 'Gineco-oncologia.', 'Bi/multilocular com componente sólido, CS 3–4.', desc);
    }
    // CS 1-2
    return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Bi/multilocular com componente sólido, CS 1–2.', desc);
  }

  // SOLID LESION
  if (lesion.type === 'solid') {
    // Solid irregular → O-RADS 5
    if (solidContour === 'irregular') {
      return buildResult(lesion, 5, 'Protocolo gineco-oncologia.', 'Gineco-oncologia.', 'Lesão sólida irregular.', desc);
    }

    // Solid smooth
    if (cs === 4) {
      return buildResult(lesion, 5, 'Protocolo gineco-oncologia.', 'Gineco-oncologia.', 'Lesão sólida lisa com CS 4.', desc);
    }
    if (cs === 1) {
      return buildResult(lesion, 3, 'US em 6 meses ou RM.', 'Acompanhamento clínico com ginecologista.', 'Lesão sólida lisa, CS 1 (± shadowing).', desc);
    }
    if (shadowing && (cs === 2 || cs === 3)) {
      return buildResult(lesion, 3, 'US em 6 meses ou RM.', 'Acompanhamento clínico com ginecologista.', 'Lesão sólida lisa com shadowing, CS 2–3.', desc);
    }
    // Solid smooth CS 2-3 without shadowing → O-RADS 4
    return buildResult(lesion, 4, 'Especialista US, RM com contraste, ou protocolo gineco-oncologia.', 'Ginecologista com consulta gineco-oncologia.', 'Lesão sólida lisa sem shadowing, CS 2–3.', desc);
  }

  // Fallback
  return buildResult(lesion, 3, 'Considerar RM ou especialista.', 'Acompanhamento clínico com ginecologista.', 'Classificação por descritores gerais.', desc);
}

export function classifyLesion(lesion: LesionInput, meno: MenopausalStatus): LesionResult {
  // Priority rules
  if (lesion.type === 'incomplete') {
    return buildResult(lesion, 0, 'Repetir US ou complementar com RM.', 'Agendar novo exame.', 'Exame incompleto / não caracterizável.', 'Exame incompleto');
  }

  if (lesion.type === 'normal') {
    return buildResult(lesion, 1, 'Sem seguimento por imagem necessário.', 'Rotina.', 'Ovário normal / sem lesão.', 'Ovário normal');
  }

  if (lesion.hasAscitesOrPeritonealNodules) {
    return buildResult(lesion, 5, 'Protocolo gineco-oncologia.', 'Gineco-oncologia.', 'Presença de ascite e/ou nódulos peritoneais.', `${lesion.type}, ascite/nódulos peritoneais`);
  }

  if (lesion.type === 'classic_benign') {
    return classifyClassicBenign(lesion, meno);
  }

  return classifyNonClassic(lesion, meno);
}

export function classifyExam(lesions: LesionInput[], meno: MenopausalStatus): ORADSResult {
  const results = lesions.map(l => classifyLesion(l, meno));
  let worst = results[0];
  for (const r of results) {
    if (r.oradsScore > worst.oradsScore) worst = r;
  }

  return {
    lesions: results,
    finalScore: worst.oradsScore,
    finalRiskBucket: worst.riskBucket,
    finalManagementImaging: worst.managementImaging,
    finalManagementClinical: worst.managementClinical,
    worstLesionId: worst.lesionId,
  };
}

export function generateReportText(result: ORADSResult): string {
  const lines = result.lesions.map((l) => {
    const sideLabel = l.side === 'right' ? 'direita' : l.side === 'left' ? 'esquerda' : 'indeterminado';
    return `Lesão anexial ${sideLabel}, medindo ${l.maxDiameter} cm, com características: ${l.descriptorsSummary}. Classificação O-RADS US (v2022): O-RADS ${l.oradsScore} (${l.riskBucket}). Conduta sugerida: ${l.managementImaging} ${l.managementClinical}`;
  });

  let text = lines.join('\n');

  if (result.lesions.length > 1) {
    text += `\nConduta orientada pela lesão de maior categoria (O-RADS ${result.finalScore}).`;
  }

  // Check plaque alert
  const plaqueAlert = result.lesions.some(l => l.maxDiameter > 0 && (l as any).hasFocalPlaque);
  if (plaqueAlert) {
    text += '\nNota: presença de placa focal no local da medida.';
  }

  return text;
}

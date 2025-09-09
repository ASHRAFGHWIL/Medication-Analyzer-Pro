export interface SideEffect {
  symptom: string;
  severity: string;
}

export interface Dosage {
  recommendation: string;
  reasoning: string;
}

export interface MedicationInfo {
  name: string;
  form: string;
  description: string;
  indications: string[];
  methodOfUse: string;

  sideEffects: SideEffect[];
  dosage: Dosage;
  imageUrl?: string;
  imageLoading?: boolean;
}

export interface InteractionInfo {
  medications: string[];
  severity: 'Minor' | 'Moderate' | 'Major' | 'Life-threatening' | string;
  description: string;
}

export interface AnalysisResult {
  medications: MedicationInfo[];
  interactions: InteractionInfo[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  medications: string[];
  result: AnalysisResult;
}

export enum LoadingState {
  IDLE,
  ANALYZING_TEXT,
  GENERATING_IMAGES,
  DONE
}
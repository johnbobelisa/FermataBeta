export interface Hold {
  id: number;
  type: 'start_hand' | 'start_foot' | 'finish_hold';
  xNorm: number;
  yNorm: number;
}

export interface ClimberState {
  RH: number | null;
  LH: number | null;
  RF: number | null;
  LF: number | null;
}

export type BetaSequence = ClimberState[];

export interface JointPositions {
  [key: string]: { x: number; y: number };
}
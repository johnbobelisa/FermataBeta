export type HoldType = 'start_hand' | 'start_foot' | 'finish_hold' | 'climbing_hold';

export type Hold = {
  id: number;
  xNorm: number;
  yNorm: number;
  type: HoldType;
};

export type ClimberState = {
  RH: number | null;
  LH: number | null;
  RF: number | null;
  LF: number | null;
};

// Represents a sequence of moves from the backend
export type BetaSequence = ClimberState[];
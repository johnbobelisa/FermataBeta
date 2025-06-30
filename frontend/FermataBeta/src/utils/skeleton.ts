import type { ClimberState, Hold } from '../types';

type Joint = { x: number; y: number };
type LimbChain = Joint[];

const LIMB_SEGMENT_LENGTHS = {
  upperArm: 50,
  forearm: 45,
  thigh: 55,
  shin: 50,
};

const TORSO_WIDTH = 40;
const TORSO_HEIGHT = 60;

// Simple FABRIK IK Solver
const solveIK = (chain: LimbChain, target: Joint, iterations = 3): LimbChain => {
  const segmentLengths = chain.slice(0, -1).map((p, i) => Math.hypot(chain[i+1].x - p.x, chain[i+1].y - p.y));
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  const distToTarget = Math.hypot(target.x - chain[0].x, target.y - chain[0].y);

  if (distToTarget > totalLength) {
    // Target is out of reach, stretch towards it
    for (let i = 1; i < chain.length; i++) {
      const ratio = segmentLengths[i-1] / totalLength;
      chain[i] = {
          x: chain[i-1].x + (target.x - chain[i-1].x) * ratio,
          y: chain[i-1].y + (target.y - chain[i-1].y) * ratio,
      }
    }
  } else {
    // Target is reachable
    const root = { ...chain[0] };
    for (let iter = 0; iter < iterations; iter++) {
      // Forward reaching
      chain[chain.length - 1] = target;
      for (let i = chain.length - 2; i >= 0; i--) {
        const dist = Math.hypot(chain[i+1].x - chain[i].x, chain[i+1].y - chain[i].y);
        const ratio = segmentLengths[i] / dist;
        chain[i] = {
            x: chain[i+1].x + (chain[i].x - chain[i+1].x) * ratio,
            y: chain[i+1].y + (chain[i].y - chain[i+1].y) * ratio,
        }
      }
      // Backward reaching
      chain[0] = root;
      for (let i = 1; i < chain.length; i++) {
        const dist = Math.hypot(chain[i].x - chain[i-1].x, chain[i].y - chain[i-1].y);
        const ratio = segmentLengths[i-1] / dist;
        chain[i] = {
            x: chain[i-1].x + (chain[i].x - chain[i-1].x) * ratio,
            y: chain[i-1].y + (chain[i].y - chain[i-1].y) * ratio,
        }
      }
    }
  }
  return chain;
};

const drawLimb = (ctx: CanvasRenderingContext2D, a: Joint, b: Joint) => {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

export const drawClimber = (
  ctx: CanvasRenderingContext2D,
  climberState: ClimberState,
  holds: Hold[],
  canvasWidth: number,
  canvasHeight: number
) => {
  const findHoldCoords = (holdId: number | null): Joint | null => {
    if (holdId === null) return null;
    const hold = holds.find(h => h.id === holdId);
    return hold ? { x: hold.xNorm * canvasWidth, y: hold.yNorm * canvasHeight } : null;
  };

  const rhPos = findHoldCoords(climberState.RH);
  const lhPos = findHoldCoords(climberState.LH);
  const rfPos = findHoldCoords(climberState.RF);
  const lfPos = findHoldCoords(climberState.LF);

  const activeLimbs = [rhPos, lhPos, rfPos, lfPos].filter(Boolean) as Joint[];
  if (activeLimbs.length === 0) return;

  // Approximate torso position as the average of active holds
  const avgPos = activeLimbs.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0});
  const corePos = { x: avgPos.x / activeLimbs.length, y: avgPos.y / activeLimbs.length - TORSO_HEIGHT / 2 };

  const shoulderL = { x: corePos.x - TORSO_WIDTH / 2, y: corePos.y };
  const shoulderR = { x: corePos.x + TORSO_WIDTH / 2, y: corePos.y };
  const hipL = { x: corePos.x - TORSO_WIDTH / 2, y: corePos.y + TORSO_HEIGHT };
  const hipR = { x: corePos.x + TORSO_WIDTH / 2, y: corePos.y + TORSO_HEIGHT };

  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 4;

  // Draw Torso
  drawLimb(ctx, shoulderL, shoulderR);
  drawLimb(ctx, shoulderL, hipL);
  drawLimb(ctx, shoulderR, hipR);
  drawLimb(ctx, hipL, hipR);

  // Solve and draw limbs
  if (rhPos) {
    const elbowR = { x: shoulderR.x, y: shoulderR.y + LIMB_SEGMENT_LENGTHS.upperArm };
    const armChain = solveIK([shoulderR, elbowR, rhPos], rhPos);
    armChain.forEach((p, i) => i > 0 && drawLimb(ctx, armChain[i-1], p));
  }
  if (lhPos) {
    const elbowL = { x: shoulderL.x, y: shoulderL.y + LIMB_SEGMENT_LENGTHS.upperArm };
    const armChain = solveIK([shoulderL, elbowL, lhPos], lhPos);
    armChain.forEach((p, i) => i > 0 && drawLimb(ctx, armChain[i-1], p));
  }
  if (rfPos) {
    const kneeR = { x: hipR.x, y: hipR.y + LIMB_SEGMENT_LENGTHS.thigh };
    const legChain = solveIK([hipR, kneeR, rfPos], rfPos);
    legChain.forEach((p, i) => i > 0 && drawLimb(ctx, legChain[i-1], p));
  }
  if (lfPos) {
    const kneeL = { x: hipL.x, y: hipL.y + LIMB_SEGMENT_LENGTHS.thigh };
    const legChain = solveIK([hipL, kneeL, lfPos], lfPos);
    legChain.forEach((p, i) => i > 0 && drawLimb(ctx, legChain[i-1], p));
  }
};
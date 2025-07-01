// src/utils/skeleton.ts

import type { Hold, ClimberState, JointPositions } from '../types/types';

/**
 * Calculates the 2D coordinates for a full skeletal model of the climber.
 * This is the TypeScript version of the pose calculation logic.
 */
function calculateFullBodyPose(
  state: ClimberState,
  holds: Hold[],
  canvasWidth: number,
  canvasHeight: number
): JointPositions {
  const climberModel = {
    torsoHeight: 0.30 * canvasHeight,
    torsoWidth: 0.15 * canvasHeight,
    upperArmLength: 0.25 * canvasHeight,
    forearmLength: 0.25 * canvasHeight,
    thighLength: 0.30 * canvasHeight,
    shinLength: 0.25 * canvasHeight,
  };

  const holdCoordsById: { [id: number]: { x: number; y: number } } = {};
  holds.forEach(h => {
    holdCoordsById[h.id] = { x: h.xNorm * canvasWidth, y: h.yNorm * canvasHeight };
  });

  const limbCoords = {
    RH: state.RH !== null ? holdCoordsById[state.RH] : null,
    LH: state.LH !== null ? holdCoordsById[state.LH] : null,
    RF: state.RF !== null ? holdCoordsById[state.RF] : null,
    LF: state.LF !== null ? holdCoordsById[state.LF] : null,
  };

  const contactPoints = Object.values(limbCoords).filter(p => p !== null) as { x: number; y: number }[];
  
  let coreX: number, coreY: number;
  if (contactPoints.length > 0) {
    const avgX = contactPoints.reduce((sum, p) => sum + p.x, 0) / contactPoints.length;
    const avgY = contactPoints.reduce((sum, p) => sum + p.y, 0) / contactPoints.length;
    coreX = avgX;
    coreY = avgY - climberModel.torsoHeight / 2;
  } else {
    coreX = canvasWidth / 2;
    coreY = canvasHeight / 2;
  }

  const joints: JointPositions = {
    shoulderR: { x: coreX + climberModel.torsoWidth / 2, y: coreY },
    shoulderL: { x: coreX - climberModel.torsoWidth / 2, y: coreY },
    hipR: { x: coreX + climberModel.torsoWidth / 2, y: coreY + climberModel.torsoHeight },
    hipL: { x: coreX - climberModel.torsoWidth / 2, y: coreY + climberModel.torsoHeight },
  };
  
  // A simple IK solver can be embedded or imported here.
  // For simplicity, we'll just connect the joints to the holds directly.
  // A full FABRIK implementation would be more robust.
  if (limbCoords.RH) joints.handR = limbCoords.RH;
  if (limbCoords.LH) joints.handL = limbCoords.LH;
  if (limbCoords.RF) joints.footR = limbCoords.RF;
  if (limbCoords.LF) joints.footL = limbCoords.LF;
  
  // Simplified elbow/knee placement (midpoint, bent slightly)
  if (joints.handR) joints.elbowR = { x: (joints.shoulderR.x + joints.handR.x) / 2, y: (joints.shoulderR.y + joints.handR.y) / 2 + 20 };
  if (joints.handL) joints.elbowL = { x: (joints.shoulderL.x + joints.handL.x) / 2, y: (joints.shoulderL.y + joints.handL.y) / 2 + 20 };
  if (joints.footR) joints.kneeR = { x: (joints.hipR.x + joints.footR.x) / 2, y: (joints.hipR.y + joints.footR.y) / 2 - 20 };
  if (joints.footL) joints.kneeL = { x: (joints.hipL.x + joints.footL.x) / 2, y: (joints.hipL.y + joints.footL.y) / 2 - 20 };

  return joints;
}


/**
 * Draws the climber's skeleton on the canvas for a given state.
 */
export function drawClimber(
  ctx: CanvasRenderingContext2D,
  state: ClimberState,
  holds: Hold[],
  canvasWidth: number,
  canvasHeight: number
) {
  const joints = calculateFullBodyPose(state, holds, canvasWidth, canvasHeight);

  ctx.strokeStyle = '#FFFF00'; // Bright yellow for visibility
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const drawLimb = (p1?: {x:number, y:number}, p2?: {x:number, y:number}, p3?: {x:number, y:number}) => {
    if (p1 && p2 && p3) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();
    }
  };
  
  const drawTorso = (s1: {x:number, y:number}, s2: {x:number, y:number}, h1: {x:number, y:number}, h2: {x:number, y:number}) => {
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(h2.x, h2.y);
      ctx.lineTo(h1.x, h1.y);
      ctx.closePath();
      ctx.stroke();
  }

  // Draw limbs
  drawLimb(joints.shoulderR, joints.elbowR, joints.handR); // Right Arm
  drawLimb(joints.shoulderL, joints.elbowL, joints.handL); // Left Arm
  drawLimb(joints.hipR, joints.kneeR, joints.footR);       // Right Leg
  drawLimb(joints.hipL, joints.kneeL, joints.footL);       // Left Leg
  
  // Draw Torso
  drawTorso(joints.shoulderR, joints.shoulderL, joints.hipR, joints.hipL)
}
import math
from typing import Tuple, Dict, Any, List

from state import State
from climber_model import ClimberModel

def solve_2segment_IK(base: Tuple[float, float], target: Tuple[float, float], 
                      seg1_length: float, seg2_length: float, 
                      iterations: int = 10) -> Tuple[Tuple[float, float], Tuple[float, float]]:
    """
    Solves IK for a 2-segment limb using the FABRIK algorithm.

    Args:
        base: (x, y) of the base joint (shoulder or hip).
        target: (x, y) position the end effector should reach (hold position).
        seg1_length: Length of the first segment (e.g., upper arm).
        seg2_length: Length of the second segment (e.g., forearm).
        iterations: Number of FABRIK iterations to perform.

    Returns:
        A tuple containing (mid_joint_pos, end_effector_pos).
    """
    base_x, base_y = base
    target_x, target_y = target
    total_length = seg1_length + seg2_length
    
    # Check if the target is reachable
    dist_to_target = math.hypot(target_x - base_x, target_y - base_y)

    if dist_to_target > total_length:
        # Target is out of reach, stretch the limb towards it
        direction_x = (target_x - base_x) / dist_to_target
        direction_y = (target_y - base_y) / dist_to_target
        
        mid_x = base_x + direction_x * seg1_length
        mid_y = base_y + direction_y * seg1_length
        end_x = base_x + direction_x * total_length
        end_y = base_y + direction_y * total_length
        
        return (mid_x, mid_y), (end_x, end_y)

    # Target is reachable, use FABRIK
    # Initial guess for mid-joint doesn't matter much, but can't be on the base.
    mid_x, mid_y = base_x, base_y + seg1_length

    for _ in range(iterations):
        # --- FORWARD REACHING (from target to base) ---
        # 1. Set end effector to the target
        end_x, end_y = target_x, target_y
        
        # 2. Move mid-joint to be seg2_length away from the new end effector
        dist_mid_end = math.hypot(mid_x - end_x, mid_y - end_y)
        if dist_mid_end > 1e-6:
            mid_x = end_x + (mid_x - end_x) / dist_mid_end * seg2_length
            mid_y = end_y + (mid_y - end_y) / dist_mid_end * seg2_length

        # --- BACKWARD REACHING (from base to end) ---
        # 3. Base is fixed, so move mid-joint to be seg1_length away from it
        dist_base_mid = math.hypot(mid_x - base_x, mid_y - base_y)
        if dist_base_mid > 1e-6:
            mid_x = base_x + (mid_x - base_x) / dist_base_mid * seg1_length
            mid_y = base_y + (mid_y - base_y) / dist_base_mid * seg1_length

    return (mid_x, mid_y), (target_x, target_y)


def calculate_full_body_pose(
    state: State, 
    climber: ClimberModel,
    hold_coords_norm: Dict[int, Tuple[float, float]],
    image_width: float, 
    image_height: float
) -> Dict[str, Tuple[float, float]]:
    """
    Calculates the 2D coordinates for a full skeletal model of the climber.

    Returns:
        A dictionary mapping joint names to their (x, y) pixel coordinates.
    """
    # 1. Get pixel coordinates of holds for the current state
    limb_holds = {
        'RH': state.RH, 'LH': state.LH, 'RF': state.RF, 'LF': state.LF
    }
    limb_coords_px = {}
    for limb, hold_id in limb_holds.items():
        if hold_id is not None:
            x_norm, y_norm = hold_coords_norm[hold_id]
            limb_coords_px[limb] = (x_norm * image_width, y_norm * image_height)

    # 2. Estimate torso core position from contact points
    contact_points = list(limb_coords_px.values())
    if not contact_points:
        # Default position if no limbs are on holds (unlikely)
        core_x, core_y = image_width / 2, image_height / 2
    else:
        avg_x = sum(p[0] for p in contact_points) / len(contact_points)
        avg_y = sum(p[1] for p in contact_points) / len(contact_points)
        core_x = avg_x
        # Adjust core to be slightly above the average y-position of holds
        core_y = avg_y - climber.torso_height / 2

    # 3. Define anchor points (shoulders and hips)
    shoulderR = (core_x + climber.torso_width / 2, core_y)
    shoulderL = (core_x - climber.torso_width / 2, core_y)
    hipR = (core_x + climber.torso_width / 2, core_y + climber.torso_height)
    hipL = (core_x - climber.torso_width / 2, core_y + climber.torso_height)

    joints = {
        "core": (core_x, core_y),
        "shoulderR": shoulderR, "shoulderL": shoulderL,
        "hipR": hipR, "hipL": hipL
    }

    # 4. Solve IK for each limb to find elbow/knee positions
    # Right Arm
    if 'RH' in limb_coords_px:
        elbowR, handR = solve_2segment_IK(
            shoulderR, limb_coords_px['RH'],
            climber.upper_arm_length, climber.forearm_length
        )
        joints["elbowR"] = elbowR
        joints["handR"] = handR
    
    # Left Arm
    if 'LH' in limb_coords_px:
        elbowL, handL = solve_2segment_IK(
            shoulderL, limb_coords_px['LH'],
            climber.upper_arm_length, climber.forearm_length
        )
        joints["elbowL"] = elbowL
        joints["handL"] = handL

    # Right Leg
    if 'RF' in limb_coords_px:
        kneeR, footR = solve_2segment_IK(
            hipR, limb_coords_px['RF'],
            climber.thigh_length, climber.shin_length
        )
        joints["kneeR"] = kneeR
        joints["footR"] = footR

    # Left Leg
    if 'LF' in limb_coords_px:
        kneeL, footL = solve_2segment_IK(
            hipL, limb_coords_px['LF'],
            climber.thigh_length, climber.shin_length
        )
        joints["kneeL"] = kneeL
        joints["footL"] = footL

    return joints
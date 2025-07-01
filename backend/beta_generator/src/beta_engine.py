# beta_engine.py
import math
import heapq
from typing import Optional, List, Dict, Any, Tuple

from state import State
from climber_model import ClimberModel

# --- Globals (initialized in main.py) ---
# These are treated as global for simplicity, as per the design plan.
# In a larger application, they would be encapsulated in a class.
holds_data: List[Dict[str, Any]] = []
hold_coords: Dict[int, Tuple[float, float]] = {}
climber: Optional[ClimberModel] = None
finish_id: Optional[int] = None
# ---

def is_reachable(limb: str, target_hold: int, state: State) -> bool:
    """Check if the given limb can reach the target_hold from the current state."""
    assert climber is not None, "Climber model not initialized."
    
    # Estimate the climber's torso position by averaging current contact points.
    contacts = [hold_coords[h] for h in {state.RH, state.LH, state.RF, state.LF} if h is not None]
    if not contacts: return False

    avg_x = sum(x for x, y in contacts) / len(contacts)
    avg_y = sum(y for x, y in contacts) / len(contacts)
    
    # A simple heuristic for core position relative to average contact points
    core_x = avg_x
    core_y = avg_y - climber.torso_height / 2

    # Determine anchor point (shoulder/hip) for the moving limb
    if limb in ('RH', 'LH'):
        anchor_y = core_y
        max_reach = climber.upper_arm_length + climber.forearm_length
        anchor_x = core_x + climber.torso_width / 2 if limb == 'RH' else core_x - climber.torso_width / 2
    elif limb in ('RF', 'LF'):
        anchor_y = core_y + climber.torso_height
        max_reach = climber.thigh_length + climber.shin_length
        anchor_x = core_x + climber.torso_width / 2 if limb == 'RF' else core_x - climber.torso_width / 2
    else:
        raise ValueError(f"Unknown limb: {limb}")
    
    tx, ty = hold_coords[target_hold]
    dist = math.hypot(tx - anchor_x, ty - anchor_y)
    return dist <= max_reach + 1e-6

def point_in_polygon(px: float, py: float, polygon: List[Tuple[float, float]]) -> bool:
    """Check if a point is inside a polygon using the ray-casting algorithm."""
    inside = False
    n = len(polygon)
    for i in range(n):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % n]
        if ((y1 > py) != (y2 > py)) and (px < (x2 - x1) * (py - y1) / (y2 - y1) + x1):
            inside = not inside
    return inside

def is_stable(state: State) -> bool:
    """Check if the climber's CoM is within the base of support."""
    # Get unique contact points
    contacts = list(set([hold_coords[h] for h in state if h is not None]))
    
    if len(contacts) < 3:
        return False # Statically unstable with fewer than 3 points of contact

    # CoM is estimated as the average of contact points
    com_x = sum(x for x, y in contacts) / len(contacts)
    com_y = sum(y for x, y in contacts) / len(contacts)

    # Compute convex hull of contact points (base of support)
    pts = sorted(list(set(contacts)))
    if len(pts) <= 2: return False

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    
    hull = lower[:-1] + upper[:-1]
    
    if point_in_polygon(com_x, com_y, hull):
        return True

    # Check if CoM lies on the edge of the hull
    for i in range(len(hull)):
        p1 = hull[i]
        p2 = hull[(i + 1) % len(hull)]
        # Check for collinearity and if com is between p1 and p2
        if abs(cross(p1, p2, (com_x, com_y))) < 1e-9:
             if min(p1[0], p2[0]) <= com_x <= max(p1[0], p2[0]) and \
                min(p1[1], p2[1]) <= com_y <= max(p1[1], p2[1]):
                 return True
    return False

def get_valid_moves(state: State) -> List[State]:
    """Generate all valid next states from the current state."""
    next_states = []
    all_hold_ids = [hold['id'] for hold in holds_data]

    for i, limb in enumerate(['RH', 'LH', 'RF', 'LF']):
        current_hold = state[i]
        
        # Create intermediate state with the limb off the wall
        temp_state_list = list(state)
        temp_state_list[i] = None
        temp_state = State(*temp_state_list)
        
        # Check stability with only 3 limbs
        if not is_stable(temp_state):
            continue

        for hold_id in all_hold_ids:
            if hold_id == current_hold:
                continue # Not a move

            # Create the potential new state
            new_state_list = list(state)
            new_state_list[i] = hold_id
            new_state = State(*new_state_list)
            
            # Check reachability and stability of the new state
            if is_reachable(limb, hold_id, state) and is_stable(new_state):
                next_states.append(new_state)
    return next_states

def heuristic(state: State) -> float:
    """A* heuristic: estimates remaining cost to goal."""
    assert finish_id is not None, "Finish hold ID not set."
    if state.RH == finish_id and state.LH == finish_id:
        return 0.0

    finish_y = hold_coords[finish_id][1]
    
    rh_y = hold_coords[state.RH][1] if state.RH is not None else float('inf')
    lh_y = hold_coords[state.LH][1] if state.LH is not None else float('inf')
    highest_hand_y = min(rh_y, lh_y)
    
    # Vertical distance to finish (y increases downwards)
    vert_dist = max(0, highest_hand_y - finish_y)
    
    # Estimate moves based on an assumed max vertical gain per move (e.g., 20% of wall height)
    estimated_moves = vert_dist / 0.20
    
    # If one hand is on the finish, the next best move is to match it.
    if state.RH == finish_id or state.LH == finish_id:
        return 1.0
        
    return estimated_moves

def cost_between(state1: State, state2: State) -> float:
    """Calculates the cost of a single move between two states."""
    moved_limb_info = next(((limb, state1[i], state2[i]) for i, limb in enumerate(['RH', 'LH', 'RF', 'LF']) if state1[i] != state2[i]), None)
    if not moved_limb_info: return 0.0

    _, old_hold, new_hold = moved_limb_info
    
    # This should not happen with the current logic, but as a safeguard:
    assert old_hold is not None and new_hold is not None, "Move must be from one hold to another"

    base_cost = 1.0
    
    ox, oy = hold_coords[old_hold]
    nx, ny = hold_coords[new_hold]
    dist = math.hypot(nx - ox, ny - oy)

    # Penalize long, strenuous moves
    extra_cost = max(0.0, dist - 0.10) * 5.0
    
    # Penalize moves that lose height
    if ny > oy:
        extra_cost += 0.5
        
    return base_cost + extra_cost

def a_star_search(start_state: State) -> Optional[List[State]]:
    """Performs A* search to find the optimal path to the finish hold."""
    assert finish_id is not None, "Finish hold ID not set."
    
    frontier = []
    heapq.heappush(frontier, (heuristic(start_state), 0.0, start_state)) # (f, g, state)

    came_from = {start_state: None}
    cost_so_far = {start_state: 0.0}
    
    print("Starting A* Search...")
    count = 0

    while frontier:
        count += 1
        _, g_score, current_state = heapq.heappop(frontier)

        if count % 500 == 0:
            print(f"  ... expanded {count} states. Frontier size: {len(frontier)}")

        if g_score > cost_so_far.get(current_state, float('inf')):
            continue

        if current_state.RH == finish_id and current_state.LH == finish_id:
            print(f"Goal reached! Total states explored: {len(cost_so_far)}")
            path = []
            curr = current_state
            while curr is not None:
                path.append(curr)
                curr = came_from[curr]
            return path[::-1]

        for next_state in get_valid_moves(current_state):
            new_cost = g_score + cost_between(current_state, next_state)
            if new_cost < cost_so_far.get(next_state, float('inf')):
                cost_so_far[next_state] = new_cost
                came_from[next_state] = current_state
                f_score = new_cost + heuristic(next_state)
                heapq.heappush(frontier, (f_score, new_cost, next_state))
    
    print("No path found to the finish hold.")
    return None
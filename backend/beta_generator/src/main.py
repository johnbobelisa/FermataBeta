# main.py
import json
import beta_engine
import visualizer  # Import the new visualizer module
from state import State
from climber_model import ClimberModel

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROUTE_DATA_PATH = BASE_DIR.parent.parent / "route_data.json"

def run():
    """Main function to load data, run search, and visualize results."""
    # --- 1. Load Route Data ---
    with open(ROUTE_DATA_PATH, "r") as f:
        route_data = json.load(f)

    # --- 2. Initialize Models and Global State ---
    IMAGE_WIDTH = 800.0   # Define image dimensions
    IMAGE_HEIGHT = 1000.0

    local_climber = ClimberModel()
    local_climber.scale_to_image(IMAGE_HEIGHT)

    # Store both normalized and scaled coordinates
    hold_coords_norm = {h['id']: (h['xNorm'], h['yNorm']) for h in route_data['holds']}
    scaled_hold_coords = {
        h['id']: (h['xNorm'] * IMAGE_WIDTH, h['yNorm'] * IMAGE_HEIGHT) 
        for h in route_data['holds']
    }
    
    # Populate the global variables in the beta_engine module
    beta_engine.climber = local_climber
    beta_engine.holds_data = route_data['holds']
    beta_engine.hold_coords = scaled_hold_coords # Engine uses scaled coords
    beta_engine.finish_id = route_data['finish']

    # --- 3. Define Start State and Run Search ---
    start_holds = route_data['start']
    start_state = State(
        RH=start_holds['RH'], LH=start_holds['LH'], 
        RF=start_holds['RF'], LF=start_holds['LF']
    )
    
    finish_id = route_data['finish']
    print(f"Start State: {start_state}")
    print(f"Finish Hold ID: {finish_id}")
    print("-" * 30)

    path = beta_engine.a_star_search(start_state)

    # --- 4. Print Results and Visualize Poses ---
    print("-" * 30)
    if path:
        print(f"✅ SUCCESS: Path found in {len(path) - 1} moves.")
        print("-" * 30)
        
        # --- NEW VISUALIZATION PART ---
        print("Calculating skeletal poses for each step:")
        for i, state in enumerate(path):
            print(f"\n--- Pose for Step {i}: {state} ---")
            
            # Calculate the full body pose for the current state
            joint_positions = visualizer.calculate_full_body_pose(
                state=state,
                climber=local_climber,
                hold_coords_norm=hold_coords_norm,
                image_width=IMAGE_WIDTH,
                image_height=IMAGE_HEIGHT
            )
            
            # Print the calculated joint coordinates
            for joint, pos in joint_positions.items():
                print(f"  {joint:<10}: (x={pos[0]:.1f}, y={pos[1]:.1f})")
                
    else:
        print("❌ FAILURE: No feasible path was found.")

if __name__ == '__main__':
    run()
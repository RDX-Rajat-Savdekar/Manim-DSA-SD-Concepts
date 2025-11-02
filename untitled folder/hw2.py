import matplotlib.pyplot as plt
import numpy as np

def visualize_trajectories():
    """
    Creates a static plot of the flow-reset trajectories using Matplotlib.
    """
    
    # 1. Store all the trajectory data
    trajectories = [
        {
            "name": "P1", "color": "blue",
            "points": [
                (2, 2), (4, 0), (2, 0), (0, -2), (0, -1),
                (-1, 0), (-0.5, 0), (0, 0.5), (0, 0.25)
            ]
        },
        {
            "name": "P2", "color": "green",
            "points": [
                (-3, 1), (0, 4), (0, 2), (2, 0), (1, 0),
                (0, -1), (0, -0.5), (-0.5, 0), (-0.25, 0)
            ]
        },
        {
            "name": "P3", "color": "orange",  # Yellow is hard to see
            "points": [
                (-2, -3), (-5, 0), (-2.5, 0), (0, 2.5), (0, 1.25),
                (1.25, 0), (0.625, 0), (0, -0.625), (0, -0.3125)
            ]
        },
        {
            "name": "P4", "color": "purple", # Orange is used
            "points": [
                (1, -4), (0, -5), (0, -2.5), (-2.5, 0), (-1.25, 0),
                (0, 1.25), (0, 0.625), (0.625, 0), (0.3125, 0)
            ]
        },
        {
            "name": "P5", "color": "red",
            "points": [
                (0, 0)
            ]
        }
    ]

    # 2. Setup the coordinate system
    fig, ax = plt.subplots(figsize=(10, 10))
    
    # Set up axes centered at (0,0)
    ax.spines['left'].set_position('zero')
    ax.spines['bottom'].set_position('zero')
    ax.spines['right'].set_color('none')
    ax.spines['top'].set_color('none')
    
    # Set axis limits
    ax.set_xlim([-6, 6])
    ax.set_ylim([-6, 6])
    
    # Add labels and grid
    ax.set_xlabel("x", loc='right')
    ax.set_ylabel("y", loc='top', rotation=0)
    ax.grid(True, linestyle='--', alpha=0.5)
    
    # 3. Process each trajectory
    for traj in trajectories:
        points = traj["points"]
        color = traj["color"]
        name = traj["name"]
        
        # Plot all points as dots
        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]
        ax.plot(x_coords, y_coords, 'o', color=color, markersize=8)

        # Label the start point
        ax.text(points[0][0] + 0.1, points[0][1] + 0.1, name, color=color, fontsize=14, fontweight='bold')

        # Draw lines and arrows
        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i+1]
            
            # x, y coordinates for the two points
            x1, y1 = p1
            x2, y2 = p2
            
            # Calculate change
            dx = x2 - x1
            dy = y2 - y1
            
            if i % 2 == 0: 
                # FLOW: Draw a solid line
                ax.plot([x1, x2], [y1, y2], color=color, linestyle='-', linewidth=2)
            else: 
                # RESET: Draw a dashed arrow
                # We use quiver for arrows in data coordinates
                ax.quiver(x1, y1, dx, dy, 
                          angles='xy', scale_units='xy', scale=1, 
                          color=color, linestyle='--', 
                          width=0.005, headwidth=4, headlength=6)

    # 4. Add title
    ax.set_title("Flow-Reset Trajectories", fontsize=16)
    
    # Save the figure
    plt.savefig("flow_reset_trajectories.png")
    print("Trajectory plot saved as 'flow_reset_trajectories.png'")

# Run the visualization function
visualize_trajectories()
from manim import *
import random
from collections import defaultdict



class LinkedListNode(VGroup):
    """
    A Mobject representing a single node in a linked list
    It's a VGroup containing the data_box, data_text, and next_box
    """
    def __init__(self, value, node_color=BLUE, box_width=2.0, box_height=1.0, **kwargs):
        super().__init__(**kwargs)

        # convert value to string for the Text Mobject
        text_val = str(value)

        # create the 'data' part of the node
        self.data_box = Rectangle(
            width = box_width,
            height = box_height,
            color = node_color,
            fill_opacity = 0.5
        )
        self.data_text = Text(text_val, color=WHITE).move_to(self.data_box.get_center())

        # create the 'next' ( pointer ) part of the node 
        self.next_box = Rectangle(
            width = box_width / 2 ,
            height = box_height,
            color = node_color,
            fill_opacity = 0.5
        ).next_to(self.data_box, RIGHT, buff=0)

        # add all parts to the VGroup
        self.add(self.data_box, self.data_text, self.next_box)
    
    def get_data_center(self):
        return self.data_box.get_center()
    
    def get_next_box_center(self):
        return self.next_box.get_center()
    
    def get_left_anchor(self):
        return self.data_box.get_left()

class LinkedList(VGroup):
    """
    A data-driven Mobject that creates and arranges
    a complete visual Linked List from a list of values.
    """
    def __init__(self, values, node_color=BLUE, **kwargs):
        super().__init__(**kwargs)

        # create all the nodes from the input list
        self.nodes = [LinkedListNode(val, node_color=node_color) for val in values]

        # arrange nodes horizontally
        self.nodes_group = VGroup(*self.nodes).arrange(RIGHT, buff=0.5)
        
        # create arrows between nodes
        self.arrows = VGroup()
        for i in range(len(self.nodes) - 1):
            arrow = Arrow(
                self.nodes[i].get_next_box_center(),
                self.nodes[i + 1].get_left_anchor(),
                buff = 0.1
            )
            self.arrows.add(arrow)
        
        #add "null" text and the final arrow
        self.null_text = Text("None").scale(0.5).next_to(self.nodes[-1], RIGHT, buff=1.0)
        null_arrow = Arrow(
            self.nodes[-1].get_next_box_center(),
            self.null_text.get_left(),
            buff = 0.1 
        ).scale(0.7)
        self.arrows.add(null_arrow)

        self.pointers = {} # A dictionary to hold named pointers like "head", "curr"

        # add all components to the VGroup
        self.add(self.nodes_group, self.arrows, self.null_text)
    
    def get_node(self, index):
        return self.nodes[index]
    
    def get_arrows(self):
        return self.arrows
    
    # In manim_utils.py, add these methods INSIDE the LinkedList class

    def create_pointer(self, node_index, label="ptr", p_color=PINK, direction=DOWN, offset=1.0):
        """Creates a pointer, stores it, and returns its FadeIn animation."""
        if node_index >= len(self.nodes):
            print("Error: Node index out of bounds.")
            return FadeIn(Square().set_opacity(0)) # Return empty animation

        target_node = self.nodes[node_index]
        
        # (This is the logic from your Base_DSA_Scene helper)
        if direction is DOWN:
            start_point = target_node.get_bottom() + DOWN*offset
            end_point = target_node.get_bottom()
            label_pos = DOWN
        elif direction is UP:
            start_point = target_node.get_top() + UP*offset
            end_point = target_node.get_top()
            label_pos = UP
        
        arrow = Arrow(start_point, end_point, buff=0.1, color=p_color)
        text = Text(label, color=p_color, font_size=24).next_to(arrow, label_pos, buff=0.1)
        
        pointer_group = VGroup(arrow, text)
        
        # Store it so we can move it later
        self.pointers[label] = pointer_group
        
        # Add it to the main VGroup so it moves with the list
        self.add(pointer_group) 
        
        return FadeIn(pointer_group) # Return the animation

    def transfer_pointer(self, label, new_node_index, direction=DOWN, offset=1.0):
        """Finds a stored pointer and returns its Transform animation."""
        if label not in self.pointers:
            print(f"Error: Pointer '{label}' not found.")
            return FadeIn(Square().set_opacity(0))
            
        if new_node_index >= len(self.nodes):
            print("Error: Node index out of bounds.")
            return FadeIn(Square().set_opacity(0))

        pointer_group = self.pointers[label]
        target_node = self.nodes[new_node_index]
        
        # Create the new target mobjects
        old_arrow = pointer_group[0]
        old_text = pointer_group[1]

        if direction is DOWN:
            new_start = target_node.get_bottom() + DOWN*offset
            new_end = target_node.get_bottom()
            label_pos = DOWN
        elif direction is UP:
            new_start = target_node.get_top() + UP*offset
            new_end = target_node.get_top()
            label_pos = UP
            
        new_arrow = Arrow(new_start, new_end, buff=0.1, color=old_arrow.get_color())
        new_text = Text(old_text.text, color=old_text.get_color(), font_size=24).next_to(new_arrow, label_pos, buff=0.1)
        
        # Store the new mobjects in the pointer group
        # This makes the transform permanent
        self.pointers[label].become(VGroup(new_arrow, new_text))
        
        return Transform(pointer_group[0], new_arrow), Transform(pointer_group[1], new_text)

class Base_DSA_Scene(Scene):
    """
    Our "stage": A base scene that automatically sets up
    a code window on the right and an animation zone on the left.
    """
    
    def setup_layout(self, code_file_path):
        """
        Creates and positions self.listing (the code)
        and self.anim_zone (the animation area).
        """
        
        ### 1. Create and Position the Code ###
        self.listing = Code(
            code_file_path,
            tab_width=4,
            formatter_style="emacs",
            background="rectangle",
            language="Python",
            background_config={
                "fill_color": BLACK,
                "fill_opacity": 1.0,
                "stroke_color": WHITE
            },
            paragraph_config={"font": "Noto Sans Mono",
                              "font_size": 20}
        ).set_z_index(0)
        
        # Position code in the top-right corner
        self.listing.to_corner(UP + RIGHT, buff=0.25)

        # store the x coordinate of the code's center
        self.code_center_x = self.listing.get_center()[0]

        ### 2. Dynamically Define the Animation Zone ###
        
        # Get X-coordinates of code and screen edges
        code_left_x = self.listing.get_left()[0]
        screen_left_x = -config.frame_width / 2

        # Calculate the available width
        anim_zone_width = code_left_x - screen_left_x - 0.5 # 0.25 buff on each side
        
        # Create our anim_zone rectangle
        self.anim_zone = Rectangle(
            width=anim_zone_width,
            color=YELLOW,
            height=config.frame_height * 0.9, 
            stroke_opacity=0.5 # Make it visible by default
        ).to_corner(UP + LEFT, buff=0.25)

        # NEW : Create a log zone

        # Calculate the height for the log zone
        listing_bottom_y = self.listing.get_bottom()[1]
        anim_zone_bottom_y = self.anim_zone.get_bottom()[1]

        # use the space between the bottom of the code
        log_zone_height = (listing_bottom_y - 0.25) - anim_zone_bottom_y

        self.log_zone = Rectangle(
            width = self.listing.get_width(),
            height = log_zone_height,
            color = GREEN,
            stroke_opacity = 0.5
        )

        # We remove the conflicting .align_to(self.anim_zone, DOWN)
        # We position it relative to the listing *only*.
        self.log_zone.next_to(self.listing, DOWN, buff=0.25)
        self.log_zone.align_to(self.listing, LEFT) # Align its left edge

        # Create a manual highlighter
        self.highlighter = Rectangle(
            height = 0.4,
            width = self.listing.get_width(),
            fill_color=YELLOW,
            fill_opacity = 0.4,
            stroke_width = 0.4,
        ).set_z_index(1) # higher meaning in front of the code

        # We are KEEPING the fly-in, so no pre-positioning.
        self.highlighter.set_opacity(0)
        self.add(self.highlighter)


        # Create our log text
        self.log_label = Text("Log:", font_size = 15, color = GRAY)
        self.log_label.align_to(self.log_zone, UP + LEFT).shift(RIGHT*0.2 + DOWN*0.2)
        self.add(self.log_label)
        
        # And a separate, dynamic text mobject
        self.log_text = Text("", font_size=18, color=WHITE)
        self.log_text.next_to(self.log_label, RIGHT, buff=0.2)
        self.add(self.log_text)
        # some new helper methods

    def highlight_line(self, line_num):
        """
        Animates our manual highlight rectangle to a specific line.
        """
        try:
            # Access the Paragraph (index 1), then its submobjects (the lines)
            target_line = self.listing[1].submobjects[line_num]
        except IndexError:
            print(f"Error: Line number {line_num} is out of bounds.")
            return
            
        # 1. Get the target Y-coordinate from the line
        target_y = target_line.get_center()[1]
        
        # 2. Create the new position using our stored X and the target Y
        target_position = [self.code_center_x, target_y, 0]

        # Create the animation
        animation = self.highlighter.animate\
            .move_to(target_position)\
            .set_height(target_line.get_height() + 0.1)\
            .set_opacity(0.4)
        
        self.play(animation, run_time=0.4)
        self.current_highlighted_line = line_num
        self.wait(0.1) # Pause to read the line

    def unhighlight_line(self):
        """Fades out the highlighter."""
        self.play(self.highlighter.animate.set_opacity(0), run_time=0.3)
        self.current_highlighted_line = None
        
    def update_log_text(self, new_text_string):
        """Helper to update the log text Mobject."""
        new_text = Text(new_text_string, font_size=15, color=WHITE)
        # We position it relative to the STATIC label, not the old text
        new_text.next_to(self.log_label, RIGHT, buff=0.2) 
        
        # Animate the transformation
        #self.play(Transform(self.log_text, new_text), run_time=0.5)
        # We replace the single Transform line with a cross-fade
        self.play(
            FadeOut(self.log_text, shift=DOWN*0.2), # Fade out old, moving down
            FadeIn(new_text, shift=DOWN*0.2),    # Fade in new, moving down
            run_time=0.3 # Make it a bit faster
        )
        
        # CRITICAL: We must now update the scene's reference
        # to point to the new text Mobject.
        self.remove(self.log_text) # Remove old text from scene
        self.add(new_text)         # Add new text to scene
        self.log_text = new_text   # Update the variable



        self.wait(0.5)

        # In manim_utils.py

# --- UPDATED FUNCTION SIGNATURE ---
def create_scrambled_title(
    scene, 
    title_string, 
    subtitle_string="Data Structures in Motion",
    transform_time=2.0,  # <-- NEW: Controls the main unscramble
    hold_time=1.0        # <-- NEW: Controls the final pause
):
    """
    A utility function that "takes over" the scene to play
    a full, animated, scrambled title card.
    ...
    """
    
    # ... (Code for scramble and key_map is unchanged) ...
    
    ### 1. Generate Scramble ###
    target_chars = list(title_string)
    scrambled_chars = list(title_string)
    while "".join(scrambled_chars) == title_string:
        random.shuffle(scrambled_chars)
    scrambled_title = "".join(scrambled_chars)

    ### 2. Dynamically Generate Key Map ###
    target_indices = defaultdict(list)
    scrambled_indices = defaultdict(list)
    for i, char in enumerate(target_chars):
        target_indices[char].append(i)
    for i, char in enumerate(scrambled_chars):
        scrambled_indices[char].append(i)
        
    key_map = {}
    for char in target_indices:
        if char in scrambled_indices:
            for i in range(len(target_indices[char])):
                if i < len(scrambled_indices[char]):
                    scrambled_idx = scrambled_indices[char][i]
                    target_idx = target_indices[char][i]
                    key_map[scrambled_idx] = target_idx

    ### 3. Create Mobjects ###
    start_text = Text(scrambled_title, font_size=48).center()
    end_text = Text(title_string, font_size=48).center()
    log_text = Text("Unscrambling...", font_size=24).to_edge(DOWN)
    
    ### 4. Choreograph the Animation ###
    scene.play(Write(start_text), FadeIn(log_text))
    scene.wait(0.5) # Shorter wait
    
    scene.play(
        TransformMatchingShapes(
            start_text, 
            end_text, 
            key_map=key_map
        ),
        log_text.animate.fade(1),
        # --- USE THE NEW PARAMETER ---
        run_time=transform_time 
    )
    scene.wait(0.5) # Shorter wait

    # 4. Add Subtitle
    subtitle = Text(subtitle_string, font_size=36, color=BLUE)
    subtitle.next_to(start_text, DOWN, buff=0.8)
    scene.play(Write(subtitle))

    # --- USE THE NEW PARAMETER ---
    scene.wait(hold_time) 
    
    scene.play(FadeOut(end_text), FadeOut(subtitle))
    scene.wait(0.2)
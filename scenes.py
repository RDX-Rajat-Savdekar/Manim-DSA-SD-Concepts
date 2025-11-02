from manim import *
# importing manim_utils
from manim_utils import *


class IntroToLinkedListScene(Base_DSA_Scene):
    """
    Session 4: The final choreographed "Intro to Linked Lists" video.
    VERSION 2: Includes a "code swap" animation.
    """
    def construct(self):
        
        ### 1. Setup ###
        self.setup_layout("./code_snippets/node_definition.py")
        self.play(Write(self.listing))
        self.wait(1) 

        ### 2. Act 1: "What is a Node?" ###
        self.update_log_text("A Node is a container.")
        self.highlight_line(0) # 'class Node:'
        
        node1 = LinkedListNode("A")
        node1.scale_to_fit_width(self.anim_zone.width * 0.2)
        node1.move_to(self.anim_zone.get_center())
        
        self.play(Create(node1))
        self.wait(1)
        
        ### 3. Act 2: "It has data..." ###
        self.update_log_text("It stores a piece of data...")
        self.highlight_line(2) # 'self.data = data'
        self.play(Indicate(node1.data_box))
        self.wait(1)

        ### 4. Act 3: "...and a 'next' pointer." ###
        self.update_log_text("...and a pointer to the next node.")
        self.highlight_line(3) # 'self.next = None'
        self.play(Indicate(node1.next_box))
        self.wait(1)

        ### 5. Act 4: "Let's link them!" ###
        self.unhighlight_line()
        self.update_log_text("Multiple nodes are linked together.")

        my_list = LinkedList(["A", "B", "C"])
        my_list.scale_to_fit_width(self.anim_zone.width * 0.9)
        my_list.move_to(self.anim_zone.get_center())

        self.play(
            Transform(node1, my_list.get_node(0)),
            FadeIn(my_list.get_node(1)),
            FadeIn(my_list.get_node(2)),
            FadeIn(my_list.arrows),
            FadeIn(my_list.null_text)
        )
        self.wait(1)
        
        # --- ( NEW CODE STARTS HERE ) ---
        
        ### 6. Act 5: "Code Swap" ###
        self.update_log_text("A LinkedList class tracks the 'head'.")

        # Create the new code Mobject
        new_listing = Code(
            "./code_snippets/linked_list_class.py",
            tab_width=4,
            formatter_style="emacs",
            background="rectangle",
            language="Python",
            background_config={
                "fill_color": BLACK,
                "fill_opacity": 1.0,
                "stroke_color": WHITE
            },
            paragraph_config={
                "font": "Noto Sans Mono",
                "font_size": 20
            },
        ).set_z_index(0)
        new_listing.to_corner(UP + RIGHT, buff=0.25)
        
        # We must animate the highlighter and update our scene's variables
        self.play(
            FadeOut(self.listing),
            FadeIn(new_listing),
            # Animate the highlighter to match the new code's width
            self.highlighter.animate.set_width(new_listing.get_width())
        )
        
        # CRITICAL: Update the scene's references
        self.listing = new_listing
        self.code_center_x = new_listing.get_center()[0]
        self.wait(1)

        ### 7. Act 6: "Animate the Head" ###
        self.update_log_text("The 'head' points to the start.")
        2
        # This will now highlight line 2 of the *new* code
        self.highlight_line(2) # 'self.head = None'
        
        # Play the pointer creation simultaneously
        self.play(
            my_list.create_pointer(0, label="head", p_color=YELLOW, direction=UP)
        )
        self.wait(1)
        
        # --- ( NEW CODE ENDS HERE ) ---

        ### 8. Act 7: "The End" ###
        self.unhighlight_line()
        self.update_log_text("The last node points to None.")
        self.play(Indicate(my_list.null_text)) # Flash the None

        self.update_log_text("This is a Linked List.")
        self.wait(2)
        # This one line fades out all Mobjects currently on the scene,
        # including the list, code, log, highlighter, etc.
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5) # A short pause after fading
        # end_message = Text("Thanks for watching!")
        # self.play(Write(end_message))
        create_scrambled_title(
            self, 
            "Thanks for watching!",
            transform_time=1.0, # Unscramble in 1.0s
            hold_time=0.5       # Hold for 0.5s
        )

class testIntroToLinkedList(Base_DSA_Scene):
    # define our input data in1 one place
    INPUT_DATA = ["A", "B", "C", "D", "E", "F", "G", "H"]

    def construct(self):

        self.setup_layout("./code_snippets/node_definition.py")
        self.anim_zone.set_stroke(BLUE, 2)
        self.log_zone.set_stroke(RED, 2)

        self.play(
            Write(self.listing),
            Create(self.anim_zone),
            Create(self.log_zone),
            run_time = 5
        )
        self.wait(1)

        
        ### 1. Test the Factory ###
        # test the factory
        self.update_log_text("Test 1: Create Linked List from the input")
        # create the entire list in ONE line!
        my_list = LinkedList(self.INPUT_DATA)

        my_list.scale_to_fit_width(self.anim_zone.width * 0.8)
        my_list.move_to(self.anim_zone.get_center())

        self.play(Write(my_list), run_time = 5)
        self.wait(1)  


class TestFXScene(Base_DSA_Scene):
    """
    simple scene to test log zone and highlighter
    """
    def construct(self):

        self.setup_layout("./code_snippets/node_definition.py")

        self.anim_zone.set_stroke(BLUE, 2)
        self.log_zone.set_stroke(RED, 2)

        self.play(
            Write(self.listing),
            Create(self.anim_zone),
            Create(self.log_zone),
            run_time = 5
        )
        self.wait(1)

       ### 2. Test Log Text ###
        self.update_log_text("Test 1: Updating log text...")
        
        # --- NEW TEST ---
        # Add a long line to test wrapping
        self.update_log_text(
            "This is a very long log text string to test "
            "if the new width parameter is working correctly."
        )
        # --- END OF TEST ---
        
        ### 3. Test Highlighter ###
        self.update_log_text("Test 2: Testing highlighter...")
        
        # Highlight 'class Node:'
        self.highlight_line(0) 
        
        self.update_log_text("Highlighting line 2...")
        # Highlight 'self.data = data'
        self.highlight_line(2) 
        
        self.update_log_text("Fading highlight...")
        self.unhighlight_line()

        ### 4. Test Clean up ###
        self.update_log_text("All tests complete!")
        self.wait(2)
        
        # Fade out the test zones
        self.play(FadeOut(self.anim_zone), FadeOut(self.log_zone))
        self.wait(1)





class TestLayoutScene(Base_DSA_Scene):
    """
    A simple scene to test our new Base_DSA_Scene layout.
    """
    def construct(self):
        
        ### 1. Setup Layout ###
        # This one line runs all the code we just added to manim_utils
        self.setup_layout("./code_snippets/node_definition.py")
        
        # Make the anim_zone visible for this test
        self.anim_zone.set_stroke(BLUE, 2) 
        
        # Display the code and the zone
        self.play(
            Write(self.listing),
            Create(self.anim_zone)
        )
        self.wait(1)
        
        ### 2. Test placing the LinkedList in the zone ###
        
        # Now we test both utilities together!
        # Create the list using our "smart" LinkedList class
        my_list = LinkedList(["A", "B", "C", "D", "E"])
        
        # Scale and move it to fit INSIDE the anim_zone
        my_list.scale_to_fit_width(self.anim_zone.width * 0.8)
        my_list.move_to(self.anim_zone.get_center())
        
        self.play(Create(my_list))
        self.wait(2)







class TestLL(Scene):
    """
    A scene to test our data-driven Linkedlist Mobject
    and basic arrows animations.
    """

    # define our input data in one place
    INPUT_DATA = ["A", "B", "C"]

    def construct(self):

        ### 1. Test the Factory ###
        # test the factory
        self.add(Text("Test 1: Create Linked List from the input").to_corner(UL))
        
        # create the entire list in ONE line!
        my_list = LinkedList(self.INPUT_DATA)

        self.play(Write(my_list), run_time = 5)
        self.wait(1)
        # self.play(FadeOut(my_list))
        # self.wait(0.5)

        ### 2. Test the Animation Primitives (adding / removing / transforming) ###

        # add a new arrow
        self.add(Text('test 2: Add arrow (head ptr)', font_size=24).to_corner(UL))
        
        #get the first node ("A")
        node0 = my_list.get_node(0)
        head_ptr = Arrow(node0.get_top() + UP*1.0, node0.get_top(), buff=0.1, color = YELLOW)

        self.play(GrowArrow(head_ptr), run_time=2)
        self.wait(1)

        # remove the arrow
        self.add(Text('test 3: Remove arrow', font_size=24).to_corner(UR))
        self.play(FadeOut(head_ptr), run_time=2)

        # test 3 : transfer the arrow
        self.add(Text('test 4: Transfer arrow', font_size=24).to_corner(DR))

        # get the curr pointer and arrow on the bottom of node 0
        curr_ptr = Arrow(node0.get_bottom() + DOWN*1.0, node0.get_bottom(), buff=0.1, color = GREEN)
        self.play(GrowArrow(curr_ptr), run_time = 2)

        # move the arrow to point to node 1
        node1 = my_list.get_node(1)
        new_curr_ptr = Arrow(node1.get_bottom() + DOWN*1.0, node1.get_bottom(), buff=0.1, color = GREEN)

        self.play(Transform(curr_ptr, new_curr_ptr), run_time = 2)

        self.wait(2)
# In scenes.py

from manim import *
# Import our new utility function
from manim_utils import *

# (Your other scenes are here)
# class IntroToLinkedListScene(Base_DSA_Scene): ...


class LinkedTitle(Scene):
    def construct(self):
        # Just call the utility function
        #create_scrambled_title(self, "INTRO TO LINKED LISTS")
        create_scrambled_title(
            self, 
            "SELECTION SORT",
            transform_time=1.5, # Unscramble in 1.5s
            hold_time=1.0       # Hold for 1s
        )

class PathTitle(Scene):
    def construct(self):
        # It works with any string!
        create_scrambled_title(self, "A* PATHFINDING")

# Manim DSA & System Design Concepts

This repository is a collection of data structure, algorithm, and system design animations created with the [Manim](https://www.manim.community/) Python library.

The primary goal is to not only *visualize* these concepts but also to build a **reusable open-source toolkit** (`manim_utils.py`) that makes creating complex DSA animations in Manim simpler and more robust.

-----

## Project Goals

  * **Deep Learning:** To deeply understand Manim's core concepts by building a production-ready animation toolkit from scratch.
  * **Open Source:** To create a high-quality `manim_utils.py` library that others can use to create their own DSA animations (e.g., `LinkedList`, `Grid`, `Base_DSA_Scene`).
  * **Video Playlist:** To produce a full YouTube playlist of animations, starting with data structure fundamentals (Linked Lists) and moving to more complex algorithms (Pathfinding, Sorting).

-----

## The Toolkit: `manim_utils.py`

The core of this project is the `manim_utils.py` library, which provides a set of powerful, "smart" Mobjects and Scenes:

  * **`Base_DSA_Scene`:** A custom base class for all animations. It automatically sets up a dynamic three-zone layout:
      * **`anim_zone`:** A dedicated area for the animation.
      * **`listing`:** A code window for displaying and highlighting source code.
      * **`log_zone`:** An output/status panel for showing status text or algorithm output.
  * **`LinkedListNode` & `LinkedList`:** "Smart" Mobjects that can build and animate themselves. Instead of manually moving nodes, you can simply call methods like `my_list.create_pointer()` or `my_list.transfer_pointer()` and get animations in return.
  * **Helpers:** Robust helper methods like `highlight_line()` (which won't go out of bounds) and `update_log_text()` (with a clean cross-fade).

-----

## Current Status

### 1\. Core Toolkit

  * [x] `Base_DSA_Scene` with dynamic 3-zone layout is complete.
  * [x] `highlight_line()` utility is functional and bounds-checked.
  * [x] `update_log_text()` utility is functional with text-wrapping and cross-fade.

### 2\. Content

  * **Linked Lists**
      * [x] `LinkedListNode` Mobject.
      * [x] `LinkedList` "factory" Mobject.
      * [x] **Video 1: "Intro to Linked Lists"** - Complete. (Animates `Node` and `LinkedList` classes with code swapping).
  * **Title Cards**
      * [x] `create_scrambled_title()` utility (`TransformMatchingStrings`).
  * **Pathfinding (In Progress)**
      * [ ] `GridNode` and `Grid` Mobjects.
      * [ ] `AStarTitleCard` prototype.

-----

## How to Run

This project uses the Python library `manim` (community edition).

1.  **Install dependencies:**

    ```bash
    pip install manim
    ```

2.  **Render a scene:**
    To render one of the videos, use the `manim` command from your terminal.

      * **For a high-quality (1080p) render:**
        ```bash
        manim -pqh scenes.py IntroToLinkedListScene
        ```
      * **For a quick low-quality preview:**
        ```bash
        manim -pql scenes.py TestFXScene
        ```

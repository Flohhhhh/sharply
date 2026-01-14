# Sharply Field of View Reference System – Execution Plan

## Purpose

Build a Field of View reference tool that allows visual comparison of focal lengths and sensor crops using standardized image sets. The system should be extensible, shareable via URL, and usable across desktop and mobile layouts.

---

## System Overview

The feature is composed of three coordinated systems:

1. Image Set Management
2. Interactive Comparison UI
3. State and Shareability Layer

Each system is independent but designed to work together cleanly.

---

## 1. Image Set Management

The system supports multiple **reference image sets**.

Each image set:

- Has a name and a thumbnail image for selection
- Represents one controlled shooting scenario
- Uses remote image URLs
- Contains images captured at fixed focal lengths
- Assumes a consistent camera position and subject distance
- Uses a consistent aspect ratio across all images

Each set includes descriptive metadata:

- Subject description and physical size
- Distance from camera to subject
- Short caption explaining the setup
- Photographer or contributor credit

Users must be able to select which image set is active before comparing focal lengths.

---

## 2. Interactive Comparison UI

### Desktop Layout

- Two full-width columns displayed side by side
- Each column represents one comparison slot
- Each slot allows independent selection of:
  - Focal length
  - Sensor format (from existing constants)
- Focal length can be adjusted via:
  - Vertical scroll interaction (wheel-style)
  - Explicit select control for precision
- The current focal length is visually emphasized
- Adjacent focal lengths are visible but de-emphasized to create a scrolling wheel effect

### Mobile Layout

- Columns collapse into a stacked vertical layout
- Each comparison slot is shown sequentially
- Focal length and sensor selection use explicit controls only
- The comparison model remains the same, with simplified interaction

---

## 3. Sensor Format Representation

Sensor formats are sourced from the existing sensor constants.

Applying a sensor format:

- Does not change perspective or reframe the image
- Displays a visual crop overlay on top of the image
- Indicates the effective capture area of the selected sensor
- Greys out content outside the crop region
- Uses a subtle border or outline to show the crop boundary

This is a visual and educational representation, not a simulated zoom.

---

## 4. Captions and Context

Each comparison slot displays contextual information tied to the selected image set:

- Subject size
- Distance from camera
- Short descriptive caption

This context remains constant as focal length and sensor format change.

---

## 5. State and Shareability

The entire comparison state is represented in the URL:

- Selected image set
- Focal length for each comparison slot
- Sensor format for each slot

This enables:

- Direct linking to specific comparisons
- State persistence on reload
- Easy sharing of exact visual comparisons

State changes should update the URL without triggering a full page reload.

---

## Design Intent

This system is designed to:

- Teach field of view visually rather than mathematically
- Make focal length differences intuitive
- Clarify sensor crop behavior without abstraction
- Scale cleanly as new image sets are added

The implementation should favor clarity, calm UI, and correctness over feature density.

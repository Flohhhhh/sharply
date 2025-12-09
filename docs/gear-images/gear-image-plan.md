Camera scale system plan

Scope and views

Apply physical scale only on the camera comparison page.

All other views (camera detail pages, cards, lists) use a standard layout where the image simply fills a fixed height with object-contain. Those views ignore physical scaling.

Image preparation rules

Use a strict front view only, aligned so the camera body faces straight toward the viewer.

Remove the background and perform a tight crop to the outermost points of the camera body:

Include grip bulges, strap lugs, and viewfinder humps if they extend the true body width.

Avoid extra padding, frame, or shadows.

Save images at any convenient resolution. The file pixel dimensions do not matter as long as cropping is consistent.

Core scaling logic on comparison page

Each camera has a stored bodyWidthMm value for its real physical width.

The comparison layout computes a single pxPerMm scale for the entire row:

Measure available row width.

Subtract total horizontal gaps between cameras.

Divide the remaining width by the widest camera’s bodyWidthMm.

Clamp pxPerMm within a sensible range so items do not become absurdly large or tiny.

For each camera in the row:

Compute displayWidthPx = bodyWidthMm \* pxPerMm.

Render a container with that width.

Place the camera image inside, set to full width with preserved aspect ratio.

This guarantees that every camera on that comparison row is shown at correct relative width.

Responsiveness via hook

A dedicated hook uses ResizeObserver to track the comparison row’s container width.

Whenever the container width changes, the hook:

Recomputes the pxPerMm scale based on the new width and current set of cameras.

Returns both the measured containerWidth and the current pxPerMm.

The comparison component subscribes to this hook so scale adjusts automatically on window resize or layout changes.

Container component responsibilities

A ScaledCameraRow (or similar) component:

Receives an array of cameras with id, name, bodyWidthMm, and imageUrl.

Uses the scaling hook to obtain pxPerMm.

For each camera:

If bodyWidthMm is present, calculates a width from the scale and renders the image within that container.

Aligns all images along a shared baseline so the bottoms line up visually.

Renders labels or captions below each camera as usual.

Fallback behavior when width is missing

If any camera in a comparison lacks bodyWidthMm:

Option A for that specific camera:

Render it with a neutral fixed card width that matches your standard non scaled layout.

Display a small badge or tooltip such as “Size not to scale”.

Option B at the page level:

If one or more cameras in the comparison are missing width data, show a non intrusive warning banner above the comparison table. Example: “Some cameras are shown without physical scaling because width specs are missing.”

Cameras that have valid bodyWidthMm still participate in the scale system. Missing ones fall back to the neutral card layout so the feature degrades gracefully instead of failing entirely.

This gives you a closed loop: consistent image prep, strictly width based scaling for cameras on the compare page, automatic responsiveness through the hook, and clear behavior for missing dimensions so users understand when they are looking at true physical scale and when they are not.

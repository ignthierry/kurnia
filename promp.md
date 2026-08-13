Create a fullscreen interactive web section inspired by a cinematic character-study frame.
Build a React component where a background video fills the entire viewport. The video should not autoplay normally; instead, the horizontal mouse or pointer position controls the video timeline, so moving the cursor left and right scrubs through the video smoothly. Use requestAnimationFrame and video currentTime/fastSeek for smooth easing.

Visual style: - fullscreen 100svh section - dark cinematic background background video object-cover, slightly scaled up subtle black gradient overlay from left and bottom so white text remains adlable - editorial typography, large white title, generous spacing - minimal Ul, no visible controls

- responsive layout for desktop and mobile

Text content:

Top left label: Character Study Top right label: Interactive Web / Motion Narrative

Main title:

Kurnia

Supporting caption: The cutest being on a planet

Layout:

Place the main title near the lower-left area. Place the supporting caption near the lower-right area on desktop, and below the title on mobile. large bold display type for "Kurnia", and smaller bold text for the caption.

Interaction:

Map pointer X position to video progress:

- left side of screen = later part of video
right side of screen = earlier part of video
ease the playhead toward the target progress
pause the video while scrubbing

- preload the video
on accessible with aria-label: "Kurnia - Interactive character story"
Use clean React + TypeScrint code and Tailwind CSS classes if available.

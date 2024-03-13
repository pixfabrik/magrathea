# Magrathea Change Log

8:

- The scheduler now schedules out modes (when in view mode).

7:

- Added "Show" buttons to palettes and overlays so you can see them without having to put them in modes/events.
- There's now a status bar at the bottom to let you know what is currently being shown.
- Started a "viewer app"... It's accessible by adding `viewer` to the URL.
- Now more resilient with palettes in modes: palettes with no ID are skipped, and if the first palette doesn't go all the way to the beginning of the day or the last palette doesn't go all the way to the end, we just extend.

6:

- We now have a "modes" control section. A mode is a sequence of palettes, and can be thought of as different kinds of weather, like clear vs cloudy.
- Added "Help" link at the top.
- Fixed a bug where base pixels with transparency wouldn't get erased properly during an overlay animation. [#1]
- If there are layers in a DPaintJS file, we now load them all as separate overlays.

5:

- We now have an "events" control section. An event (at this point) is an overlay that appears for a duration at a location and can move across the screen.
- There's now a switcher between "view" mode and "edit" mode. View mode acts like the viewer app, scheduling a whole day worth of events. You can use the time slider to move through them, or hit the "Next Event" button to skip to the next one.
- Various UI updates.

4:

- Now honoring the "active" flag on cycles imported from DPaintJS.
- Better error reporting for opening files.
- You can now load overlay pixels. They assume index 0 is transparent.
- You can now collapse and expand the palette controls, as well as the new overlay controls. They start off collapsed by default.

3:

- Added version number to top nav. If you click it, it goes to the changelog.
- The time slider readout now updates as time advances.

2:

- Added import/export for worlds.

1:

- First version.

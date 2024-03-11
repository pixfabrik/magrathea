# Living Worlds Maker

New here? Check out the [wiki](https://github.com/pixfabrik/magrathea/wiki)!

## Running

Requires Node. First time, do an `npm install`. After that, to run:

`npm run dev`

## TODO

### Next

- Add modes to the scheduler and be able to transition between them

### Events

- Be able to specify how frequently they appear
- Be able to specify time ranges they appear during
- Be able to have multiple overlays it can choose from at random
- Better UI for event duration
- Be able to have events start off the top and left sides (currently the X and Y can only go down to 0)
- Min/max for event duration
- Be able to edit event names

### Backlog

- Treat mode palette infos that don't have a palette ID as if they don't exist
- If a mode palette info doesn't exist at the beginning or end of the day, just extend the time
- Transparent base layer issue - https://github.com/pixfabrik/magrathea/issues/1
- Be able to import GIF
- Be able to import PNG8
- "load overlay pixels" doesn't seem to work with LBM files… Actually it does seem to work but it doesn't update the UI evidently.
- Be able to expand and collapse individual modes
- Panel for base pixels
- Remember which panels are expanded or collapsed
- Color cycling should be based on real time rather than the time slider (so it still cycles smoothly when fast forwarding)
- Cycle blending
- Optimize cycling so we only touch the pixels that need to change
- What to do during transition if there are different cycles between palettes?
- Support reverse 4
- Normalize our cycle data so it's not LBM specific
- Support 24 hour clock if the locale is using it
- The AM/PM in the time controls are getting clipped by the clock icon
- Customize ESLint so it doesn't complain about unused variables
- Enable Typescript on server-side

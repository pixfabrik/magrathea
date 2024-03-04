# Living Worlds Maker

## Running

Requires Node. First time, do an `npm install`. After that, to run:

`npm run dev`

## TODO

### Next

### Backlog

- Remember which panels are expanded or collapsed
- Color cycling should be based on real time rather than the time slider (so it still cycles smoothly when fast forwarding)
- Better UI for event duration
- Be able to have events start off the top and left sides (currently the X and Y can only go down to 0)
- Viewer mode
- Min/max for event duration
- Cycle blending
- Optimize cycling so we only touch the pixels that need to change
- What to do during transition if there are different cycles between palettes?
- Support reverse 4
- Normalize our cycle data so it's not LBM specific
- Support 24 hour clock if the locale is using it
- The AM/PM in the time controls are getting clipped by the clock icon
- Customize ESLint so it doesn't complain about unused variables
- Enable Typescript on server-side

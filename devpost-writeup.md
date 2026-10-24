# One Next Step

**Tagline:** Turns an overwhelming to-do list into one calm next action.

## Inspiration

Maya is a university student with ADHD. She doesn't lack a to-do app; she has three. The problem is what happens when she opens one: ten items, all equally loud, and her brain refuses to choose. She closes the app and scrolls her phone instead. This is often called task paralysis, and it's one of the most common barriers people with ADHD describe. Every productivity tool we tried makes it worse by showing *more*: more lists, more tags, more red overdue badges.

We wanted to build the opposite: a tool that shows *less*.

## Who it's for

**One named user:** Maya, a student with ADHD.
**One barrier:** task initiation. A long list makes it impossible for her to decide where to start, so she doesn't start at all.

## What it does

1. **Brain dump.** Maya types everything on her mind, one thing per line, with no sorting. She picks how much energy she has (low, some, plenty) and how long she can focus (5, 15 or 25 minutes).
2. **One next step.** The list disappears. She sees one small, concrete action she can start in under two minutes, like "Open your inbox and find the message", plus one sentence on why it was picked ("This one sounds urgent, so it goes first").
3. **Keep momentum.** `D` marks it done and shows the next step of the same task. `S` ("too big") splits the step into something even smaller, such as "Just get set up". `N` ("not now") moves the task to later with no guilt.
4. **Calm support.** An optional focus timer with a soft chime, a "peek at the list" toggle for when she wants to see everything, and read-aloud for the current step.
5. **Finish.** The last screen shows what she got done, not what is left.

## Accessibility

- Fully keyboard operable with single-key shortcuts (`?` shows them all), plus normal Tab and Enter.
- Every new step, timer event and finished task is announced through an `aria-live` region, and focus moves to the new step, so screen-reader users get the same one-step-at-a-time experience.
- Read aloud uses the browser's speech synthesis.
- Large type, 48px targets, visible focus rings, dark mode, and `prefers-reduced-motion` support.
- No account, no network, nothing to set up. It works offline and stores progress only on the device.

## How we built it

- A single static page in HTML, CSS and vanilla JavaScript, with no framework and no backend.
- Task breakdown uses a set of hand-written "recipes" that match the kind of task (writing, email, calls and bookings, study, chores, forms and bills, applications, shopping, projects) and turn it into 3 to 5 small, concrete steps. Unknown tasks get a gentle generic plan.
- A small scoring function picks the next task from urgency words ("today", "asap", weekday names, "due"), how many times the task was skipped, and Maya's energy level: low energy favours quick wins, high energy favours the biggest task.
- Progress is saved in `localStorage`, so a refresh or closed tab doesn't lose her place.
- The demo video was recorded automatically with Playwright, with captions and a key-press overlay, and narrated with the open-source Kokoro text-to-speech model running locally. ffmpeg mixed the final video.

## Challenges

- Writing first steps that are genuinely small. "Write essay" is not a step; "Open a blank document and type a title" is.
- Making a single-focus interface work for screen readers without being noisy: one polite announcement per change, and focus moved to the step itself.
- Deciding what to *leave out*. Every feature we considered (tags, priorities, calendars) made the screen busier, which is the problem we're solving.

## Accomplishments we're proud of

- The core loop is three keys: D, S, N.
- It runs anywhere a browser does, with zero setup and zero data leaving the device.

## What we learned

For people with ADHD, the hardest part of a task is often the first thirty seconds. Shrinking the first step and hiding everything else did more than any amount of organising features.

## Limitations

- Step suggestions are keyword-based recipes, not a language model, so unusual tasks get a generic plan.
- Urgency detection only reads words in the task text; there are no real due dates.
- Progress lives in one browser, with no sync between devices.
- We have not yet tested it with users with ADHD or across every screen reader; that's the next step.

## What's next

- Optional on-device AI to write steps for tasks the recipes don't cover.
- Real due dates and gentle reminders.
- Testing sessions with ADHD students and screen-reader users.

## AI assistance disclosure

This project was built with Claude (Anthropic) as an AI coding assistant. Claude helped write the app's code, the demo recording script and this write-up, under our direction. The demo voiceover is synthetic speech generated with the open-source Kokoro TTS model. The app itself does not use AI at runtime.

## Built with

html, css, javascript, web-speech-api, web-audio-api, localstorage, playwright, ffmpeg, kokoro-tts, claude

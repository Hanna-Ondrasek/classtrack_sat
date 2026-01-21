# Transcript Upload to SAT Study Plan (Next.js + OCR + Gemini)

This is a Next.js component/workflow that lets a user upload an image of their transcript, extracts course/grade text using OCR (Tesseract.js), parses the results into structured courses, estimates potential SAT score gains based on missing “high impact” coursework, and generates a personalized study plan through a backend API endpoint (Gemini).

The main UI is implemented in `components/UploadTranscript.tsx`.

---

## Link: https://sat-class.vercel.app/

## What it does

1. User uploads a transcript image (JPG/PNG/JPEG)
2. Client-side OCR runs via `tesseract.js` and extracts text
3. Extracted lines are parsed into `{ course, grade }` pairs
4. The app calculates “potential score increases” based on courses not detected on the transcript
5. The app calls `POST /api/generate-plan` to generate a study plan
6. The user can navigate to a day-by-day view with the plan passed as a query param

---

## Screenshots




<img width="1001" height="985" alt="image" src="https://github.com/user-attachments/assets/1d3c5065-ba75-41ae-9474-95420774c402" />
<img width="1802" height="740" alt="image" src="https://github.com/user-attachments/assets/1d32a372-74a0-4f0b-8b20-e36ecafbe562" />
<img width="1553" height="1026" alt="image" src="https://github.com/user-attachments/assets/6cea1ba6-ad7d-41cb-8895-b904774c73ba" />


---

## Tech stack

- Next.js (App Router, client components)
- React + TypeScript
- Tesseract.js (OCR in the browser)
- Tailwind CSS (styling)
- Gemini (via your `/api/generate-plan` route)

---

## Key files

- `components/UploadTranscript.tsx`
  - Upload UI
  - OCR with Tesseract
  - Transcript parsing logic
  - Potential gains calculation
  - Calls the plan generation endpoint
  - Navigates to `/daybyday?plan=...`

- `app/api/generate-plan/route.ts` (or equivalent)
  - Receives `{ coursesAndGrades }`
  - Calls Gemini using `NEXT_PUBLIC_GEMINI_API_KEY` or a server-side key
  - Returns `{ plan }`

---

## How transcript parsing works

The component uses a line-based regex:

- Expected format per line:

```
Course Name - A
Course Name - B+
Course Name - C-
```

Regex used:

```ts
/^(.*?)-\s*(A\+?|A-|B\+?|B-|C\+?|C-|D\+?|D-|F)$/
```

If a line does not match the pattern, it is stored as:

```ts
{ course: line, grade: "N/A" }
```

---

## Potential SAT score gains logic

The component includes a simple heuristic list of “high impact” courses and associated potential point gains.

Example entries:

- Calculus: +200 Math
- AP English/Language: +170 English
- Pre-Calculus: +50 Math
- Physics: +30 Math

It checks whether the uploaded transcript appears to include any course matching each category (case-insensitive substring matching). If not found, it adds that course as a “potential gain” suggestion.

This is implemented in:

- `HighImpactCourses` (list of match strings and points)
- `getPotentialGainsFromUntakenCourses()` (compares transcript courses to the list)

---

## Running locally

### 1) Install dependencies

```bash
npm install
```

### 2) Add environment variables

Create a `.env.local` file in the project root and set your API key:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

Note: If you are calling Gemini from a server route, it is better to use a server-only env var (without `NEXT_PUBLIC_`) so the key is not exposed in the browser. This component reads `NEXT_PUBLIC_GEMINI_API_KEY`, but the actual call is made through `/api/generate-plan`, so you can keep the key server-side in the route implementation.

### 3) Start the dev server

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

---

## How to test

### Manual test checklist

1. Upload a clear transcript screenshot (JPG/PNG/JPEG)
2. Confirm OCR text appears under “Extracted Text”
3. Confirm “Detected Courses and Grades” list populates
4. Confirm “Potential Score Increases” panel renders
5. Confirm “study plan generated” state appears
6. Click “Take me to my personalized study plan!” and verify navigation to `/daybyday?plan=...`


## Notes / limitations

- OCR quality depends heavily on image quality and transcript formatting.
- The parsing regex expects a `Course - Grade` line format; transcripts that use tables or different separators may need additional parsing logic.
- Passing the full plan via query string can get large; storing plans server-side or in local storage would be more robust for longer outputs.

---

## Future improvements

- Support PDF transcripts (server-side OCR or PDF parsing)
- Add a transcript formatting guide for best OCR results
- Improve course/grade extraction with a more robust parser
- Store plans in a database instead of query params
- Add loading states and error handling for low-quality OCR cases

---

## Developed at MIT's Sundai

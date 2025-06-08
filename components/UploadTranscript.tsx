// components/UploadTranscript.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

// --- TYPES ---
type CourseGrade = { course: string; grade: string };

// New type to detail potential increase per course
type PotentialCourseGain = {
  courseName: string; // The user-friendly name of the course
  subject: 'Math' | 'English'; // Which subject the points apply to
  points: number; // The potential points increase
};

// --- API setup ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

async function generateStudyPlanWithGemini(coursesAndGrades: CourseGrade[]) {
  const response = await fetch("/api/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coursesAndGrades }),
  });

  const data = await response.json();
  return data.plan;
}

// Define a list of high-impact courses and their potential points
// 'matches' are strings to check against taken course names (case-insensitive, includes check)
const HighImpactCourses = [
  { matches: ["calculus"], displayName: "Calculus", mathPoints: 200 },
  { matches: ["ap english", "ap lang"], displayName: "AP English/Language", englishPoints: 170 },
  { matches: ["ap lit"], displayName: "AP Literature", englishPoints: 90 },
  { matches: ["pre-calculus", "precalculus"], displayName: "Pre-Calculus", mathPoints: 50 },
  { matches: ["algebra"], displayName: "Algebra", mathPoints: 20 },
  { matches: ["physics"], displayName: "Physics", mathPoints: 30 },
  { matches: ["journalism", "writing"], displayName: "Journalism/Writing", englishPoints: 30 },
  { matches: ["english"], displayName: "General English", englishPoints: 10 },
];

// New function to calculate potential gains from courses the student hasn't taken
function getPotentialGainsFromUntakenCourses(takenCourses: CourseGrade[]): PotentialCourseGain[] {
  const takenCourseLowerNames = new Set(takenCourses.map(c => c.course.toLowerCase()));
  const potentialGains: PotentialCourseGain[] = [];

  HighImpactCourses.forEach(impactCourse => {
    // Check if ANY of the 'matches' strings for this impactCourse are included in ANY taken course name
    const hasTakenThisType = impactCourse.matches.some(matchStr =>
      Array.from(takenCourseLowerNames).some(takenName => takenName.includes(matchStr))
    );

    if (!hasTakenThisType) {
      if (impactCourse.mathPoints && impactCourse.mathPoints > 0) {
        potentialGains.push({
          courseName: impactCourse.displayName,
          subject: 'Math',
          points: impactCourse.mathPoints,
        });
      }
      if (impactCourse.englishPoints && impactCourse.englishPoints > 0) {
        potentialGains.push({
          courseName: impactCourse.displayName,
          subject: 'English',
          points: impactCourse.englishPoints,
        });
      }
    }
  });

  return potentialGains;
}

export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [structuredCourses, setStructuredCourses] = useState<CourseGrade[]>([]);
  // State to store the detailed potential gains per course
  const [potentialCourseGains, setPotentialCourseGains] = useState<PotentialCourseGain[] | null>(null);
  const [studyPlan, setStudyPlan] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile ?? null);

    if (selectedFile) {
      setIsProcessing(true);
      // Reset plan related states when new file is uploaded
      setExtractedText("");
      setStructuredCourses([]);
      setPotentialCourseGains(null); // Reset potential gains too
      setStudyPlan("");
      setIsGeneratingPlan(false);

      Tesseract.recognize(selectedFile, 'eng', {
        logger: m => console.log(m),
      })
        .then(({ data: { text } }) => {
          const fixedText = text
            .split("\n")
            .map(line => line.replace(/^([a-z])/, (_, c) => c.toUpperCase()))
            .join("\n")
            .replace(/(\bB)\s*\+/g, '$1+')
            .replace(/(\bA)\s*\+/g, '$1+');

          setExtractedText(fixedText);
        })
        .catch(err => {
          console.error("OCR failed", err);
          setExtractedText("Failed to extract text.");
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }

  useEffect(() => {
    if (extractedText) {
      const gradePattern = /^(.*?)-\s*(A\+?|A-|B\+?|B-|C\+?|C-|D\+?|D-|F)$/;
      const lines = extractedText.split("\n").filter(line => line.trim() !== "");

      const parsed: CourseGrade[] = lines.map(line => {
        const match = line.match(gradePattern);
        return match
          ? { course: match[1].trim(), grade: match[2] }
          : { course: line, grade: "N/A" };
      });

      setStructuredCourses(parsed);
      // Calculate and set the detailed potential gains
      const gains = getPotentialGainsFromUntakenCourses(parsed);
      setPotentialCourseGains(gains);

      setIsGeneratingPlan(true);
      generateStudyPlanWithGemini(parsed)
        .then(plan => setStudyPlan(plan))
        .catch(() => setStudyPlan("Failed to generate study plan."))
        .finally(() => setIsGeneratingPlan(false));
    }
  }, [extractedText]);

  const handleGoToPlan = () => {
    if (studyPlan && studyPlan !== "Failed to generate study plan.") {
      const encodedStudyPlan = encodeURIComponent(studyPlan);
      router.push(`/daybyday?plan=${encodedStudyPlan}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="mx-auto my-20 max-w-5xl rounded-3xl border border-neutral-200 bg-neutral-100 p-10 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-3xl font-bold mb-6 text-center">Upload Transcript & Get Your Personalized SAT Plan</h1>

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 border p-6 rounded-lg bg-white dark:bg-neutral-800">
            <input type="file" accept="image/*" onChange={handleFileChange} ref={inputRef} style={{ display: "none" }} />
            <button onClick={handleButtonClick} className="w-full rounded-lg bg-blue-500 px-6 py-3 text-white text-lg hover:bg-blue-600">
              Upload Transcript File
            </button>

            {isProcessing && <p className="mt-4 text-blue-600">Processing... Please wait.</p>}

            {extractedText && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
                <p className="whitespace-pre-wrap">{extractedText}</p>
              </div>
            )}

            {structuredCourses.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Detected Courses and Grades:</h2>
                <ul className="list-disc ml-5">
                  {structuredCourses.map((item, index) => (
                    <li key={index}>{item.course}: {item.grade}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-full md:w-1/3 border p-6 rounded-lg bg-neutral-50 dark:bg-neutral-800">
            <h2 className="text-lg font-semibold mb-2">📌 Upload Instructions</h2>
            <p>Please upload only:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>JPG</li>
              <li>PNG</li>
              <li>JPEG</li>
            </ul>
          </div>
        </div>

        {/* Updated display for potential score increases, showing specific courses, without markdown bolding */}
        {potentialCourseGains && potentialCourseGains.length > 0 && (
          <div className="mt-10 border p-6 rounded-lg bg-green-50 dark:bg-neutral-800">
            <h2 className="text-xl font-semibold mb-2">Potential Score Increases from Future Coursework:</h2>
            <ul className="list-disc ml-5">
              {potentialCourseGains.map((gain, index) => (
                <li key={index}>
                  If you take {gain.courseName}, your {gain.subject} score can increase by up to {gain.points} points!
                </li>
              ))}
            </ul>
          </div>
        )}
        {potentialCourseGains && potentialCourseGains.length === 0 && (
            <div className="mt-10 border p-6 rounded-lg bg-green-50 dark:bg-neutral-800">
                <h2 className="text-xl font-semibold mb-2">Potential Score Increases from Future Coursework:</h2>
                <p>Based on your transcript, you've already taken many courses that build SAT readiness!</p>
            </div>
        )}


        {isGeneratingPlan && (
          <p className="mt-6 text-blue-600">Generating personalized study plan... please wait.</p>
        )}

        {studyPlan && !isGeneratingPlan && studyPlan !== "Failed to generate study plan." && (
          <div className="mt-6 text-center">
            <p className="mb-4 text-green-600 font-semibold">Your study plan has been generated!</p>
            <button
              onClick={handleGoToPlan}
              className="rounded-lg bg-purple-600 px-8 py-3 text-white text-lg font-semibold hover:bg-purple-700 transition duration-300 ease-in-out"
            >
              Take me to my personalized study plan!
            </button>
          </div>
        )}

        {studyPlan === "Failed to generate study plan." && !isGeneratingPlan && (
          <p className="mt-6 text-center text-red-600">Failed to generate study plan. Please try again.</p>
        )}
      </div>
    </div>
  );
}
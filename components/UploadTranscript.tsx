"use client";

import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

// --- TYPES ---
type CourseGrade = { course: string; grade: string };
type EstimatedScores = { math: number; english: number };

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



function estimateSATScores(coursesAndGrades: CourseGrade[]): EstimatedScores {
  let math = 500, english = 510;

  coursesAndGrades.forEach(({ course }) => {
    const name = course.toLowerCase();
  
    if (name.includes("pre-calculus") || name.includes("precalculus")) {
      math += 50;
    } else if (/\bcalculus\b/.test(name)) {
      math += 200;
    } else if (name.includes("algebra")) {
      math += 20;
    }
  
    if (name.includes("physics")) math += 30;
  
    if (name.includes("ap lit")) english += 90;
    else if (name.includes("ap english") || name.includes("ap lang")) english += 170;
    else if (name.includes("journalism") || name.includes("writing")) english += 30;
    else if (name.includes("english")) english += 10;
  });

  return { math: Math.min(800, Math.max(400, math)), english: Math.min(800, Math.max(400, english)) };
}

export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [structuredCourses, setStructuredCourses] = useState<CourseGrade[]>([]);
  const [estimatedScores, setEstimatedScores] = useState<EstimatedScores | null>(null);
  const [studyPlan, setStudyPlan] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile ?? null);
  
    if (selectedFile) {
      setIsProcessing(true);
  
      Tesseract.recognize(selectedFile, 'eng', {
        logger: m => console.log(m),
      })
        .then(({ data: { text } }) => {
          // Postprocess the extracted text to fix OCR mistakes
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
      const scores = estimateSATScores(parsed);
      setEstimatedScores(scores);

      setIsGeneratingPlan(true);
      generateStudyPlanWithGemini(parsed)
        .then(plan => setStudyPlan(plan))
        .catch(() => setStudyPlan("Failed to generate study plan."))
        .finally(() => setIsGeneratingPlan(false));
    }
  }, [extractedText]);

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

        {estimatedScores && (
          <div className="mt-10 border p-6 rounded-lg bg-green-50 dark:bg-neutral-800">
            <h2 className="text-xl font-semibold mb-2">Estimated SAT Scores:</h2>
            <p>📊 Math: {estimatedScores.math}</p>
            <p>📖 English: {estimatedScores.english}</p>
          </div>
        )}

        {isGeneratingPlan && (
          <p className="mt-6 text-blue-600">Generating personalized study plan... please wait.</p>
        )}

        {studyPlan && !isGeneratingPlan && (
          <div className="mt-6 border p-6 rounded-lg bg-purple-50 dark:bg-neutral-800">
            <h2 className="text-xl font-semibold mb-2">Personalized Study Plan:</h2>
            <p className="whitespace-pre-wrap">{studyPlan}</p>
          </div>
        )}
      </div>
    </div>
  );
}

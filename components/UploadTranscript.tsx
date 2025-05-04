"use client";

import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(apiKey);


async function generateStudyPlanWithGemini(coursesAndGrades) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
  const coursesText = coursesAndGrades.map(c => `${c.course} - ${c.grade}`).join("\n");

  const prompt = `
You are an SAT study advisor.

Here are the student's courses and grades:

${coursesText}

Please do the following:
1. Determine what SAT Math topics they should review based on the courses they have and haven't taken.
2. Determine what SAT English topics they should review based on the courses they have and haven't taken.
3. Provide a 7-day personalized study plan for Math and English based on this.

Return it in organized, readable text.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return await response.text();
}

function estimateSATScores(coursesAndGrades) {
  let math = 500, english = 500;

  coursesAndGrades.forEach(({ course }) => {
    const name = course.toLowerCase();
    if (name.includes("calculus")) math += 60;
    else if (name.includes("pre-calculus") || name.includes("precalculus")) math += 40;
    else if (name.includes("algebra")) math += 20;
    if (name.includes("physics")) math += 30;
    if (name.includes("ap english") || name.includes("ap lang") || name.includes("ap lit")) english += 40;
    else if (name.includes("journalism") || name.includes("writing")) english += 30;
    else if (name.includes("english")) english += 10;
  });

  return { math: Math.min(800, Math.max(400, math)), english: Math.min(800, Math.max(400, english)) };
}

export default function UploadTranscript() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [structuredCourses, setStructuredCourses] = useState([]);
  const [estimatedScores, setEstimatedScores] = useState(null);
  const [studyPlan, setStudyPlan] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const inputRef = useRef(null);

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile ?? null);

    if (selectedFile) {
      setIsProcessing(true);
      Tesseract.recognize(selectedFile, 'eng', { logger: m => console.log(m) })
        .then(({ data: { text } }) => {
          setExtractedText(text);
          setIsProcessing(false);
        });
    }
  }

  useEffect(() => {
    if (extractedText) {
      const gradePattern = /\b(A\+?|A-|B\+?|B-|C\+?|C-|D\+?|D-|F)\b/;
      const lines = extractedText.split("\n").filter(line => line.trim() !== "");

      const parsed = lines.map(line => {
        const match = line.match(gradePattern);
        return match
          ? { course: line.replace(match[0], "").trim(), grade: match[0] }
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
      <Navbar/>
    <div className="mx-auto my-20 max-w-5xl rounded-3xl border border-neutral-200 bg-neutral-100 p-10 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Transcript & Get Your Personalized SAT Plan</h1>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Upload Box */}
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

        {/* Instructions Box */}
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

      {/* Results */}
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

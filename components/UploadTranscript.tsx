
"use client";

import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";

function estimateSATScores(coursesAndGrades: { course: string; grade: string }[]) {
  let mathScore = 500;
  let englishScore = 500;

  coursesAndGrades.forEach(item => {
    const courseName = item.course.toLowerCase();

    // Math detection
    if (courseName.includes("calculus")) {
      mathScore += 60;
    } else if (courseName.includes("pre-calculus") || courseName.includes("precalculus")) {
      mathScore += 40;
    } else if (courseName.includes("algebra")) {
      mathScore += 20;
    }

    if (courseName.includes("physics")) {
      mathScore += 30;
    }

    // English detection
    if (courseName.includes("ap english") || courseName.includes("ap lang") || courseName.includes("ap lit")) {
      englishScore += 40;
    } else if (courseName.includes("journalism") || courseName.includes("writing")) {
      englishScore += 30;
    } else if (courseName.includes("english")) {
      englishScore += 10;
    }
  });

  mathScore = Math.min(800, Math.max(400, mathScore));
  englishScore = Math.min(800, Math.max(400, englishScore));

  return {
    math: mathScore,
    english: englishScore
  };
}



export default function UploadTranscript() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [structuredCourses, setStructuredCourses] = useState<{ course: string; grade: string }[]>([]);
  const [estimatedScores, setEstimatedScores] = useState<{ math: number; english: number } | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile ?? null);

    if (selectedFile) {
      setIsProcessing(true);
      function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const selectedFile = e.target.files?.[0];
  setFile(selectedFile ?? null);

  if (selectedFile) {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setExtractedText(data.text);
        setIsProcessing(false);
      })
      .catch(err => {
        console.error(err);
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
  
        if (match) {
          const grade = match[0];
          const course = line.replace(grade, "").replace(/\s+/g, " ").trim(); // remove grade from line
          return { course, grade };
        } else {
          return { course: line, grade: "N/A" };
        }
      });
  
      setStructuredCourses(parsed);

      const scores = estimateSATScores(parsed);
      setEstimatedScores(scores);
    }
  }, [extractedText]);

  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={inputRef}
        style={{ display: "none" }}
      />

      {/* Custom button */}
      <button
        onClick={handleButtonClick}
        className="px-6 py-3 bg-blue-500 text-white rounded text-lg"
      >
        Upload Transcript File
      </button>

      {isProcessing && <p>Processing... Please wait.</p>}

      {extractedText && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
          <p className="whitespace-pre-wrap">{extractedText}</p>
        </div>
      )}

      {/* 📌 NEW: Show structured courses and grades */}
      {structuredCourses.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Detected Courses and Grades:</h2>
          <ul>
            {structuredCourses.map((item, index) => (
              <li key={index}>
                {item.course}: {item.grade}
              </li>
            ))}
          </ul>
        </div>
      )}
      {estimatedScores && (
  <div className="mt-6">
    <h2 className="text-xl font-semibold mb-2">Estimated SAT Scores:</h2>
    <p>📊 Math: {estimatedScores.math}</p>
    <p>📖 English: {estimatedScores.english}</p>
  </div>
)}

      
    </div>
  );
}

// components/DaybyDay.tsx
"use client"; // Needs to be a client component to use `useSearchParams`

import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import Navbar from "@/components/Navbar";

export default function DaybyDay() {
  const searchParams = useSearchParams();
  const studyPlan = searchParams.get('plan'); // Get the 'plan' query parameter

  return (
    <div>
      <Navbar />
      <div className="mx-auto my-20 max-w-5xl rounded-3xl border border-neutral-200 bg-neutral-100 p-10 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Personalized Task-By-Task Study Plan!</h1>
        <p className="text-center mb-10">Below, you will also find how much your scores could potentially increase if you take select courses!</p>

        {/* Display the study plan only if it exists */}
        {studyPlan ? ( // Check if studyPlan has a value
          <div className="mt-6 border p-6 rounded-lg bg-purple-50 dark:bg-neutral-800">
            <h2 className="text-xl font-semibold mb-2">Personalized Study Plan:</h2>
            <p className="whitespace-pre-wrap">{decodeURIComponent(studyPlan)}</p> {/* Decode the URL component */}
          </div>
        ) : (
          <div className="mt-6 text-center text-red-500">
            <p>No study plan found. Please upload your transcript to generate one.</p>
            {/* Optionally add a link back to the upload page */}
            <p className="mt-2"><a href="/upload" className="text-blue-600 hover:underline">Go to Upload Page</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { calculateCourseImpact, getKhanAcademyRecommendations } from "@/lib/courseImpact";

interface StudyDay {
  date: string;
  tasks: Array<{
    description: string;
    completed: boolean;
    khanAcademyLink?: string;
  }>;
}

interface CourseImpact {
  course: string;
  impact: number;
  potentialScoreIncrease: number;
  relatedTopics: string[];
  khanAcademyLinks: string[];
}

export default function YourStudyPlan() {
  const router = useRouter();
  const [studyDays, setStudyDays] = useState<StudyDay[]>([]);
  const [courseImpacts, setCourseImpacts] = useState<CourseImpact[]>([]);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const toggleTaskCompletion = (dayIndex: number, taskIndex: number) => {
    setStudyDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex].tasks[taskIndex].completed = !newDays[dayIndex].tasks[taskIndex].completed;
      return newDays;
    });
  };

  useEffect(() => {
    const savedData = localStorage.getItem('studyPlanData');
    if (savedData) {
      const { coursesAndGrades, plan } = JSON.parse(savedData);
      
      // Calculate course impacts
      const impacts = coursesAndGrades.map(({ course, grade }: { course: string, grade: number }) => {
        const impact = calculateCourseImpact(course, grade.toString());
        return impact;
      }).filter((impact: CourseImpact | null): impact is CourseImpact => impact !== null);

      setCourseImpacts(impacts);

      // Parse the plan into daily tasks
      const days = plan.split("\n\n").map((day: string, index: number) => {
        // Skip empty entries
        if (!day.trim()) return null;
        
        // Extract and clean the first line
        const firstLine = day.split("\n")[0].trim();
        // Extract the topic by removing any day markers and numbers
        const topic = firstLine.replace(/^(Day\s+[0-9]+:\s*|[0-9]+\.\s*)/, "").trim();
        
        // Extract and format tasks
        const tasks = day.split("\n").slice(1).map((task: string) => {
          const trimmedTask = task.trim();
          if (!trimmedTask) return null;
          
          return {
            description: trimmedTask,
            completed: false,
            khanAcademyLink: getKhanAcademyRecommendations(trimmedTask.split(":")[0]?.split(",") || [])?.[0]
          };
        }).filter(Boolean);
        
        return { 
          date: `Day ${index + 1}: ${topic || "Study Plan"}`,
          tasks 
        };
      }).filter((day: any): day is StudyDay => day !== null);

      setStudyDays(days);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Impact Summary */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Course Impact Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseImpacts.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <h3 className="text-lg font-semibold mb-2">{impact.course}</h3>
                <div className="text-gray-600 mb-4">
                  <p>Impact: {impact.impact}</p>
                  <p>Potential Score Increase: {impact.potentialScoreIncrease}</p>
                </div>
                <div className="mt-auto">
                  <h4 className="font-medium text-xs mb-1">Related Topics:</h4>
                  <ul className="list-disc pl-3 space-y-0.5">
                    {impact.relatedTopics.slice(0, 2).map((topic, i) => (
                      <li key={i} className="text-gray-600 text-xs">{topic}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Study Plan */}
        <section>
          <h2 className="text-3xl font-bold mb-6">16-Day Personalized Study Plan</h2>

          {/* Study Plan Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Study Plan Overview</h3>
            <div className="space-y-6">
              {/* Math Topics */}
              <div>
                <h4 className="font-semibold mb-2">SAT Math Topics to Review</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-700">Algebra: linear equations, systems of equations, functions, and graphing</li>
                  <li className="text-gray-700">Geometry: shapes and their properties, area, perimeter, volume, and the Pythagorean theorem</li>
                  <li className="text-gray-700">Data Analysis: mean, median, mode, standard deviation, and interpreting charts and graphs</li>
                  <li className="text-gray-700">Trigonometry: sine, cosine, tangent, and their applications</li>
                </ul>
              </div>

              {/* English Topics */}
              <div>
                <h4 className="font-semibold mb-2">SAT English Topics to Review</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-700">Vocabulary: focusing on words that are commonly used in SAT passages</li>
                  <li className="text-gray-700">Reading Comprehension: strategies for understanding and analyzing complex passages, identifying the main idea, and making inferences</li>
                  <li className="text-gray-700">Writing and Language: grammar, punctuation, sentence structure, and rhetoric</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Daily Study Plan */}
          <div className="space-y-4">
            {studyDays.map((day, dayIndex) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Day {dayIndex + 1}: {day.date}</h4>
                    <button
                      onClick={() => toggleDayExpansion(day.date)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg 
                        className={`w-5 h-5 transform ${
                          expandedDays.includes(day.date) ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {expandedDays.includes(day.date) ? (
                    <div className="space-y-3">
                      {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(dayIndex, taskIndex)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-gray-700">{task.description}</p>
                            {task.khanAcademyLink && (
                              <a
                                href={task.khanAcademyLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center text-blue-500 hover:text-blue-700 text-sm"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Learn on Khan Academy
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center">
                      <p className="text-gray-600">Click to view tasks</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Edit Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push("/upload")}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Edit Study Plan
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

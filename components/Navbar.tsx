"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => router.push("/")}
      >
        <div className="text-2xl">✅</div>
        <h1 className="text-base font-bold md:text-2xl">ClassTrack SAT</h1>
      </div>

      <button 
        onClick={() => router.push("https://www.sundai.club/projects/afec3e0b-19da-4170-9509-0e293e639c09")}
        className="w-32 transform rounded-lg bg-gray-100 px-6 py-2 font-medium text-black transition-all duration-300 hover:bg-gray-200"
      >
        Made at Sundai
      </button>
    </nav>
  );
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { coursesAndGrades } = await req.json();

  const coursesText = coursesAndGrades.map((c: { course: string; grade: string }) => `${c.course} - ${c.grade}`).join("\n");

  const prompt = `
You are an SAT study advisor.

Here are the student's courses and grades:

${coursesText}

Please do the following (and keep it concise to be within token limits). Make it so that it sounds like
you're talking to the student:
1. Determine what SAT Math topics they should review based on the courses they have and haven't taken.
2. Determine what SAT English topics they should review based on the courses they have and haven't taken.
3. Provide a 7-day personalized study plan for Math and English based on this.

Return it in organized, readable text.
`;

console.log("API KEY BEING USED:", process.env.OPENROUTER_API_KEY);
const apiKey = process.env.OPENROUTER_API_KEY;


  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    
    method: "POST",
    headers: {
        "Authorization": `Bearer ${apiKey!}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sat-class.vercel.app/upload",
        "X-Title": "SAT Plan Generator",
      },
      
    body: JSON.stringify({
      model: "mistralai/mixtral-8x7b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  console.log("OpenRouter Response", JSON.stringify(data, null, 2));


  const choice = data.choices?.[0];

const content = choice?.message?.content || choice?.text || "Failed to generate study plan.";

return NextResponse.json({ plan: content });

}

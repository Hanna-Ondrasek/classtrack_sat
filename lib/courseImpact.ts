interface CourseImpact {
  course: string;
  impact: number;
  potentialScoreIncrease: number;
  relatedTopics: string[];
  khanAcademyLinks: string[];
  satSections: string[];
}

interface SATResource {
  section: string;
  playlistUrl: string;
  relatedCourses: string[];
  description: string;
}

export const SAT_RESOURCES: SATResource[] = [
  {
    section: "Reading & Writing",
    playlistUrl: "https://www.youtube.com/watch?v=zpE-CfCvXiE&list=PL6dL3ACWCL8c_Vw8F0-97LPMr927tkAFV",
    relatedCourses: ["English", "Literature", "Writing"],
    description: "Comprehensive playlist covering SAT Reading and Writing sections"
  },
  {
    section: "Heart of Algebra",
    playlistUrl: "https://www.youtube.com/watch?v=fmt6mKBQhVg&list=PL6dL3ACWCL8ebFVL96B5PPrFv4gxckJu8",
    relatedCourses: ["Algebra 1", "Algebra 2"],
    description: "Focused playlist for Heart of Algebra SAT section"
  },
  {
    section: "Passport to Advanced Math",
    playlistUrl: "https://www.youtube.com/watch?v=zpE-CfCvXiE&list=PL6dL3ACWCL8c_Vw8F0-97LPMr927tkAFV",
    relatedCourses: ["Algebra 2", "Precalculus"],
    description: "Advanced math topics for SAT"
  },
  {
    section: "Problem Solving & Data Analysis",
    playlistUrl: "https://www.youtube.com/watch?v=zpE-CfCvXiE&list=PL6dL3ACWCL8c_Vw8F0-97LPMr927tkAFV",
    relatedCourses: ["Algebra 1", "Algebra 2", "Geometry", "Statistics"],
    description: "Data analysis and problem-solving skills"
  },
  {
    section: "Additional Topics in Math",
    playlistUrl: "https://www.youtube.com/watch?v=q9_L7aTmbZw&list=PL6dL3ACWCL8cIVmBrzwD8JEy2i9jZUWgA",
    relatedCourses: ["Geometry", "Algebra 2", "Precalculus"],
    description: "Geometry, complex numbers, and trigonometry"
  }
];

export function calculateCourseImpact(course: string, grade: string): CourseImpact | null {
  const gradeValue = parseInt(grade);
  
  // Basic impact calculation based on grade
  let impact = 0;
  if (gradeValue >= 90) impact = 100;
  else if (gradeValue >= 80) impact = 80;
  else if (gradeValue >= 70) impact = 60;
  else if (gradeValue >= 60) impact = 40;
  else impact = 20;

  // Calculate potential SAT score increase based on course and grade
  let potentialScoreIncrease = 0;
  
  // Map course to SAT sections and calculate impact
  const satSections: string[] = [];
  const relatedTopics: string[] = [];
  const khanAcademyLinks: string[] = [];

  // Reading & Writing related courses
  if (['English', 'Literature', 'Writing'].includes(course)) {
    satSections.push('Reading & Writing');
    potentialScoreIncrease += impact * 0.8;
    khanAcademyLinks.push(SAT_RESOURCES[0].playlistUrl);
    relatedTopics.push('Reading Comprehension', 'Writing Skills', 'Grammar');
  }

  // Heart of Algebra related courses
  if (['Algebra 1', 'Algebra 2'].includes(course)) {
    satSections.push('Heart of Algebra');
    potentialScoreIncrease += impact * 0.7;
    khanAcademyLinks.push(SAT_RESOURCES[1].playlistUrl);
    relatedTopics.push('Linear Equations', 'Systems of Equations', 'Functions');
  }

  // Passport to Advanced Math related courses
  if (['Algebra 2', 'Precalculus'].includes(course)) {
    satSections.push('Passport to Advanced Math');
    potentialScoreIncrease += impact * 0.6;
    khanAcademyLinks.push(SAT_RESOURCES[2].playlistUrl);
    relatedTopics.push('Quadratic Equations', 'Polynomials', 'Rational Expressions');
  }

  // Problem Solving & Data Analysis related courses
  if (['Algebra 1', 'Algebra 2', 'Geometry', 'Statistics'].includes(course)) {
    satSections.push('Problem Solving & Data Analysis');
    potentialScoreIncrease += impact * 0.5;
    khanAcademyLinks.push(SAT_RESOURCES[3].playlistUrl);
    relatedTopics.push('Data Analysis', 'Statistics', 'Probability');
  }

  // Additional Topics related courses
  if (['Geometry', 'Algebra 2', 'Precalculus'].includes(course)) {
    satSections.push('Additional Topics in Math');
    potentialScoreIncrease += impact * 0.4;
    khanAcademyLinks.push(SAT_RESOURCES[4].playlistUrl);
    relatedTopics.push('Geometry', 'Trigonometry', 'Complex Numbers');
  }

  // Cap potential score increase at 160 points per section
  potentialScoreIncrease = Math.min(potentialScoreIncrease, 160);

  // If no SAT sections are related, return null
  if (satSections.length === 0) return null;

  return {
    course,
    impact,
    potentialScoreIncrease,
    relatedTopics,
    khanAcademyLinks,
    satSections
  };
}

export function getKhanAcademyRecommendations(topics: string[]): string[] {
  const recommendations: string[] = [];
  
  // Map topics to relevant SAT sections
  const topicToSection: Record<string, string> = {
    'Reading': 'Reading & Writing',
    'Writing': 'Reading & Writing',
    'Grammar': 'Reading & Writing',
    'Algebra': 'Heart of Algebra',
    'Equations': 'Heart of Algebra',
    'Functions': 'Heart of Algebra',
    'Data': 'Problem Solving & Data Analysis',
    'Statistics': 'Problem Solving & Data Analysis',
    'Probability': 'Problem Solving & Data Analysis',
    'Geometry': 'Additional Topics in Math',
    'Trigonometry': 'Additional Topics in Math',
    'Complex Numbers': 'Additional Topics in Math'
  };

  topics.forEach(topic => {
    const section = topicToSection[topic];
    if (section) {
      const resource = SAT_RESOURCES.find(r => r.section === section);
      if (resource) {
        recommendations.push(resource.playlistUrl);
      }
    }
  });

  // Remove duplicates and return unique recommendations
  return [...new Set(recommendations)];
}
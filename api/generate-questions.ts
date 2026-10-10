export const config = {
  runtime: 'edge'
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, message: 'GEMINI_API_KEY not configured in Vercel environment variables.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  
  const { topic, level, difficulty, count = 3, datasetName } = body;

  const prompt = `Generate ${count} advanced MongoDB practical questions. 
Topic: ${topic || 'General MongoDB'}
Difficulty: ${difficulty || 'Medium'}
Level: ${level || 3}
Dataset context: ${datasetName || 'General'}

Return a JSON array of objects. Each object MUST exactly match this structure:
{
  "title": "String (Short question title)",
  "scenario": "String (The context or problem description)",
  "type": "String (must be either 'write-command' or 'multiple-choice')",
  "expectedCommand": "String (The correct MongoDB shell command, required if type is write-command. E.g. db.users.find({}))",
  "options": ["String", "String", "String", "String"],
  "correctOptionIndex": 0,
  "explanation": "String (Detailed explanation of the correct answer)",
  "misconception": "String (A common pitfall or incorrect approach)",
  "conceptFocus": "String (The core MongoDB concept being tested)",
  "points": 10
}
Note: For multiple-choice questions, "options" must be an array of exactly 4 strings, and "correctOptionIndex" must be a number between 0 and 3. For write-command questions, leave options empty and provide expectedCommand.`;

  try {
    const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(\`Gemini API Error (\${response.status}): \${errText.substring(0, 200)}\`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("Empty or invalid response from Gemini API");
    }

    let questions = JSON.parse(text);
    
    // Validate and post-process
    if (!Array.isArray(questions)) {
        questions = [questions];
    }
    
    questions = questions.map((q: any, i: number) => ({
      ...q,
      id: \`ai_\${Date.now()}_\${i}_\${Math.random().toString(36).substring(2, 6)}\`,
      topic: topic || 'AI Generated',
      level: level || 3,
      difficulty: difficulty || 'Medium',
      datasetName: datasetName || 'Custom',
      type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
      tags: ['ai-generated', 'dynamic', 'gemini-2.5']
    }));

    return new Response(JSON.stringify({ success: true, questions }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new Response(JSON.stringify({ success: false, message: error.message || 'Unknown Server Error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured in Vercel environment variables.' });
  }
  
  const { topic, level, difficulty, count = 3, datasetName, existingQuestionsToAvoid } = req.body;

  let avoidInstruction = '';
  if (existingQuestionsToAvoid && existingQuestionsToAvoid.length > 0) {
    const titles = existingQuestionsToAvoid.slice(-6).map((t: string) => `"${t}"`).join(', ');
    avoidInstruction = ` Avoid repeating similar questions to: ${titles}.`;
  }

  const prompt = `Generate ${count} advanced MongoDB practical quiz questions. 
Topic: ${topic || 'General MongoDB'}
Difficulty: ${difficulty || 'Medium'}
Level: ${level || 3}
Dataset context: ${datasetName || 'General'}${avoidInstruction}

SPEED & BREVITY RULES (CRITICAL):
- Keep "scenario" concise (maximum 1-2 sentences).
- Keep "explanation" and "misconception" crisp and direct (maximum 1-2 sentences).
- Keep option strings concise.
- Output ONLY the valid JSON array without any markdown wrappers or conversational filler.

Return a JSON array of objects. Each object MUST exactly match this structure:
{
  "title": "String (Short question title)",
  "scenario": "String (Concise 1-2 sentence context or problem description)",
  "type": "String (must be either 'write-command' or 'multiple-choice')",
  "expectedCommand": "String (The correct MongoDB shell command, required if type is write-command. E.g. db.users.find({}))",
  "options": ["String", "String", "String", "String"],
  "correctOptionIndex": 0,
  "explanation": "String (Concise 1-2 sentence explanation)",
  "misconception": "String (Concise 1-sentence common pitfall)",
  "conceptFocus": "String (The core MongoDB concept being tested)",
  "points": 10
}
Note: For multiple-choice questions, "options" must be an array of exactly 4 strings, and "correctOptionIndex" must be a number between 0 and 3. For write-command questions, leave options empty array [] and provide expectedCommand.`;

  try {
    // Prioritize gemini-2.5-flash-lite with thinking turned off for ultra-fast response (sub-3s)
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    let lastError: any = null;
    let text: string | undefined;

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7500);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        });
        clearTimeout(timer);

        if (response.ok) {
          const data = await response.json();
          text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) break;
        } else {
          const errText = await response.text().catch(() => '');
          lastError = new Error(`Gemini ${model} Error (${response.status}): ${errText.substring(0, 200)}`);
        }
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') break;
      }
    }

    if (!text) {
      throw lastError || new Error("Empty or invalid response from Gemini API");
    }

    let questions: any;
    try {
      questions = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
      questions = JSON.parse(cleaned);
    }
    
    if (!Array.isArray(questions)) {
      questions = [questions];
    }
    
    questions = questions.map((q: any, i: number) => ({
      ...q,
      id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      topic: topic || 'AI Generated',
      level: level || 3,
      difficulty: difficulty || 'Medium',
      datasetName: datasetName || 'Custom',
      type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
      tags: ['ai-generated', 'dynamic', 'gemini']
    }));

    return res.status(200).json({ success: true, questions });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message || 'Unknown Server Error' });
  }
}

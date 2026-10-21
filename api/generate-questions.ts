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

  const prompt = `Generate exactly ${count} practical, high-caliber MongoDB quiz questions modeled directly after professional MongoDB developer certification standards.
Topic: ${topic || 'CRUD Operations'}
Difficulty: ${difficulty || 'Medium'}
Curriculum Level: ${level || 3}
Dataset context: ${datasetName || 'GptData02 (Students collection with fields: _id, Name, Section, GPA, Age, Course, Courses, Marks, Active, MonthOfAdmission)'}${avoidInstruction}

AUTHENTIC MONGODB QUESTION GUIDELINES (MATCH USER'S STYLE):
1. USE REAL APP DATASETS & SCHEMAS:
   - Primary: 'GptData02' (student records: Name, Section, GPA, Age, Course, Courses [array], Marks, Active)
   - Secondary: 'inventory' (sku, quantity, price, warehouse, tags [array]), 'orders' (orderId, customer, items [array of subdocs], totalAmount, status), 'accounts' (accountNumber, balance, status), or 'users' (username, email, role, createdAt).
2. WRITE-COMMAND REALISM:
   - Provide genuine executable mongosh shell commands (e.g. db.GptData02.find({ Section: "A" }, { Name: 1, GPA: 1, _id: 0 }), db.accounts.findOneAndUpdate(...), db.orders.aggregate([...])).
   - Provide 2-3 "acceptableAlternatives" with variations in spacing, single/double quotes, or alternative valid mongosh forms so user inputs are graded fairly.
3. MULTIPLE-CHOICE REALISM:
   - Include believable developer misconceptions as distractors (e.g. confusing $in with $or, forgetting {_id: 0} in projections, assuming findOneAndUpdate returns the new doc without returnDocument: "after").
   - Optionally provide a concise "codeSnippet" (1-4 lines of JSON document or command) if examining code.
4. SPEED & BREVITY RULES:
   - Keep "scenario" concise (1-2 sentences).
   - Keep "explanation" and "misconception" crisp and punchy (1-2 sentences each).
   - Output ONLY the raw valid JSON array without any markdown wrappers.

Return a JSON array of objects. Each object MUST exactly match this structure:
{
  "title": "String (Short question title)",
  "scenario": "String (Concise 1-2 sentence context or problem description)",
  "codeSnippet": "String or null (Optional 1-3 lines of sample document or query)",
  "type": "String (must be either 'write-command' or 'multiple-choice')",
  "expectedCommand": "String (The correct MongoDB shell command if write-command, e.g. db.GptData02.find({ Section: 'A' }, { Name: 1, _id: 0 }))",
  "acceptableAlternatives": ["String", "String"],
  "options": ["String", "String", "String", "String"],
  "correctOptionIndex": 0,
  "explanation": "String (Concise 1-2 sentence explanation)",
  "misconception": "String (Concise 1-sentence common pitfall)",
  "conceptFocus": "String (The core MongoDB concept being tested)",
  "points": 10
}
Note: For multiple-choice questions, "options" must be an array of exactly 4 strings, and "correctOptionIndex" must be a number between 0 and 3. For write-command questions, leave options empty array [] and provide expectedCommand and acceptableAlternatives.`;

  try {
    const models = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
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
                thinkingLevel: 'low'
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
    
    questions = questions.map((q: any, i: number) => {
      let acceptableAlternatives = Array.isArray(q.acceptableAlternatives) ? q.acceptableAlternatives : [];
      if (q.type === 'write-command' && q.expectedCommand && acceptableAlternatives.length === 0) {
        const cmd = String(q.expectedCommand);
        const singleQuoteVer = cmd.replace(/"/g, "'");
        const doubleQuoteVer = cmd.replace(/'/g, '"');
        const noSpaceVer = cmd.replace(/:\s+/g, ':').replace(/,\s+/g, ',');
        acceptableAlternatives = Array.from(new Set([cmd, singleQuoteVer, doubleQuoteVer, noSpaceVer]));
      }

      return {
        ...q,
        id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        topic: topic || 'AI Generated',
        level: level || 3,
        difficulty: difficulty || 'Medium',
        datasetName: datasetName || 'GptData02',
        type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
        codeSnippet: q.codeSnippet || undefined,
        acceptableAlternatives: acceptableAlternatives.length > 0 ? acceptableAlternatives : undefined,
        tags: ['ai-generated', 'dynamic', 'gemini']
      };
    });

    return res.status(200).json({ success: true, questions });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message || 'Unknown Server Error' });
  }
}

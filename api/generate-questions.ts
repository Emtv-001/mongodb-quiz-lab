import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Max allowed for Vercel Hobby plan

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured in Vercel environment variables.' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const { topic, level, difficulty, count = 3, datasetName } = req.body;

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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    let questions = JSON.parse(response.text);
    
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

    return res.status(200).json({ success: true, questions });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

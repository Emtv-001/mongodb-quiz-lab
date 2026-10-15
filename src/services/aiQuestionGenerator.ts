import { MongoTopic, Question, DifficultyLevel, CurriculumLevel, QuestionType } from '../types';
import { getSiteCustomization } from './adminService';

export interface GenerationOptions {
  topic?: MongoTopic;
  level?: CurriculumLevel;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  datasetName?: string;
  count?: number;
  apiKeyOverride?: string;
}

/**
 * Builds the strict structured JSON prompt for Gemini.
 */
function buildQuestionPrompt(options: GenerationOptions): string {
  const { topic, level, difficulty, count = 3, datasetName } = options;
  return `Generate ${count} advanced MongoDB practical questions. 
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
}

/**
 * Normalizes raw JSON response from Gemini into valid Question[] format.
 */
function parseAndFormatQuestions(text: string, options: GenerationOptions): Question[] {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Attempt markdown cleanup if surrounded with ```json ... ```
    const cleaned = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed.map((q: any, i: number) => ({
    ...q,
    id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
    topic: options.topic || 'General MongoDB',
    level: options.level || 3,
    difficulty: options.difficulty || 'Medium',
    datasetName: options.datasetName || 'Custom',
    type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
    tags: ['ai-generated', 'dynamic', 'gemini']
  }));
}

/**
 * Direct call to Google Gemini API from browser (Alternative 1).
 * Completely bypasses Vercel 10s Serverless Function timeouts and execution errors.
 */
export async function directGeminiGenerate(prompt: string, apiKey: string): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini ${model} Error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`No text returned by ${model}`);
      }
      return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Direct Gemini call failed with ${model}:`, err.message);
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API");
}

/**
 * Tests a Gemini API key with a fast ping request.
 */
export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Please enter a Gemini API Key to test.' };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, message: `HTTP ${res.status}: ${errText.slice(0, 150)}` };
    }

    return { success: true, message: 'Connection verified! Gemini 2.0 Flash is operational.', model: 'gemini-2.0-flash' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed.' };
  }
}

/**
 * Generates dynamic, AI-synthesized practical MongoDB questions on the fly.
 * Priority 1: Direct Client-Side Gemini (Immune to Vercel timeouts)
 * Priority 2: Vercel Backend Proxy (/api/generate-questions)
 */
export async function generateAiDynamicQuestions(options: GenerationOptions = {}): Promise<Question[]> {
  const prompt = buildQuestionPrompt(options);

  // 1. Resolve API Key for direct client-side generation
  let apiKey = options.apiKeyOverride;

  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  if (!apiKey) {
    try {
      const siteConfig = await getSiteCustomization();
      if (siteConfig?.geminiApiKey) {
        apiKey = siteConfig.geminiApiKey;
      }
    } catch {}
  }

  // 2. If API Key is available, perform direct client-side call
  if (apiKey && apiKey.trim()) {
    try {
      const rawJson = await directGeminiGenerate(prompt, apiKey);
      const questions = parseAndFormatQuestions(rawJson, options);
      if (questions.length > 0) {
        return questions;
      }
    } catch (clientErr: any) {
      console.warn("Direct client Gemini failed, falling back to backend proxy...", clientErr.message);
    }
  }

  // 3. Fallback: Call Vercel backend route (/api/generate-questions)
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      let errText = await response.text().catch(() => '');
      let msg = `Failed (HTTP ${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch {
        if (errText) msg += ' - ' + errText.substring(0, 100);
      }
      throw new Error(msg);
    }

    const data = await response.json();
    if (data.success && data.questions && data.questions.length > 0) {
      return data.questions;
    }
  } catch (proxyErr: any) {
    console.warn("Backend proxy also failed:", proxyErr.message);
    throw proxyErr;
  }

  return [];
}

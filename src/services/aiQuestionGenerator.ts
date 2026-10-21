import { MongoTopic, Question, DifficultyLevel, CurriculumLevel, QuestionType } from '../types';
import { getSiteCustomization } from './adminService';
import { sanitizeQuestion } from './storage';
import { reportSystemIncident } from './incidentService';

export interface GenerationOptions {
  topic?: MongoTopic;
  level?: CurriculumLevel;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  datasetName?: string;
  count?: number;
  apiKeyOverride?: string;
  existingQuestionsToAvoid?: string[];
}

/**
 * Builds a dynamic, versatile structured JSON prompt for Gemini.
 * Generates practical, varied MongoDB questions across diverse real-world industry domains
 * (e-commerce, fintech, IoT time-series, SaaS multi-tenant, healthcare, gaming, logs, and more)
 * without being artificially restricted to any single fixed dataset.
 */
function buildQuestionPrompt(options: GenerationOptions): string {
  const { topic, level, difficulty, count = 3, datasetName, existingQuestionsToAvoid } = options;
  let avoidInstruction = '';
  if (existingQuestionsToAvoid && existingQuestionsToAvoid.length > 0) {
    const titles = existingQuestionsToAvoid.slice(-6).map(t => `"${t}"`).join(', ');
    avoidInstruction = `\nAvoid repeating similar questions to: ${titles}.\n`;
  }

  const datasetContext = datasetName
    ? `Specific dataset: ${datasetName}`
    : `Diverse real-world production datasets (draw freely from varied domains: e-commerce, fintech, IoT telemetry, SaaS multi-tenancy, healthcare, logistics, social media, gaming, or general databases)`;

  return `Generate exactly ${count} practical, high-caliber MongoDB quiz questions modeled after real-world production engineering and MongoDB certification challenges.
Topic: ${topic || 'CRUD Operations'}
Difficulty: ${difficulty || 'Medium'}
Curriculum Level: ${level || 3}
Dataset context: ${datasetContext}${avoidInstruction}

VERSATILE REAL-WORLD MONGODB QUESTION GUIDELINES:
1. DIVERSE INDUSTRY DOMAINS & REALISTIC SCHEMAS:
   - Do NOT restrict yourself to any single dataset. Feel free to use varied, creative, realistic production collections:
     * E-Commerce / Retail: db.products, db.orders, db.customers, db.reviews
     * Fintech & Payments: db.transactions, db.accounts, db.ledgers, db.wallets
     * IoT & Time-Series: db.sensor_readings, db.telemetry, db.devices, db.metrics
     * SaaS & Cloud Services: db.tenants, db.subscriptions, db.audit_logs, db.users
     * Healthcare & Life Sciences: db.patients, db.appointments, db.medical_records
     * Social & Media Streaming: db.posts, db.comments, db.media, db.notifications
     * Education & Academics: db.students, db.courses, db.enrollments, db.GptData02
     * Logistics & Supply Chain: db.shipments, db.inventory, db.warehouses
2. WRITE-COMMAND REALISM:
   - Provide genuine, executable mongosh shell commands (e.g. db.collection.find(...), db.collection.aggregate([...]), db.collection.updateOne(...), db.collection.createIndex(...)).
   - Provide 2-3 "acceptableAlternatives" with variations in spacing, single/double quotes, or alternative valid mongosh forms so user inputs are graded fairly.
3. MULTIPLE-CHOICE REALISM:
   - Include believable developer misconceptions as distractors (e.g. confusing $in with $or, projection rules, index ESR prefix rules, pipeline stage ordering).
   - Optionally include a concise "codeSnippet" (1-4 lines of JSON document, query, or pipeline) whenever helpful.
4. SPEED & BREVITY RULES:
   - Keep "scenario" concise (1-2 sentences).
   - Keep "explanation" and "misconception" crisp and punchy (1-2 sentences each).
   - Output ONLY the raw valid JSON array without any markdown wrappers.

Return a JSON array of objects. Each object MUST exactly match this structure:
{
  "title": "String (Short question title)",
  "scenario": "String (Concise 1-2 sentence context or problem description)",
  "codeSnippet": "String or null (Optional 1-3 lines of sample document or query)",
  "datasetName": "String (Name of the collection, e.g. 'orders', 'transactions', 'telemetry', 'students')",
  "type": "String (must be either 'write-command' or 'multiple-choice')",
  "expectedCommand": "String (The correct MongoDB shell command if write-command)",
  "acceptableAlternatives": ["String", "String"],
  "options": ["String", "String", "String", "String"],
  "correctOptionIndex": 0,
  "explanation": "String (Concise 1-2 sentence explanation of correct answer)",
  "misconception": "String (Concise 1-sentence common pitfall)",
  "conceptFocus": "String (Core concept)",
  "points": 10
}
Note: For multiple-choice questions, "options" must be an array of exactly 4 strings, and "correctOptionIndex" must be a number between 0 and 3. For write-command questions, leave options as empty array [] and provide expectedCommand and acceptableAlternatives.`;
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

  return parsed.map((q: any, i: number) => {
    // Ensure acceptableAlternatives are provided for write-command
    let acceptableAlternatives = Array.isArray(q.acceptableAlternatives) ? q.acceptableAlternatives : [];
    if (q.type === 'write-command' && q.expectedCommand && acceptableAlternatives.length === 0) {
      const cmd = String(q.expectedCommand);
      const singleQuoteVer = cmd.replace(/"/g, "'");
      const doubleQuoteVer = cmd.replace(/'/g, '"');
      const noSpaceVer = cmd.replace(/:\s+/g, ':').replace(/,\s+/g, ',');
      acceptableAlternatives = Array.from(new Set([cmd, singleQuoteVer, doubleQuoteVer, noSpaceVer]));
    }

    return sanitizeQuestion({
      ...q,
      id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      topic: options.topic || 'General MongoDB',
      level: options.level || 3,
      difficulty: options.difficulty || 'Medium',
      datasetName: q.datasetName || options.datasetName || 'General',
      type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
      codeSnippet: q.codeSnippet || undefined,
      acceptableAlternatives: acceptableAlternatives.length > 0 ? acceptableAlternatives : undefined,
      tags: ['ai-generated', 'dynamic', 'gemini', (options.topic || 'mongodb').toLowerCase().replace(/\s+/g, '-')]
    }, i);
  });
}

/**
 * Direct call to Google Gemini API from browser (Alternative 1).
 * Completely bypasses Vercel 10s Serverless Function timeouts and execution errors.
 * Uses gemini-3.8-flash with thinkingLevel: "low" for ultra-fast, high-quality responses.
 */
export async function directGeminiGenerate(
  prompt: string,
  apiKey: string,
  timeoutMs: number = 7500
): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
  let lastError: Error | null = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`Direct Gemini call failed with ${model}:`, err.message);
      if (err.name === 'AbortError') {
        break; // Don't continue to next model if hard timeout elapsed
      }
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API");
}

/**
 * Tests a Gemini API key with a fast ping request using gemini-3.8-flash.
 */
export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Please enter a Gemini API Key to test.' };
  }
  const testModels = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
  let lastErr = '';

  for (const model of testModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: 'low'
            }
          }
        })
      });

      if (res.ok) {
        return { success: true, message: `Connection verified! Model ${model} is active and operational.`, model };
      }

      const errText = await res.text().catch(() => '');
      lastErr = `HTTP ${res.status}: ${errText.slice(0, 150)}`;
    } catch (err: any) {
      lastErr = err.message || 'Connection failed.';
    }
  }

  return { success: false, message: lastErr };
}

/**
 * Generates dynamic, AI-synthesized practical MongoDB questions on the fly.
 * Priority 1: Direct Client-Side Gemini (Immune to Vercel timeouts, sub-3s via flash-lite & 0-thinking)
 * Priority 2: Vercel Backend Proxy (/api/generate-questions) with 7.5s hard timeout
 */
export async function generateAiDynamicQuestions(options: GenerationOptions = {}): Promise<Question[]> {
  const prompt = buildQuestionPrompt(options);

  // 1. Resolve API Key for direct client-side generation
  let apiKey = options.apiKeyOverride;

  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  // Fast check: check local cached site config first to avoid a 1-2s serverless cold-start roundtrip
  if (!apiKey) {
    try {
      const cached = localStorage.getItem('mongo_quiz_site_config_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey;
      }
    } catch {}
  }

  if (!apiKey) {
    try {
      const siteConfig = await getSiteCustomization();
      if (siteConfig?.geminiApiKey) {
        apiKey = siteConfig.geminiApiKey;
        try {
          localStorage.setItem('mongo_quiz_site_config_cache', JSON.stringify(siteConfig));
        } catch {}
      }
    } catch {}
  }

  // 2. If API Key is available, perform direct client-side call (7.5s hard limit)
  if (apiKey && apiKey.trim()) {
    try {
      const rawJson = await directGeminiGenerate(prompt, apiKey, 7500);
      const questions = parseAndFormatQuestions(rawJson, options);
      if (questions.length > 0) {
        return questions;
      }
    } catch (clientErr: any) {
      console.warn("Direct client Gemini failed, falling back to backend proxy...", clientErr.message);
    }
  }

  // 3. Fallback: Call Vercel backend route (/api/generate-questions) with 7.5s hard timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(options)
    });
    clearTimeout(timeoutId);

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
      return data.questions.map((q: any, idx: number) => sanitizeQuestion(q, idx));
    }
  } catch (proxyErr: any) {
    console.warn("Backend proxy also failed or timed out:", proxyErr.message);
    // Automatically report incident to admin portal and emails
    reportSystemIncident({
      service: 'Google Gemini AI',
      summary: 'Question Generation Failed',
      technicalDetails: proxyErr.message || String(proxyErr),
      context: `Topic: ${options.topic || 'General'}, Level: ${options.level || 3}`
    }).catch(() => {});
    throw proxyErr;
  }

  return [];
}

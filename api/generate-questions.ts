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

  const datasetContext = datasetName
    ? `Specific dataset: ${datasetName}`
    : `Diverse real-world production datasets (draw freely from varied domains: e-commerce, fintech, IoT telemetry, SaaS multi-tenancy, healthcare, logistics, social media, gaming, or general databases)`;

  // Compact prompt — fewer input tokens = faster response
  const prompt = `Generate exactly ${count} MongoDB quiz questions. Be concise, fast, and structured.
Topic: ${topic || 'CRUD Operations'} | Difficulty: ${difficulty || 'Medium'} | Level: ${level || 3}
Dataset context: ${datasetContext}${avoidInstruction}

MANDATORY SPECIFICATION RULE (DO NOT OMIT):
Every question MUST explicitly state concrete, exact schema coordinates. Do NOT use vague names or leave learners guessing:
1. "databaseName": Specific database name (e.g. 'ecommerce_db', 'fintech_db', 'school_db', 'hospital_db', 'iot_db').
2. "datasetName": Specific collection name without 'db.' prefix (e.g. 'orders', 'products', 'accounts', 'GptData02', 'patients', 'sensors', 'users').
3. "fieldNames": Array of 1-4 EXACT field names tested (e.g. ["status", "totalAmount"], ["GPA", "Course"], ["balance", "accountNumber"]).
4. "scenario": MUST begin with the explicit target spec:
   "Database: [database_name] | Collection: db.[collection_name] | Field(s): [exact_fields]\\n[Problem statement]"

Questions missing databaseName, datasetName, or fieldNames are strictly invalid and will be discarded.

Mix question types: write-command (mongosh) or multiple-choice.
For multiple-choice: 4 options, believable misconceptions as distractors.
For write-command: real executable mongosh command (e.g. db.orders.find(...)) + 2-3 acceptableAlternatives.

Return ONLY a raw JSON array — no markdown wrappers. Each item:
{"title":"string","scenario":"Database: [db] | Collection: db.[col] | Field(s): [fields]\\n[1-2 sentence scenario]","codeSnippet":"string or null","databaseName":"string","datasetName":"string","fieldNames":["string"],"type":"write-command|multiple-choice","expectedCommand":"string (write-command only)","acceptableAlternatives":["string"],"options":["string","string","string","string"],"correctOptionIndex":0,"explanation":"1-2 sentences","misconception":"1 sentence","conceptFocus":"string","points":10}`;

  try {
    // gemini-3.8-flash-lite: ultra-fast, no thinking overhead, ideal for structured JSON
    const models = ['gemini-3.8-flash-lite', 'gemini-3.8-flash', 'gemini-3-flash-preview'];
    let lastError: any = null;
    let text: string | undefined;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              // thinkingBudget: 0 disables thinking tokens — reduces latency to ~2-4s
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) break;
        } else {
          const errText = await response.text().catch(() => '');
          lastError = new Error(`Gemini ${model} Error (${response.status}): ${errText.substring(0, 200)}`);
        }
      } catch (err: any) {
        // Continue to the next fallback model rather than aborting entirely
        lastError = err;
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

    // Strict Validation: "If any of these is missing (database, collection, field name), let site not generate the question."
    const validQuestions = questions.filter((q: any) => {
      const hasDb = Boolean(q.databaseName && String(q.databaseName).trim());
      const hasCol = Boolean((q.datasetName || datasetName) && String(q.datasetName || datasetName).trim());
      const hasFields = Array.isArray(q.fieldNames) && q.fieldNames.length > 0;
      const hasValidTitle = Boolean(q.title && String(q.title).trim());
      return hasDb && hasCol && hasFields && hasValidTitle;
    });

    const formattedQuestions = validQuestions.map((q: any, i: number) => {
      let acceptableAlternatives = Array.isArray(q.acceptableAlternatives) ? q.acceptableAlternatives : [];
      if (q.type === 'write-command' && q.expectedCommand && acceptableAlternatives.length === 0) {
        const cmd = String(q.expectedCommand);
        const singleQuoteVer = cmd.replace(/"/g, "'");
        const doubleQuoteVer = cmd.replace(/'/g, '"');
        const noSpaceVer = cmd.replace(/:\s+/g, ':').replace(/,\s+/g, ',');
        acceptableAlternatives = Array.from(new Set([cmd, singleQuoteVer, doubleQuoteVer, noSpaceVer]));
      }

      const cleanDb = String(q.databaseName).trim();
      const cleanCol = String(q.datasetName || datasetName).replace(/^db\./i, '').trim();
      const cleanFields = Array.isArray(q.fieldNames) ? q.fieldNames.map((f: any) => String(f).trim()).filter(Boolean) : [];

      return {
        ...q,
        id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        topic: topic || 'AI Generated',
        level: level || 3,
        difficulty: difficulty || 'Medium',
        databaseName: cleanDb,
        datasetName: cleanCol,
        fieldNames: cleanFields,
        type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
        codeSnippet: q.codeSnippet || undefined,
        acceptableAlternatives: acceptableAlternatives.length > 0 ? acceptableAlternatives : undefined,
        tags: ['ai-generated', 'dynamic', 'gemini']
      };
    });

    return res.status(200).json({ success: true, questions: formattedQuestions });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message || 'Unknown Server Error' });
  }
}

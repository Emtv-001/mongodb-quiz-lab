import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

for (const difficulty of ['All', 'Easy', 'Medium', 'Hard', 'Expert']) {
  test(`AI seed and background batches preserve ${difficulty} selection`, async () => {
    const requests = [];
    const saved = [];
    const imports = {
      '../data/questions': { DEFAULT_QUESTIONS: [{ id: 'static', title: 'Static', difficulty: 'Easy' }] },
      '../data/mockExams': { MOCK_EXAM_PRESETS: [] },
      './storage': {
        loadCustomQuestions: async () => [], loadProgress: () => ({}),
        appendCustomQuestions: async questions => { saved.push(...questions); }
      },
      './aiQuestionGenerator': { generateAiDynamicQuestions: async options => {
        requests.push(options);
        return Array.from({ length: options.count }, (_, i) => ({
          id: `ai_${requests.length}_${i}`, title: `Generated ${requests.length}-${i}`,
          difficulty: options.difficulty, tags: ['ai-generated']
        }));
      } }
    };
    const module = { exports: {} };
    const { outputText } = ts.transpileModule(readFileSync(new URL('../src/services/quizEngine.ts', import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: false }
    });
    new Function('require', 'module', 'exports', outputText)(name => {
      if (!(name in imports)) throw new Error('Unexpected dependency: ' + name);
      return imports[name];
    }, module, module.exports);
    const engine = module.exports;
    const options = { mode: 'practice', useAiGeneration: true, questionCount: 10, difficulty };
    const session = await engine.createSession(options);
    assert.equal(session.questions.length, 3);
    assert.equal(session.isAiGeneratingInBackground, true);
    const batch = await engine.replenishAiQuestionsBatch(options, session.questions, 3);
    assert.equal(batch.length, 3);
    assert.equal(saved.length, 6);
    for (const request of requests) assert.equal(request.difficulty, difficulty === 'All' ? 'Medium' : difficulty);
    for (const question of [...session.questions, ...batch]) {
      assert.ok(question.id.startsWith('ai_'));
      assert.equal(question.difficulty, difficulty === 'All' ? 'Medium' : difficulty);
    }
  });
}

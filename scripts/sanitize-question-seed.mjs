import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../seeds/question-bank-2026-11-20.json', import.meta.url);
const seed = JSON.parse(await readFile(path, 'utf8'));
let previouslyCorrected = [];
try { previouslyCorrected = JSON.parse(await readFile(new URL('../seeds/corrected-question-ids.json', import.meta.url), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const credentials = /mongodb(?:\+srv)?:\/\/[^\s"'<>/]+:[^\s"'<>/]+@/i;
const replacements = [
  {
    title: 'Authentication database versus application database',
    problem: 'The database user was created in admin but has read access to education_db. Which connection configuration correctly separates credential authentication from the application database?',
    options: ['Use authSource=admin and select education_db as the application database.', 'Use authSource=education_db regardless of where the user was created.', 'Use readPreference=admin to authenticate.', 'Move the password into the collection name.'],
    explanation: 'authSource identifies the database that holds the database user. The selected application database and assigned roles determine where authorized operations run.'
  },
  {
    title: 'Bounded connection pool wait',
    problem: 'All connections in an application pool are busy. New operations must fail rather than wait indefinitely for a free pooled connection. Which option specifically bounds that wait?',
    options: ['waitQueueTimeoutMS', 'appName', 'authSource', 'retryReads'],
    explanation: 'waitQueueTimeoutMS bounds the time an operation waits to check out a connection from a busy pool. It is different from server selection and socket timeouts.'
  },
  {
    title: 'Server selection versus socket timeout',
    problem: 'An application cannot find an eligible replica-set primary during an election. Which option bounds how long the driver searches for a suitable server?',
    options: ['serverSelectionTimeoutMS', 'socketTimeoutMS alone', 'maxPoolSize', 'authSource'],
    explanation: 'serverSelectionTimeoutMS bounds server selection. socketTimeoutMS addresses socket inactivity and does not replace a server-selection timeout.'
  }
];
let count = 0;
const changedIds = [];
for (const q of seed.questions) {
  if (!credentials.test(JSON.stringify(q)) && !previouslyCorrected.includes(q.id)) continue;
  const replacement = replacements[count++];
  if (!replacement) throw new Error('Unexpected additional credential-bearing question; manual review required.');
  const id = q.id, topic = q.topic, difficulty = q.difficulty, level = q.level;
  for (const key of Object.keys(q)) delete q[key];
  Object.assign(q, { id, topic, difficulty, level, type: 'multiple-choice',
    title: replacement.title, databaseName: 'education_db', datasetName: 'learners', fieldNames: ['_id'],
    scenario: 'Database: education_db | Collection: db.learners | Field(s): _id\n' + replacement.problem,
    options: replacement.options, correctOptionIndex: 0, explanation: replacement.explanation,
    codeSnippet: null, expectedCommand: null, acceptableAlternatives: [], misconception: null,
    conceptFocus: replacement.title, points: 15,
    tags: ['locally-authored', 'credential-free', 'curriculum-seed-2026-11-20'] });
  changedIds.push(id);
}
if (credentials.test(JSON.stringify(seed))) throw new Error('Credential-bearing content remains.');
seed.source = '110-initial-questions-with-3-credential-free-replacements-and-690-locally-authored-drills';
await writeFile(path, JSON.stringify(seed, null, 2) + '\n');
await writeFile(new URL('../seeds/corrected-question-ids.json', import.meta.url), JSON.stringify(changedIds, null, 2) + '\n');
console.log('Replaced ' + count + ' credential-bearing examples; values were not printed.');

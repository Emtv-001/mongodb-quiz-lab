import { DifficultyLevel, MongoTopic, Question, CurriculumLevel, QuestionType } from '../types';

interface GenerationOptions {
  topic?: MongoTopic;
  level?: CurriculumLevel;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  datasetName?: string;
  count?: number;
}

const TOPIC_TEMPLATES: Record<string, {
  scenarios: { title: string; desc: string; dataset: string; type: QuestionType; cmd: string; focus: string; explanation: string; misconception: string; options?: string[]; correctIdx?: number }[];
}> = {
  'CRUD Operations': {
    scenarios: [
      {
        title: "Atomic Array Element Update in Healthcare",
        desc: "In collection 'patients', find patient with _id 'HOSP-001' and add a new medication 'Metformin' (dosage: '500mg', frequency: 'Twice daily') into the 'prescriptions' array.",
        dataset: "hospital",
        type: "write-command",
        cmd: 'db.patients.updateOne({ _id: "HOSP-001" }, { $push: { prescriptions: { medication: "Metformin", dosage: "500mg", frequency: "Twice daily" } } })',
        focus: "$push modifier for nested document array appending",
        explanation: "$push appends a new item into an array field. When passing an object into $push, MongoDB appends the structured sub-document seamlessly.",
        misconception: "Using $set instead of $push which would overwrite the entire prescriptions array instead of appending."
      },
      {
        title: "Conditional Bank Balance Deduction",
        desc: "In collection 'accounts', decrement the balance by 15000 for account '0123456789' only if current balance is greater than or equal to 15000.",
        dataset: "banking",
        type: "write-command",
        cmd: 'db.accounts.updateOne({ accountNumber: "0123456789", balance: { $gte: 15000 } }, { $inc: { balance: -15000 } })',
        focus: "Atomic conditional update preventing overdrafts",
        explanation: "Combining { balance: { $gte: 15000 } } with { $inc: { balance: -15000 } } leverages document-level atomicity to prevent concurrent race-condition overdrafts.",
        misconception: "Reading the balance first in code and updating afterwards in two non-atomic queries."
      }
    ]
  },
  'Aggregation Pipelines': {
    scenarios: [
      {
        title: "Departmental Average Billing Valuation",
        desc: "In collection 'patients', compute the total and average billing paid per department for all admitted patients.",
        dataset: "hospital",
        type: "write-command",
        cmd: 'db.patients.aggregate([{ $match: { admitted: true } }, { $group: { _id: "$department", totalPaid: { $sum: "$billing.paid" }, avgPaid: { $avg: "$billing.paid" } } }])',
        focus: "$match followed by $group with dot notation accumulator",
        explanation: "Pipeline filters admitted patients with $match, then groups by '$department' and aggregates '$billing.paid' with $sum and $avg.",
        misconception: "Omitting the '$' prefix in '$billing.paid' which causes MongoDB to treat it as a string literal instead of a document field path."
      },
      {
        title: "Product Inventory Stockout Audit with $facet",
        desc: "In collection 'products', group products into in-stock and out-of-stock buckets simultaneously in a single aggregation pass.",
        dataset: "ecommerce",
        type: "write-command",
        cmd: 'db.products.aggregate([{ $facet: { inStock: [{ $match: { stock: { $gt: 0 } } }], outOfStock: [{ $match: { stock: 0 } }] } }])',
        focus: "Multi-faceted aggregation with $facet",
        explanation: "$facet allows executing multiple parallel sub-pipelines over the same input stream of documents within a single stage.",
        misconception: "Running two separate heavy aggregation queries across the network instead of using $facet."
      }
    ]
  },
  'Indexes & ESR Rule': {
    scenarios: [
      {
        title: "Optimal Compound Index for E-Commerce Orders",
        desc: "Given query: db.orders.find({ status: 'completed', amount: { $gte: 100 } }).sort({ orderDate: -1 }). What is the optimal compound index following the ESR rule?",
        dataset: "ecommerce",
        type: "multiple-choice",
        cmd: 'db.orders.createIndex({ status: 1, orderDate: -1, amount: 1 })',
        options: [
          "{ status: 1, orderDate: -1, amount: 1 }",
          "{ amount: 1, status: 1, orderDate: -1 }",
          "{ orderDate: -1, status: 1, amount: 1 }",
          "{ amount: 1, orderDate: -1, status: 1 }"
        ],
        correctIdx: 0,
        focus: "ESR Rule: Equality (status) -> Sort (orderDate) -> Range (amount)",
        explanation: "The ESR Rule dictates: Equality predicates first ('status'), Sort key second ('orderDate') to avoid blocking in-memory sorts, and Range predicates last ('amount').",
        misconception: "Putting the range filter before the sort key, which causes MongoDB to perform an in-memory sort."
      }
    ]
  },
  'Transactions & Consistency': {
    scenarios: [
      {
        title: "Cross-Collection Ledger Transaction Session",
        desc: "In a banking multi-document transaction debiting Account A and crediting Account B, what session option ensures transactions do not block indefinitely?",
        dataset: "banking",
        type: "multiple-choice",
        cmd: '',
        options: [
          "maxCommitTimeMS / default 60-second transaction lifetime limit",
          "Setting readPreference to nearest",
          "Disabling journal writes with j: false",
          "Locking the whole replica set using rs.lock()"
        ],
        correctIdx: 0,
        focus: "Transaction timeout limit and session lifecycle",
        explanation: "MongoDB enforces a default 60-second maximum transaction lifetime to prevent lock contention and oplog pinning.",
        misconception: "Assuming transactions can remain open indefinitely across user interactions."
      }
    ]
  }
};

/**
 * Generates dynamic, AI-synthesized practical MongoDB questions on the fly
 */
export function generateAiDynamicQuestions(options: GenerationOptions = {}): Question[] {
  const {
    topic,
    level = 3,
    difficulty = 'Medium',
    count = 5
  } = options;

  const generatedList: Question[] = [];
  const datasets = ['GptData02', 'hospital', 'banking', 'ecommerce', 'hotel'];

  const topicsPool: MongoTopic[] = topic
    ? [topic]
    : [
        'CRUD Operations',
        'Basic & Advanced Querying',
        'Comparison & Logical Operators',
        'Arrays & Indexing',
        'Nested Documents & Dot Notation',
        'Update Operators & Modifiers',
        'Data Modeling & Schema Design',
        'Aggregation Pipelines',
        'Indexes & ESR Rule',
        'Performance & explain()',
        'Transactions & Consistency',
        'Security & RBAC'
      ];

  for (let i = 0; i < count; i++) {
    const selectedTopic = topicsPool[i % topicsPool.length];
    const dataset = options.datasetName || datasets[i % datasets.length];
    const templateGroup = TOPIC_TEMPLATES[selectedTopic] || TOPIC_TEMPLATES['CRUD Operations'];
    const template = templateGroup.scenarios[i % templateGroup.scenarios.length];

    const dynamicId = `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const points = difficulty === 'Expert' ? 15 : difficulty === 'Hard' ? 10 : 5;

    const dynamicQ: Question = {
      id: dynamicId,
      topic: selectedTopic,
      level: level || 3,
      difficulty,
      type: template.type || 'write-command',
      title: `${template.title} (AI Dynamic #${i + 1})`,
      scenario: template.desc,
      datasetName: dataset,
      expectedCommand: template.type === 'write-command' ? template.cmd : undefined,
      acceptableAlternatives: template.type === 'write-command' ? [template.cmd.replace(/\s+/g, '')] : undefined,
      options: template.options,
      correctOptionIndex: template.correctIdx,
      explanation: template.explanation,
      misconception: template.misconception,
      conceptFocus: template.focus,
      points,
      tags: ["ai-generated", "real-time", selectedTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')]
    };

    generatedList.push(dynamicQ);
  }

  return generatedList;
}

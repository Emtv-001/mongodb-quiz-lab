import { MockExamPreset } from '../types';

export const MOCK_EXAM_PRESETS: MockExamPreset[] = [
  {
    id: "mock-beginner",
    title: "MongoDB Beginner Mock Exam",
    subtitle: "Level 1 — Fundamentals, documents, BSON types, ObjectId & Atlas basics",
    level: "Level 1: Beginner",
    targetLevel: 1,
    questionCount: 15,
    durationMinutes: 15,
    topics: ["MongoDB Fundamentals", "Connections & Tools"],
    iconName: "Compass"
  },
  {
    id: "mock-fundamentals",
    title: "MongoDB Fundamentals Mock Exam",
    subtitle: "Architecture, document anatomy, JSON vs BSON, and connection workflows",
    level: "Level 1–2: Foundation",
    targetLevel: 2,
    questionCount: 20,
    durationMinutes: 20,
    topics: ["MongoDB Fundamentals", "Connections & Tools", "Basic & Advanced Querying"],
    iconName: "Layers"
  },
  {
    id: "mock-crud",
    title: "MongoDB CRUD Mastery Mock",
    subtitle: "Level 3 — insert, find, updateOne, updateMany, replace, delete & upsert semantics",
    level: "Level 3: CRUD",
    targetLevel: 3,
    questionCount: 20,
    durationMinutes: 25,
    topics: ["CRUD Operations", "Update Operators & Modifiers", "Nested Documents & Dot Notation"],
    iconName: "Edit3"
  },
  {
    id: "mock-querying",
    title: "MongoDB Querying & Operators Mock",
    subtitle: "Level 2 — Filters, comparisons, logical, regex, array matches, and cursors",
    level: "Level 2: Querying",
    targetLevel: 2,
    questionCount: 20,
    durationMinutes: 25,
    topics: ["Basic & Advanced Querying", "Comparison & Logical Operators", "Regular Expressions", "Arrays & Indexing"],
    iconName: "Search"
  },
  {
    id: "mock-aggregation",
    title: "MongoDB Aggregation Pipeline Mock",
    subtitle: "Level 5 — $match, $group, $lookup, $unwind, accumulators, facets & window fields",
    level: "Level 5: Aggregation",
    targetLevel: 5,
    questionCount: 20,
    durationMinutes: 30,
    topics: ["Aggregation Pipelines"],
    iconName: "GitMerge"
  },
  {
    id: "mock-indexing-perf",
    title: "MongoDB Indexing & Performance Mock",
    subtitle: "Level 6 — ESR rule, compound, multikey, explain(), executionStats & bottlenecks",
    level: "Level 6: Performance",
    targetLevel: 6,
    questionCount: 20,
    durationMinutes: 25,
    topics: ["Indexes & ESR Rule", "Performance & explain()"],
    iconName: "Zap"
  },
  {
    id: "mock-admin",
    title: "MongoDB Administration Mock",
    subtitle: "Level 7 — Replica sets, elections, RBAC, SCRAM, backup/restore with mongodump",
    level: "Level 7: Administration",
    targetLevel: 7,
    questionCount: 20,
    durationMinutes: 25,
    topics: ["Security & RBAC", "Replication & High Availability", "Backup & Restore"],
    iconName: "Shield"
  },
  {
    id: "mock-advanced",
    title: "MongoDB Advanced Architecture Mock",
    subtitle: "Level 8 — Multi-document transactions, sharding, change streams & time-series",
    level: "Level 8: Advanced",
    targetLevel: 8,
    questionCount: 20,
    durationMinutes: 30,
    topics: ["Transactions & Consistency", "MongoDB Atlas & Advanced Features"],
    iconName: "Cpu"
  },
  {
    id: "mock-full",
    title: "Full MongoDB Comprehensive Practical Mock",
    subtitle: "Levels 1–8 — Complete cross-curriculum assessment modeled after NIIT/Atlas certifications",
    level: "Comprehensive",
    questionCount: 25,
    durationMinutes: 35,
    topics: [
      "MongoDB Fundamentals",
      "CRUD Operations",
      "Basic & Advanced Querying",
      "Update Operators & Modifiers",
      "Aggregation Pipelines",
      "Indexes & ESR Rule",
      "Security & RBAC",
      "Replication & High Availability"
    ],
    iconName: "GraduationCap"
  },
  {
    id: "mock-mastery",
    title: "Final MongoDB Mastery & Real-World Projects Exam",
    subtitle: "Level 9 — Complex real-world systems: Hospital, Banking, E-Commerce & Hotel architectures",
    level: "Level 9: Mastery",
    targetLevel: 9,
    questionCount: 30,
    durationMinutes: 45,
    topics: [
      "Data Modeling & Schema Design",
      "Schema Validation",
      "Aggregation Pipelines",
      "Indexes & ESR Rule",
      "Performance & explain()",
      "Transactions & Consistency",
      "MongoDB Atlas & Advanced Features"
    ],
    iconName: "Trophy"
  }
];

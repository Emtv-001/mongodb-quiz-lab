import { Flashcard } from '../types';

export const FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    topic: "Update Operators & Modifiers",
    level: 3,
    difficulty: "Easy",
    front: "What is the difference between $pop: -1 and $pop: 1?",
    back: "$pop: -1 removes the FIRST element (index 0) of an array, while $pop: 1 removes the LAST element of an array.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $pop: { Skills: -1 } })",
    example: "Skills: ['A', 'B', 'C'] with $pop: -1 becomes ['B', 'C'].",
    note: "Remember: negative -1 removes from the front, positive 1 removes from the end."
  },
  {
    id: "fc-2",
    topic: "Update Operators & Modifiers",
    level: 3,
    difficulty: "Medium",
    front: "Can you use the $position modifier without $each in $push?",
    back: "NO! In MongoDB, the $position modifier MUST be used alongside $each, even if you are inserting a single element.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $push: { Courses: { $each: ['React'], $position: 0 } } })",
    example: "Inserting at the beginning: $position: 0. After 1st element: $position: 1.",
    note: "Omitting $each causes a MongoDB command parsing error."
  },
  {
    id: "fc-3",
    topic: "Update Operators & Modifiers",
    level: 3,
    difficulty: "Medium",
    front: "What is the difference between $slice: 4 and $slice: -4 in a $push update?",
    back: "$slice: 4 retains only the FIRST 4 elements in the array. $slice: -4 retains only the LAST 4 elements in the array.",
    syntax: "db.collection.updateOne({ _id: 2 }, { $push: { Courses: { $each: ['Angular'], $slice: 4 } } })",
    example: "Keeps array bounded to at most 4 elements after insertion.",
    note: "Positive keeps from beginning; negative keeps from the end."
  },
  {
    id: "fc-4",
    topic: "Update Operators & Modifiers",
    level: 3,
    difficulty: "Easy",
    front: "What is the core difference between $push and $addToSet?",
    back: "$push allows duplicate items and always appends. $addToSet treats the array like a mathematical set, adding the item ONLY if it does not already exist.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $addToSet: { Skills: 'Java' } })",
    example: "If 'Java' is already present in Skills, $addToSet makes no changes (nModified = 0).",
    note: "Use $addToSet for unique tags, roles, or skills."
  },
  {
    id: "fc-5",
    topic: "CRUD Operations",
    level: 3,
    difficulty: "Medium",
    front: "When does the $setOnInsert operator execute its updates?",
    back: "$setOnInsert ONLY assigns fields when an upsert operation creates a brand new document. If a matching document already exists, $setOnInsert is completely ignored.",
    syntax: "db.Students.updateOne({ _id: 27 }, { $setOnInsert: { CreatedAt: new Date() } }, { upsert: true })",
    example: "Existing document with _id 27 will NOT update CreatedAt.",
    note: "Ideal for creation timestamps or author fields that should never be overwritten."
  },
  {
    id: "fc-6",
    topic: "Indexes & ESR Rule",
    level: 6,
    difficulty: "Hard",
    front: "What does the ESR rule prescribe for compound index ordering?",
    back: "1. Equality fields first (exact matches =)\n2. Sort fields second (order by)\n3. Range filter fields last (>, <, $in)\nThis eliminates in-memory blocking sorts and narrows index scans.",
    syntax: "db.orders.createIndex({ status: 1, customerId: 1, createdAt: 1 })",
    example: "Equality (status), Sort (customerId), Range (createdAt).",
    note: "ESR = Equality, Sort, Range."
  },
  {
    id: "fc-7",
    topic: "Performance & explain()",
    level: 6,
    difficulty: "Hard",
    front: "What does a COLLSCAN execution stage indicate in an explain plan?",
    back: "COLLSCAN indicates a full collection scan where every single document in the collection was loaded from disk into memory to test query filters, signaling a missing or unindexed query field.",
    syntax: "db.orders.find({ orderNumber: 9912 }).explain('executionStats')",
    example: "totalDocsExamined = 1,000,000 but nReturned = 1.",
    note: "Aim for IXSCAN (Index Scan) and totalDocsExamined == nReturned."
  },
  {
    id: "fc-8",
    topic: "Aggregation Pipelines",
    level: 5,
    difficulty: "Medium",
    front: "What is the difference between $project and $set / $addFields?",
    back: "$project reshapes the document and excludes unlisted fields by default (unless explicitly included). $set and $addFields add or overwrite specified fields while leaving all other existing fields completely untouched.",
    syntax: "db.collection.aggregate([{ $addFields: { isSenior: { $gte: ['$age', 60] } } }])",
    example: "Use $set/$addFields when you only want to add a calculated property without re-specifying every other field.",
    note: "$set is an alias for $addFields introduced in MongoDB 4.2."
  },
  {
    id: "fc-9",
    topic: "Transactions & Consistency",
    level: 8,
    difficulty: "Hard",
    front: "What does Write Concern 'w: majority' guarantee?",
    back: "It guarantees that a write operation is committed to disk and acknowledged by a majority of voting replica set members before the client receives an acknowledgement, preventing rollback during failover.",
    syntax: "db.accounts.updateOne({ _id: 1 }, { $set: { balance: 500 } }, { writeConcern: { w: 'majority' } })",
    example: "Protects against data loss if the primary node crashes immediately after writing.",
    note: "'w: majority' is default in MongoDB 5.0+."
  },
  {
    id: "fc-10",
    topic: "Security & RBAC",
    level: 7,
    difficulty: "Medium",
    front: "What is the Principle of Least Privilege in MongoDB security?",
    back: "Users and application microservices should only be granted the absolute minimum privileges and roles necessary to perform their functions (e.g. read or readWrite on a single database, never clusterAdmin or root).",
    syntax: "db.createUser({ user: 'appSvc', pwd: '...', roles: [{ role: 'readWrite', db: 'orders' }] })",
    example: "Never connect public web apps with the 'root' administrator credential.",
    note: "Built-in roles include read, readWrite, dbAdmin, userAdmin, clusterAdmin."
  }
];

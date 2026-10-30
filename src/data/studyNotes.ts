import { StudyNoteSection } from '../types';

export const STUDY_NOTES: StudyNoteSection[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 1: MongoDB Fundamentals
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-fundamentals",
    lectureNumber: 1,
    moduleTitle: "Getting Started",
    topic: "MongoDB Fundamentals",
    level: 1,
    estimatedReadTimeMinutes: 10,
    title: "MongoDB Architecture, Documents & BSON Anatomy",
    subtitle: "Understanding what MongoDB is, how it stores data, and why it exists",
    summary: "Understand document databases, JSON vs BSON binary representation, ObjectId anatomy, and the flexible schema model.",

    noviceMentalModel: {
      analogyTitle: "MongoDB is a Smart Filing Cabinet",
      analogyStory: "Imagine a massive digital filing cabinet labelled 'Database'. Inside are labelled drawers — these are your Collections (e.g. 'students', 'orders', 'products'). Each drawer holds hundreds of folders — these are your Documents, one per record. Unlike a spreadsheet where every row must have the same columns, each folder (document) can hold different things. One student folder might have a 'scholarship' field; another might not. MongoDB doesn't mind. This flexibility is why developers love it for modern apps.",
      keyTakeaway: "Database → Collections (drawers) → Documents (folders). Each document is a JSON object. No rigid schema required — fields can vary between documents in the same collection."
    },

    structuralDiagram: `
MONGODB DATA HIERARCHY
══════════════════════════════════════════════
  📦 DATABASE  (mongo_school)
  │
  ├── 📂 COLLECTION: students
  │       ├── 📄 { _id: ObjectId, name: "Alice", age: 20, gpa: 3.8 }
  │       ├── 📄 { _id: ObjectId, name: "Bob",   age: 22, scholarship: true }
  │       └── 📄 { _id: ObjectId, name: "Carol", age: 19 }
  │
  ├── 📂 COLLECTION: courses
  │       └── 📄 { _id: ObjectId, code: "CS101", credits: 3 }
  │
  └── 📂 COLLECTION: enrollments
          └── 📄 { _id: ObjectId, studentId: ..., courseId: ... }

DOCUMENT ANATOMY (BSON format internally)
──────────────────────────────────────────
  {
    "_id"   : ObjectId("66fa9b4a...")  ← 12-byte unique ID, auto-added
    "name"  : "Alice",                 ← String (BSON type 2)
    "age"   : 20,                      ← Int32 (BSON type 16)
    "gpa"   : 3.8,                     ← Double (BSON type 1)
    "active": true                     ← Boolean (BSON type 8)
  }
══════════════════════════════════════════════`,

    coreConcepts: [
      {
        heading: "What is a Document?",
        explanation: "A document is a JSON-like object that holds data for one entity (one student, one order, one product). It uses key-value pairs. The keys are field names (strings), and the values can be strings, numbers, booleans, arrays, nested objects, dates, or null.",
        codeSnippet: `{
  "_id": ObjectId("66fa9b4a1b2c3d4e5f6a7b8c"),
  "name": "Alice",
  "age": 20,
  "courses": ["CS101", "MATH201"],
  "address": { "city": "Lagos", "zip": "100001" }
}`,
        codeExplanation: "This is one student document. Notice the nested 'address' object and the 'courses' array — these are natural ways to store related data without joins.",
        analogyOrTip: "💡 Think of a document as one row in a spreadsheet, but it can have sub-tables embedded inside it."
      },
      {
        heading: "ObjectId — The Auto-Generated Unique Key",
        explanation: "Every document automatically gets an '_id' field if you don't provide one. By default it's an ObjectId — a 12-byte value that encodes the creation timestamp, machine ID, and a counter. This makes it globally unique and chronologically sortable.",
        codeSnippet: `// Extract creation time from ObjectId:
ObjectId("66fa9b4a1b2c3d4e5f6a7b8c").getTimestamp()
// → ISODate("2024-09-30T...")`,
        codeExplanation: "ObjectIds are NOT random — the first 4 bytes ARE a Unix timestamp. You can get the document's creation time for free.",
        analogyOrTip: "💡 ObjectId = timestamp (4 bytes) + machine fingerprint (5 bytes) + counter (3 bytes). It's like a barcode that encodes when and where it was created."
      },
      {
        heading: "JSON vs BSON",
        explanation: "MongoDB stores data as BSON (Binary JSON) internally, not plain text JSON. BSON adds strict type information (Int32 vs Int64 vs Double), supports more types (Date, Binary, ObjectId), and is faster to encode/parse. When you write queries, you write JSON-like syntax — MongoDB driver converts it to BSON.",
        codeSnippet: `// BSON types you'll see in queries:
{ $type: "string" }     // string fields
{ $type: "int" }        // 32-bit integers
{ $type: "date" }       // Date objects
{ $type: "objectId" }   // ObjectId fields`,
        analogyOrTip: "💡 Think of JSON as what you write, and BSON as what MongoDB actually stores on disk — like writing a letter vs the postal encoding used to deliver it."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Launch mongosh and connect",
        explanation: "mongosh is MongoDB's interactive shell. Type 'mongosh' in your terminal. If you're connecting to Atlas, paste your connection string.",
        codeExample: `mongosh "mongodb+srv://cluster0.xxxx.mongodb.net" --username admin`,
        outputPreview: `Current Mongosh Log ID: 66fa...
Connecting to: mongodb+srv://...
Atlas atlas-xxxxx-shard-0 [primary] test>`
      },
      {
        stepNumber: 2,
        stepTitle: "Switch to a database",
        explanation: "The 'use' command switches to a database — or creates it when you first write to it. MongoDB creates databases lazily (only when data is inserted).",
        codeExample: `use school`,
        outputPreview: `switched to db school`
      },
      {
        stepNumber: 3,
        stepTitle: "Inspect what's in your database",
        explanation: "List all collections in the current database, and count documents in one.",
        codeExample: `db.getCollectionNames()
db.students.countDocuments()`,
        outputPreview: `[ 'students', 'courses', 'enrollments' ]
42`
      }
    ],

    keyOperators: [
      {
        name: "BSON Types",
        description: "BSON preserves strict types (Double: 1, String: 2, Object: 3, Array: 4, BinData: 5, ObjectId: 7, Bool: 8, Date: 9, Null: 10, Regex: 11, Int32: 16, Timestamp: 17, Int64: 18, Decimal128: 19).",
        example: '{ $type: "decimal" } or { $type: 19 }'
      },
      {
        name: "ObjectId('...')",
        description: "12-byte identifier composed of 4-byte timestamp + 5-byte random value + 3-byte incrementing counter.",
        example: 'ObjectId("66fa9b4a1b2c3d4e5f6a7b8c").getTimestamp()'
      }
    ],
    importantRules: [
      "Documents in MongoDB have a hard 16MB limit to prevent memory exhaustion and encourage normalized relationships when data grows unbounded.",
      "Field order matters in embedded document equality: { a: 1, b: 2 } != { b: 2, a: 1 }."
    ],
    commonMistakes: [
      "Assuming numbers are stored as arbitrary text strings; numeric 20 != string '20'.",
      "Treating ObjectId as completely random instead of chronologically sortable."
    ],
    realWorldScenario: "In school and enterprise setups, use ObjectId timestamps for audit trails without needing separate createdAt columns.",
    teacherTips: [
      "Always run 'use <dbname>' before any CRUD — otherwise you may accidentally write to the wrong database.",
      "Remember: MongoDB doesn't enforce schema by default. This is a feature, not a bug — but it means your application code must be disciplined about data shape."
    ],
    noviceSummaryChecklist: [
      "✅ MongoDB organises data as: Database → Collections → Documents",
      "✅ A document is a JSON-like object with key-value pairs — think of it as one flexible row",
      "✅ Every document automatically gets a unique '_id' (ObjectId by default)",
      "✅ BSON = the binary storage format; JSON = what you write in queries",
      "✅ No rigid schema — different documents in the same collection can have different fields"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 2: CRUD Operations
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-crud",
    lectureNumber: 2,
    moduleTitle: "Working with Data",
    topic: "CRUD Operations",
    level: 3,
    estimatedReadTimeMinutes: 14,
    title: "CRUD Operations — Create, Read, Update & Delete",
    subtitle: "The four fundamental verbs every MongoDB developer uses every day",
    summary: "Execute inserts, granular updates, atomic find-and-modify, and filter-based deletions. These four operations are the foundation of all MongoDB development.",

    noviceMentalModel: {
      analogyTitle: "The Library Desk Analogy",
      analogyStory: "A library (database) has shelves of books (collections). Each book record is a card in a card catalog (document). The library desk can: Add a new book card (Create/Insert), Look up a book card (Read/Find), Update a book's details when it moves shelf (Update), or Remove a book card when it's lost (Delete). MongoDB's CRUD maps perfectly: insertOne = 'Add new card', find = 'Search catalog', updateOne = 'Correct a card detail', deleteOne = 'Remove from catalog'.",
      keyTakeaway: "CRUD = Create (insert), Read (find), Update (update), Delete (delete). MongoDB's syntax: db.collectionName.operation(filter, changes)."
    },

    structuralDiagram: `
CRUD OPERATION MAP
══════════════════════════════════════════════════
  CREATE                 READ
  ──────────────         ─────────────────────────
  insertOne({...})       find({filter})
  insertMany([...])      findOne({filter})
                         countDocuments({filter})
                         distinct("field", {filter})

  UPDATE                 DELETE
  ──────────────         ─────────────────────────
  updateOne(f, {$set})   deleteOne({filter})
  updateMany(f, {$set})  deleteMany({filter})
  replaceOne(f, doc)
  findOneAndUpdate(...)
══════════════════════════════════════════════════
KEY PATTERN:  db.<collection>.<operation>(<filter>, <modification>)
`,

    coreConcepts: [
      {
        heading: "Creating Documents — insertOne & insertMany",
        explanation: "insertOne() adds a single document. insertMany() adds an array of documents. Both return acknowledgement objects. MongoDB auto-assigns '_id' if you don't provide one.",
        codeSnippet: `// Add one student
db.students.insertOne({ name: "Alice", age: 20, gpa: 3.8 })

// Add multiple students in one call
db.students.insertMany([
  { name: "Bob",   age: 22, gpa: 3.5 },
  { name: "Carol", age: 19, gpa: 3.9 }
])`,
        codeExplanation: "insertMany is faster than multiple insertOne calls because it sends one network round-trip.",
        analogyOrTip: "💡 insertMany is like mailing a whole batch of forms at once vs. one at a time — same result, less trips to the post office."
      },
      {
        heading: "Reading Documents — find & findOne",
        explanation: "find() returns a cursor (a lazy iterator over results). findOne() returns the first matching document or null. Provide an empty object {} or no argument to match ALL documents.",
        codeSnippet: `// Find all students
db.students.find()

// Find students older than 20
db.students.find({ age: { $gt: 20 } })

// Find one student by name (returns object, not cursor)
db.students.findOne({ name: "Alice" })

// Project: only return name and gpa (exclude _id)
db.students.find({}, { name: 1, gpa: 1, _id: 0 })`,
        codeExplanation: "The second argument to find() is the projection — 1 = include, 0 = exclude. You cannot mix includes and excludes (except for _id).",
        analogyOrTip: "💡 find() is lazy — it doesn't load all results at once. Call .toArray() in scripts to get an actual array."
      },
      {
        heading: "Updating Documents — Always Use Update Operators!",
        explanation: "NEVER pass a raw object to updateOne/updateMany. Always use an update operator like $set (set a field), $inc (increment a number), $push (add to array), $unset (remove a field). Without operators, MongoDB throws an error in modern versions.",
        codeSnippet: `// ✅ Correct — use $set operator
db.students.updateOne(
  { name: "Alice" },            // filter
  { $set: { gpa: 4.0 } }       // update
)

// ✅ Increment a field
db.students.updateOne(
  { name: "Bob" },
  { $inc: { age: 1 } }          // adds 1 to age

// ❌ WRONG — this replaces the ENTIRE document!
db.students.updateOne({ name: "Alice" }, { gpa: 4.0 })`,
        codeExplanation: "Using $set means: 'change ONLY the gpa field'. Without $set, updateOne tries to REPLACE the whole document with { gpa: 4.0 }, losing all other fields.",
        analogyOrTip: "⚠️ The most common beginner mistake — forgetting $set. Always ask: 'Am I modifying fields or replacing the document?'"
      },
      {
        heading: "Deleting Documents — deleteOne & deleteMany",
        explanation: "deleteOne removes the first document matching the filter. deleteMany removes ALL matching documents. Always preview with find() using the same filter before deleting.",
        codeSnippet: `// Preview what you're about to delete first!
db.students.find({ gpa: { $lt: 1.0 } })

// Delete one failing student
db.students.deleteOne({ gpa: { $lt: 1.0 } })

// Delete ALL students with GPA < 1.0
db.students.deleteMany({ gpa: { $lt: 1.0 } })`,
        codeExplanation: "MongoDB deletes are permanent — there's no recycle bin. Always run find() with your filter first to confirm what will be affected.",
        analogyOrTip: "💡 Treat deleteMany like rm -rf. Preview with find(), then delete. Saves careers."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Insert your first document",
        explanation: "Let's insert a student record and see MongoDB assign an ObjectId automatically.",
        codeExample: `use school
db.students.insertOne({
  name: "Alice",
  age: 20,
  gpa: 3.8,
  courses: ["CS101", "MATH201"]
})`,
        outputPreview: `{
  acknowledged: true,
  insertedId: ObjectId("66fa9b4a1b2c3d4e5f6a7b8c")
}`
      },
      {
        stepNumber: 2,
        stepTitle: "Read it back with a filter",
        explanation: "Now find Alice using her name. Then try a range query to find all students with GPA above 3.5.",
        codeExample: `db.students.findOne({ name: "Alice" })
db.students.find({ gpa: { $gt: 3.5 } }).toArray()`,
        outputPreview: `{ _id: ObjectId("..."), name: "Alice", age: 20, gpa: 3.8, courses: [...] }`
      },
      {
        stepNumber: 3,
        stepTitle: "Update a field safely with $set",
        explanation: "Alice earned an A. Update her GPA. Use $set to change ONLY the gpa field.",
        codeExample: `db.students.updateOne(
  { name: "Alice" },
  { $set: { gpa: 4.0 }, $currentDate: { updatedAt: true } }
)`,
        outputPreview: `{ acknowledged: true, matchedCount: 1, modifiedCount: 1 }`
      },
      {
        stepNumber: 4,
        stepTitle: "Use upsert to insert-or-update",
        explanation: "Upsert means: update if found, insert if not. Pass { upsert: true } as the third argument.",
        codeExample: `db.students.updateOne(
  { name: "Dave" },
  { $set: { gpa: 3.2, age: 21 } },
  { upsert: true }
)`,
        outputPreview: `{ acknowledged: true, matchedCount: 0, upsertedCount: 1, upsertedId: ObjectId("...") }`
      }
    ],

    keyOperators: [
      {
        name: "findOneAndUpdate(filter, update, options)",
        description: "Atomically updates a document and returns either the pre-update or post-update document ({ returnDocument: 'after' }).",
        example: 'db.accounts.findOneAndUpdate({ _id: "ACC-1" }, { $inc: { balance: 100 } }, { returnDocument: "after" })'
      },
      {
        name: "replaceOne(filter, replacement)",
        description: "Replaces the entire document while preserving the original _id.",
        example: 'db.patients.replaceOne({ _id: "HOSP-1" }, { patientName: "John", age: 30 })'
      }
    ],
    importantRules: [
      "updateOne() modifies ONLY the first document matched, while updateMany() updates all matching documents.",
      "Upsert ({ upsert: true }) updates a matched document or atomically inserts a new document if no match is found."
    ],
    commonMistakes: [
      "Passing { age: 30 } instead of { $set: { age: 30 } } in updateOne, which throws an error in modern MongoDB.",
      "Using updateOne followed by find() rather than findOneAndUpdate() in multi-threaded workflows."
    ],
    teacherTips: [
      "Preview with find() before deleteMany() — same filter, no consequences.",
      "findOneAndUpdate with { returnDocument: 'after' } is your best friend for atomic read-modify operations."
    ],
    noviceSummaryChecklist: [
      "✅ insertOne({...}) adds one document; insertMany([...]) adds multiple in one round-trip",
      "✅ find({filter}) returns a cursor; findOne({filter}) returns one document or null",
      "✅ ALWAYS use update operators ($set, $inc, $push) — never pass a raw object to updateOne",
      "✅ deleteOne removes first match; deleteMany removes ALL matches — preview with find() first",
      "✅ upsert: true inserts a new document if no match is found"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 3: Basic & Advanced Querying
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-querying",
    lectureNumber: 3,
    moduleTitle: "Working with Data",
    topic: "Basic & Advanced Querying",
    level: 3,
    estimatedReadTimeMinutes: 12,
    title: "Querying Mastery — Filters, Projections & Cursors",
    subtitle: "How to find exactly what you need in a collection of millions",
    summary: "Master comparison operators, logical operators, array queries, regular expressions, projections, sorting, limiting, and skipping for powerful data retrieval.",

    noviceMentalModel: {
      analogyTitle: "MongoDB Queries as a Smart Search Filter",
      analogyStory: "Imagine searching through thousands of student records on a website. You can filter by age range (between 18 and 25), by status (active only), by course (CS101 or MATH201). Each filter narrows your results. MongoDB's query operators are exactly those filter checkboxes — you combine them to drill down to exactly the documents you need. The query object { age: { $gte: 18, $lte: 25 }, active: true } reads almost like English: 'age between 18 and 25, AND active is true'.",
      keyTakeaway: "A query filter is a JSON object describing conditions. Field names are the columns; operators like $gt, $in, $or add power. MongoDB checks every field condition must be true (AND by default)."
    },

    structuralDiagram: `
QUERY OPERATOR CHEAT MAP
═══════════════════════════════════════════════════════
  COMPARISON           LOGICAL           ELEMENT
  ──────────────────   ───────────────   ─────────────
  $eq  — equals        $and — all true   $exists — field exists
  $ne  — not equals    $or  — any true   $type   — BSON type
  $gt  — greater than  $not — negation
  $gte — >=            $nor — none true
  $lt  — less than
  $lte — <=
  $in  — in array
  $nin — not in array

  ARRAY                PROJECTION (2nd arg to find)
  ──────────────────   ──────────────────────────────
  $all — contains all  { field: 1 } — include
  $size — array size   { field: 0 } — exclude
  $elemMatch           (cannot mix 0 and 1 except _id)

SORT / LIMIT / SKIP CHAINING:
  db.col.find({}).sort({ age: -1 }).limit(10).skip(20)
═══════════════════════════════════════════════════════`,

    coreConcepts: [
      {
        heading: "Comparison Operators",
        explanation: "Use comparison operators inside a field's value to express ranges and set membership. All start with $ symbol. They replace traditional SQL WHERE conditions.",
        codeSnippet: `// Students aged between 18 and 25 (inclusive)
db.students.find({ age: { $gte: 18, $lte: 25 } })

// Students NOT from Lagos
db.students.find({ city: { $ne: "Lagos" } })

// Students taking CS101 or MATH201
db.students.find({ course: { $in: ["CS101", "MATH201"] } })`,
        codeExplanation: "Multiple conditions on the same field are AND'd together: { age: { $gte: 18, $lte: 25 } } means age >= 18 AND age <= 25.",
        analogyOrTip: "💡 Think of $in like SQL's WHERE course IN ('CS101', 'MATH201'). Much cleaner than writing many $or conditions."
      },
      {
        heading: "Logical Operators — $and, $or, $not, $nor",
        explanation: "$and requires ALL conditions to be true. $or requires ANY condition to be true. Multiple conditions at the same level are implicitly AND'd. You need explicit $or for OR logic.",
        codeSnippet: `// Implicit AND (same as { $and: [...] })
db.students.find({ age: { $gt: 20 }, active: true })

// Explicit OR — either GPA > 3.8 OR has scholarship
db.students.find({
  $or: [
    { gpa: { $gt: 3.8 } },
    { scholarship: true }
  ]
})

// NOT — students who are NOT active
db.students.find({ active: { $not: { $eq: true } } })`,
        analogyOrTip: "💡 You almost never need explicit $and — just list conditions in the same object. Use $or when you want 'either/or' logic."
      },
      {
        heading: "Projections — Returning Only What You Need",
        explanation: "The second argument to find() controls which fields are returned. Use 1 to include fields, 0 to exclude. You cannot mix includes and excludes — except for _id which can always be explicitly excluded.",
        codeSnippet: `// Return ONLY name and gpa (exclude everything else including _id)
db.students.find({}, { name: 1, gpa: 1, _id: 0 })

// Return everything EXCEPT the password field
db.users.find({}, { passwordHash: 0 })`,
        codeExplanation: "Projections reduce network traffic significantly on large documents. Always project only what your application needs.",
        analogyOrTip: "💡 Rule: All 1s (include mode) OR all 0s (exclude mode) — you can't combine them except for _id:0 in an inclusion projection."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Basic filter — find students with GPA above 3.5",
        explanation: "Use $gt (greater than) operator on the gpa field.",
        codeExample: `db.students.find({ gpa: { $gt: 3.5 } })`,
        outputPreview: `[
  { _id: ObjectId("..."), name: "Alice", gpa: 3.8 },
  { _id: ObjectId("..."), name: "Carol", gpa: 3.9 }
]`
      },
      {
        stepNumber: 2,
        stepTitle: "Sort, limit and skip for pagination",
        explanation: "Chain .sort(), .limit(), .skip() on the cursor. sort({field: -1}) = descending, 1 = ascending.",
        codeExample: `// Page 2 of results (10 per page, skip first 10)
db.students.find({})
  .sort({ gpa: -1 })   // Highest GPA first
  .skip(10)             // Skip page 1
  .limit(10)            // Return 10 results`,
        outputPreview: `// Returns students ranked 11-20 by GPA`
      },
      {
        stepNumber: 3,
        stepTitle: "Project to return only relevant fields",
        explanation: "Only return name, gpa, and course. Exclude _id. This is faster on large documents.",
        codeExample: `db.students.find(
  { gpa: { $gt: 3.5 } },
  { name: 1, gpa: 1, course: 1, _id: 0 }
)`,
        outputPreview: `[
  { name: "Alice", gpa: 3.8, course: "CS" },
  { name: "Carol", gpa: 3.9, course: "Math" }
]`
      }
    ],

    keyOperators: [
      { name: "$gt / $gte / $lt / $lte", description: "Greater than, >=, less than, <=.", example: 'db.students.find({ age: { $gte: 18, $lte: 25 } })' },
      { name: "$in / $nin", description: "Match any value in array / exclude values in array.", example: 'db.products.find({ category: { $in: ["electronics", "books"] } })' },
      { name: "$or / $and", description: "Logical OR / AND across multiple field conditions.", example: 'db.orders.find({ $or: [{ status: "pending" }, { priority: "high" }] })' },
      { name: "$exists", description: "Match documents where a field exists (or doesn't).", example: 'db.users.find({ email: { $exists: true } })' }
    ],
    importantRules: [
      "Multiple conditions on the same document object are AND'd implicitly — no need for $and unless combining $or blocks.",
      "Projection cannot mix 1 (include) and 0 (exclude) on different fields — the only exception is _id:0 in inclusion mode."
    ],
    commonMistakes: [
      "Writing { $or: [...], $or: [...] } with duplicate keys — only the last $or counts. Use $and: [{ $or: [...] }, { $or: [...] }].",
      "Using .sort() after .limit() — always sort BEFORE limit/skip for correct pagination."
    ],
    teacherTips: [
      "Count matching documents cheaply: db.students.countDocuments({ gpa: { $gt: 3.5 } })",
      "Use .explain('executionStats') on slow queries to understand if an index is being used."
    ],
    noviceSummaryChecklist: [
      "✅ Comparison: $gt, $gte, $lt, $lte, $eq, $ne, $in, $nin",
      "✅ Multiple conditions in one {} object are implicitly AND'd",
      "✅ Use $or: [...] for 'either condition' matching",
      "✅ Projection second arg: 1=include, 0=exclude (can't mix, except _id:0)",
      "✅ Chain .sort().skip().limit() for pagination — in that order"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 4: Aggregation Pipelines
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-aggregation",
    lectureNumber: 4,
    moduleTitle: "Analytics & Transformations",
    topic: "Aggregation Pipelines",
    level: 5,
    estimatedReadTimeMinutes: 16,
    title: "Aggregation Pipelines — Multi-Stage Data Transformations",
    subtitle: "MongoDB's powerful ETL tool for grouping, joining, and computing analytics",
    summary: "Harness $match, $group, $lookup, $unwind, $project, $sort, $limit, and accumulators for high-performance analytics and data transformation.",

    noviceMentalModel: {
      analogyTitle: "A Pipeline is a Factory Assembly Line",
      analogyStory: "Imagine an assembly line in a car factory. Raw metal enters Stage 1 (cut to shape). The shaped parts move to Stage 2 (paint). Painted parts move to Stage 3 (assemble). Finished cars exit. MongoDB's aggregation pipeline works the same way: documents enter Stage 1 ($match — filter), matching documents move to Stage 2 ($group — compute totals), results move to Stage 3 ($sort — rank). Each stage transforms the data passing through it. The output of one stage is the input of the next.",
      keyTakeaway: "db.collection.aggregate([stage1, stage2, stage3, ...]). Documents flow through each stage in order, transformed by each one."
    },

    structuralDiagram: `
AGGREGATION PIPELINE FLOW
══════════════════════════════════════════════════
  INPUT: All documents in collection
      │
      ▼
  ┌─────────────┐
  │  $match     │  Filter documents (use indexes here!)
  └──────┬──────┘
         │  Only matching docs pass through
         ▼
  ┌─────────────┐
  │  $group     │  Group by field, compute aggregates
  └──────┬──────┘
         │  One doc per group
         ▼
  ┌─────────────┐
  │  $sort      │  Sort the grouped results
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  $limit     │  Return top N results
  └──────┬──────┘
         ▼
  OUTPUT: Transformed result documents
══════════════════════════════════════════════════

KEY ACCUMULATOR OPERATORS ($group stage):
  $sum   — total                $avg — average
  $min   — minimum              $max — maximum
  $push  — collect into array   $addToSet — unique array
  $count — count (use $sum: 1)`,

    coreConcepts: [
      {
        heading: "$match — Filter Early, Filter Hard",
        explanation: "$match is exactly like find() — it filters documents using the same query syntax. Place it FIRST to reduce the number of documents in subsequent expensive stages. If $match can use an index, it's blazingly fast.",
        codeSnippet: `db.orders.aggregate([
  // Stage 1: Only process completed orders from 2024
  { $match: { status: "completed", year: 2024 } }
])`,
        codeExplanation: "A $match at the start of the pipeline allows MongoDB to use indexes — just like a find() query. If you put $match later, the index opportunity is lost.",
        analogyOrTip: "💡 Put $match first — always. It's like pre-sorting your mail before reading it vs sorting all of it after."
      },
      {
        heading: "$group — Computing Aggregates",
        explanation: "$group groups documents by an expression and computes aggregate values using accumulators. The '_id' field in $group defines what to group by. Use $sum: 1 to count documents per group.",
        codeSnippet: `db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: "$customerId",         // Group by customerId
      totalSpent: { $sum: "$amount" },  // Sum all amounts
      orderCount: { $sum: 1 },         // Count orders
      avgOrder:   { $avg: "$amount" }   // Average amount
  }}
])`,
        codeExplanation: "The $ before a field name in expressions means 'value of this field'. In $group, _id determines the grouping key. Set _id: null to aggregate all documents into one result.",
        analogyOrTip: "⚠️ Field references in $group expressions MUST have $: { $sum: '$amount' } not { $sum: 'amount' }. 'amount' without $ sums the literal string and returns 0."
      },
      {
        heading: "$lookup — Joining Collections",
        explanation: "$lookup performs a left outer join between two collections. It adds a new array field to each document containing the matching documents from the foreign collection.",
        codeSnippet: `db.orders.aggregate([
  { $lookup: {
      from: "customers",           // Foreign collection
      localField: "customerId",    // Field in orders
      foreignField: "_id",         // Field in customers
      as: "customerDetails"        // New array field added
  }},
  { $unwind: "$customerDetails" }  // Flatten array to object
])`,
        codeExplanation: "$lookup adds an array. $unwind after it creates one document per array element — effectively 'flattening' the join like a SQL JOIN row expansion.",
        analogyOrTip: "💡 $lookup is MongoDB's SQL JOIN. But remember: embedding related data in the same document (when sensible) is usually faster than $lookup."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Count orders per customer",
        explanation: "Use $group with $sum: 1 to count documents per customer ID.",
        codeExample: `db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
])`,
        outputPreview: `[
  { _id: "C001", count: 42 },
  { _id: "C007", count: 38 },
  ...
]`
      },
      {
        stepNumber: 2,
        stepTitle: "Compute total revenue by product category",
        explanation: "Group by category field and sum the revenue for each.",
        codeExample: `db.sales.aggregate([
  { $group: {
      _id: "$category",
      totalRevenue: { $sum: "$amount" },
      transactions: { $sum: 1 }
  }},
  { $sort: { totalRevenue: -1 } }
])`,
        outputPreview: `[
  { _id: "Electronics", totalRevenue: 120000, transactions: 450 },
  { _id: "Clothing",    totalRevenue:  65000, transactions: 890 }
]`
      },
      {
        stepNumber: 3,
        stepTitle: "Join orders with customer names",
        explanation: "Use $lookup to pull customer name from the customers collection.",
        codeExample: `db.orders.aggregate([
  { $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
  }},
  { $unwind: "$customer" },
  { $project: {
      orderId: 1,
      amount: 1,
      customerName: "$customer.name"
  }}
])`,
        outputPreview: `[
  { orderId: "ORD-001", amount: 250, customerName: "Alice" }
]`
      }
    ],

    keyOperators: [
      {
        name: "$lookup (Left Outer Join)",
        description: "Joins documents from another collection into an array field.",
        example: '{ $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "items" } }'
      },
      {
        name: "$group & Accumulators",
        description: "Groups documents by an expression and computes aggregates ($sum, $avg, $push, $addToSet, $min, $max).",
        example: '{ $group: { _id: "$department", avgSalary: { $avg: "$salary" }, count: { $sum: 1 } } }'
      },
      {
        name: "$setWindowFields (Windowing)",
        description: "Computes running totals, moving averages, and ranks across document partitions.",
        example: '{ $setWindowFields: { partitionBy: "$state", sortBy: { date: 1 }, output: { cumulative: { $sum: "$amount", window: { documents: ["unbounded", "current"] } } } } }'
      }
    ],
    importantRules: [
      "Place $match and $sort stages at the very beginning of the pipeline so MongoDB can leverage database indexes.",
      "Field references in accumulators and expressions MUST be prefixed with a dollar sign: '$salary'."
    ],
    commonMistakes: [
      "Forgetting the '$' prefix in field references ({ $sum: 'salary' } sums literal string 'salary' = 0).",
      "Placing $match after an expensive $group or $unwind stage."
    ],
    teacherTips: [
      "Use $match before $unwind when possible — $unwind can multiply documents significantly.",
      "Test each pipeline stage incrementally: add one stage at a time and inspect output before adding the next."
    ],
    noviceSummaryChecklist: [
      "✅ Aggregation = [ stage1, stage2, stage3, ... ] — documents flow through each stage",
      "✅ $match first — filters early, uses indexes",
      "✅ $group computes: $sum, $avg, $min, $max, $push — always use '$fieldName' in expressions",
      "✅ $lookup joins collections (adds array); follow with $unwind to flatten",
      "✅ $sort → $limit at the end for top-N patterns"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 5: Indexes & ESR Rule
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-indexes-esr",
    lectureNumber: 5,
    moduleTitle: "Performance Engineering",
    topic: "Indexes & ESR Rule",
    level: 6,
    estimatedReadTimeMinutes: 14,
    title: "Indexes, Compound Indexing & The ESR Rule",
    subtitle: "The difference between millisecond queries and full-table scan disasters",
    summary: "Design compound, multikey, TTL, partial, and text indexes. Master the Equality, Sort, Range (ESR) rule to design compound indexes that MongoDB can fully utilise.",

    noviceMentalModel: {
      analogyTitle: "The Index is a Book's Table of Contents",
      analogyStory: "Imagine finding the word 'photosynthesis' in a 1000-page biology textbook. Without an index (table of contents), you'd scan every page — that's a COLLSCAN (collection scan) in MongoDB. With a table of contents that maps topics to page numbers, you jump directly to page 634 — that's an IXSCAN (index scan). MongoDB indexes work the same way: they maintain a sorted data structure (B-tree) that maps field values to document locations on disk. Without an index on a large collection, every query reads every document.",
      keyTakeaway: "Index = a sorted map from field values → document locations. Indexed queries jump directly to results. Unindexed queries scan every document. At 10M documents, this difference is seconds vs milliseconds."
    },

    structuralDiagram: `
HOW INDEXES WORK
═══════════════════════════════════════════════════
  COLLECTION (students, 10M documents)
  ┌──────────────────────────────────────────┐
  │ { name: "Alice", age: 20, gpa: 3.8, ... }│
  │ { name: "Bob",   age: 22, gpa: 3.5, ... }│
  │ { name: "Carol", age: 19, gpa: 3.9, ... }│
  │              ... 10M more docs ...        │
  └──────────────────────────────────────────┘

  WITHOUT INDEX (COLLSCAN):
  → Scan all 10M docs to find age > 20. SLOW!

  WITH INDEX on { age: 1 }:
  ┌─────────────────────────────┐
  │ B-TREE INDEX (sorted by age)│
  │  18 → [doc_id_x, doc_id_y] │
  │  19 → [doc_id_z]            │
  │  20 → [doc_id_a, doc_id_b] │  ← jump here
  │  21 → [doc_id_c]            │
  └─────────────────────────────┘
  → Jump to age=20 entry, traverse forward. FAST!

ESR RULE (Compound Index Field Order):
  ┌────────────────────────────────────────────┐
  │  E — Equality fields first  (status = "ok")│
  │  S — Sort fields second     (sort by date) │
  │  R — Range fields last      (age > 18)     │
  └────────────────────────────────────────────┘
═══════════════════════════════════════════════════`,

    coreConcepts: [
      {
        heading: "Creating Indexes — createIndex()",
        explanation: "Create an index with db.collection.createIndex({ field: 1 }) where 1 = ascending, -1 = descending. Index direction matters for sorting but not for single-field equality checks.",
        codeSnippet: `// Single field index on age
db.students.createIndex({ age: 1 })

// Unique index on email (prevents duplicates)
db.users.createIndex({ email: 1 }, { unique: true })

// Compound index (multiple fields)
db.orders.createIndex({ status: 1, createdAt: -1 })

// TTL index (auto-delete after 24 hours)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })`,
        codeExplanation: "Indexes are persistent data structures stored alongside the collection. They automatically update on every insert/update/delete — which is why too many indexes slow down writes.",
        analogyOrTip: "💡 A unique index is like a primary key constraint in SQL — MongoDB will reject any insert that duplicates an indexed field value."
      },
      {
        heading: "The ESR Rule — Compound Index Field Order",
        explanation: "When building a compound index (multiple fields), order matters. Put Equality fields first (fields with exact matches), Sort fields second (fields used in .sort()), Range fields last (fields with $gt, $lt, $in, etc.). Violating ESR causes in-memory sorts and partial index use.",
        codeSnippet: `// Query: find active orders, sort by date, where amount > 100
db.orders.find(
  { status: "active", amount: { $gt: 100 } }
).sort({ createdAt: -1 })

// ✅ Correct ESR compound index:
db.orders.createIndex({ status: 1, createdAt: -1, amount: 1 })
//                       ↑ Equality   ↑ Sort         ↑ Range

// ❌ Wrong order (Range before Sort causes in-memory sort):
db.orders.createIndex({ amount: 1, status: 1, createdAt: -1 })`,
        codeExplanation: "ESR: status (E) first because it's an equality match. createdAt (S) second because it's the sort field. amount (R) last because it's a range.",
        analogyOrTip: "💡 ESR mnemonic: 'Every Sunday Run' — Equality, Sort, Range. Write the index fields in that order."
      },
      {
        heading: "Index Left-Prefix Rule",
        explanation: "A compound index on { a, b, c } can support queries on (a), (a, b), or (a, b, c) — but NOT on (b) alone or (c) alone. You can only 'skip' fields from the right, not from the left.",
        codeSnippet: `// Index: { status: 1, customerId: 1, createdAt: 1 }

// ✅ Uses index (left prefix match):
db.orders.find({ status: "pending" })
db.orders.find({ status: "pending", customerId: "C001" })

// ❌ Does NOT use index (skips 'status', the leftmost field):
db.orders.find({ customerId: "C001" })
db.orders.find({ createdAt: { $gt: new Date("2024-01-01") } })`,
        codeExplanation: "MongoDB can only use an index if the query starts with the leftmost fields of the index. Think of it like alphabetical sorting: you can find words starting with 'ca' easily, but not all words ending in 'at'.",
        analogyOrTip: "💡 The index is like a phone book sorted by Last Name, First Name. You can look up 'Smith, John' easily. But finding everyone named 'John' (without the last name) still requires scanning."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Create an index and verify it was created",
        explanation: "Create a compound index, then list all indexes on the collection.",
        codeExample: `db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.getIndexes()`,
        outputPreview: `[
  { key: { _id: 1 }, name: "_id_" },
  { key: { status: 1, createdAt: -1 }, name: "status_1_createdAt_-1" }
]`
      },
      {
        stepNumber: 2,
        stepTitle: "Run explain() to confirm index is used",
        explanation: "Use explain('executionStats') to see if your query uses an IXSCAN (good) or COLLSCAN (bad).",
        codeExample: `db.orders.find({ status: "pending" })
  .sort({ createdAt: -1 })
  .explain("executionStats")`,
        outputPreview: `{
  executionStages: {
    stage: "IXSCAN",          // ✅ Good — using index
    totalKeysExamined: 12,
    totalDocsExamined: 12,
    nReturned: 12
  }
}`
      },
      {
        stepNumber: 3,
        stepTitle: "Drop an index you no longer need",
        explanation: "Unused indexes slow down writes without helping reads. Drop them.",
        codeExample: `// Drop by name
db.orders.dropIndex("status_1_createdAt_-1")

// Drop all non-_id indexes (careful!)
db.orders.dropIndexes()`,
        outputPreview: `{ nIndexesWas: 2, ok: 1 }`
      }
    ],

    keyOperators: [
      {
        name: "The ESR Rule",
        description: "Order compound index fields: 1. Equality fields (=), 2. Sort fields (order), 3. Range fields (>, <, in).",
        example: 'db.orders.createIndex({ status: 1, customerId: 1, createdAt: 1 })'
      },
      {
        name: "Partial Index",
        description: "Indexes only documents that satisfy a specified filter expression, saving disk and RAM.",
        example: 'db.users.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } })'
      }
    ],
    importantRules: [
      "Covered Query: When all fields requested in the query filter and projection are satisfied entirely by index keys (totalDocsExamined = 0).",
      "Compound indexes support left-prefix matching: an index on { a: 1, b: 1, c: 1 } supports queries on (a), (a, b), and (a, b, c), but NOT on (b) or (c) alone."
    ],
    commonMistakes: [
      "Creating an index on every single field, which severely slows down insert and update performance.",
      "Placing Range filter fields before Sort fields in compound indexes, triggering in-memory blocking sorts."
    ],
    teacherTips: [
      "Rule of thumb: create indexes to support your most frequent and most expensive queries, not all queries.",
      "A covered query (all fields in the index, 0 docs examined) is the holy grail of query optimization."
    ],
    noviceSummaryChecklist: [
      "✅ Index = sorted B-tree map from field values to document locations — IXSCAN vs COLLSCAN",
      "✅ createIndex({ field: 1 }) ascending, -1 descending; { unique: true } prevents duplicates",
      "✅ ESR Rule: Equality fields FIRST, Sort fields SECOND, Range fields LAST in compound indexes",
      "✅ Left-prefix rule: a { a, b, c } index supports (a), (a,b), (a,b,c) but NOT (b) alone",
      "✅ Use .explain('executionStats') to verify IXSCAN and check totalDocsExamined vs nReturned"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LECTURE 6: Transactions & Consistency
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-transactions-advanced",
    lectureNumber: 6,
    moduleTitle: "Advanced Architecture",
    topic: "Transactions & Consistency",
    level: 8,
    estimatedReadTimeMinutes: 12,
    title: "Multi-Document ACID Transactions & Consistency",
    subtitle: "Guaranteeing atomicity and consistency across multiple collections",
    summary: "Execute distributed transactions, tune writeConcern and readConcern, deploy sharded clusters, and listen to Change Streams.",

    noviceMentalModel: {
      analogyTitle: "The Bank Transfer Analogy",
      analogyStory: "You transfer £500 from your savings account to your current account. Two things must happen: (1) Deduct £500 from savings, (2) Add £500 to current. What if the app crashes after step 1 but before step 2? You've lost £500! Transactions solve this: wrap both operations in a transaction. If ANYTHING fails, MongoDB rolls back BOTH changes — as if the transfer never happened. Atomicity means: all-or-nothing. Either both changes commit, or neither does.",
      keyTakeaway: "A transaction groups multiple operations so they either ALL succeed (commit) or ALL fail and rollback. Use transactions for operations that must be atomic across multiple collections or documents."
    },

    structuralDiagram: `
TRANSACTION LIFECYCLE
══════════════════════════════════════════════════
  START TRANSACTION
       │
       ▼
  ┌──────────────────────────────────────┐
  │  Operation 1: debit savings account  │
  │  Operation 2: credit current account │
  │  Operation 3: log audit trail        │
  └──────────────────────────────────────┘
       │
       ├── All OK? ──▶ COMMIT  ──▶ All changes persisted ✅
       │
       └── Any Error? ─▶ ABORT ──▶ All changes rolled back ↩️

WRITE CONCERN (Durability settings):
  w: 0  — No acknowledgement (fire and forget)
  w: 1  — Primary node confirms (default)
  w: "majority" — Majority of replica nodes confirm ← use for critical data

READ CONCERN (Isolation settings):
  "local"     — Read from primary (may return uncommitted data)
  "majority"  — Only return data acknowledged by majority
  "snapshot"  — Consistent snapshot at transaction start time
══════════════════════════════════════════════════`,

    coreConcepts: [
      {
        heading: "Starting and Committing a Transaction",
        explanation: "Transactions require a client session. Start the session, start the transaction, perform operations using that session, then commit. Always wrap in try/catch/finally to handle aborts.",
        codeSnippet: `const session = db.getMongo().startSession();
try {
  session.startTransaction({
    readConcern:  { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  // Both operations must succeed together
  db.accounts.updateOne(
    { _id: "savings" },
    { $inc: { balance: -500 } },
    { session }
  );
  db.accounts.updateOne(
    { _id: "current" },
    { $inc: { balance: +500 } },
    { session }
  );

  session.commitTransaction();
  print("Transfer successful!");
} catch (err) {
  session.abortTransaction();
  print("Transfer failed, rolled back:", err.message);
} finally {
  session.endSession();
}`,
        codeExplanation: "The { session } option in each operation ties it to the transaction. Without it, the operation runs outside the transaction scope.",
        analogyOrTip: "⚠️ Always call session.endSession() in finally — otherwise you'll leak sessions and hit connection limits."
      },
      {
        heading: "writeConcern — How Durable Must Writes Be?",
        explanation: "writeConcern controls how many replica set members must acknowledge a write before MongoDB considers it successful. Higher w = more durability, slightly more latency. For critical financial or user data, always use w: 'majority'.",
        codeSnippet: `// Default — primary only (fast but less durable)
db.orders.insertOne({ ... }, { writeConcern: { w: 1 } })

// Most durable — majority of replica nodes confirm
db.payments.insertOne({ ... }, { writeConcern: { w: "majority" } })

// Fire-and-forget (dangerous — no confirmation)
db.logs.insertOne({ ... }, { writeConcern: { w: 0 } })`,
        analogyOrTip: "💡 Think of w:'majority' as requiring two out of three bank tellers to confirm your deposit before handing you a receipt."
      },
      {
        heading: "Change Streams — Listening for Real-Time Changes",
        explanation: "Change streams let your application react to database changes in real time — without polling. They use the replica set oplog internally. Perfect for notifications, cache invalidation, and audit logs.",
        codeSnippet: `// Watch for any new orders inserted
const changeStream = db.orders.watch([
  { $match: { operationType: "insert" } }
]);

changeStream.on("change", (change) => {
  console.log("New order:", change.fullDocument);
  // Trigger email, update cache, etc.
});`,
        codeExplanation: "Change streams work on collections, databases, or entire deployments. They require a replica set (even a single-node one with --replSet on Atlas Serverless).",
        analogyOrTip: "💡 Change streams are like a pub/sub event bus built directly into MongoDB — no need for a separate message broker for simple notification patterns."
      }
    ],

    stepByStepWalkthrough: [
      {
        stepNumber: 1,
        stepTitle: "Understand when to use transactions",
        explanation: "Transactions add overhead. Only use them when you truly need atomicity across multiple documents or collections. For single document operations, MongoDB is already atomic without transactions.",
        codeExample: `// NO transaction needed — single document = atomic
db.orders.updateOne(
  { _id: orderId },
  { $set: { status: "paid" }, $push: { history: "paid" } }
)

// TRANSACTION needed — two different collections
// (debit account AND create invoice — must both succeed)`,
        outputPreview: `// Single-doc operations are atomic in MongoDB automatically.
// Multi-doc operations across collections need sessions.`
      },
      {
        stepNumber: 2,
        stepTitle: "Watch a collection for inserts in real time",
        explanation: "Open a change stream on the orders collection and log new orders as they arrive.",
        codeExample: `const stream = db.orders.watch([
  { $match: { operationType: { $in: ["insert", "update"] } } }
]);
while (stream.hasNext()) {
  const change = stream.next();
  print("Change detected:", JSON.stringify(change.fullDocument));
}`,
        outputPreview: `Change detected: { orderId: "ORD-999", amount: 250, status: "pending" }`
      }
    ],

    keyOperators: [
      {
        name: "Client Session Transactions",
        description: "Atomic multi-document updates across multiple collections with ACID guarantees.",
        example: 'const session = client.startSession(); session.startTransaction(); ... await session.commitTransaction();'
      },
      {
        name: "Change Streams (watch())",
        description: "Listen to dynamic database modifications using the replica set oplog without polling.",
        example: 'const changeStream = db.orders.watch([{ $match: { "operationType": "insert" } }]);'
      }
    ],
    importantRules: [
      "Transactions incur overhead; design schemas with embedded documents so most single-document operations are naturally atomic without multi-document transactions.",
      "Write Concern 'w: majority' ensures durability across a majority of voting replica set nodes."
    ],
    commonMistakes: [
      "Keeping transactions open for long periods (default transaction lifetime limit is 60 seconds in MongoDB).",
      "Selecting a monotonically increasing shard key (e.g. timestamp) which creates severe write bottlenecks on a single shard."
    ],
    teacherTips: [
      "Design your schema to minimize the need for transactions — embedded documents are atomically updated without sessions.",
      "Always abort and end the session in a finally block to prevent resource leaks."
    ],
    noviceSummaryChecklist: [
      "✅ Transactions = all-or-nothing: commit (all succeed) or abort (all roll back)",
      "✅ Wrap operations in a session: db.collection.updateOne({...}, { session })",
      "✅ writeConcern: { w: 'majority' } for critical data durability",
      "✅ Change streams let you react to DB changes in real-time without polling",
      "✅ Single-document operations are already atomic — no transaction needed"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EXISTING NOTES (kept with original structure)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "note-data-modeling",
    lectureNumber: 7,
    moduleTitle: "Schema Design",
    topic: "Data Modeling & Schema Design",
    level: 4,
    estimatedReadTimeMinutes: 10,
    title: "Schema Design: Embedding vs Referencing",
    subtitle: "When to embed data and when to reference it — the most important design decision",
    summary: "Model relationships (1:1, 1:N, N:M), evaluate access patterns, cardinality, and avoid the 16MB document boundary.",
    keyOperators: [
      {
        name: "1-to-Few (Embedding)",
        description: "Embed bounded data frequently accessed together with the parent.",
        example: '{ _id: "user-1", name: "Sarah", addresses: [{ city: "Lagos", zip: "100001" }] }'
      },
      {
        name: "1-to-Squillions (Referencing)",
        description: "Store child records in a separate collection with a parent foreign key reference.",
        example: 'db.logs.find({ deviceId: "DEV-109" }).sort({ timestamp: -1 })'
      }
    ],
    importantRules: [
      "Model your data for your application's read and write access patterns, not generic third-normal-form (3NF) relational tables.",
      "Favor embedding when entities have a 1-to-few relationship and are updated together."
    ],
    commonMistakes: [
      "Allowing an embedded array to grow unbounded (e.g. logging IoT events inside a single device document).",
      "Over-normalizing into dozens of tiny collections requiring expensive application-level joins."
    ]
  },
  {
    id: "note-performance",
    lectureNumber: 8,
    moduleTitle: "Performance Engineering",
    topic: "Performance & explain()",
    level: 6,
    estimatedReadTimeMinutes: 8,
    title: "Query Optimization & explain('executionStats')",
    subtitle: "Finding and eliminating slow queries before they find you",
    summary: "Analyze query execution plans, identify COLLSCAN bottlenecks, and balance read/write performance.",
    keyOperators: [
      {
        name: "explain('executionStats')",
        description: "Returns statistics on query execution: totalKeysExamined, totalDocsExamined, nReturned, and executionStages.",
        example: 'db.orders.find({ status: "pending" }).explain("executionStats")'
      }
    ],
    importantRules: [
      "Target ratio: totalDocsExamined should ideally match nReturned. A high ratio (e.g. 100,000 docs examined to return 5) flags a missing or inefficient index.",
      "IXSCAN is an index scan stage; FETCH retrieves documents from disk based on index pointers; COLLSCAN is a full table scan."
    ],
    commonMistakes: [
      "Accepting in-memory sorts for large collections (MongoDB caps in-memory sort to 100MB unless allowDiskUse is enabled or an index is used)."
    ]
  },
  {
    id: "note-security-admin",
    lectureNumber: 9,
    moduleTitle: "Security & Ops",
    topic: "Security & RBAC",
    level: 7,
    estimatedReadTimeMinutes: 10,
    title: "Authentication, RBAC & High Availability",
    subtitle: "Securing your cluster and keeping it running 24/7",
    summary: "Configure replica set elections, oplog replication, failover, SCRAM authentication, and role-based access control.",
    keyOperators: [
      {
        name: "Replica Set Status",
        description: "Inspect replica set health, primary node, secondary replication lag, and election state.",
        example: 'rs.status() and rs.stepDown()'
      },
      {
        name: "Create User with Roles",
        description: "Grant fine-grained permissions following the Principle of Least Privilege.",
        example: 'db.createUser({ user: "reportingApp", pwd: passwordPrompt(), roles: [{ role: "read", db: "analytics" }] })'
      }
    ],
    importantRules: [
      "Replica sets require an odd number of voting members (e.g. 3 or 5) to ensure a clear majority in elections during network partitions.",
      "Secondary reads with readPreference: 'secondary' can return stale data if replication lag exists."
    ],
    commonMistakes: [
      "Giving administrative or 'root' roles to application microservices instead of isolated readWrite access.",
      "Forgetting to configure TLS/SSL in transit between application drivers and Atlas clusters."
    ]
  }
];

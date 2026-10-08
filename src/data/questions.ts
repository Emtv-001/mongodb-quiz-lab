import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  // =========================================================================
  // LEVEL 1: BEGINNER & FUNDAMENTALS
  // =========================================================================
  {
    id: "fund-001",
    topic: "MongoDB Fundamentals",
    level: 1,
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Nature of MongoDB Architecture",
    scenario: "An engineering team is evaluating MongoDB to replace a legacy relational table architecture.",
    options: [
      "A document-oriented NoSQL database that stores data in BSON format",
      "A relational tabular database utilizing strict fixed column schemas",
      "A graph database storing entities strictly as nodes and directed edges",
      "A pure in-memory cache that cannot persist data to permanent disk storage"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB is a leading document database classified under NoSQL. It organizes records as flexible, self-describing BSON (Binary JSON) documents rather than rigid relational rows and columns.",
    misconception: "Thinking MongoDB is purely in-memory (like Redis) or an RDBMS with fixed schemas.",
    conceptFocus: "MongoDB stores data in flexible BSON documents.",
    tags: ["fundamentals", "nosql", "bson"],
    points: 5
  },
  {
    id: "fund-002",
    topic: "MongoDB Fundamentals",
    level: 1,
    difficulty: "Easy",
    type: "true-false",
    title: "JSON vs BSON Data Representation",
    scenario: "Is the following statement technically correct?",
    codeSnippet: "BSON is a binary serialization format for JSON that adds support for additional data types such as Date, ObjectId, and Int32/Int64 which standard text JSON does not natively distinguish.",
    options: [
      "True",
      "False"
    ],
    correctOptionIndex: 0,
    explanation: "True. Standard text JSON only supports strings, generic numbers, booleans, arrays, objects, and null. BSON extends JSON with explicit binary encodings for dates, timestamps, 32/64-bit integers, Decimal128, and ObjectId.",
    misconception: "Believing that MongoDB stores raw JSON text strings on disk.",
    conceptFocus: "BSON provides high-speed binary serialization and rich types beyond JSON.",
    tags: ["bson", "json", "types"],
    points: 5
  },
  {
    id: "fund-003",
    topic: "MongoDB Fundamentals",
    level: 1,
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Structure of an ObjectId",
    scenario: "By default, MongoDB creates an '_id' field containing a 12-byte BSON ObjectId. What components make up this 12-byte identifier?",
    options: [
      "4-byte Unix timestamp + 5-byte random value unique to machine/process + 3-byte incrementing counter",
      "8-byte random UUID + 4-byte client IP address",
      "12-byte purely random cryptographically generated string",
      "6-byte millisecond timestamp + 6-byte CPU serial number"
    ],
    correctOptionIndex: 0,
    explanation: "A 12-byte BSON ObjectId is ordered by time: 4-byte timestamp (seconds since Unix epoch) + 5-byte random value (unique per machine/process) + 3-byte incrementing counter initialized to a random value. This makes ObjectIds roughly sortable chronologically.",
    misconception: "Assuming ObjectId is completely random like a standard UUID v4.",
    conceptFocus: "ObjectId embeds a 4-byte timestamp making it naturally sortable by creation time.",
    tags: ["objectid", "bson", "internals"],
    points: 5
  },
  {
    id: "conn-001",
    topic: "Connections & Tools",
    level: 1,
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Default MongoDB Connection Port",
    scenario: "When initializing a local mongod daemon or connecting with mongosh, what is the default TCP listening port?",
    options: [
      "27017",
      "5432",
      "3306",
      "8080"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB default listener port is 27017. Port 5432 is PostgreSQL, 3306 is MySQL.",
    conceptFocus: "Port 27017 is standard for MongoDB instances and clusters.",
    tags: ["networking", "tools", "mongosh"],
    points: 5
  },
  {
    id: "conn-002",
    topic: "Connections & Tools",
    level: 1,
    difficulty: "Medium",
    type: "multiple-select",
    title: "Atlas Network Security Configuration",
    scenario: "When setting up network security for an Atlas cluster in production, which of the following practices follow security best practices?",
    options: [
      "Allowing 0.0.0.0/0 (any IP) permanently in production",
      "Configuring strict IP Access Lists containing only production application server IPs or NAT gateways",
      "Setting up VPC Peering or AWS/GCP PrivateLink for private network routing without public internet exposure",
      "Hardcoding database username and password in frontend JavaScript bundle"
    ],
    correctOptionIndices: [1, 2],
    explanation: "Security best practices require limiting access via specific IP access lists or private network peering (VPC Peering / PrivateLink). Opening 0.0.0.0/0 in production or embedding credentials in client code is a critical vulnerability.",
    misconception: "Leaving 0.0.0.0/0 active because it was convenient during local development.",
    conceptFocus: "Atlas production clusters require strict IP filtering or PrivateLink.",
    tags: ["security", "atlas", "networking"],
    points: 10
  },

  // =========================================================================
  // LEVEL 2 & 3: CRUD OPERATIONS & QUERYING
  // =========================================================================
  {
    id: "crud-001",
    topic: "CRUD Operations",
    level: 3,
    difficulty: "Medium",
    type: "predict-output",
    title: "Return Value of insertOne()",
    scenario: "You execute the following command in mongosh:\ndb.patients.insertOne({ patientName: 'Ngozi Obi', age: 34 })\nWhat does MongoDB return upon successful acknowledgement?",
    options: [
      "{ acknowledged: true, insertedId: ObjectId('...') }",
      "The entire newly created document including all server metadata",
      "true (boolean)",
      "An array containing [1, 'Ngozi Obi']"
    ],
    correctOptionIndex: 0,
    explanation: "In modern mongosh and MongoDB drivers, insertOne() returns an acknowledgement object containing '{ acknowledged: true, insertedId: ObjectId(...) }'. It does not return the full inserted document.",
    misconception: "Expecting insertOne() to return the document itself.",
    conceptFocus: "insertOne returns { acknowledged: true, insertedId: ... }.",
    tags: ["crud", "insertOne", "return-values"],
    points: 5
  },
  {
    id: "crud-002",
    topic: "CRUD Operations",
    level: 3,
    difficulty: "Hard",
    type: "write-command",
    title: "Atomic findOneAndUpdate with Upsert",
    scenario: "In collection 'accounts', atomically find the account where accountNumber is '0123456789', increment its balance by 5000, and return the NEW modified document after the update.",
    expectedCommand: 'db.accounts.findOneAndUpdate({ accountNumber: "0123456789" }, { $inc: { balance: 5000 } }, { returnDocument: "after" })',
    acceptableAlternatives: [
      'db.accounts.findOneAndUpdate({accountNumber:"0123456789"},{$inc:{balance:5000}},{returnDocument:"after"})',
      'db.accounts.findOneAndUpdate({ "accountNumber": "0123456789" }, { "$inc": { "balance": 5000 } }, { returnDocument: "after" })'
    ],
    explanation: "findOneAndUpdate() provides atomic fetch-and-modify. Setting '{ returnDocument: \"after\" }' (or '{ returnNewDocument: true }' in older syntax) causes it to return the updated document rather than the original pre-update state.",
    misconception: "Using updateOne() and then a separate find(), which is not atomic and risks race conditions.",
    conceptFocus: "findOneAndUpdate with { returnDocument: 'after' } provides atomic update and retrieval.",
    tags: ["crud", "atomic", "findOneAndUpdate"],
    points: 10
  },
  {
    id: "query-001",
    topic: "Basic & Advanced Querying",
    level: 2,
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Suppression of Default _id in Projection",
    scenario: "You want to find all students in section 'A' and display ONLY their Name and GPA, without the default _id field.",
    options: [
      "db.GptData02.find({ Section: 'A' }, { Name: 1, GPA: 1, _id: 0 })",
      "db.GptData02.find({ Section: 'A' }, { Name: 1, GPA: 1, _id: 1 })",
      "db.GptData02.find({ Section: 'A' }).exclude('_id').include(['Name', 'GPA'])",
      "db.GptData02.find({ Section: 'A' }, { Name: 1, GPA: 1 })"
    ],
    correctOptionIndex: 0,
    explanation: "_id is included by default in find projections. To suppress it, you must explicitly specify {_id: 0}.",
    conceptFocus: "{_id: 0} is the only field exclusion permitted inside an inclusion projection.",
    tags: ["querying", "projection", "_id"],
    points: 5
  },
  {
    id: "query-002",
    topic: "Comparison & Logical Operators",
    level: 2,
    difficulty: "Medium",
    type: "write-command",
    title: "Filtering with $in and $gte",
    scenario: "Query collection 'GptData02' for all students who belong to Section 'A' or 'B' AND have a GPA greater than or equal to 3.5.",
    expectedCommand: 'db.GptData02.find({ Section: { $in: ["A", "B"] }, GPA: { $gte: 3.5 } })',
    acceptableAlternatives: [
      'db.GptData02.find({Section:{$in:["A","B"]},GPA:{$gte:3.5}})',
      'db.GptData02.find({ GPA: { $gte: 3.5 }, Section: { $in: ["A", "B"] } })',
      'db.GptData02.find({ $and: [{ Section: { $in: ["A", "B"] } }, { GPA: { $gte: 3.5 } }] })'
    ],
    explanation: "Multiple field clauses in a single object act as an implicit $and. $in matches any element in the specified array (Section 'A' or 'B'), and $gte verifies GPA is at least 3.5.",
    conceptFocus: "Comma-separated query fields evaluate as an implicit logical AND.",
    tags: ["querying", "comparison", "in"],
    points: 10
  },
  {
    id: "query-003",
    topic: "Arrays & Indexing",
    level: 2,
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Array Zero-Based Index Match",
    scenario: "What does the query db.GptData02.find({ 'Courses.0': 'Java' }) match?",
    options: [
      "Documents where the very first element of Courses array is 'Java'",
      "Documents where Courses array contains 'Java' at any index",
      "Documents where the Courses array has length 0",
      "Documents where 'Java' is the last course"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB uses zero-based indexing in queries. 'Courses.0' specifically tests whether the element at index 0 (the first element) equals 'Java'.",
    conceptFocus: "Array index notation .0 refers to the first element.",
    tags: ["arrays", "indexing", "dot-notation"],
    points: 5
  },
  {
    id: "query-004",
    topic: "Arrays & Indexing",
    level: 2,
    difficulty: "Hard",
    type: "multiple-choice",
    title: "Behavior of $elemMatch on Arrays of Objects",
    scenario: "Given collection 'hospital' with patients containing prescriptions: [ { medication: 'Aspirin', dosage: '81mg' }, { medication: 'Lisinopril', dosage: '10mg' } ]. Why should you use $elemMatch rather than multiple dot conditions when matching a patient taking Aspirin at 81mg?",
    options: [
      "$elemMatch ensures BOTH conditions match within the SAME array sub-document, whereas multiple dot filters can match across different array elements",
      "$elemMatch is required because MongoDB cannot index arrays without it",
      "Dot notation does not work on arrays",
      "$elemMatch converts array elements into temporary strings"
    ],
    correctOptionIndex: 0,
    explanation: "Without $elemMatch, a query like { 'prescriptions.medication': 'Aspirin', 'prescriptions.dosage': '10mg' } would match a document that has Aspirin in one prescription and 10mg in a completely different prescription! $elemMatch guarantees that both criteria are satisfied by the SAME array element.",
    misconception: "Thinking standard multi-field dot notation enforces matching on the same array element.",
    conceptFocus: "$elemMatch guarantees all conditions match within the same array sub-document.",
    tags: ["arrays", "elemMatch", "hospital"],
    points: 5
  },

  // =========================================================================
  // LEVEL 4: DATA MODELING, SCHEMA VALIDATION & JAVASCRIPT
  // =========================================================================
  {
    id: "model-001",
    topic: "Data Modeling & Schema Design",
    level: 4,
    difficulty: "Medium",
    type: "scenario",
    title: "Embedding vs Referencing (1-to-Few vs 1-to-Squillions)",
    scenario: "You are designing an e-commerce platform where a user has up to 3 shipping addresses, but a product can receive 500,000 user reviews over 5 years. How should addresses and reviews be modeled?",
    options: [
      "Embed shipping addresses directly in the User document (1-to-few); Reference reviews in a separate Reviews collection with a productId reference (1-to-many unbounded)",
      "Embed both addresses and all 500,000 reviews directly in the respective documents",
      "Reference both addresses and reviews in separate tables with foreign keys and SQL joins",
      "Embed reviews and reference addresses"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB has a 16MB document size limit. Unbounded 1-to-many relationships (like reviews) must be referenced in a separate collection. Small, bounded relationships that are read together (like user addresses) should be embedded for single-read performance.",
    misconception: "Embedding unbounded arrays inside a parent document, which leads to document growth, fragmentation, and eventually the 16MB limit error.",
    conceptFocus: "Embed bounded 1-to-few; Reference unbounded 1-to-many.",
    tags: ["data-modeling", "schema-design", "16mb-limit"],
    points: 5
  },
  {
    id: "valid-001",
    topic: "Schema Validation",
    level: 4,
    difficulty: "Hard",
    type: "write-command",
    title: "Creating Collection with JSON Schema Validation",
    scenario: "Create a collection named 'accounts' with strict JSON Schema validation requiring 'accountNumber' (string) and 'balance' (number/double).",
    expectedCommand: 'db.createCollection("accounts", { validator: { $jsonSchema: { bsonType: "object", required: ["accountNumber", "balance"], properties: { accountNumber: { bsonType: "string" }, balance: { bsonType: ["double", "int", "number"] } } } } })',
    acceptableAlternatives: [
      'db.createCollection("accounts",{validator:{$jsonSchema:{bsonType:"object",required:["accountNumber","balance"],properties:{accountNumber:{bsonType:"string"},balance:{bsonType:["double","int","number"]}}}}})',
      'db.createCollection("accounts", { validator: { $jsonSchema: { bsonType: "object", required: ["accountNumber", "balance"], properties: { accountNumber: { bsonType: "string" }, balance: { bsonType: "number" } } } } })'
    ],
    explanation: "db.createCollection() accepts a validator object utilizing '$jsonSchema'. Fields listed in 'required' must be present, and 'properties' defines acceptable BSON types.",
    conceptFocus: "MongoDB Schema validation uses $jsonSchema to enforce document integrity.",
    tags: ["validation", "jsonSchema", "createCollection"],
    points: 10
  },

  // =========================================================================
  // LEVEL 5: AGGREGATION PIPELINES
  // =========================================================================
  {
    id: "agg-001",
    topic: "Aggregation Pipelines",
    level: 5,
    difficulty: "Medium",
    type: "write-command",
    title: "Group by Section with Accumulators",
    scenario: "In collection GptData02, write an aggregation query that groups students by their 'Section', calculates 'TotalMarks' using $sum on '$Marks', and calculates 'AverageMarks' using $avg on '$Marks'.",
    expectedCommand: 'db.GptData02.aggregate([{ $group: { _id: "$Section", TotalMarks: { $sum: "$Marks" }, AverageMarks: { $avg: "$Marks" } } }])',
    acceptableAlternatives: [
      'db.GptData02.aggregate([{$group:{_id:"$Section",TotalMarks:{$sum:"$Marks"},AverageMarks:{$avg:"$Marks"}}}])',
      'db.GptData02.aggregate([{ "$group": { "_id": "$Section", "TotalMarks": { "$sum": "$Marks" }, "AverageMarks": { "$avg": "$Marks" } } }])'
    ],
    explanation: "In $group, the grouping expression is assigned to _id: '$Section'. Field names inside accumulator expressions must be prefixed with '$' ('$Marks') to reference document field values.",
    misconception: "Forgetting the dollar sign prefix in accumulator references (e.g. { $sum: 'Marks' }), which treats 'Marks' as a string literal instead of summing field values.",
    conceptFocus: "Field references in aggregation accumulators require a '$' prefix.",
    tags: ["aggregation", "$group", "$sum", "$avg"],
    points: 10
  },
  {
    id: "agg-002",
    topic: "Aggregation Pipelines",
    level: 5,
    difficulty: "Hard",
    type: "write-command",
    title: "Deconstruct Array with $unwind and Group Count",
    scenario: "In collection GptData02, deconstruct the 'Courses' array so each course is a separate document, then group by course name and compute 'StudentCount' representing how many students take each course.",
    expectedCommand: 'db.GptData02.aggregate([{ $unwind: "$Courses" }, { $group: { _id: "$Courses", StudentCount: { $sum: 1 } } }])',
    acceptableAlternatives: [
      'db.GptData02.aggregate([{$unwind:"$Courses"},{$group:{_id:"$Courses",StudentCount:{$sum:1}}}])',
      'db.GptData02.aggregate([{ "$unwind": "$Courses" }, { "$group": { "_id": "$Courses", "StudentCount": { "$sum": 1 } } }])'
    ],
    explanation: "$unwind deconstructs an array field from the input documents to output a document for each element. Then $group with _id: '$Courses' and { $sum: 1 } calculates the count of each course.",
    conceptFocus: "$unwind deconstructs arrays for element-level aggregation.",
    tags: ["aggregation", "$unwind", "$group"],
    points: 10
  },
  {
    id: "agg-003",
    topic: "Aggregation Pipelines",
    level: 5,
    difficulty: "Expert",
    type: "multiple-choice",
    title: "Left Outer Join with $lookup",
    scenario: "You run the following pipeline on 'orders':\n{\n  $lookup: {\n    from: 'products',\n    localField: 'productId',\n    foreignField: '_id',\n    as: 'productDetails'\n  }\n}\nWhat data type is 'productDetails' in the resulting documents?",
    options: [
      "Always an Array of matching product documents (even if 0 or 1 match)",
      "A single embedded Object if exactly one match was found",
      "A string containing the product ID",
      "A cursor reference that must be resolved with another query"
    ],
    correctOptionIndex: 0,
    explanation: "$lookup performs an equality match and ALWAYS outputs an array field (e.g. 'productDetails: [...]'), containing zero, one, or many matching documents from the foreign collection.",
    misconception: "Assuming $lookup automatically flattens single matches into a single document object without needing $unwind.",
    conceptFocus: "$lookup always returns an array field in the output document.",
    tags: ["aggregation", "$lookup", "join"],
    points: 5
  },

  // =========================================================================
  // LEVEL 6: INDEXING & PERFORMANCE
  // =========================================================================
  {
    id: "idx-001",
    topic: "Indexes & ESR Rule",
    level: 6,
    difficulty: "Hard",
    type: "multiple-choice",
    title: "The ESR (Equality, Sort, Range) Rule",
    scenario: "You have a query: db.orders.find({ status: 'shipped', createdAt: { $gte: ISODate('2026-01-01') } }).sort({ customerId: 1 }). According to MongoDB's ESR rule, in what order should the compound index keys be defined?",
    options: [
      "{ status: 1, customerId: 1, createdAt: 1 }",
      "{ createdAt: 1, status: 1, customerId: 1 }",
      "{ customerId: 1, status: 1, createdAt: 1 }",
      "{ createdAt: 1, customerId: 1, status: 1 }"
    ],
    correctOptionIndex: 0,
    explanation: "The ESR rule dictates: 1) Equality matches first (status), 2) Sort fields second (customerId) to avoid in-memory blocking sorts, 3) Range filter fields last (createdAt). Therefore, { status: 1, customerId: 1, createdAt: 1 } is optimal.",
    misconception: "Putting the range field before the sort field, which forces an in-memory sort.",
    conceptFocus: "ESR Rule: Equality fields first, Sort fields second, Range fields last.",
    tags: ["indexes", "esr-rule", "performance"],
    points: 5
  },
  {
    id: "idx-002",
    topic: "Indexes & ESR Rule",
    level: 6,
    difficulty: "Medium",
    type: "write-command",
    title: "Creating a TTL (Time-To-Live) Index",
    scenario: "Create a TTL index on collection 'sessions' on the 'createdAt' field so that sessions automatically expire and are deleted 3600 seconds (1 hour) after creation.",
    expectedCommand: 'db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })',
    acceptableAlternatives: [
      'db.sessions.createIndex({createdAt:1},{expireAfterSeconds:3600})',
      'db.sessions.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 3600 })'
    ],
    explanation: "A TTL index requires a single-field index on a Date field with the option '{ expireAfterSeconds: n }'. A background thread in MongoDB sweeps and purges expired documents automatically.",
    conceptFocus: "TTL indexes use expireAfterSeconds on Date fields to auto-delete documents.",
    tags: ["indexes", "ttl", "createIndex"],
    points: 10
  },
  {
    id: "perf-001",
    topic: "Performance & explain()",
    level: 6,
    difficulty: "Expert",
    type: "find-error",
    title: "Diagnosing explain('executionStats') Output",
    codeSnippet: '{\n  "winningPlan": {\n    "stage": "COLLSCAN",\n    "filter": { "age": { "$gte": 21 } }\n  },\n  "totalKeysExamined": 0,\n  "totalDocsExamined": 5000000,\n  "nReturned": 120\n}',
    scenario: "Review the explain executionStats output above. Why is this query causing high CPU and memory latency on production?",
    options: [
      "The query executed a full collection scan (COLLSCAN) examining 5,000,000 documents to return only 120, because no index exists on 'age'",
      "totalKeysExamined is 0 because the index was corrupted",
      "nReturned is too low for MongoDB to operate efficiently",
      "COLLSCAN is the fastest possible index stage in MongoDB"
    ],
    correctOptionIndex: 0,
    explanation: "COLLSCAN means a collection scan: MongoDB had to read every single one of the 5 million documents from disk into RAM (totalDocsExamined: 5,000,000) just to find 120 matching records. Creating an index on { age: 1 } would change the stage to IXSCAN and reduce totalDocsExamined to 120.",
    misconception: "Assuming MongoDB automatically creates indexes for all query filters.",
    conceptFocus: "COLLSCAN with totalDocsExamined >> nReturned indicates a missing index.",
    tags: ["performance", "explain", "executionStats"],
    points: 5
  },

  // =========================================================================
  // LEVEL 7: ADMINISTRATION, REPLICATION, BACKUP & SECURITY
  // =========================================================================
  {
    id: "repl-001",
    topic: "Replication & High Availability",
    level: 7,
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Role of the Oplog in Replica Sets",
    scenario: "What is the primary role of the 'oplog.rs' (operations log) capped collection in a MongoDB replica set?",
    options: [
      "Secondary members continuously read the primary's oplog and apply recorded changes to keep their data in sync",
      "It stores client authentication tokens and passwords",
      "It acts as a temporary trash bin for deleted collections",
      "It is an audit log used only for debugging failed network requests"
    ],
    correctOptionIndex: 0,
    explanation: "The oplog (operations log) is a capped collection in the local database that records all write operations applied to the primary. Secondary nodes tail the oplog asynchronously to replicate state.",
    conceptFocus: "Secondary members tail the primary's oplog for data synchronization.",
    tags: ["replication", "replica-set", "oplog"],
    points: 5
  },
  {
    id: "sec-001",
    topic: "Security & RBAC",
    level: 7,
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Principle of Least Privilege with Built-in Roles",
    scenario: "A microservice only needs to read documents from the 'catalog' database and must never modify documents or view other databases. Which built-in role should be assigned?",
    options: [
      "{ role: 'read', db: 'catalog' }",
      "{ role: 'readWrite', db: 'catalog' }",
      "{ role: 'dbAdmin', db: 'catalog' }",
      "{ role: 'root', db: 'admin' }"
    ],
    correctOptionIndex: 0,
    explanation: "Under the Principle of Least Privilege, granting '{ role: \"read\", db: \"catalog\" }' grants read-only access strictly to the catalog database without privileges to alter schemas or modify data.",
    conceptFocus: "Assign the minimal built-in role required for application duties.",
    tags: ["security", "rbac", "roles"],
    points: 5
  },
  {
    id: "backup-001",
    topic: "Backup & Restore",
    level: 7,
    difficulty: "Medium",
    type: "multiple-choice",
    title: "mongodump vs mongoexport",
    scenario: "When taking a full binary backup of a production database to ensure exact BSON data types, indexes, and metadata are preserved, which tool must be used?",
    options: [
      "mongodump (produces binary BSON files)",
      "mongoexport (produces text JSON/CSV files)",
      "mongosh .save()",
      "robomongo"
    ],
    correctOptionIndex: 0,
    explanation: "mongodump captures data in native binary BSON format along with index metadata. mongoexport exports to text JSON or CSV, which loses specific BSON type fidelity (e.g. Int32 vs Double vs Decimal128) and does not backup index definitions.",
    misconception: "Using mongoexport for database backups instead of mongodump.",
    conceptFocus: "mongodump creates binary BSON backups preserving all data types and indexes.",
    tags: ["backup", "mongodump", "tools"],
    points: 5
  },

  // =========================================================================
  // LEVEL 8: TRANSACTIONS & ADVANCED ARCHITECTURES
  // =========================================================================
  {
    id: "trans-001",
    topic: "Transactions & Consistency",
    level: 8,
    difficulty: "Hard",
    type: "multiple-choice",
    title: "Multi-Document ACID Transactions",
    scenario: "When executing a financial transfer debiting Account A and crediting Account B in MongoDB using a multi-document transaction, what session method must be called to guarantee both updates persist or both roll back?",
    options: [
      "session.commitTransaction() after both operations inside a try block, with session.abortTransaction() in catch",
      "db.accounts.sync()",
      "db.accounts.lockTables()",
      "Transactions are purely automatic without sessions"
    ],
    correctOptionIndex: 0,
    explanation: "Multi-document transactions in MongoDB require starting a client session (client.startSession()), beginning the transaction (session.startTransaction()), passing { session } to all CRUD operations, and calling session.commitTransaction() or session.abortTransaction().",
    conceptFocus: "Multi-document transactions require sessions with commitTransaction/abortTransaction.",
    tags: ["transactions", "acid", "banking"],
    points: 5
  },
  {
    id: "shard-001",
    topic: "MongoDB Atlas & Advanced Features",
    level: 8,
    difficulty: "Expert",
    type: "multiple-choice",
    title: "Choosing a Shard Key with High Cardinality",
    scenario: "You are designing a horizontally scaled sharded cluster for an international banking system handling 50,000 writes/sec. Which of the following makes the WORST shard key?",
    options: [
      "A monotonically increasing timestamp / auto-incrementing ID (causes all writes to funnel into the single max-range chunk / hotspot shard)",
      "A compound hashed shard key with high cardinality like { accountId: 'hashed' }",
      "A compound key combining tenant ID with a unique account UUID",
      "A key with high cardinality and even write distribution"
    ],
    correctOptionIndex: 0,
    explanation: "Monotonically increasing values (like timestamps or auto-incrementing integers) cause write hotspotting: every new document is routed to the single chunk holding the upper boundary on one shard, nullifying the benefits of horizontal scaling.",
    misconception: "Thinking timestamps make good shard keys because queries frequently sort by time.",
    conceptFocus: "Monotonically increasing shard keys cause write hotspots.",
    tags: ["sharding", "shard-key", "scalability"],
    points: 5
  },

  // =========================================================================
  // LEVEL 9: REAL-WORLD PROJECTS (Hospital, Banking, E-Commerce, School)
  // =========================================================================
  {
    id: "proj-hosp-001",
    topic: "Data Modeling & Schema Design",
    level: 9,
    difficulty: "Hard",
    type: "scenario",
    title: "Hospital Bed & Ward Dynamic Availability",
    scenario: "In a Hospital Management System, patients are admitted to wards. Nurses must allocate an empty bed without double-booking, even under simultaneous requests. What MongoDB pattern ensures an atomic bed reservation?",
    options: [
      "Use findOneAndUpdate({ _id: wardId, 'beds.number': 14, 'beds.occupied': false }, { $set: { 'beds.$.occupied': true, 'beds.$.patientId': patientId } })",
      "Run a find() to check if bed is empty in JavaScript, then wait 500ms and run updateOne()",
      "Create a separate collection for every single bed in the hospital",
      "Store bed numbers as an unindexed text string"
    ],
    correctOptionIndex: 0,
    explanation: "Using an atomic findOneAndUpdate with the condition '{ 'beds.occupied': false }' leverages document-level atomicity. If two nurses attempt to reserve the bed simultaneously, only one write will match and succeed, preventing race conditions.",
    conceptFocus: "Document-level atomic updates on conditional filters eliminate race conditions.",
    tags: ["hospital", "concurrency", "atomicity"],
    points: 10
  },
  {
    id: "proj-bank-001",
    topic: "Transactions & Consistency",
    level: 9,
    difficulty: "Expert",
    type: "write-command",
    title: "Banking Ledger Balance Check with w:majority",
    scenario: "In collection 'accounts', decrement balance by 25000 for account '0123456789' only if current balance is greater than or equal to 25000, using writeConcern majority.",
    expectedCommand: 'db.accounts.updateOne({ accountNumber: "0123456789", balance: { $gte: 25000 } }, { $inc: { balance: -25000 } }, { writeConcern: { w: "majority" } })',
    acceptableAlternatives: [
      'db.accounts.updateOne({accountNumber:"0123456789",balance:{$gte:25000}},{$inc:{balance:-25000}},{writeConcern:{w:"majority"}})',
      'db.accounts.updateOne({ "accountNumber": "0123456789", "balance": { "$gte": 25000 } }, { "$inc": { "balance": -25000 } }, { "writeConcern": { "w": "majority" } })'
    ],
    explanation: "Combining query condition '{ balance: { $gte: 25000 } }' with '{ $inc: { balance: -25000 } }' ensures non-negative balance protection, and '{ writeConcern: { w: \"majority\" } }' guarantees the write is durably committed to a majority of replica set nodes before acknowledging.",
    conceptFocus: "Conditional decrement prevents overdraft; writeConcern majority guarantees durability.",
    tags: ["banking", "writeConcern", "update"],
    points: 10
  },
  {
    id: "proj-ecom-001",
    topic: "Aggregation Pipelines",
    level: 9,
    difficulty: "Hard",
    type: "write-command",
    title: "E-Commerce Category Revenue Analysis with $match & $group",
    scenario: "In collection 'products', calculate the total inventory valuation per category (multiply price by stock for each product and sum by category), filtering only products with stock greater than 0.",
    expectedCommand: 'db.products.aggregate([{ $match: { stock: { $gt: 0 } } }, { $group: { _id: "$category", totalValuation: { $sum: { $multiply: ["$price", "$stock"] } } } }])',
    acceptableAlternatives: [
      'db.products.aggregate([{$match:{stock:{$gt:0}}},{$group:{_id:"$category",totalValuation:{$sum:{$multiply:["$price","$stock"]}}}}])',
      'db.products.aggregate([{ "$match": { "stock": { "$gt": 0 } } }, { "$group": { "_id": "$category", "totalValuation": { "$sum": { "$multiply": ["$price", "$stock"] } } } }])'
    ],
    explanation: "Filter early with $match to only process in-stock products. Then group by '$category' and compute the sum of '$multiply: [\"$price\", \"$stock\"]'.",
    conceptFocus: "Combining $match with expression accumulators ($sum with $multiply).",
    tags: ["ecommerce", "aggregation", "multiply"],
    points: 10
  },
  {
    id: "proj-hotel-001",
    topic: "Basic & Advanced Querying",
    level: 9,
    difficulty: "Medium",
    type: "write-command",
    title: "Hotel Room Availability Date Conflict Search",
    scenario: "In collection 'reservations', find all reservations where checkIn date is less than or equal to '2026-10-14' AND checkOut date is greater than '2026-10-12'.",
    expectedCommand: 'db.reservations.find({ checkIn: { $lte: "2026-10-14" }, checkOut: { $gt: "2026-10-12" } })',
    acceptableAlternatives: [
      'db.reservations.find({checkIn:{$lte:"2026-10-14"},checkOut:{$gt:"2026-10-12"}})',
      'db.reservations.find({ $and: [{ checkIn: { $lte: "2026-10-14" } }, { checkOut: { $gt: "2026-10-12" } }] })'
    ],
    explanation: "A standard interval overlap query tests if existing reservation starts before prospective checkout AND ends after prospective checkin.",
    conceptFocus: "Interval overlap queries with $lte and $gt.",
    tags: ["hotel", "querying", "date-range"],
    points: 10
  }
];

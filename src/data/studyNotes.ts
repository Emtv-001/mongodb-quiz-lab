import { StudyNoteSection } from '../types';

export const STUDY_NOTES: StudyNoteSection[] = [
  {
    id: "note-fundamentals",
    topic: "MongoDB Fundamentals",
    level: 1,
    title: "MongoDB Architecture, Documents & BSON Anatomy",
    summary: "Understand document databases, JSON vs BSON binary representation, ObjectId anatomy, and the flexible schema model.",
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
    realWorldScenario: "In school and enterprise setups, use ObjectId timestamps for audit trails without needing separate createdAt columns."
  },
  {
    id: "note-crud",
    topic: "CRUD Operations",
    level: 3,
    title: "Comprehensive CRUD & Atomic Methods",
    summary: "Execute inserts, granular updates, atomic find-and-modify, and filter-based deletions.",
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
    ]
  },
  {
    id: "note-data-modeling",
    topic: "Data Modeling & Schema Design",
    level: 4,
    title: "Schema Design: Embedding vs Referencing",
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
    id: "note-aggregation",
    topic: "Aggregation Pipelines",
    level: 5,
    title: "Aggregation Pipelines & Multi-Stage Data Transformations",
    summary: "Harness $match, $group, $lookup, $unwind, $facet, $setWindowFields, and accumulators for high-performance analytics.",
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
    ]
  },
  {
    id: "note-indexes-esr",
    topic: "Indexes & ESR Rule",
    level: 6,
    title: "Indexes, Compound Indexing & The ESR Rule",
    summary: "Design compound, multikey, TTL, partial, and text indexes. Master the Equality, Sort, Range (ESR) rule.",
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
    ]
  },
  {
    id: "note-performance",
    topic: "Performance & explain()",
    level: 6,
    title: "Query Optimization & explain('executionStats')",
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
    topic: "Security & RBAC",
    level: 7,
    title: "Authentication, RBAC & High Availability",
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
  },
  {
    id: "note-transactions-advanced",
    topic: "Transactions & Consistency",
    level: 8,
    title: "Multi-Document ACID Transactions & Advanced Architectures",
    summary: "Execute distributed transactions, tune writeConcern and readConcern, deploy sharded clusters, and listen to Change Streams.",
    keyOperators: [
      {
        name: "Client Session Transactions",
        description: "Atomic multi-document updates across multiple collections with ACID guarantees.",
        example: 'const session = client.startSession(); session.startTransaction(); ... await session.commitTransaction();'
      },
      {
        name: "Change Streams (watch())",
        description: "Listen to real-time database modifications using the replica set oplog without polling.",
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
    ]
  }
];

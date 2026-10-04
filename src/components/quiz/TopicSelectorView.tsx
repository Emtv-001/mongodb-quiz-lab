import React from 'react';
import { MongoTopic } from '../../types';
import { Layers, ArrowRight, Code } from 'lucide-react';
import { DEFAULT_QUESTIONS } from '../../data/questions';
import { ALL_TOPICS } from '../../services/storage';

interface TopicSelectorViewProps {
  onSelectTopic: (topic: MongoTopic) => void;
}

export const TopicSelectorView: React.FC<TopicSelectorViewProps> = ({ onSelectTopic }) => {
  const topicMetadata: Record<MongoTopic, { description: string; keyExample: string; level: number }> = {
    'MongoDB Fundamentals': {
      description: 'Document architecture, NoSQL, BSON vs JSON binary encoding, ObjectId structure, flexible schemas.',
      keyExample: 'ObjectId("...").getTimestamp()',
      level: 1
    },
    'Connections & Tools': {
      description: 'mongosh shell, MongoDB Compass, Atlas connection strings, IP access lists, default port 27017.',
      keyExample: 'mongosh "mongodb+srv://cluster.mongodb.net/test"',
      level: 1
    },
    'CRUD Operations': {
      description: 'insertOne, insertMany, find, findOne, updateOne, replaceOne, deleteMany, findOneAndUpdate, upsert.',
      keyExample: 'db.patients.findOneAndUpdate({_id: 1}, {$set: {status: "admitted"}})',
      level: 3
    },
    'Basic & Advanced Querying': {
      description: 'find() filters, projections ({Name:1, _id:0}), sorting, limit, skip, countDocuments, cursors.',
      keyExample: 'db.GptData02.find({Section:"A"}, {Name:1, _id:0}).sort({GPA:-1})',
      level: 2
    },
    'Comparison & Logical Operators': {
      description: '$gt, $gte, $lt, $lte, $eq, $ne, $in, $nin, $and, $or, $nor, $not, and BSON type sensitivity.',
      keyExample: 'db.accounts.find({$or: [{balance: {$gt: 50000}}, {tier: 3}]})',
      level: 2
    },
    'Regular Expressions': {
      description: '$regex, $options: "i", start ^ and end $ string anchors, array regex matching.',
      keyExample: 'db.GptData02.find({Name: {$regex: "^chioma", $options: "i"}})',
      level: 2
    },
    'Arrays & Indexing': {
      description: 'Zero-based array indexing ("Courses.0": "Java"), $size, $all, $elemMatch on embedded arrays.',
      keyExample: 'db.hospital.find({prescriptions: {$elemMatch: {medication: "Aspirin", dosage: "81mg"}}})',
      level: 2
    },
    'Nested Documents & Dot Notation': {
      description: 'Dot notation ("Address.State"), updating embedded subdocuments without overwriting sibling keys.',
      keyExample: 'db.GptData02.updateOne({_id:10}, {$set:{"Address.State":"Lagos"}})',
      level: 3
    },
    'Update Operators & Modifiers': {
      description: '$set, $unset, $inc, $mul, $min, $max, $currentDate, $push, $addToSet, $pop, $pull, $each, $slice, $sort.',
      keyExample: 'db.GptData02.updateOne({_id:1}, {$push:{Courses:{$each:["React"], $position:0}}})',
      level: 3
    },
    'Data Modeling & Schema Design': {
      description: 'Embedding vs Referencing, 1-to-few vs 1-to-squillions, cardinality, access-pattern design, 16MB limit.',
      keyExample: 'Embed bounded addresses; Reference unbounded reviews',
      level: 4
    },
    'Schema Validation': {
      description: 'JSON Schema ($jsonSchema), required fields, bsonType, validationLevel, validationAction.',
      keyExample: 'db.createCollection("accounts", {validator: {$jsonSchema: {...}}})',
      level: 4
    },
    'Aggregation Pipelines': {
      description: '$match, $group, $sum, $avg, $project, $lookup, $unwind, $facet, $bucket, $setWindowFields.',
      keyExample: 'db.products.aggregate([{$match: {stock: {$gt: 0}}}, {$group: {_id: "$category", total: {$sum: "$price"}}}])',
      level: 5
    },
    'JavaScript & mongosh Scripts': {
      description: 'Variables, loops, cursor iteration, cursor.forEach(), mongosh automation, async/await.',
      keyExample: 'db.orders.find().forEach(doc => printjson(doc))',
      level: 4
    },
    'Indexes & ESR Rule': {
      description: 'Single-field, compound, multikey, TTL, partial, text, hashed, wildcard, and the ESR rule.',
      keyExample: 'db.orders.createIndex({status: 1, customerId: 1, createdAt: 1})',
      level: 6
    },
    'Performance & explain()': {
      description: 'explain("executionStats"), winning plan, COLLSCAN vs IXSCAN, docsExamined vs nReturned ratio.',
      keyExample: 'db.orders.find({status: "shipped"}).explain("executionStats")',
      level: 6
    },
    'Replication & High Availability': {
      description: 'Replica sets, Primary/Secondary nodes, elections, failover, oplog tailing, readPreference.',
      keyExample: 'rs.status() and rs.stepDown()',
      level: 7
    },
    'Transactions & Consistency': {
      description: 'Multi-document ACID transactions, client sessions, writeConcern (w:majority), readConcern, durability.',
      keyExample: 'session.startTransaction(); ... await session.commitTransaction();',
      level: 8
    },
    'Backup & Restore': {
      description: 'mongodump, mongorestore, mongoexport, mongoimport, Atlas continuous backups, PITR.',
      keyExample: 'mongodump --uri="mongodb+srv://..." --archive="backup.gz" --gzip',
      level: 7
    },
    'Security & RBAC': {
      description: 'SCRAM authentication, Authorization, built-in roles (read, readWrite, dbAdmin), least privilege, TLS/SSL.',
      keyExample: 'db.createUser({user: "svc", pwd: "...", roles: [{role: "readWrite", db: "app"}]})',
      level: 7
    },
    'MongoDB Atlas & Advanced Features': {
      description: 'Sharded clusters, shard keys, mongos, change streams (watch()), time series, Atlas Search.',
      keyExample: 'db.orders.watch([{$match: {operationType: "insert"}}])',
      level: 8
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Targeted Curriculum Practice</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Practice by MongoDB Topic (20 Areas)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drill specific syntax, operator modifiers, performance plans, and real-world architectures.
          </p>
        </div>
      </div>

      {/* Grid of 20 Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_TOPICS.map((topicName) => {
          const meta = topicMetadata[topicName] || {
            description: 'Core practical MongoDB syntax and commands.',
            keyExample: 'db.collection.find()',
            level: 1
          };
          const count = DEFAULT_QUESTIONS.filter(q => q.topic === topicName).length;

          return (
            <div
              key={topicName}
              onClick={() => onSelectTopic(topicName)}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Level {meta.level}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {topicName}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {count} Questions
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="font-mono text-[11px] text-emerald-400/90 bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-x-auto truncate">
                  {meta.keyExample}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

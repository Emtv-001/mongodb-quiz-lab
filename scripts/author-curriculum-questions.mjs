// Locally authored, parameterized MongoDB practice drills. No model or network calls.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const file = new URL('../seeds/question-bank-2026-11-20.json', import.meta.url);
const seed = JSON.parse(await readFile(file, 'utf8'));
const source = await readFile(new URL('../src/services/storage.ts', import.meta.url), 'utf8');
const topics = [...source.match(/export const ALL_TOPICS[^=]*=\s*\[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
const domains = ['retail', 'logistics', 'education', 'iot', 'media', 'travel', 'energy', 'manufacturing', 'research', 'gaming'];
const rules = new Map();
function add(topic, difficulty, title, fields, build, explanation) {
  rules.set(topics[topic] + '|' + difficulties[difficulty], { title, fields, build, explanation });
}
// Each builder returns a scenario and four independently checkable answers (correct first).
add(2,3,'Idempotent reservation under contention',['_id','available','requests'], x => [
  'A request with token ' + x.token + ' must decrement available by ' + x.n + ' exactly once. Which single-document update rejects both insufficient stock and a repeated token?',
  x.db + '.updateOne({_id:1,available:{$gte:' + x.n + '},requests:{$ne:"' + x.token + '"}},{$inc:{available:-' + x.n + '},$addToSet:{requests:"' + x.token + '"}})',
  x.db + '.updateOne({_id:1},{$inc:{available:-' + x.n + '}})',
  x.db + '.updateMany({available:{$gte:' + x.n + '}},{$inc:{available:-' + x.n + '}})',
  x.db + '.updateOne({_id:1},{$set:{available:' + x.n + '}})'],
  'A single-document update atomically checks the token and available balance before changing both fields. A repeated request no longer matches.');

add(3,0,'Inclusive numeric filtering',['amount'], x => ['Return documents whose amount is at least ' + x.n + '.',
  x.db+'.find({amount:{$gte:'+x.n+'}})', x.db+'.find({amount:{$gt:'+x.n+'}})', x.db+'.find({amount:{$lte:'+x.n+'}})', x.db+'.find({amount:'+x.n+'})'], '$gte includes the boundary and all greater values.');
add(3,1,'Projection without identifiers',['status','amount'], x => ['Return only amount for documents with status "'+x.status+'", excluding _id.',
  x.db+'.find({status:"'+x.status+'"},{amount:1,_id:0})',x.db+'.find({amount:1},{status:"'+x.status+'"})',x.db+'.find({status:"'+x.status+'"},{amount:0})',x.db+'.find({status:"'+x.status+'"},{amount:1})'], 'The first argument filters; the second projects. _id must be explicitly excluded from an inclusion projection.');
add(3,2,'Keyset pagination with a tie breaker',['tenantId','createdAt','_id'], x => ['Rows are sorted by createdAt descending then _id descending for tenant "'+x.tenant+'". After row (T,I), which continuation condition avoids skipping rows tied at T?',
  '{tenantId:"'+x.tenant+'",$or:[{createdAt:{$lt:T}},{createdAt:T,_id:{$lt:I}}]}',
  '{tenantId:"'+x.tenant+'",createdAt:{$lt:T}}','{tenantId:"'+x.tenant+'",_id:{$lt:I}}','{tenantId:"'+x.tenant+'",createdAt:{$lte:T}}'], 'Lexicographic continuation must include both an earlier timestamp and smaller identifiers at the same timestamp. T and I denote the last row values.');
add(3,3,'Separate missing, null, and numeric values',['amount'], x => ['A migration must select only documents with an explicit null amount, excluding absent fields and numeric amounts such as '+x.n+'. Which predicate works?',
  '{amount:{$type:10}}','{amount:null}','{amount:{$exists:false}}','{amount:{$ne:null}}'], 'BSON type 10 is explicit null. Equality to null also matches a missing field.');

add(4,0,'Strict numeric comparison',['amount'], x => ['Select amount values strictly greater than '+x.n+'.',
  '{amount:{$gt:'+x.n+'}}','{amount:{$gte:'+x.n+'}}','{amount:{$lt:'+x.n+'}}','{amount:{$eq:'+x.n+'}}'], '$gt excludes the boundary; $gte includes it.');
add(4,1,'Conjunction and alternatives',['status','amount'], x => ['Require amount at least '+x.n+' AND status either "'+x.status+'" or "review".',
  '{amount:{$gte:'+x.n+'},status:{$in:["'+x.status+'","review"]}}',
  '{$or:[{amount:{$gte:'+x.n+'}},{status:"'+x.status+'"}]}',
  '{amount:{$lte:'+x.n+'},status:"'+x.status+'"}',
  '{status:{$all:["'+x.status+'","review"]}}'], 'Different query fields are implicitly ANDed, and $in expresses alternatives for a scalar field.');
add(4,2,'Comparing fields in one document',['spent','budget'], x => ['Select documents where spent exceeds budget by at least '+x.n+'. Which uses an expression correctly?',
  '{$expr:{$gte:[{$subtract:["$spent","$budget"]},'+x.n+']}}',
  '{spent:{$gte:"$budget"}}','{$gte:["$spent","$budget"]}',
  '{spent:{$subtract:["$budget",'+x.n+']}}'], '$expr evaluates aggregation expressions against the current document; a normal comparison value "$budget" is just a string.');
add(4,3,'Negative predicates and missing fields',['status'], x => ['Exclude "'+x.status+'" but require status to exist. Which predicate implements both requirements?',
  '{status:{$exists:true,$ne:"'+x.status+'"}}','{status:{$ne:"'+x.status+'"}}',
  '{status:{$exists:false}}','{status:{$in:["'+x.status+'"]}}'], '$ne alone can include documents where the field is missing. $exists:true excludes those documents.');

add(5,0,'Anchored prefix matching',['code'], x => ['Match string code values beginning with "'+x.prefix+'".',
  '{code:{$regex:"^'+x.prefix+'"}}','{code:{$regex:"'+x.prefix+'$"}}',
  '{code:"^'+x.prefix+'"}','{code:{$regex:"^$"}}'], 'The caret anchors a regular expression to the beginning of a string.');
add(5,1,'Case insensitive exact text',['status'], x => ['Match exactly "'+x.status+'" regardless of letter case, excluding longer strings.',
  '{status:{$regex:"^'+x.status+'$",$options:"i"}}',
  '{status:{$regex:"'+x.status+'",$options:"i"}}',
  '{status:{$regex:"^'+x.status+'$"}}','{status:"'+x.status.toUpperCase()+'"}'], 'Both anchors enforce a whole-string match; the i flag ignores case.');
add(5,2,'Regex prefix index bounds',['code'], x => ['With a simple ascending index on code and case-sensitive matching, which pattern offers a literal prefix for bounded scanning of codes beginning "'+x.prefix+'"?',
  '^'+x.prefix, '.*'+x.prefix, x.prefix+'$', '.*'+x.prefix+'.*'], 'A case-sensitive anchored literal prefix can constrain index bounds; a leading wildcard does not provide that prefix.');
add(5,3,'Literal regex input',['label'], x => ['The literal label "'+x.prefix+'.'+x.n+'" is supplied by an untrusted form. What must happen before building an anchored exact-match regex?',
  'Escape regex metacharacters in the input, then add ^ and $ anchors.',
  'Insert the input unchanged between anchors.',
  'Remove the anchors and rely on the i flag.',
  'Treat every dot as a wildcard intentionally.'], 'Literal user text must be escaped; otherwise characters such as . change the meaning of the regular expression.');

add(6,0,'Membership in an array',['tags'], x => ['Select documents whose tags array contains "'+x.status+'".',
  '{tags:"'+x.status+'"}','{tags:{$size:"'+x.status+'"}}','{tags:{$exists:"'+x.status+'"}}','{tags:{$eq:[]}}'], 'Equality to a scalar can match an element within an array.');
add(6,1,'Requiring several array members',['tags'], x => ['Require tags to contain both "'+x.status+'" and "priority", in any order and possibly with extra tags.',
  '{tags:{$all:["'+x.status+'","priority"]}}',
  '{tags:{$in:["'+x.status+'","priority"]}}',
  '{tags:["'+x.status+'","priority"]}',
  '{tags:{$size:2}}'], '$all requires both values; $in requires any listed value, and array equality also constrains the complete array.');
add(6,2,'Same array element constraints',['items.sku','items.qty'], x => ['Require one items element to have sku "'+x.prefix+'" AND qty at least '+x.n+'.',
  '{items:{$elemMatch:{sku:"'+x.prefix+'",qty:{$gte:'+x.n+'}}}}',
  '{"items.sku":"'+x.prefix+'","items.qty":{$gte:'+x.n+'}}',
  '{items:{$all:["'+x.prefix+'",'+x.n+']}}','{items:{$size:'+x.n+'}}'], '$elemMatch binds all predicates to the same element. Separate dotted predicates may match different array elements.');
add(6,3,'Compound multikey restriction',['tags','regions'], x => ['A document has tags ["'+x.status+'"] and regions ["'+x.prefix+'"]. Why can a compound index on both fields fail?',
  'Both indexed fields are arrays in the same document, creating a parallel-array compound multikey index.',
  'MongoDB never indexes any array field.', 'A multikey index must always be unique.', 'Every string index requires text search.'], 'For a compound multikey index, a document cannot have array values in more than one indexed field.');

add(7,0,'Reading a nested scalar',['profile.city'], x => ['Match profile.city equal to "'+x.domain+'" without requiring the entire profile object to be identical.',
  '{"profile.city":"'+x.domain+'"}', '{profile:{city:"'+x.domain+'"}}',
  '{"profile.city":{$exists:false}}','{city:"'+x.domain+'"}'], 'A quoted dotted path targets the nested field without comparing the full embedded document.');
add(7,1,'Preserving sibling fields',['profile.city','profile.country'], x => ['Change profile.city to "'+x.domain+'" while preserving profile.country.',
  '{$set:{"profile.city":"'+x.domain+'"}}', '{$set:{profile:{city:"'+x.domain+'"}}}',
  '{$unset:{profile:""}}','{$rename:{profile:"'+x.domain+'"}}'], 'Setting a dotted field updates that value; replacing profile with a new object discards existing siblings.');
add(7,2,'Filtered nested array updates',['groups.members.active','groups.members.score'], x => ['Increment score by '+x.n+' for every active member in every groups element. Which pair of update path and array filter is valid?',
  '"groups.$[].members.$[m].score" with arrayFilters:[{"m.active":true}]',
  '"groups.members.$.score" with no array filter',
  '"groups.$[].members.$[m].score" with arrayFilters:[{active:true}]',
  '"groups.$[].members.$[].score" with no filtering'], 'The all-positional $[] traverses all outer elements; the filtered identifier $[m] applies the condition to inner members.');
add(7,3,'Embedded equality versus dotted conditions',['address.city','address.zip'], x => ['Legacy documents may add address.line2. A query should require city "'+x.domain+'" and zip '+x.n+' but permit extra address fields. Which is robust?',
  '{"address.city":"'+x.domain+'","address.zip":'+x.n+'}',
  '{address:{city:"'+x.domain+'",zip:'+x.n+'}}',
  '{address:{$eq:{zip:'+x.n+',city:"'+x.domain+'"}}}',
  '{address:"'+x.domain+'"}'], 'Dotted predicates do not require exact embedded-document equality or field ordering and permit extra nested fields.');

add(8,0,'Atomic numeric increment',['amount'], x => ['Increase amount by '+x.n+' without replacing other fields.',
  '{$inc:{amount:'+x.n+'}}','{$set:{amount:'+x.n+'}}','{$unset:{amount:""}}','{$rename:{amount:"'+x.n+'"}}'], '$inc adds to the existing numeric value atomically within a document.');
add(8,1,'Insert-only defaults in an upsert',['code','createdAt','status'], x => ['An upsert keyed by code "'+x.prefix+'" must set createdAt only for a newly inserted document. Which operator holds that field?',
  '$setOnInsert', '$set', '$inc', '$unset'], '$setOnInsert applies only when an upsert inserts a new document, leaving existing creation timestamps intact.');
add(8,2,'Pipeline update from current fields',['subtotal','tax','total'], x => ['Set total to subtotal plus tax plus a fixed fee of '+x.n+' using existing field values. Which update is valid?',
  '[{$set:{total:{$add:["$subtotal","$tax",'+x.n+']}}}]',
  '{$set:{total:{$add:["$subtotal","$tax",'+x.n+']}}}',
  '{$inc:{total:"$subtotal"}}','{$rename:{subtotal:"total"}}'], 'An update pipeline (an array of stages) evaluates aggregation expressions; a traditional $set update does not evaluate $add.');
add(8,3,'Compare and swap concurrency',['_id','version','amount'], x => ['Two workers read version '+x.i+'. Only one may set amount to '+x.n+' based on that version. Which update detects a competing write?',
  x.db+'.updateOne({_id:1,version:'+x.i+'},{$set:{amount:'+x.n+'},$inc:{version:1}})',
  x.db+'.updateOne({_id:1},{$set:{amount:'+x.n+'}})',
  x.db+'.updateMany({},{$inc:{version:1}})',
  x.db+'.replaceOne({_id:1},{amount:'+x.n+'})'], 'The version predicate and version increment occur in one atomic update. A stale worker observes matchedCount 0.');

add(9,0,'Choosing a document model',['name','address.city'], x => ['A '+x.domain+' entity and its small address are always read together. Which design usually avoids a separate join?',
  'Embed the bounded address object in the entity document.', 'Create one database per address field.',
  'Store all addresses in a single unbounded global document.', 'Remove the address from persistent storage.'], 'Embedding bounded data accessed together supports a single-document read.');
add(9,1,'Avoiding unbounded growth',['entityId','eventAt'], x => ['Each '+x.domain+' entity can accumulate millions of events. Which model avoids an unbounded embedded events array?',
  'Store events as separate documents keyed by entityId, with an appropriate query index.',
  'Append every event forever into the entity document.',
  'Increase the BSON document limit in a collection option.',
  'Use a capped collection to make one document unlimited.'], 'Separate documents avoid the BSON document size limit and support independently indexed event history.');
add(9,2,'Materialized counters and reconciliation',['entityId','count'], x => ['A '+x.domain+' dashboard stores a denormalized count beside source events. What is required when updates can fail between the two writes?',
  'An atomic transaction where suitable, or an idempotent update/reconciliation strategy.',
  'Assume separate writes can never partially succeed.', 'Disable all indexes.', 'Increase the document nesting depth.'], 'Denormalized values introduce consistency obligations; transactions or reliable reconciliation prevent silent drift.');
add(9,3,'Tenant isolation in unique business keys',['tenantId','externalId'], x => ['externalId "'+x.prefix+'" may repeat across tenants but must be unique within tenant "'+x.tenant+'". Which index and query design is appropriate?',
  'Unique {tenantId:1,externalId:1}; include tenantId in tenant-scoped queries.',
  'Unique {externalId:1}; omit tenantId from queries.',
  'Nonunique {externalId:1}; rely only on UI validation.',
  'Unique {tenantId:1}; allow only one document per tenant.'], 'The compound unique key enforces the per-tenant rule, while tenant-scoped filters preserve isolation.');

add(10,0,'Required schema properties',['status'], x => ['A JSON Schema validator must require the status field on new '+x.domain+' documents. Which keyword declares that?',
  'required:["status"]', 'optional:["status"]', 'index:["status"]', 'sort:{status:1}'], 'The required array lists properties that must be present; defining a property alone does not require it.');
add(10,1,'BSON integer validation',['quantity'], x => ['quantity must be a BSON 32-bit integer, not a floating point value such as '+(x.n+0.5)+'. Which property rule applies?',
  '{bsonType:"int"}', '{bsonType:"string"}', '{type:"integer32"}', '{bsonType:"object"}'], 'MongoDB JSON Schema uses bsonType int for BSON 32-bit integers.');
add(10,2,'Closed schemas and automatic identifiers',['_id','status'], x => ['A validator sets additionalProperties:false and allows status, but omits _id from properties. Why do inserts with automatic ObjectId identifiers fail?',
  '_id is also a property and must be allowed in the closed schema.',
  'MongoDB automatically removes _id before validating.',
  'required always disables additionalProperties.',
  'An ObjectId cannot be used in a validated collection.'], 'A closed schema must explicitly allow _id because MongoDB includes it in stored documents.');
add(10,3,'Safe rollout of stricter validation',['status','schemaVersion'], x => ['Historical '+x.domain+' documents violate a proposed validator. Which rollout best limits disruption while moving toward strict rejection?',
  'Audit violations, repair/migrate data, and deliberately stage validationAction/validationLevel before strict enforcement.',
  'Assume adding a validator automatically repairs historical documents.',
  'Delete every invalid document without reviewing it.',
  'Set validationAction:"warn" and assume invalid writes will be rejected.'], 'Validators do not migrate data. Warn records violations instead of rejecting them, so enforcement must be chosen and verified deliberately.');

add(11,0,'Filtering in aggregation',['amount'], x => ['Which pipeline stage keeps only documents with amount greater than '+x.n+'?',
  '{$match:{amount:{$gt:'+x.n+'}}}', '{$sort:{amount:1}}', '{$limit:'+x.n+'}', '{$project:{amount:1}}'], '$match filters documents. The other stages sort, limit, or reshape them.');
add(11,1,'Group totals',['status','amount'], x => ['Produce one row per status with the sum of amount in the '+x.domain+' collection.',
  '{$group:{_id:"$status",total:{$sum:"$amount"}}}',
  '{$group:{_id:"status",total:{$sum:1}}}',
  '{$sort:{status:1,amount:1}}','{$project:{total:"$amount"}}'], 'A field-path group key begins with $. $sum over $amount accumulates numeric amounts instead of just counting documents.');
add(11,2,'Unwind and distinct parent counts',['_id','items.sku'], x => ['After unwinding items, an order with several matching items appears more than once. How do you count distinct orders containing sku "'+x.prefix+'"?',
  'Match the sku, group by the original order _id, then $count the grouped rows.',
  'Use $count immediately after $unwind with no deduplication.',
  'Sum the number of all items.', 'Project _id:0 and count rows.'], 'Unwind multiplies parent rows. Grouping by the parent identifier removes repeated occurrences before counting.');
add(11,3,'Window ranking within tenants',['tenantId','amount','rank'], x => ['Compute dense ranks by descending amount within each tenant without collapsing documents. Which stage configuration fits?',
  '{$setWindowFields:{partitionBy:"$tenantId",sortBy:{amount:-1},output:{rank:{$denseRank:{}}}}}',
  '{$group:{_id:"$tenantId",rank:{$sum:1}}}',
  '{$sort:{tenantId:1,amount:-1}}','{$count:"rank"}'], '$setWindowFields adds window calculations while preserving rows; denseRank assigns consecutive ranks to distinct sort values within each partition.');

add(12,0,'JavaScript cursor iteration',['status'], x => ['In mongosh, which visits each document matching status "'+x.status+'" without first building an array of all results?',
  x.db+'.find({status:"'+x.status+'"}).forEach(doc => print(doc._id))',
  x.db+'.find({status:"'+x.status+'"}).countDocuments()',
  x.db+'.forEach({status:"'+x.status+'"})', 'print("'+x.status+'")'], 'A cursor forEach iterates the matching results; countDocuments is a collection method, not the shown cursor method.');
add(12,1,'Explicit database handle',['_id'], x => ['A mongosh script must query '+x.domain+'_db even if the current database differs. Which handle is explicit?',
  'db.getSiblingDB("'+x.domain+'_db").getCollection("'+x.col+'")',
  'db.getCollection("'+x.domain+'_db")', 'db.currentDatabase("'+x.domain+'_db")',
  'db.getSiblingDB("'+x.col+'").getCollection("'+x.domain+'_db")'], 'getSiblingDB selects a database handle without depending on the shell current database; getCollection then selects the collection.');
add(12,2,'Bounded memory export scripts',['_id','amount'], x => ['A '+x.domain+' report scans millions of documents. Which scripting approach avoids materializing the complete result in application memory?',
  'Iterate the cursor and emit/process rows incrementally, with a suitable projection.',
  'Call toArray() and retain every returned document.',
  'Load every document into one giant embedded array.',
  'Increase batchSize and assume it limits total toArray memory.'], 'Cursor batches support incremental processing. toArray still accumulates the complete cursor result regardless of batch size.');
add(12,3,'Retry-safe migration script',['schemaVersion','normalized'], x => ['A migration from schemaVersion '+x.i+' may restart after partial completion. What makes it safely resumable?',
  'Filter only unmigrated versions and use idempotent transformations with checkpoints and validation.',
  'Increment every numeric field on every restart with no version predicate.',
  'Delete the checkpoint after each processed row.',
  'Assume all writes roll back automatically if the script process exits.'], 'Idempotency and version predicates prevent repeated application; separate successful writes survive a later process failure unless enclosed in a transaction.');

add(13,0,'Compound index key order',['tenantId','createdAt'], x => ['Which specification creates a compound index on tenantId ascending, then createdAt descending?',
  '{tenantId:1,createdAt:-1}', '{createdAt:-1,tenantId:1}', '{tenantId:"asc",createdAt:"desc"}', '{tenantId:0,createdAt:0}'], 'Index specifications use 1 and -1 for ascending and descending keys, and their field order matters.');
add(13,1,'Equality before sort',['tenantId','createdAt'], x => ['The query filters tenantId="'+x.tenant+'" and sorts by createdAt descending. Which index follows equality then sort?',
  '{tenantId:1,createdAt:-1}', '{createdAt:1}', '{amount:1,tenantId:1}', '{tenantId:"hashed",amount:1}'], 'An equality prefix fixes tenantId, allowing the following createdAt key to provide the requested order.');
add(13,2,'Equality sort range tradeoffs',['tenantId','createdAt','amount'], x => ['For tenant equality, createdAt sort, and amount > '+x.n+', which is the standard ESR starting point when avoiding a blocking sort is the priority?',
  '{tenantId:1,createdAt:-1,amount:1}', '{amount:1,createdAt:-1,tenantId:1}',
  '{createdAt:-1,amount:1}', '{amount:1}'], 'ESR places equality first, sort next, and range last. Selectivity can motivate alternatives, so the final choice must be measured.');
add(13,3,'Compound sort direction compatibility',['tenantId','score','createdAt'], x => ['With equality on tenantId, index {tenantId:1,score:-1,createdAt:1} must satisfy a sort without an in-memory sort. Which requested suffix order is compatible?',
  '{score:1,createdAt:-1}', '{score:1,createdAt:1}', '{score:-1,createdAt:-1}', '{createdAt:1,score:-1}'], 'A compound index supports the specified direction pattern or its complete reverse, with the same field order after equality-bound prefix keys.');

add(14,0,'Explain execution metrics',['amount'], x => ['Which mongosh call asks for execution statistics for amount > '+x.n+'?',
  x.db+'.find({amount:{$gt:'+x.n+'}}).explain("executionStats")',
  x.db+'.find({amount:{$gt:'+x.n+'}}).explain("rowsOnly")',
  x.db+'.explainStats()',x.db+'.find({amount:{$gt:'+x.n+'}}).printStats()'], 'executionStats includes metrics from executing the winning query plan.');
add(14,1,'Scanned versus returned documents',['tenantId','amount'], x => ['A query returns '+x.i+' rows but examines '+(x.n*1000)+' documents. What is the best first investigation?',
  'Inspect the winning plan, predicates, and index bounds for excessive scanning.',
  'Assume the query is covered because it returns few rows.',
  'Delete returned rows to speed up the next query.',
  'Treat nReturned as the number of documents examined.'], 'nReturned measures output size, not scan cost. High documents examined relative to results often indicates insufficiently selective access.');
add(14,2,'Covered query requirements',['tenantId','amount','_id'], x => ['An index is {tenantId:1,amount:1}. For tenant "'+x.tenant+'", which query projection is a candidate for a covered query?',
  '{tenantId:1,amount:1,_id:0}', '{tenantId:1,amount:1}', '{tenantId:1,description:1,_id:0}', '{description:1}'], 'Filter and returned fields must be available from the index. _id must be excluded if it is not included in this secondary index.');
add(14,3,'Measuring a proposed index',['tenantId','createdAt','amount'], x => ['A proposed '+x.domain+' compound index improves one explain result. What evidence is needed before claiming a production improvement?',
  'Representative workload measurements including scan/sort metrics, latency, and write/storage costs.',
  'Only the index name appearing in the winning plan.',
  'Only one cached query returning one document.',
  'A rule that more indexes always improve every workload.'], 'Index use alone does not establish workload benefit. Read gains must be assessed against representative data and write/storage overhead.');

add(15,0,'Replica set write leader',['_id','amount'], x => ['In a normal replica set, where are application writes to the '+x.domain+' collection directed?',
  'The current primary.', 'Every secondary independently.', 'Only an arbiter.', 'A random member with no primary selection.'], 'The primary accepts normal application writes and secondaries replicate its oplog.');
add(15,1,'Read preference and freshness',['status'], x => ['A '+x.domain+' dashboard uses secondary reads. Which limitation must the application account for?',
  'Replication lag can make a secondary return older data.',
  'Secondary reads are always linearizable.',
  'A secondary cannot answer any read query.',
  'readPreference secondary automatically makes writes synchronous to every node.'], 'Read preference chooses eligible servers; it does not eliminate replication lag or by itself provide a freshness guarantee.');
add(15,2,'Arbiters and data durability',['_id','amount'], x => ['A replica set adds an arbiter to help elections. Which statement about '+x.domain+' data is true?',
  'The arbiter votes but does not hold a copy of the collection data.',
  'The arbiter is a full backup of all collections.',
  'The arbiter can become a writable primary.',
  'The arbiter serves secondary application reads.'], 'Arbiters participate in elections but do not store data or serve application reads.');
add(15,3,'Rollback exposure after failover',['_id','amount'], x => ['A '+x.domain+' write was acknowledged with w:1, then the primary failed before replication. Which outcome remains possible?',
  'The acknowledged write can be rolled back if it is absent from the elected primary history.',
  'w:1 guarantees persistence on a majority of voting data-bearing members.',
  'The arbiter must reconstruct the missing document.',
  'A new primary must accept every divergent write from every old primary.'], 'w:1 acknowledges the primary alone. Majority acknowledgment offers stronger replication guarantees than an unreplicated w:1 write.');

add(16,0,'Single-document atomicity',['amount','status'], x => ['A single update changes amount and status in one '+x.domain+' document. What is its atomicity scope?',
  'The fields in that single document update change atomically.',
  'Every document in the database is automatically locked into one transaction.',
  'Each changed field is always visible independently.',
  'No MongoDB write is atomic.'], 'MongoDB writes are atomic at the single-document level. Multi-document atomicity requires an appropriate transaction.');
add(16,1,'Transaction session propagation',['_id','balance'], x => ['Two balances in '+x.domain+' must change in one transaction. Which requirement is essential?',
  'Perform both operations using the same transaction session.',
  'Use a different unconnected session for each write.',
  'Use updateMany and assume it is atomic across all matching documents.',
  'Commit before the second write has executed.'], 'Operations must belong to the same transaction session for its atomic commit/abort guarantees to encompass both writes.');
add(16,2,'Snapshot guarantees',['_id','balance'], x => ['A '+x.domain+' transaction needs a snapshot of majority-committed data. Which concern combination provides the documented transaction guarantee?',
  'readConcern snapshot with commit writeConcern majority.',
  'readConcern local with writeConcern 0.',
  'readPreference nearest alone.',
  'journal:true alone with no transaction.'], 'For transactions, snapshot read concern provides its majority-committed snapshot guarantee when the transaction commits with majority write concern.');
add(16,3,'Unknown commit outcome',['requestId','balance'], x => ['A network failure during commit leaves a '+x.domain+' transaction outcome unknown. What is the safe design principle?',
  'Follow driver transaction retry semantics and use idempotency for external side effects; do not blindly repeat all effects.',
  'Assume the transaction definitely aborted and send an external payment again.',
  'Assume every error proves no write committed.',
  'Delete the idempotency record before checking commit outcome.'], 'An unknown commit result is not proof of an abort. Drivers handle transaction error labels; external effects require their own idempotency strategy.');

add(17,0,'Logical backup tool',['_id','status'], x => ['Which MongoDB Database Tools utility creates a BSON logical dump of '+x.domain+'_db?',
  'mongodump', 'mongorestore', 'mongoimport', 'mongostat'], 'mongodump creates BSON logical backups; mongorestore loads them.');
add(17,1,'Restore testing',['_id','amount'], x => ['A backup job for '+x.domain+'_db reports success. What best demonstrates that the backup can meet recovery needs?',
  'Restore it in an isolated environment and verify data, indexes, permissions, and application checks.',
  'Only check that a filename exists.',
  'Only compare the backup filename length.',
  'Delete the source database to test it immediately.'], 'Successful creation alone does not establish recoverability. An isolated restore exercise validates the recovery procedure and required artifacts.');
add(17,2,'RPO and RTO',['eventAt','amount'], x => ['A '+x.domain+' service tolerates losing at most '+x.i+' minutes of writes and requires restoration within '+x.n+' minutes. Which mapping is correct?',
  'RPO = '+x.i+' minutes; RTO = '+x.n+' minutes.',
  'RTO = '+x.i+' minutes; RPO = '+x.n+' minutes.',
  'Both numbers describe index cardinality.',
  'RPO measures encryption key length.'], 'Recovery point objective concerns acceptable data loss; recovery time objective concerns how long recovery may take.');
add(17,3,'Consistent sharded backups',['tenantId','eventAt'], x => ['A busy sharded '+x.domain+' deployment spans multiple shards. Which backup approach avoids assuming that independent uncoordinated dumps form one consistent recovery point?',
  'Use a supported coordinated backup procedure and verify a consistent cluster-wide restore.',
  'Dump random shards at unrelated times and assume cross-shard consistency.',
  'Copy only the mongos process files.',
  'Back up only one shard and infer all others from its indexes.'], 'Sharded recovery must preserve consistent data and cluster metadata across components; uncoordinated independent copies do not establish that guarantee.');

add(18,0,'Read-only application role',['_id','status'], x => ['An analyst needs to read '+x.domain+'_db but must not write its documents. Which built-in database role is the appropriate starting point?',
  'read on '+x.domain+'_db', 'readWrite on '+x.domain+'_db', 'root on admin', 'dbOwner on '+x.domain+'_db'], 'The read role grants read access; broader roles unnecessarily allow writes or administrative operations.');
add(18,1,'Authentication database versus target',['_id','status'], x => ['The user is created in admin but reads '+x.domain+'_db. Which connection option identifies where the credential is authenticated?',
  'authSource=admin', 'readPreference=admin', 'replicaSet=admin', 'appName=admin'], 'authSource identifies the authentication database; it does not define the full set of databases the user is authorized to access.');
add(18,2,'Least privilege for one collection',['_id','status'], x => ['A service may find and insert only in '+x.domain+'_db.'+x.col+'. Which approach is most precise?',
  'Create a custom role granting only find and insert on that database/collection resource.',
  'Give root and ask the application not to use other powers.',
  'Disable authorization for the entire cluster.',
  'Grant readWriteAnyDatabase.'], 'A custom role can scope specific actions to a specific collection, unlike broad built-in administrative privileges.');
add(18,3,'Defense against query selector injection',['status','tenantId'], x => ['An API accepts a status filter for tenant "'+x.tenant+'". Which design prevents a client object such as {$ne:null} from becoming an unintended query operator?',
  'Validate status as an allowed scalar, build a server-owned filter, and derive tenantId from authenticated context.',
  'Pass the complete request JSON directly as the database filter.',
  'Trust a hidden tenantId form field.',
  'Disable TLS because it does not validate selectors.'], 'Input type validation and server-owned authorization constraints prevent client-controlled selector objects and tenant spoofing.');

add(19,0,'Atlas network access',['_id','status'], x => ['An authorized '+x.domain+' application cannot reach Atlas from a new outbound IP. Which setting should be checked alongside credentials and DNS?',
  'The project network access configuration and allowed connection path.',
  'The collection sort direction.', 'The number of answer options in a quiz.', 'The document field order.'], 'Atlas access requires a permitted network path in addition to valid database authentication.');
add(19,1,'Targeted sharded queries',['tenantId','amount'], x => ['A collection is range-sharded by tenantId. Which filter gives mongos the shard-key value for tenant "'+x.tenant+'"?',
  '{tenantId:"'+x.tenant+'",amount:{$gte:'+x.n+'}}',
  '{amount:{$gte:'+x.n+'}}','{status:"'+x.status+'"}', '{createdAt:{$exists:true}}'], 'Including the shard-key value allows targeted routing; filters without it may require contacting multiple shards.');
add(19,2,'Change stream resume token',['_id','status'], x => ['A '+x.domain+' change-stream consumer restarts. What should it durably checkpoint to resume after processed events within the supported history window?',
  'The change event resume token (_id), after the corresponding processing is safely recorded.',
  'Only the number of fields in the last document.',
  'A random ObjectId unrelated to the stream.',
  'Only the wall-clock time when the process started.'], 'Change streams supply opaque resume tokens. Checkpointing must be coordinated with processing, and resumption still depends on retained history.');
add(19,3,'Shard key and hot partitions',['tenantId','eventAt'], x => ['A '+x.domain+' workload inserts with a monotonically increasing shard key. Which risk should the shard-key review address?',
  'New writes can concentrate on the current maximum range, producing a write hotspot.',
  'Monotonic keys always distribute every insert equally across all shards.',
  'Adding a secondary index automatically changes the shard key.',
  'An arbiter will absorb the hottest document writes.'], 'A monotonically increasing range key can direct recent inserts to one range. Distribution, cardinality, frequency, and query routing must be evaluated together.');

let added = 0;
for (let t = 0; t < topics.length; t++) for (let d = 0; d < difficulties.length; d++) {
  const topic = topics[t], difficulty = difficulties[d];
  const bucket = seed.questions.filter(q => q.topic === topic && q.difficulty === difficulty);
  if (bucket.length >= 10) continue;
  const rule = rules.get(topic+'|'+difficulty);
  if (!rule) throw new Error('No authored lesson: '+topic+' / '+difficulty);
  for (let variant = bucket.length; variant < 10; variant++) {
    const domain = domains[variant];
    const x = { domain, col: domain+'_records', db:'db.'+domain+'_records', n:25*(variant+1), i:variant+1,
      prefix:domain.slice(0,3).toUpperCase(), status:['open','ready','active','pending','review','queued','closed','paused','new','held'][variant], tenant:'tenant_'+(variant+1), token:'request_'+(variant+1) };
    const [problem, correct, ...wrong] = rule.build(x);
    const answers = [correct,...wrong];
    if (answers.length !== 4 || new Set(answers).size !== 4) throw new Error('Invalid authored choices: '+rule.title);
    const rotation = (t+d+variant)%4;
    const options = [...answers.slice(rotation),...answers.slice(0,rotation)];
    const scenario = 'Database: '+domain+'_db | Collection: '+x.db+' | Field(s): '+rule.fields.join(', ')+'\n'+problem;
    const hash = createHash('sha256').update(topic+'|'+difficulty+'|'+scenario).digest('hex');
    seed.questions.push({
      id:'ai_seed_'+hash, topic, difficulty, level:[1,3,6,9][d], type:'multiple-choice',
      title:rule.title+' — '+domain+' case '+(variant+1), scenario,
      databaseName:domain+'_db', datasetName:x.col, fieldNames:rule.fields,
      options, correctOptionIndex:options.indexOf(correct), explanation:rule.explanation,
      conceptFocus:rule.title, points:[10,15,20,25][d],
      tags:['locally-authored','parameterized-practice','curriculum-seed-2026-11-20']
    });
    added++;
  }
}
seed.source = 'site-api-first-110-and-locally-authored-remaining-690';
if(seed.questions.length!==800 || new Set(seed.questions.map(q=>q.id)).size!==800) throw new Error('Seed coverage mismatch.');
await writeFile(file,JSON.stringify(seed,null,2)+'\n');
console.log('Authored '+added+' questions locally; complete seed contains '+seed.questions.length+' questions. No AI API was called.');

import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  // ==========================================
  // TYPE D: WRITE THE COMMAND (Practical Core)
  // ==========================================
  {
    id: "q-write-1",
    topic: "Array Updates",
    difficulty: "Hard",
    type: "write-command",
    title: "Insert Course at Beginning with $position",
    scenario: "Add 'React' to the beginning (index 0) of the Courses array for student with _id: 1 in collection GptData02.",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$push: {Courses: {$each: ["React"], $position: 0}}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$push:{Courses:{$each:["React"],$position:0}}})',
      'db.GptData02.updateOne({ "_id": 1 }, { "$push": { "Courses": { "$each": ["React"], "$position": 0 } } })'
    ],
    explanation: "To insert at a specific array index like the beginning ($position: 0), MongoDB requires combining $push with the $each modifier, even if inserting a single string element.",
    conceptFocus: "$push with $position requires $each modifier; $position: 0 targets the array start.",
    points: 10
  },
  {
    id: "q-write-2",
    topic: "Nested Documents",
    difficulty: "Medium",
    type: "write-command",
    title: "Update Nested Field using Dot Notation",
    scenario: "Update the State inside the nested Address object to 'Lagos' for the student with _id: 10 in collection GptData02.",
    expectedCommand: 'db.GptData02.updateOne({_id: 10}, {$set: {"Address.State": "Lagos"}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:10},{$set:{"Address.State":"Lagos"}})',
      'db.GptData02.updateOne({_id: 10}, {$set: {\'Address.State\': "Lagos"}})'
    ],
    explanation: "Dot notation 'Address.State' targets the State key inside the Address embedded document without overriding the other Address properties (Country, City, HouseNumber). Quoting dot notation keys is mandatory in JavaScript.",
    conceptFocus: "Dot notation ('Address.State') enables granular nested updates.",
    points: 10
  },
  {
    id: "q-write-3",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "write-command",
    title: "Conditional Update with $min",
    scenario: "Ensure the student with _id: 1 in GptData02 has their GPA capped at 3.0 (i.e. keep the smaller value between current GPA and 3.0).",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$min: {GPA: 3.0}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$min:{GPA:3.0}})',
      'db.GptData02.updateOne({_id: 1}, {$min: {GPA: 3}})'
    ],
    explanation: "The $min operator updates the field value only if the specified value is LESS than the document's current field value. It effectively enforces an upper bound/ceiling.",
    conceptFocus: "$min keeps the smaller value; does not replace if current value is already lower.",
    points: 10
  },
  {
    id: "q-write-4",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "write-command",
    title: "Increment Nested Address HouseNumber",
    scenario: "Increment the nested Address.HouseNumber by 10 for student with _id: 1 in GptData02.",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$inc: {"Address.HouseNumber": 10}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$inc:{"Address.HouseNumber":10}})',
      'db.GptData02.updateOne({_id: 1}, {$inc: {\'Address.HouseNumber\': 10}})'
    ],
    explanation: "The $inc operator can be applied directly to nested fields using dot notation 'Address.HouseNumber' with an integer operand.",
    conceptFocus: "$inc with dot notation modifies numeric embedded fields.",
    points: 10
  },
  {
    id: "q-write-5",
    topic: "Removing Array Elements",
    difficulty: "Medium",
    type: "write-command",
    title: "Remove First Element with $pop",
    scenario: "Remove the very first element from the Skills array for student with _id: 1 in GptData02.",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$pop: {Skills: -1}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$pop:{Skills:-1}})'
    ],
    explanation: "The $pop operator removes the first element when passed -1, and removes the last element when passed 1.",
    conceptFocus: "$pop: -1 removes the first element; $pop: 1 removes the last element.",
    points: 10
  },
  {
    id: "q-write-6",
    topic: "Removing Array Elements",
    difficulty: "Hard",
    type: "write-command",
    title: "Conditional Array Element Removal with $pull",
    scenario: "Remove all values greater than 20 from the Misc array for student with _id: 15 in GptData02.",
    expectedCommand: 'db.GptData02.updateOne({_id: 15}, {$pull: {Misc: {$gt: 20}}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:15},{$pull:{Misc:{$gt:20}}})'
    ],
    explanation: "$pull evaluates query conditions on array elements and removes all elements that satisfy the condition (here, elements where value > 20).",
    conceptFocus: "$pull supports condition operators like {$gt: 20} on primitive array elements.",
    points: 10
  },
  {
    id: "q-write-7",
    topic: "Upsert & $setOnInsert",
    difficulty: "Hard",
    type: "write-command",
    title: "Upsert with $setOnInsert",
    scenario: "In collection Students, update student with _id: 27. If a new document is inserted during upsert, set Name to 'Test Mic' and CreatedBy to 'MongoTest' using $setOnInsert. Ensure upsert is enabled.",
    expectedCommand: 'db.Students.updateOne({_id: 27}, {$setOnInsert: {Name: "Test Mic", CreatedBy: "MongoTest"}}, {upsert: true})',
    acceptableAlternatives: [
      'db.Students.updateOne({_id:27},{$setOnInsert:{Name:"Test Mic",CreatedBy:"MongoTest"}},{upsert:true})',
      'db.Students.updateOne({_id: 27}, {$setOnInsert: {CreatedBy: "MongoTest", Name: "Test Mic"}}, {upsert: true})'
    ],
    explanation: "$setOnInsert assigns values only when an upsert operation creates a new document. If a document with _id: 27 already exists, $setOnInsert makes zero modifications.",
    conceptFocus: "$setOnInsert triggers solely when a new document is inserted via {upsert: true}.",
    points: 10
  },
  {
    id: "q-write-8",
    topic: "Array Updates",
    difficulty: "Expert",
    type: "write-command",
    title: "Complex Push with Multiple Modifiers ($each, $sort, $slice)",
    scenario: "For student with _id: 2 in GptData02, push 'C++' and 'C#' into the Courses array, sort all courses in ascending alphabetical order, and keep only the first 5 courses.",
    expectedCommand: 'db.GptData02.updateOne({_id: 2}, {$push: {Courses: {$each: ["C++", "C#"], $sort: 1, $slice: 5}}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:2},{$push:{Courses:{$each:["C++","C#"],$sort:1,$slice:5}}})',
      'db.GptData02.updateOne({_id: 2}, {$push: {Courses: {$each: ["C++", "C#"], $slice: 5, $sort: 1}}})'
    ],
    explanation: "When $sort and $slice are combined in a $push operation with $each, MongoDB inserts the new items, sorts the entire array in ascending order ($sort: 1), and then slices the array to keep only the first 5 elements ($slice: 5).",
    conceptFocus: "Combined modifiers: $push + $each + $sort: 1 + $slice: 5 executes sort then slice.",
    points: 10
  },

  // ==========================================
  // TYPE A: MULTIPLE CHOICE
  // ==========================================
  {
    id: "q-mcq-1",
    topic: "Removing Array Elements",
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Removing Array End Elements",
    scenario: "You need to remove the last element from an array field called Courses.",
    options: [
      "{ $pop: { Courses: 1 } }",
      "{ $pop: { Courses: -1 } }",
      "{ $pull: { Courses: 1 } }",
      "{ $slice: { Courses: -1 } }"
    ],
    correctOptionIndex: 0,
    explanation: "$pop: 1 removes the LAST element from an array. $pop: -1 removes the first element.",
    conceptFocus: "$pop: 1 removes the end item, $pop: -1 removes the start item.",
    points: 5
  },
  {
    id: "q-mcq-2",
    topic: "$addToSet vs $push",
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Preventing Duplicate Array Items",
    scenario: "You want to add 'Python' to the Skills array of student _id: 1 only if 'Python' is not already in the array.",
    options: [
      "db.GptData02.updateOne({_id: 1}, { $addToSet: { Skills: 'Python' } })",
      "db.GptData02.updateOne({_id: 1}, { $push: { Skills: 'Python' } })",
      "db.GptData02.updateOne({_id: 1}, { $set: { 'Skills.$': 'Python' } })",
      "db.GptData02.updateOne({_id: 1}, { $put: { Skills: 'Python' } })"
    ],
    correctOptionIndex: 0,
    explanation: "$addToSet ensures array uniqueness by treating the array as a set. $push would add the element even if it already exists.",
    conceptFocus: "$addToSet prevents duplicates; $push allows duplicates.",
    points: 5
  },
  {
    id: "q-mcq-3",
    topic: "Arrays",
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Zero-Based Array Index Query",
    scenario: "What does the query db.GptData02.find({'Courses.0': 'Java'}) return?",
    options: [
      "Documents where the first element of the Courses array is 'Java'",
      "Documents where the Courses array has exactly zero elements",
      "Documents containing 'Java' anywhere in the Courses array",
      "Documents where the last element of Courses is 'Java'"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB uses zero-based indexing for array queries. 'Courses.0' targets the item at position 0, which is the first element.",
    conceptFocus: "Array zero-based indexing: .0 refers to the first element.",
    points: 5
  },
  {
    id: "q-mcq-4",
    topic: "Array Updates",
    difficulty: "Medium",
    type: "multiple-choice",
    title: "$slice Modifier Behavior in $push",
    scenario: "If an array currently has 6 elements and you execute $push with {$each: ['Go'], $slice: -4}, what does $slice: -4 do?",
    options: [
      "Keeps only the last 4 elements of the resulting array",
      "Removes 4 elements from the front of the array",
      "Deletes the 4th element from the end",
      "Keeps only the first 4 elements"
    ],
    correctOptionIndex: 0,
    explanation: "A negative slice limit ($slice: -n) trims the array so that only the last n elements are preserved. A positive limit ($slice: n) keeps the first n elements.",
    conceptFocus: "Negative $slice values keep the last N elements.",
    points: 5
  },
  {
    id: "q-mcq-5",
    topic: "Comparison Operators",
    difficulty: "Medium",
    type: "multiple-choice",
    title: "BSON Data Type Sensitivity",
    scenario: "A student record has Age stored as integer 20: { Age: 20 }. What will the query db.GptData02.find({ Age: '20' }) return?",
    options: [
      "It will return 0 matching documents because BSON comparison matches both value and data type",
      "It will return the document because MongoDB automatically converts strings to numbers in queries",
      "It throws a TypeMismatch exception in the shell",
      "It converts the stored integer into a string before evaluation"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB is strongly typed at the BSON level. An integer 20 does NOT match a string '20'. Queries must match both the data type and the value.",
    conceptFocus: "BSON types are strictly matched (number 20 != string '20').",
    points: 5
  },
  {
    id: "q-mcq-6",
    topic: "Upsert & $setOnInsert",
    difficulty: "Medium",
    type: "multiple-choice",
    title: "Behavior of $setOnInsert on Match",
    scenario: "A document with _id: 10 already exists in collection GptData02. You execute:\ndb.GptData02.updateOne({_id: 10}, {$set: {Active: false}, $setOnInsert: {CreatedBy: 'Admin'}}, {upsert: true})\nWhat happens to CreatedBy?",
    options: [
      "CreatedBy is NOT added or modified because the document already exists",
      "CreatedBy is set to 'Admin' because $setOnInsert always runs on upsert: true",
      "An error is thrown because $set and $setOnInsert cannot be used together",
      "CreatedBy is updated only if it was previously undefined"
    ],
    correctOptionIndex: 0,
    explanation: "$setOnInsert only executes when the upsert creates a brand new document. If a match is found, $setOnInsert is ignored completely.",
    conceptFocus: "$setOnInsert executes only on insert, never on document update.",
    points: 5
  },

  // ==========================================
  // TYPE B: PREDICT THE OUTPUT
  // ==========================================
  {
    id: "q-predict-1",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "predict-output",
    title: "Predict $min Operator Result",
    scenario: "Given a student document in GptData02 with:\n{ _id: 1, Name: 'Tunde Adeyemi', GPA: 3.4 }\nYou execute:\ndb.GptData02.updateOne({ _id: 1 }, { $min: { GPA: 3.0 } })\nWhat is the value of GPA after the command runs?",
    options: [
      "GPA becomes 3.0",
      "GPA remains 3.4",
      "GPA becomes 0.4",
      "GPA is removed"
    ],
    correctOptionIndex: 0,
    explanation: "$min updates the field only if the specified value (3.0) is smaller than the current value (3.4). Since 3.0 < 3.4, GPA is updated to 3.0.",
    conceptFocus: "$min updates when specified value is smaller than current value.",
    points: 5
  },
  {
    id: "q-predict-2",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "predict-output",
    title: "Predict $max Operator Result on Lower Value",
    scenario: "Given student document with:\n{ _id: 2, Name: 'Chioma Okonkwo', GPA: 3.85 }\nYou execute:\ndb.GptData02.updateOne({ _id: 2 }, { $max: { GPA: 3.5 } })\nWhat is the value of GPA after the command runs?",
    options: [
      "GPA remains 3.85",
      "GPA becomes 3.5",
      "GPA becomes 7.35",
      "An error occurs because 3.5 is less than 3.85"
    ],
    correctOptionIndex: 0,
    explanation: "$max updates only if the specified value is GREATER than current value. Since 3.5 is not greater than 3.85, no change occurs and GPA remains 3.85.",
    conceptFocus: "$max preserves the existing value if specified value is not greater.",
    points: 5
  },
  {
    id: "q-predict-3",
    topic: "Removing Array Elements",
    difficulty: "Hard",
    type: "predict-output",
    title: "Predict Conditional $pull on Numeric Array",
    scenario: "Document _id: 15 has Misc: [15, 25, 35, 45].\nYou run:\ndb.GptData02.updateOne({ _id: 15 }, { $pull: { Misc: { $gt: 20 } } })\nWhat does the Misc array contain afterwards?",
    options: [
      "[15]",
      "[25, 35, 45]",
      "[15, 20]",
      "[] (empty array)"
    ],
    correctOptionIndex: 0,
    explanation: "$pull removes all elements matching the condition {$gt: 20}. Since 25, 35, and 45 are greater than 20, they are all removed, leaving only [15].",
    conceptFocus: "$pull evaluates {$gt: 20} on every array element.",
    points: 5
  },
  {
    id: "q-predict-4",
    topic: "Array Updates",
    difficulty: "Expert",
    type: "predict-output",
    title: "Predict $position: 1 Insertion",
    scenario: "Courses array initially has: ['Java', 'Python'].\nYou execute:\ndb.GptData02.updateOne({ _id: 1 }, { $push: { Courses: { $each: ['Rust'], $position: 1 } } })\nWhat is the exact order of Courses?",
    options: [
      "['Java', 'Rust', 'Python']",
      "['Rust', 'Java', 'Python']",
      "['Java', 'Python', 'Rust']",
      "['Rust']"
    ],
    correctOptionIndex: 0,
    explanation: "Position 0 is the start. Position 1 places the inserted element immediately after the first element (index 0). Therefore, 'Rust' is placed at index 1, between 'Java' and 'Python'.",
    conceptFocus: "$position: 1 inserts after the first element (at index 1).",
    points: 5
  },

  // ==========================================
  // TYPE C: FIND THE ERROR
  // ==========================================
  {
    id: "q-error-1",
    topic: "Array Updates",
    difficulty: "Medium",
    type: "find-error",
    title: "Missing $each with $position",
    codeSnippet: 'db.GptData02.updateOne(\n  { _id: 1 },\n  { $push: { Courses: "React", $position: 0 } }\n)',
    scenario: "A developer ran the command above to insert 'React' at index 0 of Courses, but MongoDB threw a syntax error. What is wrong?",
    options: [
      "The $position modifier cannot be used without the $each modifier in $push",
      "Index 0 is invalid in MongoDB arrays; indexing starts at 1",
      "$position is only supported in $addToSet, not $push",
      "Quotes are missing around Courses"
    ],
    correctOptionIndex: 0,
    explanation: "MongoDB requires that modifiers such as $position, $slice, and $sort MUST be wrapped inside an object with the $each modifier: { $push: { Courses: { $each: ['React'], $position: 0 } } }.",
    conceptFocus: "$position requires $each even for single-item insertions.",
    points: 5
  },
  {
    id: "q-error-2",
    topic: "Basic Queries",
    difficulty: "Easy",
    type: "find-error",
    title: "Invalid Mixed Projection",
    codeSnippet: 'db.GptData02.find(\n  { Section: "A" },\n  { Name: 1, GPA: 1, Age: 0 }\n)',
    scenario: "What causes the command above to fail in the MongoDB shell?",
    options: [
      "Inclusion (1) and exclusion (0) cannot be mixed in the same projection (except for _id)",
      "Section must be an integer, not a string",
      "find() does not accept a second parameter",
      "GPA is a float and cannot be projected"
    ],
    correctOptionIndex: 0,
    explanation: "In MongoDB projections, you cannot mix field inclusion (1) with field exclusion (0). The only exception to this rule is the _id field (e.g. { Name: 1, _id: 0 } is valid).",
    conceptFocus: "Never mix 1 and 0 in projection, except for _id.",
    points: 5
  },
  {
    id: "q-error-3",
    topic: "Nested Documents",
    difficulty: "Hard",
    type: "find-error",
    title: "Accidental Object Overwrite Instead of Dot Notation",
    codeSnippet: 'db.GptData02.updateOne(\n  { _id: 10 },\n  { $set: { Address: { State: "Lagos" } } }\n)',
    scenario: "The developer intended to update only the State field, but all other Address fields (Country, City, HouseNumber) disappeared. Why?",
    options: [
      "Passing { Address: { State: 'Lagos' } } replaces the entire Address object; they should have used dot notation { 'Address.State': 'Lagos' }",
      "The $set operator is deprecated for nested documents",
      "Address is a reserved keyword in MongoDB",
      "The _id was not enclosed in quotes"
    ],
    correctOptionIndex: 0,
    explanation: "Assigning directly to the parent field { Address: { State: 'Lagos' } } overwrites the entire sub-document, obliterating Country, City, and HouseNumber. To preserve sibling fields, dot notation must be used: { 'Address.State': 'Lagos' }.",
    conceptFocus: "Direct assignment overwrites subdocuments; use dot notation to update nested keys.",
    points: 5
  },
  {
    id: "q-error-4",
    topic: "Aggregation",
    difficulty: "Expert",
    type: "find-error",
    title: "Missing Dollar Prefix in Accumulator",
    codeSnippet: 'db.GptData02.aggregate([\n  {\n    $group: {\n      _id: "$Section",\n      TotalMarks: { $sum: "Marks" }\n    }\n  }\n])',
    scenario: "The aggregation query runs but TotalMarks outputs 0 or NaN for all sections. What is the bug?",
    options: [
      "'Marks' is treated as a literal string because it lacks the '$' prefix; it should be '$Marks'",
      "$sum is not a valid accumulator operator inside $group",
      "_id cannot be assigned to $Section",
      "aggregate() only works on collections named 'Aggregate'"
    ],
    correctOptionIndex: 0,
    explanation: "In aggregation expressions, field references must be prefixed with a dollar sign: '$Marks'. Writing 'Marks' without '$' causes MongoDB to treat it as a literal string, resulting in an invalid sum of 0.",
    conceptFocus: "Field references in aggregation must be prefixed with '$' (e.g. '$Marks').",
    points: 5
  },

  // ==========================================
  // TYPE E: MATCH THE OPERATOR
  // ==========================================
  {
    id: "q-match-1",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "match-operator",
    title: "Match MongoDB Operators with their Purposes",
    scenario: "Match each MongoDB operator with its precise functional definition.",
    matchPairs: [
      { id: "p1", operator: "$pop: -1", definition: "Removes the very first element from an array" },
      { id: "p2", operator: "$min", definition: "Updates the field only if the specified value is smaller than current value" },
      { id: "p3", operator: "$slice: -4", definition: "Retains only the last 4 elements of an array during $push" },
      { id: "p4", operator: "$setOnInsert", definition: "Assigns fields only when an upsert creates a new document" }
    ],
    explanation: "$pop: -1 removes first element; $min keeps smaller value; $slice: -4 keeps last 4 elements; $setOnInsert applies exclusively upon insertion in an upsert.",
    conceptFocus: "Differentiating exact operator behaviors.",
    points: 10
  },
  {
    id: "q-match-2",
    topic: "Removing Array Elements",
    difficulty: "Hard",
    type: "match-operator",
    title: "Match Array Removal Operators",
    scenario: "Match each array removal operator to its mechanism.",
    matchPairs: [
      { id: "p1", operator: "$pop: 1", definition: "Removes the last element of an array" },
      { id: "p2", operator: "$pull", definition: "Removes all elements that match a specified value or query condition" },
      { id: "p3", operator: "$pullAll", definition: "Removes all occurrences of listed values specified in a literal array" },
      { id: "p4", operator: "$unset", definition: "Deletes a field completely from a document" }
    ],
    explanation: "$pop: 1 deletes the tail; $pull handles conditions like {$gt: 20}; $pullAll removes explicit list members; $unset removes the entire key.",
    conceptFocus: "Array removal mechanisms ($pop, $pull, $pullAll, $unset).",
    points: 10
  },

  // ==========================================
  // TYPE F: SCENARIO QUESTIONS
  // ==========================================
  {
    id: "q-scenario-1",
    topic: "Aggregation",
    difficulty: "Hard",
    type: "scenario",
    title: "Optimal Pipeline Stage Ordering",
    scenario: "You are calculating the average GPA and total marks for students in Section 'A' across 10,000,000 documents using aggregate(). Where should the { $match: { Section: 'A' } } stage be placed for maximum performance?",
    options: [
      "As the very first stage in the pipeline, before $group, to filter documents early and utilize indexes",
      "Immediately after the $group stage, so the calculation finishes first",
      "At the very end of the pipeline, after $sort and $project",
      "Stage ordering in MongoDB aggregation does not impact query performance"
    ],
    correctOptionIndex: 0,
    explanation: "Placing $match as early as possible reduces the working set for downstream stages (like $group) and allows MongoDB to utilize indexes on Section, avoiding a full collection scan.",
    conceptFocus: "Always place $match at the beginning of pipelines to optimize performance.",
    points: 5
  },
  {
    id: "q-scenario-2",
    topic: "Regular Expressions",
    difficulty: "Medium",
    type: "scenario",
    title: "Case-Insensitive Prefix Search",
    scenario: "You need to find all students whose names start with 'chioma', regardless of whether they are entered as 'Chioma', 'chioma', or 'CHIOMA'. Which query is optimal?",
    options: [
      "db.GptData02.find({ Name: { $regex: '^chioma', $options: 'i' } })",
      "db.GptData02.find({ Name: { $regex: 'chioma$', $options: 'i' } })",
      "db.GptData02.find({ Name: { $in: ['chioma'] } })",
      "db.GptData02.find({ Name: { $eq: '/chioma/i' } })"
    ],
    correctOptionIndex: 0,
    explanation: "The caret '^' anchors the match to the beginning of the string, and $options: 'i' enables case-insensitivity.",
    conceptFocus: "^ anchors to start; $options: 'i' grants case-insensitivity.",
    points: 5
  },
  {
    id: "q-scenario-3",
    topic: "Upsert & $setOnInsert",
    difficulty: "Expert",
    type: "scenario",
    title: "Auditing Document Creation without Overwrite",
    scenario: "A microservice receives student sync events. If the student document does not exist, it should create it with Name: 'New Student' and set CreatedAt to the current timestamp. If the document already exists, it should update Name but NEVER overwrite the original CreatedAt. How should this be implemented?",
    options: [
      "Use $set for Name, $setOnInsert for CreatedAt, and specify { upsert: true }",
      "Use $set for both Name and CreatedAt with { upsert: true }",
      "Run a find() query first in code, check if null, then call insertOne() or updateOne()",
      "Use $push with $slice: 1"
    ],
    correctOptionIndex: 0,
    explanation: "Combining $set: { Name: '...' } with $setOnInsert: { CreatedAt: '...' } under { upsert: true } is the atomic MongoDB pattern. Existing records receive only the $set update, preserving CreatedAt.",
    conceptFocus: "$setOnInsert with {upsert: true} prevents overwriting creation timestamps.",
    points: 5
  },

  // ==========================================
  // TYPE G: ARRANGE THE COMMAND
  // ==========================================
  {
    id: "q-arrange-1",
    topic: "Array Updates",
    difficulty: "Hard",
    type: "arrange-command",
    title: "Assemble Array Push with Modifiers",
    scenario: "Arrange the clauses into the correct structural order to push 'React' to index 0 of Courses for _id: 1.",
    arrangeBlocks: [
      { id: "b1", text: "db.GptData02.updateOne(" },
      { id: "b2", text: "{ _id: 1 }," },
      { id: "b3", text: "{ $push: { Courses: {" },
      { id: "b4", text: "$each: ['React']," },
      { id: "b5", text: "$position: 0" },
      { id: "b6", text: "} } }" },
      { id: "b7", text: ")" }
    ],
    correctArrangeOrder: ["b1", "b2", "b3", "b4", "b5", "b6", "b7"],
    explanation: "The correct sequence starts with method and filter, opens $push and target field, includes $each modifier, followed by $position modifier, closing braces, and final parenthesis.",
    conceptFocus: "Structural hierarchy of $push with $each and $position.",
    points: 10
  },
  {
    id: "q-arrange-2",
    topic: "Aggregation",
    difficulty: "Expert",
    type: "arrange-command",
    title: "Assemble Section Group Pipeline",
    scenario: "Arrange the aggregation stages to calculate the sum of Marks and average Marks grouped by Section.",
    arrangeBlocks: [
      { id: "a1", text: "db.GptData02.aggregate([" },
      { id: "a2", text: "{ $group: {" },
      { id: "a3", text: '_id: "$Section",' },
      { id: "a4", text: 'TotalMarks: { $sum: "$Marks" },' },
      { id: "a5", text: 'Average: { $avg: "$Marks" }' },
      { id: "a6", text: "} }" },
      { id: "a7", text: "]).sort({ _id: 1 })" }
    ],
    correctArrangeOrder: ["a1", "a2", "a3", "a4", "a5", "a6", "a7"],
    explanation: "The pipeline array begins with $group stage, defines grouping key _id: '$Section', calculates accumulators $sum and $avg with '$' field references, closes the group stage, and chains .sort({_id: 1}).",
    conceptFocus: "Aggregation stage syntax and accumulator structure.",
    points: 10
  },

  // ==========================================
  // MORE HIGH-VALUE QUESTIONS (All Topics)
  // ==========================================
  {
    id: "q-write-9",
    topic: "Basic Queries",
    difficulty: "Easy",
    type: "write-command",
    title: "Query with Projection Excluding _id",
    scenario: "Find all students in Section 'A', projecting only Name and GPA, and explicitly excluding the _id field in collection GptData02.",
    expectedCommand: 'db.GptData02.find({Section: "A"}, {Name: 1, GPA: 1, _id: 0})',
    acceptableAlternatives: [
      'db.GptData02.find({Section:"A"},{Name:1,GPA:1,_id:0})',
      'db.GptData02.find({Section: "A"}, {_id: 0, Name: 1, GPA: 1})'
    ],
    explanation: "The second parameter to find() is the projection document. Fields marked with 1 are included; _id is included by default unless explicitly suppressed with _id: 0.",
    conceptFocus: "Excluding _id in inclusion projection: {_id: 0, Name: 1, GPA: 1}.",
    points: 10
  },
  {
    id: "q-write-10",
    topic: "Logical Operators",
    difficulty: "Medium",
    type: "write-command",
    title: "Query with $or Operator",
    scenario: "Find all students in GptData02 who are either in Section 'A' OR have a GPA greater than 3.8.",
    expectedCommand: 'db.GptData02.find({$or: [{Section: "A"}, {GPA: {$gt: 3.8}}]})',
    acceptableAlternatives: [
      'db.GptData02.find({$or:[{Section:"A"},{GPA:{$gt:3.8}}]})',
      'db.GptData02.find({$or: [{GPA: {$gt: 3.8}}, {Section: "A"}]})'
    ],
    explanation: "$or takes an array of condition objects. Documents matching either condition will be returned.",
    conceptFocus: "$or joins condition objects in an array: {$or: [{cond1}, {cond2}]}.",
    points: 10
  },
  {
    id: "q-mcq-7",
    topic: "Update Operators",
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Renaming a Field",
    scenario: "Which command renames the field 'Address.State' to 'Address.Province' for student _id: 10 in GptData02?",
    options: [
      "db.GptData02.updateOne({_id: 10}, {$rename: {'Address.State': 'Address.Province'}})",
      "db.GptData02.updateOne({_id: 10}, {$change: {'Address.State': 'Address.Province'}})",
      "db.GptData02.updateOne({_id: 10}, {$set: {'Address.Province': '$Address.State'}})",
      "db.GptData02.updateOne({_id: 10}, {$replace: {State: 'Province'}})"
    ],
    correctOptionIndex: 0,
    explanation: "The $rename operator takes old field name and new field name in key-value pairs: {$rename: {'oldKey': 'newKey'}}.",
    conceptFocus: "$rename modifies the name of an existing field.",
    points: 5
  },
  {
    id: "q-mcq-8",
    topic: "Update Operators",
    difficulty: "Easy",
    type: "multiple-choice",
    title: "Removing a Field with $unset",
    scenario: "Which command completely deletes the 'Address.Country' field from student _id: 10 in GptData02?",
    options: [
      "db.GptData02.updateOne({_id: 10}, {$unset: {'Address.Country': ''}})",
      "db.GptData02.updateOne({_id: 10}, {$delete: {'Address.Country': 1}})",
      "db.GptData02.updateOne({_id: 10}, {$set: {'Address.Country': null}})",
      "db.GptData02.updateOne({_id: 10}, {$remove: 'Address.Country'})"
    ],
    correctOptionIndex: 0,
    explanation: "The $unset operator deletes fields. Setting to null retains the key with a null value, whereas $unset removes the key completely.",
    conceptFocus: "$unset removes a field from document entirely.",
    points: 5
  },
  {
    id: "q-write-11",
    topic: "Update Operators",
    difficulty: "Medium",
    type: "write-command",
    title: "Multiply Field Value with $mul",
    scenario: "Double the GPA (multiply by 2) for student with _id: 1 in GptData02 using the $mul operator.",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$mul: {GPA: 2}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$mul:{GPA:2}})'
    ],
    explanation: "The $mul operator multiplies the numeric value of a field by the specified multiplier.",
    conceptFocus: "$mul multiplies numeric field values.",
    points: 10
  },
  {
    id: "q-write-12",
    topic: "Update Operators",
    difficulty: "Easy",
    type: "write-command",
    title: "Set Current Date with $currentDate",
    scenario: "Update student with _id: 1 in GptData02 to set the field LastUpdated to the current date using $currentDate.",
    expectedCommand: 'db.GptData02.updateOne({_id: 1}, {$currentDate: {LastUpdated: true}})',
    acceptableAlternatives: [
      'db.GptData02.updateOne({_id:1},{$currentDate:{LastUpdated:true}})',
      'db.GptData02.updateOne({_id: 1}, {$currentDate: {LastUpdated: {$type: "date"}}})'
    ],
    explanation: "The $currentDate operator sets the value of a field to current date/timestamp using true or {$type: 'date'}.",
    conceptFocus: "$currentDate sets timestamp on modified document.",
    points: 10
  }
];

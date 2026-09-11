import { Flashcard } from '../types';

export const FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    topic: "Array Updates",
    difficulty: "Easy",
    front: "What is the difference between $pop: -1 and $pop: 1?",
    back: "$pop: -1 removes the FIRST element (index 0) of an array, while $pop: 1 removes the LAST element of an array.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $pop: { Skills: -1 } })",
    example: "Skills: ['A', 'B', 'C'] with $pop: -1 becomes ['B', 'C'].",
    note: "Remember: negative -1 removes from the front, positive 1 removes from the end."
  },
  {
    id: "fc-2",
    topic: "Array Updates",
    difficulty: "Medium",
    front: "Can you use the $position modifier without $each in $push?",
    back: "NO! In MongoDB, the $position modifier MUST be used alongside $each, even if you are inserting a single element.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $push: { Courses: { $each: ['React'], $position: 0 } } })",
    example: "Inserting at the beginning: $position: 0. After 1st element: $position: 1.",
    note: "Omitting $each causes a MongoDB command parsing error."
  },
  {
    id: "fc-3",
    topic: "Array Updates",
    difficulty: "Medium",
    front: "What is the difference between $slice: 4 and $slice: -4 in a $push update?",
    back: "$slice: 4 retains only the FIRST 4 elements in the array. $slice: -4 retains only the LAST 4 elements in the array.",
    syntax: "db.collection.updateOne({ _id: 2 }, { $push: { Courses: { $each: ['Angular'], $slice: 4 } } })",
    example: "Keeps array bounded to at most 4 elements after insertion.",
    note: "Positive keeps from beginning; negative keeps from the end."
  },
  {
    id: "fc-4",
    topic: "$addToSet vs $push",
    difficulty: "Easy",
    front: "What is the core difference between $push and $addToSet?",
    back: "$push allows duplicate items and always appends. $addToSet treats the array like a mathematical set, adding the item ONLY if it does not already exist.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $addToSet: { Skills: 'Java' } })",
    example: "If 'Java' is already present in Skills, $addToSet makes no changes (nModified = 0).",
    note: "Use $addToSet for unique tags, roles, or skills."
  },
  {
    id: "fc-5",
    topic: "Upsert & $setOnInsert",
    difficulty: "Medium",
    front: "When does the $setOnInsert operator execute its updates?",
    back: "$setOnInsert ONLY assigns fields when an upsert operation creates a brand new document. If a matching document already exists, $setOnInsert is completely ignored.",
    syntax: "db.Students.updateOne({ _id: 27 }, { $setOnInsert: { CreatedAt: new Date() } }, { upsert: true })",
    example: "Existing document with _id 27 will NOT update CreatedAt.",
    note: "Ideal for creation timestamps or author fields that should never be overwritten."
  },
  {
    id: "fc-6",
    topic: "Update Operators",
    difficulty: "Easy",
    front: "How do $min and $max update operators behave?",
    back: "$min updates the field only if the specified value is LESS than the current value (keeps the smaller). $max updates only if the specified value is GREATER (keeps the larger).",
    syntax: "db.collection.updateOne({ _id: 1 }, { $min: { GPA: 3.0 }, $max: { Marks: 95 } })",
    example: "If GPA is 3.4, $min: 3.0 updates it to 3.0. If GPA is 2.8, $min: 3.0 leaves it as 2.8.",
    note: "Think: $min sets a ceiling; $max sets a floor."
  },
  {
    id: "fc-7",
    topic: "Arrays",
    difficulty: "Easy",
    front: "What does the query db.GptData02.find({'Courses.0': 'Java'}) mean?",
    back: "It checks whether the very first element (index 0) of the Courses array is equal to 'Java'. Array indexes in MongoDB are strictly 0-based.",
    syntax: "db.GptData02.find({ 'Courses.0': 'Java' })",
    example: "Matches ['Java', 'Python'] but does NOT match ['Python', 'Java'].",
    note: "Always enclose dot notation in quotes: 'Courses.0'."
  },
  {
    id: "fc-8",
    topic: "Nested Documents",
    difficulty: "Easy",
    front: "How do you update only the State field inside a nested Address document?",
    back: "Use dot notation wrapped in quotes: $set: { 'Address.State': 'Lagos' }. Do NOT do $set: { Address: { State: 'Lagos' } } because that replaces the entire Address object!",
    syntax: "db.GptData02.updateOne({ _id: 10 }, { $set: { 'Address.State': 'Lagos' } })",
    example: "Leaves Address.Country, Address.City, and Address.HouseNumber completely intact.",
    note: "Quoting the key ('Address.State') is mandatory."
  },
  {
    id: "fc-9",
    topic: "Removing Array Elements",
    difficulty: "Medium",
    front: "What is the difference between $pull and $pullAll?",
    back: "$pull can remove elements matching specific values OR conditions (e.g. { $gt: 20 }). $pullAll only accepts a fixed array of literal values to remove and cannot evaluate condition expressions.",
    syntax: "db.collection.updateOne({ _id: 1 }, { $pullAll: { Skills: ['Git', 'Python'] } })",
    example: "$pull: { Misc: { $gt: 20 } } works with $pull, but not with $pullAll.",
    note: "$pullAll is syntactic sugar for $pull: { field: { $in: [...] } }."
  },
  {
    id: "fc-10",
    topic: "Comparison Operators",
    difficulty: "Easy",
    front: "Does { Age: 20 } match a document where Age is stored as '20' (string)?",
    back: "NO! MongoDB comparison operations are strictly type-aware based on BSON types. Numeric 20 will never match string '20'.",
    syntax: "db.GptData02.find({ Age: 20 }) vs db.GptData02.find({ Age: '20' })",
    example: "BSON type integer != BSON type string.",
    note: "Always verify data types when testing numerical values."
  },
  {
    id: "fc-11",
    topic: "Aggregation",
    difficulty: "Medium",
    front: "Where should the $match stage ideally be placed in an aggregation pipeline?",
    back: "As early as possible in the pipeline (usually as the first stage). Early $match filters out unnecessary documents, reduces memory consumption, and can utilize collection indexes.",
    syntax: "db.SetData.aggregate([ { $match: { Section: 'A' } }, { $group: { ... } } ])",
    example: "Placing $match before $group avoids grouping millions of rows that would later be discarded.",
    note: "Pipeline optimization rule: filter first, aggregate second."
  },
  {
    id: "fc-12",
    topic: "Aggregation",
    difficulty: "Hard",
    front: "Why must field names in $group accumulators have a '$' prefix?",
    back: "In MongoDB aggregation expressions, a dollar sign prefix like '$Marks' tells MongoDB to evaluate the value of the field from each incoming document. Without the '$', it is treated as a string literal.",
    syntax: "{ $group: { _id: '$Section', Total: { $sum: '$Marks' } } }",
    example: "{ $sum: '$Marks' } sums numbers; { $sum: 'Marks' } results in 0 because it treats 'Marks' as a literal string.",
    note: "'$Field' = Field Value Reference. 'Field' = Raw String."
  }
];

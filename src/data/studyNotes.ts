import { StudyNoteSection } from '../types';

export const STUDY_NOTES: StudyNoteSection[] = [
  {
    id: "note-basic-queries",
    topic: "Basic Queries",
    title: "Basic Queries, Projection, Sorting & Pagination",
    summary: "Master retrieval of MongoDB documents using find(), field projections, sort orders, and pagination using limit() and skip().",
    keyOperators: [
      {
        name: "find(filter, projection)",
        description: "Queries documents matching the filter. The second parameter controls field visibility (1 to show, 0 to hide).",
        example: 'db.GptData02.find({ Section: "A" }, { Name: 1, GPA: 1, _id: 0 })'
      },
      {
        name: "sort({ field: 1 | -1 })",
        description: "Orders query results in ascending (1) or descending (-1) sequence.",
        example: 'db.GptData02.find().sort({ GPA: -1, Marks: 1 })'
      },
      {
        name: "limit(n) & skip(n)",
        description: "Paginates results. skip(n) omits the first n results, limit(n) caps output to n documents.",
        example: 'db.GptData02.find().sort({ GPA: -1 }).skip(5).limit(5)'
      }
    ],
    importantRules: [
      "_id is included by default in projections unless explicitly excluded with {_id: 0}.",
      "You cannot mix inclusion (1) and exclusion (0) in the same projection object, with the sole exception of _id.",
      "MongoDB applies operations in this standard order regardless of chain syntax: sort -> skip -> limit."
    ],
    commonMistakes: [
      "Writing {Name: 1, Age: 0} which produces Projection Error: Cannot do exclusion on field Age in inclusion projection.",
      "Forgetting quotes around string values, e.g. Section: A instead of Section: \"A\"."
    ]
  },
  {
    id: "note-comparison-operators",
    topic: "Comparison Operators",
    title: "Comparison Operators ($gt, $gte, $lt, $lte, $eq, $ne, $in, $nin)",
    summary: "Filter documents by comparing field values against specific thresholds or sets.",
    keyOperators: [
      {
        name: "$gt / $gte",
        description: "Greater than (>) / Greater than or equal to (>=).",
        example: 'db.GptData02.find({ GPA: { $gte: 3.5 } })'
      },
      {
        name: "$lt / $lte",
        description: "Less than (<) / Less than or equal to (<=).",
        example: 'db.GptData02.find({ Age: { $lt: 21 } })'
      },
      {
        name: "$eq / $ne",
        description: "Matches values equal to ($eq) or not equal to ($ne) a specified value.",
        example: 'db.GptData02.find({ Active: { $ne: false } })'
      },
      {
        name: "$in / $nin",
        description: "Matches any value present ($in) or absent ($nin) in a given array of values.",
        example: 'db.GptData02.find({ Section: { $in: ["A", "B"] } })'
      }
    ],
    importantRules: [
      "Numeric vs String types: { Age: 20 } does NOT match { Age: \"20\" } because MongoDB is strictly type-aware (BSON types).",
      "$in accepts an array of values and evaluates as an OR condition among those values."
    ],
    commonMistakes: [
      "Writing { GPA: { gt: 3.5 } } without the leading dollar sign ($).",
      "Passing a single scalar to $in instead of an array: { Section: { $in: \"A\" } } causes an error; it must be [\"A\"]."
    ]
  },
  {
    id: "note-logical-operators",
    topic: "Logical Operators",
    title: "Logical Operators ($and, $or, $nor, $not)",
    summary: "Combine or negate multiple query condition clauses.",
    keyOperators: [
      {
        name: "$or",
        description: "Joins query clauses with a logical OR; returns documents that match at least one clause.",
        example: 'db.GptData02.find({ $or: [{ Section: "A" }, { GPA: { $gt: 3.8 } }] })'
      },
      {
        name: "$and",
        description: "Joins query clauses with a logical AND; required when repeating the same field or operator.",
        example: 'db.GptData02.find({ $and: [{ GPA: { $gt: 3.0 } }, { GPA: { $lt: 3.7 } }] })'
      },
      {
        name: "$nor",
        description: "Returns documents that fail all query clauses in the array.",
        example: 'db.GptData02.find({ $nor: [{ Active: false }, { Marks: { $lt: 60 } }] })'
      },
      {
        name: "$not",
        description: "Performs logical NOT on a specific operator-expression.",
        example: 'db.GptData02.find({ Marks: { $not: { $lt: 70 } } })'
      }
    ],
    importantRules: [
      "Comma-separated fields in a single query document default to an implicit $and.",
      "$or and $nor take an array of condition objects: [{ cond1 }, { cond2 }]."
    ],
    commonMistakes: [
      "Using $or without an array: { $or: { Active: true } } fails validation.",
      "Applying $not as a top-level operator like $or; $not applies directly to an expression: { field: { $not: { ... } } }."
    ]
  },
  {
    id: "note-regex",
    topic: "Regular Expressions",
    title: "Regular Expressions ($regex, $options, Anchors)",
    summary: "Pattern matching for strings and array elements using regular expressions.",
    keyOperators: [
      {
        name: "$regex & $options",
        description: "Matches string patterns. $options: 'i' enables case-insensitivity.",
        example: 'db.GptData02.find({ Name: { $regex: "^chioma", $options: "i" } })'
      },
      {
        name: "^ (Start anchor)",
        description: "Matches strings that begin with the specified pattern.",
        example: 'db.GptData02.find({ Name: { $regex: "^Tunde" } })'
      },
      {
        name: "$ (End anchor)",
        description: "Matches strings that end with the specified pattern.",
        example: 'db.GptData02.find({ DOB: { $regex: "-14$" } })'
      },
      {
        name: "Regex in Arrays",
        description: "When applied to an array of strings (e.g. Courses), matches if any element matches the pattern.",
        example: 'db.GptData02.find({ Courses: { $regex: "react", $options: "i" } })'
      }
    ],
    importantRules: [
      "Regex queries can target arrays of strings directly; MongoDB inspects every element in the array.",
      "Using index-prefixed expressions like ^Pattern allows index prefix scans, whereas .*pattern cannot utilize indexes efficiently."
    ],
    commonMistakes: [
      "Forgetting $options: 'i' when testing case-insensitive names, leading to 0 results.",
      "Confusing the end-of-string regex anchor $ with MongoDB operator prefix $."
    ]
  },
  {
    id: "note-arrays",
    topic: "Arrays",
    title: "Array Queries & Zero-Based Indexing",
    summary: "Querying arrays by size, set containment, element matching, and position.",
    keyOperators: [
      {
        name: "Zero-Based Indexing",
        description: "Index 0 refers to the very first array element. Must be enclosed in quotes.",
        example: 'db.GptData02.find({ "Courses.0": "Java" })'
      },
      {
        name: "$size",
        description: "Matches arrays with an exact number of elements (cannot be used with comparisons like $gt).",
        example: 'db.GptData02.find({ Skills: { $size: 3 } })'
      },
      {
        name: "$all",
        description: "Matches arrays that contain all specified elements, regardless of order.",
        example: 'db.GptData02.find({ Skills: { $all: ["Python", "SQL"] } })'
      },
      {
        name: "$elemMatch",
        description: "Matches documents where at least one array element satisfies all specified criteria.",
        example: 'db.GptData02.find({ Misc: { $elemMatch: { $gt: 20, $lt: 40 } } })'
      }
    ],
    importantRules: [
      "Array indexing is strictly zero-based: 'Courses.0' targets the 1st element, 'Courses.1' targets the 2nd element.",
      "$size requires an exact integer; it does NOT accept range operators like { $size: { $gt: 2 } }.",
      "$all requires every element in the given array to be present in the document's array."
    ],
    commonMistakes: [
      "Omitting quotation marks around dot-notated array index queries: Courses.0 will cause syntax errors in JS/Mongo shell.",
      "Confusing $in (matches if array contains at least one) with $all (must contain all listed elements)."
    ]
  },
  {
    id: "note-nested-docs",
    topic: "Nested Documents",
    title: "Nested Documents & Dot Notation",
    summary: "Accessing and modifying embedded objects using dot notation.",
    keyOperators: [
      {
        name: 'Dot Notation ("Parent.Child")',
        description: "Accesses fields inside embedded documents. Always wrap in quotation marks.",
        example: 'db.GptData02.find({ "Address.State": "Lagos" })'
      },
      {
        name: 'Updating Nested Fields',
        description: "Modifies only the specified nested property without replacing the entire parent object.",
        example: 'db.GptData02.updateOne({ _id: 10 }, { $set: { "Address.City": "Victoria Island" } })'
      }
    ],
    importantRules: [
      "Any path containing a dot (e.g. 'Address.State') MUST be quoted in queries and update expressions.",
      "Writing { Address: { State: 'Lagos' } } replaces the entire Address document and removes other fields! Use dot notation: { 'Address.State': 'Lagos' } instead."
    ],
    commonMistakes: [
      "Replacing the entire object when only updating one nested field.",
      "Typing unquoted Address.State which leads to a ReferenceError in JavaScript."
    ]
  },
  {
    id: "note-update-operators",
    topic: "Update Operators",
    title: "Standard Update Operators ($set, $unset, $rename, $inc, $mul, $min, $max, $currentDate)",
    summary: "Perform precise field-level updates on documents.",
    keyOperators: [
      {
        name: "$set & $unset",
        description: "$set changes or adds field values. $unset deletes the specified field completely.",
        example: 'db.GptData02.updateOne({ _id: 10 }, { $set: { Active: false }, $unset: { "Address.Country": "" } })'
      },
      {
        name: "$rename",
        description: "Renames the key name of a field in a document.",
        example: 'db.GptData02.updateOne({ _id: 10 }, { $rename: { "Address.State": "Address.Province" } })'
      },
      {
        name: "$inc & $mul",
        description: "$inc increments/decrements a numeric field by n. $mul multiplies a numeric field by n.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $inc: { Age: 2, "Address.HouseNumber": 10 } })'
      },
      {
        name: "$min & $max",
        description: "$min updates the field only if the specified value is LESS than the current value. $max updates only if GREATER.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $min: { GPA: 3.0 }, $max: { Marks: 90 } })'
      },
      {
        name: "$currentDate",
        description: "Sets the value of a field to current date/timestamp.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $currentDate: { LastUpdated: true } })'
      }
    ],
    importantRules: [
      "$min preserves whichever value is smaller. If current GPA is 3.4 and {$min: {GPA: 3.0}}, new GPA becomes 3.0. If current GPA was 2.8, it remains 2.8.",
      "$max preserves whichever value is larger.",
      "$inc with a negative number performs a decrement (e.g. { $inc: { Age: -1 } })."
    ],
    commonMistakes: [
      "Confusing $min with $max: thinking $min picks the minimum from an array or sets a floor.",
      "Writing $inc with a string value like { $inc: { Age: '2' } } which causes a type error."
    ]
  },
  {
    id: "note-array-updates",
    topic: "Array Updates",
    title: "Array Update Operators & Modifiers ($push, $each, $position, $slice, $sort)",
    summary: "Add and format items inside arrays using $push with its powerful modifiers.",
    keyOperators: [
      {
        name: "$push",
        description: "Appends an item to an array. Allows duplicate items.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $push: { Courses: "React" } })'
      },
      {
        name: "$each modifier",
        description: "Used with $push or $addToSet to add multiple elements at once.",
        example: 'db.GptData02.updateOne({ _id: 2 }, { $push: { Courses: { $each: ["React", "Node.js", "Express"] } } })'
      },
      {
        name: "$position modifier",
        description: "Specifies insertion index: 0 = start of array, 1 = after 1st element, etc. Requires $each.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $push: { Courses: { $each: ["React"], $position: 0 } } })'
      },
      {
        name: "$slice modifier",
        description: "Limits total array length after push. Positive n keeps first n items; negative -n keeps last n items.",
        example: 'db.GptData02.updateOne({ _id: 2 }, { $push: { Courses: { $each: ["Angular"], $slice: 4 } } })'
      },
      {
        name: "$sort modifier",
        description: "Sorts the array after push. 1 for ascending, -1 for descending. Can sort objects or primitives.",
        example: 'db.GptData02.updateOne({ _id: 2 }, { $push: { Courses: { $each: ["Python"], $sort: 1 } } })'
      }
    ],
    importantRules: [
      "CRITICAL: To use $position, $slice, or $sort with $push, you MUST use the $each modifier, even if inserting only one element!",
      "$slice: 4 keeps the first 4 elements. $slice: -4 keeps the last 4 elements.",
      "$sort: 1 orders items ascending; $sort: -1 orders items descending.",
      "Combined Modifier Execution Order: During execution, elements are inserted at $position, the array is $sorted, and finally trimmed to $slice."
    ],
    commonMistakes: [
      "Using $position without $each: { $push: { Courses: 'React', $position: 0 } } is INVALID syntax.",
      "Thinking $slice: 4 deletes 4 elements; it retains at most 4 elements."
    ]
  },
  {
    id: "note-addtoset-vs-push",
    topic: "$addToSet vs $push",
    title: "$addToSet vs $push: Preventing Duplicates",
    summary: "Understand the core differences between set behavior and list behavior in MongoDB.",
    keyOperators: [
      {
        name: "$addToSet",
        description: "Treats the array as a mathematical set. Appends an element ONLY if it does not already exist in the array.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $addToSet: { Skills: "Java" } })'
      },
      {
        name: "$addToSet with $each",
        description: "Adds multiple distinct elements, skipping any elements that are already present.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $addToSet: { Skills: { $each: ["Python", "Git", "Docker"] } } })'
      }
    ],
    importantRules: [
      "$push always appends elements, allowing duplicate values.",
      "$addToSet checks for equality before inserting; if the item already exists, no change is made and nModified will be 0.",
      "$position, $slice, and $sort CANNOT be used with $addToSet (they are exclusive to $push)."
    ],
    commonMistakes: [
      "Using $push when unique tags or skills are required.",
      "Attempting to use $sort or $slice modifiers inside $addToSet."
    ]
  },
  {
    id: "note-removing-array-elements",
    topic: "Removing Array Elements",
    title: "Removing Array Elements ($pull, $pullAll, $pop)",
    summary: "Delete specific elements, lists of elements, or elements at boundaries from arrays.",
    keyOperators: [
      {
        name: "$pull",
        description: "Removes all instances of a value or elements matching a query condition from an array.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $pull: { Skills: "Git" } })'
      },
      {
        name: "$pull with conditions",
        description: "Removes array items satisfying comparison expressions like $gt, $regex, etc.",
        example: 'db.GptData02.updateOne({ _id: 15 }, { $pull: { Misc: { $gt: 20 } } })'
      },
      {
        name: "$pullAll",
        description: "Removes all instances of the specified values provided in an array.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $pullAll: { Skills: ["Python", "Java"] } })'
      },
      {
        name: "$pop",
        description: "Removes the first (-1) or last (1) item of an array.",
        example: 'db.GptData02.updateOne({ _id: 1 }, { $pop: { Skills: -1 } }) // removes first'
      }
    ],
    importantRules: [
      "$pop: -1 removes the FIRST element (index 0).",
      "$pop: 1 removes the LAST element.",
      "$pop only accepts 1 or -1; you cannot pass any other number to remove multiple items.",
      "$pull with a query condition filters all elements that match the filter condition."
    ],
    commonMistakes: [
      "Thinking $pop: 1 removes the first element (it removes the LAST).",
      "Passing a condition to $pullAll; $pullAll only takes literal values, whereas $pull accepts conditions."
    ]
  },
  {
    id: "note-upsert-setoninsert",
    topic: "Upsert & $setOnInsert",
    title: "Upsert Option & $setOnInsert Operator",
    summary: "Handle update-or-insert workflows seamlessly without race conditions.",
    keyOperators: [
      {
        name: "{ upsert: true }",
        description: "Update the document if a match is found; otherwise, insert a new document.",
        example: 'db.GptData02.updateOne({ _id: 50 }, { $set: { Name: "New Student", Age: 20 } }, { upsert: true })'
      },
      {
        name: "$setOnInsert",
        description: "Assigns field values ONLY when the upsert creates a new document. Ignored if document already existed.",
        example: 'db.Students.updateOne({ _id: 27 }, { $setOnInsert: { Name: "Test Mic", CreatedBy: "MongoTest" } }, { upsert: true })'
      }
    ],
    importantRules: [
      "When a document matches the query filter, $setOnInsert does NOTHING.",
      "When no document matches and a new document is inserted, both $set and $setOnInsert fields are written.",
      "Ideal for setting creation timestamps, creator IDs, or default non-overwritten values."
    ],
    commonMistakes: [
      "Assuming $setOnInsert updates an existing document if the field is missing; it only applies on INSERT.",
      "Forgetting to supply { upsert: true } in the third argument when using $setOnInsert."
    ]
  },
  {
    id: "note-aggregation",
    topic: "Aggregation",
    title: "Aggregation Pipeline ($match, $group, $project, $unwind, $sort)",
    summary: "Multi-stage pipeline for transforming, grouping, calculating statistics, and reshaping documents.",
    keyOperators: [
      {
        name: "$match",
        description: "Filters documents passing through the pipeline. Should ideally be placed as early as possible to utilize indexes.",
        example: '{ $match: { Section: "A", GPA: { $gte: 3.5 } } }'
      },
      {
        name: "$group & Accumulators",
        description: "Groups documents by an identifier (_id) and calculates aggregates using $sum, $avg, $min, $max.",
        example: '{ $group: { _id: "$Section", TotalMarks: { $sum: "$Marks" }, Average: { $avg: "$Marks" } } }'
      },
      {
        name: "$project",
        description: "Reshapes documents, computes derived fields, or excludes fields.",
        example: '{ $project: { Name: 1, Passed: { $gte: ["$Marks", 60] } } }'
      },
      {
        name: "$unwind",
        description: "Deconstructs an array field from the input documents to output a document for each element.",
        example: '{ $unwind: "$Courses" }'
      }
    ],
    importantRules: [
      "In $group, the grouping key MUST be specified as _id (e.g. _id: '$Section'). To group all documents together, use _id: null.",
      "Field references inside pipeline stages must be prefixed with a dollar sign: '$Marks', '$Section'.",
      "Place $match before $group to minimize the number of documents processed in memory."
    ],
    commonMistakes: [
      "Forgetting the dollar sign in field references inside $group: { $sum: 'Marks' } sums strings rather than numeric field values.",
      "Using find query syntax inside $group instead of accumulator expressions."
    ]
  }
];

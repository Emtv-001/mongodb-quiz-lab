import React from 'react';
import { MongoTopic } from '../../types';
import { Layers, ArrowRight, BookOpen, Code, Database, Sparkles } from 'lucide-react';
import { DEFAULT_QUESTIONS } from '../../data/questions';

interface TopicSelectorViewProps {
  onSelectTopic: (topic: MongoTopic) => void;
}

export const TopicSelectorView: React.FC<TopicSelectorViewProps> = ({ onSelectTopic }) => {
  const topics: { topic: MongoTopic; description: string; count: number; keyExample: string }[] = [
    {
      topic: 'Basic Queries',
      description: 'find(), projections ({Name:1, _id:0}), sorting (.sort({GPA:-1})), limit() and skip().',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Basic Queries').length,
      keyExample: 'db.GptData02.find({Section:"A"}, {Name:1, _id:0})'
    },
    {
      topic: 'Comparison Operators',
      description: '$gt, $gte, $lt, $lte, $eq, $ne, $in, $nin, and BSON type sensitivity.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Comparison Operators').length,
      keyExample: 'db.GptData02.find({Age: {$gte: 21}})'
    },
    {
      topic: 'Logical Operators',
      description: '$and, $or, $nor, $not for combining complex query filter clauses.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Logical Operators').length,
      keyExample: 'db.GptData02.find({$or: [{Section:"A"}, {GPA:{$gt:3.8}}]})'
    },
    {
      topic: 'Regular Expressions',
      description: '$regex, $options: "i", start ^ and end $ string anchors, array regex matching.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Regular Expressions').length,
      keyExample: 'db.GptData02.find({Name: {$regex: "^chioma", $options: "i"}})'
    },
    {
      topic: 'Arrays',
      description: 'Zero-based array indexing ("Courses.0": "Java"), $size, $all, $elemMatch.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Arrays').length,
      keyExample: 'db.GptData02.find({"Courses.0": "Java"})'
    },
    {
      topic: 'Nested Documents',
      description: 'Dot notation ("Address.State"), embedded object updates without overwriting.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Nested Documents').length,
      keyExample: 'db.GptData02.updateOne({_id:10}, {$set:{"Address.State":"Lagos"}})'
    },
    {
      topic: 'Update Operators',
      description: '$set, $unset, $rename, $inc, $mul, $min (smaller), $max (larger), $currentDate.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Update Operators').length,
      keyExample: 'db.GptData02.updateOne({_id:1}, {$min:{GPA:3.0}, $inc:{Age:2}})'
    },
    {
      topic: 'Array Updates',
      description: '$push, $each, $position (0=start), $slice (4 vs -4), $sort, combined modifiers.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Array Updates').length,
      keyExample: 'db.GptData02.updateOne({_id:1}, {$push:{Courses:{$each:["React"], $position:0}}})'
    },
    {
      topic: '$addToSet vs $push',
      description: 'Preventing duplicates ($addToSet) vs allowing duplicates ($push), with $each.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === '$addToSet vs $push').length,
      keyExample: 'db.GptData02.updateOne({_id:1}, {$addToSet:{Skills:"Java"}})'
    },
    {
      topic: 'Removing Array Elements',
      description: '$pull (conditional $gt), $pullAll (value list), $pop (-1 first vs 1 last).',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Removing Array Elements').length,
      keyExample: 'db.GptData02.updateOne({_id:1}, {$pop:{Skills:-1}})'
    },
    {
      topic: 'Upsert & $setOnInsert',
      description: '{upsert: true} workflow, and $setOnInsert which applies exclusively on insert.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Upsert & $setOnInsert').length,
      keyExample: 'db.Students.updateOne({_id:27}, {$setOnInsert:{CreatedBy:"MongoTest"}}, {upsert:true})'
    },
    {
      topic: 'Aggregation',
      description: '$match early placement, $group, $sum, $avg, $project, $unwind, $sort, $limit.',
      count: DEFAULT_QUESTIONS.filter(q => q.topic === 'Aggregation').length,
      keyExample: 'db.GptData02.aggregate([{$group:{_id:"$Section", Avg:{$avg:"$Marks"}}}])'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Targeted Training</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Practice by MongoDB Topic
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select an isolated topic to drill syntax, operator modifiers, and edge cases.
          </p>
        </div>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((item) => (
          <div
            key={item.topic}
            onClick={() => onSelectTopic(item.topic)}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {item.topic}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.count} Questions
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="font-mono text-[11px] text-emerald-400/90 bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                {item.keyExample}
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Start Topic Practice</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

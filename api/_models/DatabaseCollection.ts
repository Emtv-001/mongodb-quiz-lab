import mongoose from 'mongoose';

const DatabaseCollectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  databaseType: { 
    type: String, 
    enum: ['mongodb', 'postgresql', 'mysql', 'dynamodb', 'sqlite', 'json'],
    default: 'mongodb' 
  },
  name: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  schemaFields: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false }
  }],
  documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'databasecollections', strict: false });

export default mongoose.models.DatabaseCollection || mongoose.model('DatabaseCollection', DatabaseCollectionSchema);

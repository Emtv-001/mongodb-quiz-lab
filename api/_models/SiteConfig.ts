import mongoose from 'mongoose';

const SiteConfigSchema = new mongoose.Schema({
  platformName: { type: String, default: 'MongoDB Quiz Lab' },
  platformLogoUrl: { type: String, default: '' },
  primaryColor: { type: String, default: 'emerald' },
  allowRegistrations: { type: Boolean, default: true },
  showLeaderboard: { type: Boolean, default: true },
  supportEmail: { type: String, default: 'support@mongodbquizlab.com' },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);

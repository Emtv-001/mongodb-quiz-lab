import mongoose from 'mongoose';

const SiteConfigSchema = new mongoose.Schema({
  siteName: { type: String, default: 'MongoDB Quiz Lab' },
  siteSubtitle: { type: String, default: 'Master MongoDB Through Practical Questions' },
  brandName: { type: String, default: 'EMTVTECH' },
  logoType: { type: String, default: 'icon' },
  logoValue: { type: String, default: 'database' },
  accentColor: { type: String, default: 'emerald' },
  footerText: { type: String, default: 'EMTVTech Learning Hub • Practical Assessment Platform' },
  enabledTabs: { type: Object, default: {} },
  customTabLabels: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow extra fields just in case

export default mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);

import React, { useState } from 'react';
import { SiteCustomization } from '../../types/admin';
import { getSiteCustomization, saveSiteCustomization } from '../../services/adminService';
import {
  Palette,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Layout,
  Save,
  Globe,
  Sparkles
} from 'lucide-react';

interface AdminBrandingConfigProps {
  currentAdminUsername: string;
}

export const AdminBrandingConfig: React.FC<AdminBrandingConfigProps> = ({ currentAdminUsername }) => {
  const [config, setConfig] = useState<SiteCustomization>(() => getSiteCustomization());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteCustomization(config, currentAdminUsername);
    setStatusMessage("Site branding & navigation configuration saved successfully! (Changes live)");
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all branding and tab customizations to system defaults?")) {
      const defaults = {
        siteName: "MongoDB Quiz Lab",
        siteSubtitle: "Master MongoDB Through Practical Questions",
        brandName: "EMTVTech",
        logoType: "icon" as const,
        logoValue: "leaf",
        accentColor: "emerald" as const,
        enabledTabs: {
          dashboard: true,
          practice: true,
          quiz: true,
          'mock-exam-selector': true,
          challenge: true,
          mastery: true,
          'topic-practice': true,
          'weak-areas': true,
          revision: true,
          flashcards: true,
          'study-notes': true,
          datasets: true,
          review: true
        },
        customTabLabels: {
          dashboard: "Dashboard",
          practice: "Practice Mode",
          'mock-exam-selector': "Mock Exam Suite",
          challenge: "Challenge Mode",
          mastery: "Level 9 Projects",
          'topic-practice': "Practice by Topic",
          'weak-areas': "Target Weak Areas",
          revision: "Spaced Repetition",
          flashcards: "Study Flashcards",
          'study-notes': "Notes & Cheatsheet",
          datasets: "Live Datasets Explorer",
          review: "Question Review"
        },
        footerText: "EMTVTech Learning Hub • Practical Assessment Platform"
      };
      setConfig(defaults);
      saveSiteCustomization(defaults, currentAdminUsername);
      setStatusMessage("Reset to defaults.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const toggleTab = (tabKey: string) => {
    setConfig(prev => ({
      ...prev,
      enabledTabs: {
        ...prev.enabledTabs,
        [tabKey]: !prev.enabledTabs[tabKey]
      }
    }));
  };

  const updateTabLabel = (tabKey: string, label: string) => {
    setConfig(prev => ({
      ...prev,
      customTabLabels: {
        ...prev.customTabLabels,
        [tabKey]: label
      }
    }));
  };

  const tabDefinitions = [
    { key: 'dashboard', defaultLabel: 'Dashboard', category: 'Main' },
    { key: 'practice', defaultLabel: 'Practice Mode', category: 'Assessments' },
    { key: 'mock-exam-selector', defaultLabel: 'Mock Exam Suite', category: 'Assessments' },
    { key: 'challenge', defaultLabel: 'Challenge Mode', category: 'Assessments' },
    { key: 'mastery', defaultLabel: 'Level 9 Projects', category: 'Assessments' },
    { key: 'topic-practice', defaultLabel: 'Practice by Topic', category: 'Assessments' },
    { key: 'weak-areas', defaultLabel: 'Target Weak Areas', category: 'Smart Study' },
    { key: 'revision', defaultLabel: 'Spaced Repetition', category: 'Smart Study' },
    { key: 'flashcards', defaultLabel: 'Study Flashcards', category: 'Smart Study' },
    { key: 'study-notes', defaultLabel: 'Notes & Cheatsheet', category: 'Smart Study' },
    { key: 'datasets', defaultLabel: 'Live Datasets Explorer', category: 'Smart Study' },
    { key: 'review', defaultLabel: 'Question Review', category: 'Analysis' }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn">
      {/* Header & Save Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Palette className="w-4 h-4" />
            <span>Site Customization & White-Labeling</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Brand Identity & Navigation Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify site name, logo, color palette, and selectively toggle or rename student navigation tabs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* Brand & Identity Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Basic Brand Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Type className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Site Titles & Identity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Main Site Title (Displayed in Navbar & Header)
              </label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Brand / Organization Tag (e.g. EMTVTech)
              </label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Site Subtitle & Tagline
              </label>
              <input
                type="text"
                value={config.siteSubtitle}
                onChange={(e) => setConfig({ ...config, siteSubtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Logo & Color Accent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Logo & Color Accent</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Brand Logo Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'leaf', label: 'MongoDB Leaf' },
                  { id: 'database', label: 'SQL/NoSQL DB' },
                  { id: 'server', label: 'Cluster Server' },
                  { id: 'terminal', label: 'Code Terminal' }
                ].map((iconOption) => (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setConfig({ ...config, logoValue: iconOption.id })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      config.logoValue === iconOption.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold text-[11px]">{iconOption.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Primary Theme Accent
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500' },
                  { id: 'blue', label: 'Ocean Blue', bg: 'bg-blue-500' },
                  { id: 'purple', label: 'Royal Purple', bg: 'bg-purple-500' },
                  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500' },
                  { id: 'cyan', label: 'Cyber Cyan', bg: 'bg-cyan-500' },
                  { id: 'rose', label: 'Crimson Rose', bg: 'bg-rose-500' }
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setConfig({ ...config, accentColor: color.id as any })}
                    className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                      config.accentColor === color.id
                        ? 'border-white bg-slate-800 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                    <span className="text-[11px]">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Navbar Live Preview
              </span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                    DB
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">{config.siteName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{config.brandName}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  3d Streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Layout className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Student Navigation Tabs Visibility & Custom Labels
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Toggle visibility or rename tabs for your students
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {tabDefinitions.map((tab) => {
            const isEnabled = config.enabledTabs[tab.key] !== false;
            const currentLabel = config.customTabLabels[tab.key] || tab.defaultLabel;

            return (
              <div
                key={tab.key}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isEnabled
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleTab(tab.key)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {tab.category} • [{tab.key}]
                    </span>
                    <input
                      type="text"
                      value={currentLabel}
                      onChange={(e) => updateTabLabel(tab.key, e.target.value)}
                      disabled={!isEnabled}
                      className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 text-white font-semibold text-xs py-0.5 w-full focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${isEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                  {isEnabled ? 'VISIBLE' : 'HIDDEN'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
};

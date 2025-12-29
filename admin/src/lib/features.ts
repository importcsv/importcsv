/**
 * Feature flags for ImportCSV Cloud vs Self-Hosted
 */

export const isCloudMode = (): boolean => {
  return process.env.NEXT_PUBLIC_IMPORTCSV_CLOUD === "true";
};

export const features = {
  billing: isCloudMode(),
  usageLimits: isCloudMode(),
  apiKeys: true, // Available in both modes
  importHistory: true, // Available in both modes
  teamManagement: false, // Phase 3
  auditLogs: false, // Phase 3
};

export type FeatureFlags = typeof features;

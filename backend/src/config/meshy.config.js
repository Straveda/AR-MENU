export const meshyConfig = {
  apiKey: process.env.MESHY_API_KEY,
  baseUrl: process.env.MESHY_API_BASE_URL || 'https://api.meshy.ai',

  defaultSettings: {
    aiModel: 'latest',
    enablePbr: true,
    topology: 'triangle',
    targetPolycount: 300000,
    shouldRemesh: true,
    shouldTexture: true,
    symmetryMode: 'off',
  },

  polling: {
    intervalMs: 10000,
    maxAttempts: 60,
    resumeOnStartup: true,
  },

  urlExpirationDays: 30,
};

export const validateMeshyConfig = () => {
  if (!meshyConfig.apiKey) {
    console.warn('⚠️  MESHY_API_KEY is not configured. 3D model generation will be disabled.');
    return false;
  }

  console.log('✅ Meshy configuration validated');
  return true;
};

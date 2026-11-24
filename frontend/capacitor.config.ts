import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensetracker.app',
  appName: 'Expense Tracker',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oconservices.invoicepro',
  appName: 'Ocon Invoice Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For a full-stack app, you can point this to your deployed URL
    // to ensure all backend features work without refactoring.
    // url: 'https://your-netlify-url.netlify.app',
    // cleartext: true
  }
};

export default config;

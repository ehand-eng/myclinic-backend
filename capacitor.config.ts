
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9dc0152d5c2f4e18b5df02945c10dffe',
  appName: 'HealthCare+ Mobile',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://9dc0152d-5c2f-4e18-b5df-02945c10dffe.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: false
    }
  }
};

export default config;

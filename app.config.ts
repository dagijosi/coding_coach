export default {
  expo: {
    name: 'coding-coach',
    slug: 'coding-coach',
    scheme: 'codingcoach',
    version: '1.0.0',
    newArchEnabled: true,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.dagijosi.codingcoach',
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '5dd7739d-1551-410b-8bf4-cc836b75336c',
      },
    },
    plugins: [
      'expo-router',
      'expo-sqlite',
      'expo-secure-store',
    ],
  },
};

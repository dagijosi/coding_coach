export default {
  expo: {
    name: 'Coding Coach',
    slug: 'coding-coach',
    scheme: 'codingcoach',
    version: '1.0.5',
    newArchEnabled: true,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#040E4A',
        foregroundImage: './assets/icon.png',
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
      [
        'expo-splash-screen',
        {
          backgroundColor: '#050C27',
          image: './assets/icon.png',
          imageWidth: 90,
          resizeMode: 'contain',
          dark: {
            backgroundColor: '#050C27',
            image: './assets/icon.png',
          },
          android: {
            backgroundColor: '#050C27',
            image: './assets/icon.png',
            imageWidth: 90,
            dark: {
              backgroundColor: '#050C27',
              image: './assets/icon.png',
            },
          },
        },
      ],
      'expo-sqlite',
      'expo-secure-store',
    ],
  },
};

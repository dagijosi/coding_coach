import { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { BRIDGE_BASE_HTML } from './webview/bridgeHtml';
import {
  handleBridgeMessage,
  markWebViewLoaded,
  registerWebView,
} from './webview/engineBridge';

export function WebViewEngineHost() {
  const webViewRef = useRef<WebView | null>(null);

  useEffect(() => {
    return () => {
      registerWebView(null);
      markWebViewLoaded(false);
    };
  }, []);

  return (
    <View
      style={styles.host}
      importantForAccessibility="no-hide-descendants"
      accessible={false}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: BRIDGE_BASE_HTML }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        onLoadEnd={() => {
          registerWebView(webViewRef.current);
          markWebViewLoaded(true);
        }}
        onLoadStart={() => markWebViewLoaded(false)}
        onMessage={(event) =>
          handleBridgeMessage(event.nativeEvent.data)
        }
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          // eslint-disable-next-line no-console
          console.warn(
            'Engine WebView error:',
            nativeEvent
          );
        }}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    width: 320,
    height: 200,
    left: -9999,
    top: -9999,
    zIndex: -1,
  },

  webView: {
    width: 320,
    height: 200,
  },
});

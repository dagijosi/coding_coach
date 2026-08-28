import { Platform } from 'react-native';

import { WebViewJavaScriptEngine } from './WebViewJavaScriptEngine';
import { UnavailableJavaScriptEngine } from './UnavailableJavaScriptEngine';

import type { JavaScriptEngine } from './JavaScriptEngine';

let engine: JavaScriptEngine | null = null;

export function getJavaScriptEngine(): JavaScriptEngine {
  if (!engine) {
    engine =
      Platform.OS === 'web' ||
      Platform.OS === 'windows' ||
      Platform.OS === 'macos'
        ? new UnavailableJavaScriptEngine()
        : new WebViewJavaScriptEngine();
  }

  return engine;
}

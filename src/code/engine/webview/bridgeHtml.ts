export const BRIDGE_BASE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>coding-coach runtime</title>
</head>
<body style="margin:0;padding:0;background:#11161d;">
<script>
(function () {
  try {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'ready' })
    );
  } catch (e) {
    // The native bridge may not be attached yet on first paint; the
    // onLoadEnd on the React side also signposts readiness.
  }
})();
</script>
</body>
</html>`;

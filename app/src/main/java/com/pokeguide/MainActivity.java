package com.pokeguide;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private static final String TAG = "PokéGuide";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private WebView webView;              // Main app
    private WebView guideWebView;         // Guide browser overlay
    private FrameLayout guideBrowserOverlay;
    private LinearLayout guideToolbar;
    private TextView guideTitleText;
    private String currentGuideId = null; // Which guide bookmark is open
    private int lastScrollY = 0;          // For toolbar auto-hide
    private boolean toolbarVisible = true;
    private ValueCallback<Uri[]> fileUploadCallback; // For custom icon file picker

    // ── Helpers ────────────────────────────────────────────────────────

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[16384];
        int n;
        while ((n = in.read(chunk)) != -1) buf.write(chunk, 0, n);
        return buf.toByteArray();
    }

    private WebResourceResponse proxyFetch(String urlStr) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Referer", "");
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(25000);
            conn.connect();

            int code = conn.getResponseCode();
            Log.d(TAG, "Proxy " + code + " <- " + urlStr);

            if (code >= 200 && code < 400) {
                byte[] data = readAll(conn.getInputStream());
                String ct = conn.getContentType();
                if (ct == null) ct = "image/png";
                int semi = ct.indexOf(';');
                if (semi > 0) ct = ct.substring(0, semi).trim();
                Map<String, String> headers = new HashMap<>();
                headers.put("Access-Control-Allow-Origin", "*");
                return new WebResourceResponse(ct, "binary", 200, "OK",
                    headers, new ByteArrayInputStream(data));
            }
        } catch (Exception e) {
            Log.e(TAG, "Proxy error for " + urlStr + ": " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    // ── JS Bridge ──────────────────────────────────────────────────────

    public class JsBridge {
        @JavascriptInterface
        public void log(String msg) {
            Log.d(TAG, "JS: " + msg);
        }

        /** Called from JS to open a guide URL in the overlay browser. */
        @JavascriptInterface
        public void openGuide(String guideId, String url, int scrollY) {
            runOnUiThread(() -> showGuideBrowser(guideId, url, scrollY));
        }

        /** Called from JS to close the guide browser overlay. */
        @JavascriptInterface
        public void closeGuide() {
            runOnUiThread(() -> hideGuideBrowser());
        }
    }

    // ── Guide Browser Overlay ──────────────────────────────────────────

    private void showGuideBrowser(String guideId, String url, int scrollY) {
        currentGuideId = guideId;
        guideBrowserOverlay.setVisibility(View.VISIBLE);
        guideToolbar.setVisibility(View.VISIBLE);
        guideToolbar.setTranslationY(0);
        toolbarVisible = true;
        lastScrollY = 0;
        guideTitleText.setText(url);

        final int savedScrollY = scrollY;
        // Track whether this is the initial load so we only restore scroll
        // position once — not on every subsequent in-browser navigation
        // (clicking "next page" on a wiki should start at the top, not jump
        // to the previous page's saved scroll position).
        final boolean[] isInitialLoad = {true};

        guideWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String loadedUrl) {
                super.onPageFinished(view, loadedUrl);
                guideTitleText.setText(view.getTitle() != null ? view.getTitle() : loadedUrl);

                // Inject ad-hiding CSS — targets common ad containers found on
                // wiki sites (Google Ads, MediaWiki ad divs, generic ad classes).
                // This runs on every page load within the guide browser.
                view.evaluateJavascript(
                    "(function(){" +
                    "var s=document.createElement('style');" +
                    "s.textContent='" +
                    // Common ad selectors
                    "[id*=\"google_ads\"], [id*=\"ad-slot\"], [id*=\"ad_slot\"], " +
                    "[class*=\"ad-slot\"], [class*=\"adslot\"], " +
                    ".mw-ad, .ad-container, .ad-wrapper, .ad-banner, " +
                    ".ads, .adsbygoogle, .ad-unit, .ad-block, " +
                    "ins.adsbygoogle, .google-auto-placed, " +
                    "[id*=\"carbonads\"], .carbon-wrap, " +
                    "[data-ad], [data-ad-slot], " +
                    ".fandom-ad-wrapper, .top-ads-container, .bottom-ads-container, " +
                    ".ad-rail, .notifications-placeholder, " +
                    "iframe[src*=\"ads\"], iframe[src*=\"doubleclick\"], " +
                    "iframe[src*=\"googlesyndication\"] " +
                    "{ display:none!important; height:0!important; min-height:0!important; " +
                    "  max-height:0!important; overflow:hidden!important; margin:0!important; padding:0!important; }';" +
                    "document.head.appendChild(s);" +
                    "})()", null);

                if (isInitialLoad[0] && savedScrollY > 0) {
                    isInitialLoad[0] = false;
                    // First two retries fire quickly and unconditionally.
                    // Later retries only fire if the page drifted (ads/images
                    // shifted layout), so the user doesn't see a delayed jump
                    // when the page was already in the right spot.
                    String scrollScript = "window.scrollTo(0," + savedScrollY + ")";
                    String smartScroll = "(function(){var d=Math.abs(window.scrollY-" + savedScrollY + ");" +
                                         "if(d>80)window.scrollTo(0," + savedScrollY + ");})()";
                    view.postDelayed(() -> view.evaluateJavascript(scrollScript, null), 200);
                    view.postDelayed(() -> view.evaluateJavascript(scrollScript, null), 600);
                    view.postDelayed(() -> view.evaluateJavascript(smartScroll, null), 1500);
                    view.postDelayed(() -> view.evaluateJavascript(smartScroll, null), 3000);
                } else {
                    isInitialLoad[0] = false;
                    // New page navigated to within the guide — scroll to top
                    view.evaluateJavascript("window.scrollTo(0,0)", null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                // Stay inside the overlay browser — don't open external browser
                return false;
            }
        });

        guideWebView.loadUrl(url);

        // Immersive mode for the overlay too
        guideBrowserOverlay.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    private void hideGuideBrowser() {
        if (currentGuideId != null) {
            // Capture the current URL + scroll position from the guide WebView
            // using JS (so we stay in CSS pixel coordinates). We also capture
            // the page height ratio as a fallback for pages that change height
            // between sessions.
            final String gid = currentGuideId;
            guideWebView.evaluateJavascript(
                "(function(){" +
                "  var sy = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;" +
                "  var sh = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 1);" +
                "  return JSON.stringify({url: location.href, scrollY: Math.round(sy), scrollPct: sy/sh});" +
                "})()",
                value -> {
                    // value is a JSON string like '"{\"url\":\"...\",\"scrollY\":123}"'
                    // Strip outer quotes from the JS string return
                    if (value != null && value.startsWith("\"")) {
                        value = value.substring(1, value.length() - 1)
                                     .replace("\\\"", "\"")
                                     .replace("\\\\", "\\");
                    }
                    final String state = value;
                    runOnUiThread(() -> {
                        // Pass the state back to the main webview's JS
                        webView.evaluateJavascript(
                            "if(typeof guideSaveState==='function')guideSaveState('" +
                            gid.replace("'", "\\'") + "'," + state + ")", null);
                    });
                });
        }

        currentGuideId = null;
        guideBrowserOverlay.setVisibility(View.GONE);
        guideWebView.loadUrl("about:blank");

        // Re-apply immersive mode to main view
        webView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    private void setupToolbarAutoHide() {
        // Auto-hide toolbar on scroll down, show on scroll up — same pattern
        // as the app's floating prev/next buttons but implemented in Java for
        // the native guide WebView.
        guideWebView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
            int dy = scrollY - oldScrollY;
            if (dy > 8 && toolbarVisible) {
                // Scrolling down — hide toolbar
                guideToolbar.animate().translationY(-guideToolbar.getHeight()).setDuration(200).start();
                toolbarVisible = false;
            } else if (dy < -8 && !toolbarVisible) {
                // Scrolling up — show toolbar
                guideToolbar.animate().translationY(0).setDuration(200).start();
                toolbarVisible = true;
            }
        });
    }

    // ── Lifecycle ──────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        // ── Main WebView ──
        webView = findViewById(R.id.webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(
            "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");

        webView.addJavascriptInterface(new JsBridge(), "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                String url = req.getUrl().toString();
                if (url.contains("bulbagarden.net") ||
                    url.contains("weserv.nl") ||
                    url.contains("wsrv.nl")) {
                    Log.d(TAG, "Intercepting: " + url);
                    WebResourceResponse r = proxyFetch(url);
                    if (r != null) return r;
                    return new WebResourceResponse("text/plain", "utf-8",
                        new ByteArrayInputStream("err".getBytes()));
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                // Cancel any previous pending callback
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = callback;
                Intent intent = params.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    Log.e(TAG, "File chooser failed: " + e.getMessage());
                    return false;
                }
                return true;
            }
        });
        webView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        webView.loadUrl("file:///android_asset/index.html");

        // ── Guide Browser WebView ──
        guideBrowserOverlay = findViewById(R.id.guideBrowserOverlay);
        guideWebView = findViewById(R.id.guideWebView);
        guideToolbar = findViewById(R.id.guideToolbar);
        guideTitleText = findViewById(R.id.guideTitleText);

        WebSettings gs = guideWebView.getSettings();
        gs.setJavaScriptEnabled(true);
        gs.setDomStorageEnabled(true);
        gs.setDatabaseEnabled(true);
        gs.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        gs.setUseWideViewPort(true);
        gs.setLoadWithOverviewMode(true);
        // Enable pinch zoom for guide pages
        gs.setBuiltInZoomControls(true);
        gs.setDisplayZoomControls(false); // Hide the +/- buttons, keep pinch
        gs.setSupportZoom(true);
        gs.setTextZoom(100);
        gs.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Use the WebView's DEFAULT User-Agent (which includes the real Chrome
        // version token) instead of a hardcoded one. Cloudflare's bot detection
        // flags mismatched Chrome versions (our hardcoded "Chrome/120" vs the
        // WebView's actual engine version). The default UA passes their checks.
        // gs.setUserAgentString(...) — intentionally NOT set, use default
        // Allow third-party cookies (Cloudflare challenge needs them)
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(guideWebView, true);

        guideWebView.setWebChromeClient(new WebChromeClient());

        // Back button — navigate back within the guide's browsing history
        TextView backBtn = findViewById(R.id.guideBackBtn);
        backBtn.setOnClickListener(v -> {
            if (guideWebView.canGoBack()) {
                guideWebView.goBack();
            }
        });

        // Close button — exit guide browser back to the app
        TextView closeBtn = findViewById(R.id.guideCloseBtn);
        closeBtn.setOnClickListener(v -> hideGuideBrowser());

        // Auto-hide toolbar on scroll
        setupToolbarAutoHide();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (fileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
                fileUploadCallback.onReceiveValue(results);
                fileUploadCallback = null;
            }
        }
    }

    @Override
    public boolean onKeyDown(int kc, KeyEvent e) {
        // If guide browser is open, back key navigates within it (or closes it)
        if (kc == KeyEvent.KEYCODE_BACK && guideBrowserOverlay.getVisibility() == View.VISIBLE) {
            if (guideWebView.canGoBack()) {
                guideWebView.goBack();
            } else {
                hideGuideBrowser();
            }
            return true;
        }
        // For the main app, delegate to JS which knows the SPA navigation stack
        if (kc == KeyEvent.KEYCODE_BACK) {
            webView.evaluateJavascript("handleBack()", value -> {
                // value is "true" or "false" as a string
                if (!"true".equals(value)) {
                    // JS couldn't handle it — exit the app
                    runOnUiThread(() -> finish());
                }
            });
            return true; // consume the event, JS callback handles it
        }
        return super.onKeyDown(kc, e);
    }

    @Override protected void onResume() {
        super.onResume();
        webView.onResume();
        webView.resumeTimers();
    }

    @Override protected void onPause() {
        super.onPause();
        webView.onPause();
        webView.pauseTimers();
    }

    @Override protected void onDestroy() {
        super.onDestroy();
        webView.destroy();
        guideWebView.destroy();
    }
}

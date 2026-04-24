package com.pokeguide;

import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.util.Log;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private static final String TAG = "PokéGuide";
    private WebView webView;

    /** Read all bytes from a stream into a byte array */
    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[16384];
        int n;
        while ((n = in.read(chunk)) != -1) buf.write(chunk, 0, n);
        return buf.toByteArray();
    }

    /** Fetch a URL natively — no CORS, no hotlink check — and return as WebResourceResponse */
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
            // Deliberately send NO Referer — defeats hotlink protection
            conn.setRequestProperty("Referer", "");
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(25000);
            conn.connect();

            int code = conn.getResponseCode();
            Log.d(TAG, "Proxy " + code + " <- " + urlStr);

            if (code >= 200 && code < 400) {
                // Buffer ALL bytes before returning — prevents premature stream close
                byte[] data = readAll(conn.getInputStream());
                String ct = conn.getContentType();
                if (ct == null) ct = "image/png";
                int semi = ct.indexOf(';');
                if (semi > 0) ct = ct.substring(0, semi).trim();

                Map<String, String> headers = new HashMap<>();
                headers.put("Access-Control-Allow-Origin", "*");

                return new WebResourceResponse(ct, "binary", 200, "OK",
                    headers, new ByteArrayInputStream(data));
            } else {
                Log.w(TAG, "Proxy got HTTP " + code + " for " + urlStr);
            }
        } catch (Exception e) {
            Log.e(TAG, "Proxy error for " + urlStr + ": " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    /** Simple JS bridge so Java can send debug messages to the page */
    public class JsBridge {
        @JavascriptInterface
        public void log(String msg) {
            Log.d(TAG, "JS: " + msg);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);
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
                // Intercept ALL image requests for map domains
                if (url.contains("bulbagarden.net") ||
                    url.contains("weserv.nl") ||
                    url.contains("wsrv.nl")) {
                    Log.d(TAG, "Intercepting: " + url);
                    WebResourceResponse r = proxyFetch(url);
                    if (r != null) return r;
                    // All fallback URLs in proxyFetch failed — return empty response
                    // so onerror fires in JS
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

        webView.setWebChromeClient(new WebChromeClient());
        webView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override public boolean onKeyDown(int kc, KeyEvent e) {
        if (kc == KeyEvent.KEYCODE_BACK && webView.canGoBack()) { webView.goBack(); return true; }
        return super.onKeyDown(kc, e);
    }
    @Override protected void onResume() { super.onResume(); webView.onResume(); webView.resumeTimers(); }
    @Override protected void onPause() { super.onPause(); webView.onPause(); webView.pauseTimers(); }
    @Override protected void onDestroy() { super.onDestroy(); webView.destroy(); }
}

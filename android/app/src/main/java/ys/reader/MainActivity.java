package ys.reader;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
public class MainActivity extends AppCompatActivity {
    private WebView wv;
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        wv = new WebView(this);
        wv.getSettings().setJavaScriptEnabled(true);
        wv.getSettings().setAllowFileAccess(true);
        wv.getSettings().setDomStorageEnabled(true);
        wv.getSettings().setDatabaseEnabled(true);
        wv.setWebViewClient(new WebViewClient());
        wv.loadUrl("file:///android_asset/index.html");
        setContentView(wv);
    }
    @Override public void onBackPressed() {
        if (wv.canGoBack()) wv.goBack(); else super.onBackPressed();
    }
}

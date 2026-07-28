const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log('> ' + cmd);
  try {
    const r = execSync(cmd, { cwd: '/tmp', stdio: 'pipe', maxBuffer: 100*1024*1024 });
    console.log(r.toString().slice(0, 500));
  } catch(e) {
    console.log('EXIT:', e.status);
    console.log(e.stdout?.toString().slice(0, 500));
    console.log(e.stderr?.toString().slice(0, 500));
    throw new Error(cmd + ' failed');
  }
}

const GH = process.env.GITHUB_WORKSPACE;
const TMP = '/tmp';

console.log('=== Setup SDK ===');
run('curl -sL -o clt.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip');
run('unzip -q clt.zip');
fs.mkdirSync(TMP + '/android-sdk/cmdline-tools', { recursive: true });
fs.renameSync(TMP + '/cmdline-tools', TMP + '/android-sdk/cmdline-tools/latest');
process.env.ANDROID_HOME = TMP + '/android-sdk';
process.env.PATH = TMP + '/android-sdk/cmdline-tools/latest/bin:' + process.env.PATH;
run('yes | sdkmanager --sdk_root=' + TMP + '/android-sdk platforms\\;android-34 build-tools\\;34.0.0 > /dev/null 2>&1');

console.log('=== Create Project ===');
const P = TMP + '/p';
fs.mkdirSync(P + '/app/src/main/assets', { recursive: true });
fs.mkdirSync(P + '/app/src/main/java/r', { recursive: true });
fs.mkdirSync(P + '/app/src/main/res/values', { recursive: true });
fs.copyFileSync(GH + '/app.html', P + '/app/src/main/assets/index.html');
fs.writeFileSync(P + '/app/src/main/java/r/Main.java', `
package r;
import android.app.Activity; import android.os.Bundle; import android.webkit.WebView;
public class Main extends Activity {
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b); WebView w = new WebView(this);
    w.getSettings().setJavaScriptEnabled(true); w.getSettings().setDomStorageEnabled(true);
    w.loadUrl("file:///android_asset/index.html"); setContentView(w);
  }
}`);
fs.writeFileSync(P + '/app/src/main/AndroidManifest.xml', `
<?xml version="1.0" encoding="utf-8"?>
<manifest package="ys.reader" xmlns:android="http://schemas.android.com/apk/res/android">
<uses-permission android:name="android.permission.INTERNET"/>
<application android:label="藏书阁" android:theme="@style/T">
<activity android:name=".Main" android:exported="true">
  <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
</activity>
</application></manifest>`);
fs.writeFileSync(P + '/app/src/main/res/values/theme.xml', `
<?xml version="1.0" encoding="utf-8"?>
<resources><style name="T" parent="android:Theme.Material.Light.NoActionBar"/></resources>`);
fs.writeFileSync(P + '/settings.gradle', "rootProject.name='YS'; include ':app'");
fs.writeFileSync(P + '/build.gradle', `
buildscript {
  repositories { google();mavenCentral() }
  dependencies { classpath 'com.android.tools.build:gradle:8.2.0' }
}
allprojects { repositories { google();mavenCentral() } }`);
fs.writeFileSync(P + '/app/build.gradle', `
plugins { id 'com.android.application' }
android { namespace 'ys.reader'; compileSdk 34
  defaultConfig { applicationId 'ys.reader'; minSdk 24; targetSdk 34; versionCode 1; versionName '1.0' }
  buildTypes { release { minifyEnabled false } } }`);
fs.writeFileSync(P + '/local.properties', 'sdk.dir=' + process.env.ANDROID_HOME);
fs.writeFileSync(P + '/gradle.properties', 'android.useAndroidX=true\norg.gradle.jvmargs=-Xmx2g');

console.log('=== Download Gradle ===');
run('curl -sL -o /tmp/gradle.zip https://services.gradle.org/distributions/gradle-8.5-bin.zip');
run('unzip -q /tmp/gradle.zip -d /tmp/');

console.log('=== Build ===');
run('/tmp/gradle-8.5/bin/gradle -p ' + P + ' assembleDebug --no-daemon');

console.log('=== Find APK ===');
const apks = execSync('find ' + P + ' -name "*.apk"', { encoding: 'utf8' }).trim();
console.log('Found:', apks);
if (apks) {
  const src = apks.split('\n')[0];
  fs.cpSync(src, TMP + '/final.apk');
  console.log('Copied to /tmp/final.apk, size:', fs.statSync(TMP + '/final.apk').size);
} else {
  console.log('NO APK FOUND!');
  process.exit(1);
}

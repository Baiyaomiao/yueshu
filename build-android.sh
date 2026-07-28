#!/bin/bash
set -e
echo "=== Setting up Android SDK ==="
cd /tmp
curl -sL -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q cmdline-tools.zip
mkdir -p android-sdk/cmdline-tools
mv cmdline-tools android-sdk/cmdline-tools/latest
export ANDROID_HOME=/tmp/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
yes | sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-34" "build-tools;34.0.0" > /dev/null 2>&1
echo "SDK ready"

echo "=== Creating project ==="
mkdir -p /tmp/project/app/src/main/assets
mkdir -p /tmp/project/app/src/main/java/ys/reader
mkdir -p /tmp/project/app/src/main/res/values
cp "$GITHUB_WORKSPACE/app.html" /tmp/project/app/src/main/assets/index.html

cat > /tmp/project/app/src/main/java/ys/reader/MainActivity.java << 'JAVA'
package ys.reader;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.appcompat.app.AppCompatActivity;
public class MainActivity extends AppCompatActivity {
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        WebView wv = new WebView(this);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        wv.loadUrl("file:///android_asset/index.html");
        setContentView(wv);
    }
}
JAVA

cat > /tmp/project/app/src/main/AndroidManifest.xml << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<manifest package="ys.reader" xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <application android:label="阅书" android:theme="@style/AppTheme">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
        </activity>
    </application>
</manifest>
XML

cat > /tmp/project/app/src/main/res/values/styles.xml << 'XML2'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
    </style>
</resources>
XML2

cat > /tmp/project/settings.gradle << 'SG'
rootProject.name = 'Yueshu'
include ':app'
SG

cat > /tmp/project/build.gradle << 'BG'
buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath 'com.android.tools.build:gradle:8.2.0' }
}
allprojects { repositories { google(); mavenCentral() } }
BG

cat > /tmp/project/app/build.gradle << 'ABG'
plugins { id 'com.android.application' }
android {
    namespace 'ys.reader'
    compileSdk 34
    defaultConfig { applicationId 'ys.reader'; minSdk 24; targetSdk 34; versionCode 1; versionName '1.0' }
    buildTypes { release { minifyEnabled false } }
}
dependencies { implementation 'androidx.appcompat:appcompat:1.7.0' }
ABG

echo "sdk.dir=$ANDROID_HOME" > /tmp/project/local.properties
echo "org.gradle.jvmargs=-Xmx2g" > /tmp/project/gradle.properties
echo "android.useAndroidX=true" >> /tmp/project/gradle.properties

echo "=== Downloading Gradle ==="
curl -sL -o /tmp/gradle-8.5-bin.zip https://services.gradle.org/distributions/gradle-8.5-bin.zip
unzip -q /tmp/gradle-8.5-bin.zip -d /tmp/
export PATH=/tmp/gradle-8.5/bin:$PATH

echo "=== Building APK ==="
cd /tmp/project
gradle assembleDebug --no-daemon -q

echo "=== Copying APK ==="
ls -la /tmp/project/app/build/outputs/apk/debug/
cp /tmp/project/app/build/outputs/apk/debug/*.apk /tmp/app-debug.apk
echo "APK_SIZE=$(stat -c%s /tmp/app-debug.apk 2>/dev/null || stat -f%z /tmp/app-debug.apk 2>/dev/null)"

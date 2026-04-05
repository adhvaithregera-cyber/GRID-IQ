# GridIQ ProGuard rules

# Keep line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor ─────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# ── Google Play Billing (cordova-plugin-purchase) ─────────
-keep class cc.fovea.** { *; }
-keep class com.android.billingclient.** { *; }

# ── Firebase ──────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# ── WebView JavaScript interface ──────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── AndroidX ──────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

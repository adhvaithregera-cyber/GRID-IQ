package com.gridiq.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FirebaseBridgePlugin.class);
        super.onCreate(savedInstanceState);

        // Draw behind status bar, navigation bar, and notch (edge-to-edge).
        // CSS env(safe-area-inset-top/bottom) provides inset values for the web layer.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Transparent system bars — no grey/white gaps.
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // Disable the grey contrast scrim Android adds over the navigation bar
        // (available API 29+; styles.xml handles API 35+ via enforceNavigationBarContrast).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        // Allow content to render inside the display cutout (notch) area.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
    }
}

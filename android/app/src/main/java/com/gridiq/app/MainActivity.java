package com.gridiq.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Draw behind status bar, navigation bar, and notch (edge-to-edge).
        // CSS env(safe-area-inset-top/bottom) provides the inset values so
        // the nav bar and bottom nav can compensate in the web layer.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Allow content to render inside the display cutout (notch) area.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
    }
}

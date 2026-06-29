package com.neyborhuud.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.ProcessedRoute;
import com.getcapacitor.RouteProcessor;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * Fixes client-side routing for the Next.js static export inside Capacitor.
 *
 * Next's `output: export` only emits a placeholder shell per dynamic segment
 * (assets/public/profile/__id.html). Capacitor's WebViewLocalServer otherwise
 * serves the ROOT index.html (landing page) for any extensionless path it can't
 * find, so /profile/<anyone>, /events/<id>, /chat/<id> would render the landing
 * page. (Confirmed: the client SPA router cannot cross from the marketing
 * index.html shell into the (app) route group, so this MUST be fixed natively.)
 *
 * RouteProcessor contract (verified against WebViewLocalServer.java @ v8):
 *   - process(basePath, path) runs for BOTH the special "/index.html" load and
 *     for every asset request.
 *   - For the index.html call, Capacitor uses getPath() DIRECTLY:
 *         openAsset(getPath())            // needs the FULL asset path
 *   - For request paths, when isIgnoreAssetPath()==true it also uses getPath()
 *     directly: openAsset(getPath()).  When false it prepends the asset base,
 *     which on this Android version omits the separator -> broken. So we ALWAYS
 *     return the full asset path ("public/...") with isAsset=true AND
 *     ignoreAssetPath=true, which both call sites handle identically.
 *
 * basePath is the asset base (e.g. "public"); we build "<basePath>/<route>".
 */
public class MainActivity extends BridgeActivity {

    /** Cache of asset paths (relative to the asset base) known to exist. */
    private final Set<String> assetCache = new HashSet<>();

    @Override
    protected void load() {
        this.bridgeBuilder.setRouteProcessor(new RouteProcessor() {
            @Override
            public ProcessedRoute process(String basePath, String path) {
                return resolve(basePath, path);
            }
        });
        super.load();
    }

    private ProcessedRoute resolve(String basePath, String path) {
        // basePath is the asset root (typically "public"); normalise to no
        // trailing slash so we can join cleanly.
        String base = basePath == null ? "public" : basePath;
        while (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        if (base.isEmpty()) base = "public";

        ProcessedRoute route = new ProcessedRoute();
        route.setAsset(true);
        route.setIgnoreAssetPath(true); // we return the FULL asset path ourselves

        // Strip query/hash and leading slashes from the requested route.
        String clean = path == null ? "" : path;
        int q = clean.indexOf('?');
        if (q >= 0) clean = clean.substring(0, q);
        int h = clean.indexOf('#');
        if (h >= 0) clean = clean.substring(0, h);
        while (clean.startsWith("/")) clean = clean.substring(1);

        // Capacitor's special index.html probe, or any path with a file
        // extension -> serve that asset directly (default behaviour).
        String lastSeg = clean.isEmpty() ? "" : clean.substring(clean.lastIndexOf('/') + 1);
        if (clean.isEmpty() || lastSeg.contains(".")) {
            route.setPath(base + "/" + (clean.isEmpty() ? "index.html" : clean));
            return route;
        }

        // 1. Static-route page: <path>.html
        if (assetExists(base, clean + ".html")) {
            route.setPath(base + "/" + clean + ".html");
            return route;
        }

        // 2. Dynamic route: replace each segment (from the last) with __id and
        //    look for <prefix>/__id.html. /profile/jane -> profile/__id.html;
        //    /profile/jane/followers -> profile/__id/followers.html
        String[] segs = clean.split("/");
        for (int i = segs.length - 1; i >= 0; i--) {
            StringBuilder sb = new StringBuilder();
            for (int k = 0; k < segs.length; k++) {
                if (k > 0) sb.append('/');
                sb.append(k == i ? "__id" : segs[k]);
            }
            String candidate = sb.toString() + ".html";
            if (assetExists(base, candidate)) {
                route.setPath(base + "/" + candidate);
                return route;
            }
        }

        // 3. Fallback: root index.html (preserves prior behaviour).
        route.setPath(base + "/index.html");
        return route;
    }

    /** Whether a file exists in bundled assets at "<base>/<relative>". */
    private boolean assetExists(String base, String relative) {
        String full = base + "/" + relative;
        if (assetCache.contains(full)) return true;
        try {
            getAssets().open(full).close();
            assetCache.add(full);
            return true;
        } catch (IOException e) {
            return false;
        }
    }
}

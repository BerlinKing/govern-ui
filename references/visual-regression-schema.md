# Visual regression manifest

Capture the baseline before source cleanup. After cleanup, capture the same route, state, viewport, and theme. A missing side remains explicitly unverified.

```json
{
  "schemaVersion": 1,
  "captures": [
    {
      "id": "canvas-dashboard-empty-desktop-light",
      "feature": "Canvas dashboard",
      "page": "Dashboard",
      "route": "/dashboard",
      "state": "empty",
      "viewport": "1440x960",
      "theme": "light",
      "beforeImage": "screenshots/before/dashboard-empty.png",
      "afterImage": "screenshots/after/dashboard-empty.png",
      "affectedTokens": ["--bg-body", "--text-primary"],
      "expectedChange": "No visible change",
      "sourceEvidence": ["apps/canvas/src/pages/Dashboard.tsx"]
    }
  ]
}
```

Required product dimensions are feature, page, state, viewport, and theme. Add authenticated, error, loading, empty, hover, focus, open overlay, responsive, and reduced-motion states when they exist. Do not label a state runtime-confirmed without a readable before and after capture.

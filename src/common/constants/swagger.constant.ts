export const SWAGGER_DARK_CSS = `
  @media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; }
  html, body { background: #0b0f1a !important; }
  .swagger-ui, .swagger-ui * { color: #e7eaf3 !important; }
  .topbar { background: #0f172a !important; border-bottom: 1px solid #1f2937; }
  .opblock, .opblock .opblock-section, .opblock .opblock-summary {
    background: #111827 !important; border-color: #374151 !important;
  }
  .btn, .expand-methods, .download-contents {
    background: #1f2937 !important; color: #e7eaf3 !important; border-color: #374151 !important;
  }
  code, pre { background: #0b1220 !important; color: #cbd5e1 !important; }
  .model-box, .parameters, .responses-table, .responses-inner {
    background: #0b1220 !important; border-color: #334155 !important;
  }
  input, select, textarea {
    background: #0b1220 !important; color: #e7eaf3 !important; border-color: #334155 !important;
  }
}
`;

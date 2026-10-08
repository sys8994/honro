// Location and production geometry share the same versioned traversal contract.
process.env.HONRO_GEOMETRY_REPORT_DIR??='_local/reports/act3-locations';
await import('./act3-production-maps.mjs');

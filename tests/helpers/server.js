'use strict';

// Provide test defaults so server.js can load without a real .env
process.env.PORT             = process.env.PORT             || '3000';
process.env.ADMIN_PASSWORD   = process.env.ADMIN_PASSWORD   || 'ci_test_password';
process.env.FAMILY_NAME      = process.env.FAMILY_NAME      || 'TestFamily';
process.env.LOCATION_LAT     = process.env.LOCATION_LAT     || '59.9139';
process.env.LOCATION_LON     = process.env.LOCATION_LON     || '10.7522';
// Use in-memory SQLite so tests never touch data/family.db
process.env.DATABASE_PATH    = ':memory:';

let app        = null;
let serverReady = false;

try {
  app         = require('../../server');
  serverReady = true;
} catch {
  // server.js not built yet — backend tests will be skipped
}

module.exports = { app, serverReady };

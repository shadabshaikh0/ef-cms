const {
  migrateItems: migration0001,
} = require('./migrations/0001-remove-has-sealed-documents');

// MODIFY THIS ARRAY TO ADD NEW MIGRATIONS OR REMOVE OLD ONES
const migrationsToRun = [
  { key: '0001-remove-has-sealed-documents.js', script: migration0001 },
];

exports.migrationsToRun = migrationsToRun;

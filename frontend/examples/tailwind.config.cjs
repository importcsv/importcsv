// Reuse root Tailwind config but ensure a valid content path from examples
const path = require('path');
const parent = require('../tailwind.config.js');

module.exports = {
  ...parent,
  // Ensure content scanning includes examples paths explicitly
  content: [
    path.join(__dirname, './**/*.{js,jsx,ts,tsx,html}'),
    path.join(__dirname, '../src/**/*.{js,jsx,ts,tsx}'),
  ],
};



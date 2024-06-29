const express = require('express');
const bodyParser = require('body-parser');
const initializeDatabase = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');


// Import routes for each table
const ledgerGroupRoutes = require('./routes/ledgerGroupRoutes');
const stockGroupRoutes = require('./routes/stockGroupRoutes');
const costCategoryRoutes = require('./routes/costCategoryRoutes');
const costCenterRoutes = require('./routes/costCenterRoutes');
const godownRoutes = require('./routes/godownRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const voucherTypeRoutes = require('./routes/voucherTypeRoutes');
const stockItemRoutes = require('./routes/stockItemRoutes');
const unitRoutes = require('./routes/unitRoutes');

const app = express();
app.use(bodyParser.json({ limit: '75mb' }));

// Initialize database connection and start server
initializeDatabase().then(() => {
  // API routes for each table
  app.use('/api/ledger-groups', ledgerGroupRoutes);
  app.use('/api/stock-groups', stockGroupRoutes);
  app.use('/api/cost-categories', costCategoryRoutes);
  app.use('/api/cost-centers', costCenterRoutes);
  app.use('/api/godowns', godownRoutes);
  app.use('/api/ledgers', ledgerRoutes);
  app.use('/api/voucher-types', voucherTypeRoutes);
  app.use('/api/stock-items', stockItemRoutes);
  app.use('/api/units', unitRoutes);

  // Error handling middleware
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize the database:', err);
});

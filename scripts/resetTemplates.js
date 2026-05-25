const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const EmailTemplate = require('../models/EmailTemplate');

  const count = await EmailTemplate.countDocuments();
  console.log('Current template count: ' + count);

  if (count > 0) {
    const result = await EmailTemplate.deleteMany({});
    console.log('Deleted ' + result.deletedCount + ' templates');
  }

  const templateService = require('../services/templateService');
  const created = await templateService.createDefaultTemplates();
  console.log('Created ' + created.length + ' templates');

  const sample = await EmailTemplate.findOne({ name: 'Welcome Email' });
  console.log('Has {{unsubscribeUrl}} placeholder: ' + sample.htmlContent.includes('{{unsubscribeUrl}}'));

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Define a route to receive webhook notifications from Airtable
app.post('/webhook', (req, res) => {
  const eventData = req.body; // Data sent by Airtable
  // Process the eventData and update your data
  // For example, you could update a local database or trigger a client-side update
  console.log('Webhook received:', eventData);
  res.status(200).send('Webhook received');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

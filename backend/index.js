const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // accept large base64 image payloads

app.post('/generate-beta', (req, res) => {
  console.log('Received problem data:');
  console.dir(req.body, { depth: null });

  // For now, just send back a placeholder response
  res.json({ message: 'Beta generation placeholder successful!' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

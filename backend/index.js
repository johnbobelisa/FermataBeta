const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // accept large base64 image payloads

app.post('/generate-beta', (req, res) => {
  console.log('Received problem data:');
  console.dir(req.body, { depth: null });

  // --- Save the received JSON to a file ---
  const outputPath = path.join(__dirname, 'route_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(req.body, null, 2));

  console.log(`Saved route data to ${outputPath}`);

  // Placeholder response
  res.json({ message: 'Beta generation placeholder successful!' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

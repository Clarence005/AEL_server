const express = require('express');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = 8000;

app.use(cors());

app.use('/static', express.static(path.join(__dirname, 'lionking_hls')));
app.use('/ads', express.static(path.join(__dirname, 'ad_hls')));


app.use('/', videoRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

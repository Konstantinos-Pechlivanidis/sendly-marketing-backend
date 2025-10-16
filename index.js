import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import './queue/worker.js'; // starts BullMQ worker

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`sendly-marketing-api listening on :${PORT}`));

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import fileRoutes from './routes/files';
import folderRoutes from './routes/folders';
import previewRoutes from './routes/preview';
import { errorHandler } from './middlewares/error';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.options('*', cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/preview', previewRoutes);

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './uploads';
app.use('/files', express.static(path.join(__dirname, '..', STORAGE_PATH)));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'ProtoHub API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

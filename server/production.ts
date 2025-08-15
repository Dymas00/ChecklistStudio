import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'checklist-studio-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files from dist/public in production
const publicPath = path.resolve(__dirname, '../dist/public');
console.log(`[production] Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Register API routes and setup
const startServer = async () => {
  const server = await registerRoutes(app);
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      console.log(`[production] Serving index.html for route: ${req.path}`);
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[express] serving on port ${PORT}`);
    console.log(`[production] Frontend available at: http://18.228.156.152:${PORT}`);
  });
};

startServer().catch(console.error);
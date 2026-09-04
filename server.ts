import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './src/server/db.js';
import authRoutes from './src/server/routes/authRoutes.js';
import resumeRoutes from './src/server/routes/resumeRoutes.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Connect to MongoDB asynchronously if MONGODB_URI is provided
  connectDB().catch((err) => {
    console.error('⚠️ Background MongoDB connection error:', err);
  });

  // Health check endpoint (FIRST)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/v1/resumes', resumeRoutes);
  app.use('/api/v1/resume', resumeRoutes);

  // Direct top-level analyze and upload aliases
  app.post('/api/analyze', resumeRoutes);
  app.post('/api/upload', resumeRoutes);

  // Strict 404 JSON response for any unmatched API endpoints (prevents HTML SPA fallback for API calls)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global API error handler ensuring JSON is always returned, never HTML
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Express Server Error:', err);
    const status = err.status || err.statusCode || 400;
    res.status(status).json({
      success: false,
      message: err.message || 'An error occurred while processing your request.',
    });
  });

  // Vite middleware for frontend development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Signup Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

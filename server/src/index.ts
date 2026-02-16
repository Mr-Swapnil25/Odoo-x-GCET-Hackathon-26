import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${backendUrl}/auth/google/callback`
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account has no email'));
          }

          const existing = await pool.query(
            'SELECT id, role, google_id FROM users WHERE google_id = $1 OR email = $2',
            [profile.id, email]
          );

          if (existing.rowCount > 0) {
            const user = existing.rows[0];
            if (!user.google_id) {
              await pool.query('UPDATE users SET google_id = $1, updated_at = now() WHERE id = $2', [profile.id, user.id]);
            }
            return done(null, { id: user.id, role: user.role });
          }

          const insert = await pool.query(
            'INSERT INTO users (name, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING id, role',
            [profile.displayName || email.split('@')[0], email, profile.id, 'USER']
          );

          return done(null, { id: insert.rows[0].id, role: insert.rows[0].role });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/tasks', tasksRoutes);
app.use('/reports', reportsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


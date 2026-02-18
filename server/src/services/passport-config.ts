import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { v4 as uuidv4 } from 'uuid';
import { upsertUser, findUserById } from './db';

export function configurePassport(): void {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    const user = findUserById(id);
    done(null, user || null);
  });

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id') {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.CALLBACK_URL}/api/auth/google/callback`,
    }, (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = upsertUser({
          id: uuidv4(),
          email: profile.emails?.[0]?.value || `${profile.id}@google.oauth`,
          name: profile.displayName || 'Google User',
          avatar_url: profile.photos?.[0]?.value || null,
          provider: 'google',
          provider_id: profile.id,
        });
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }));
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your-github-client-id') {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.CALLBACK_URL}/api/auth/github/callback`,
    }, (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const user = upsertUser({
          id: uuidv4(),
          email: profile.emails?.[0]?.value || `${profile.id}@github.oauth`,
          name: profile.displayName || profile.username || 'GitHub User',
          avatar_url: profile.photos?.[0]?.value || null,
          provider: 'github',
          provider_id: profile.id,
        });
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }));
  }
}

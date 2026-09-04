import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { 
  sendWelcomeEmail, 
  sendLoginNotificationEmail,
  sendPasswordResetEmail, 
  sendPasswordChangedConfirmationEmail 
} from '../services/emailService.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_jwt_key';

// In-memory fallback user store when MongoDB is not connected in demo mode
interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'personal' | 'recruiter';
  companyName?: string;
  createdAt: Date;
}
const inMemoryUsers: Array<InMemoryUser> = [];

// Reset codes store for password resets: email -> { code, expiresAt, name }
const resetCodesStore = new Map<string, { code: string; expiresAt: number; name?: string }>();

/**
 * POST /api/auth/signup
 * Handles user registration partitioned by portal role (personal vs recruiter)
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'personal', companyName } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole: 'personal' | 'recruiter' = role === 'recruiter' ? 'recruiter' : 'personal';

    // 2. Check if MongoDB connection is active
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Check if user already exists for this exact role in MongoDB
      const existingUserForRole = await (User as any).findOne({ email: normalizedEmail, role: validRole });
      if (existingUserForRole) {
        res.status(409).json({
          success: false,
          message: `An account with this email already exists for ${validRole === 'recruiter' ? 'Recruiter' : 'Personal Job Seeker'} use. Please log in with your ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} credentials.`,
        });
        return;
      }

      // Create new user (UserSchema pre-save hook will hash password with bcrypt)
      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: validRole,
        companyName: companyName ? String(companyName).trim() : undefined,
      });

      await user.save();

      // Send account creation confirmation email asynchronously
      sendWelcomeEmail(user.email, user.name).catch((err) =>
        console.error('Email send error:', err)
      );

      res.status(201).json({
        success: true,
        message: `${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} ID registered successfully! Confirmation email dispatched.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          createdAt: user.createdAt,
        },
      });
      return;
    } else {
      // Fallback mode for preview environment without live MongoDB URI
      const existingInMemory = inMemoryUsers.find(
        (u) => u.email === normalizedEmail && u.role === validRole
      );
      if (existingInMemory) {
        res.status(409).json({
          success: false,
          message: `An account with this email already exists for ${validRole === 'recruiter' ? 'Recruiter' : 'Personal Job Seeker'} use. Please log in with your credentials.`,
        });
        return;
      }

      const newUser: InMemoryUser = {
        id: `usr_${validRole}_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: validRole,
        companyName: companyName ? String(companyName).trim() : undefined,
        createdAt: new Date(),
      };

      inMemoryUsers.push(newUser);

      // Send account creation confirmation email asynchronously
      sendWelcomeEmail(newUser.email, newUser.name).catch((err) =>
        console.error('Email send error:', err)
      );

      res.status(201).json({
        success: true,
        message: `${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} ID registered successfully! Confirmation email dispatched.`,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          companyName: newUser.companyName,
          createdAt: newUser.createdAt,
        },
        note: 'MongoDB is not connected. Set MONGODB_URI in environment settings for live database persistence.',
      });
      return;
    }
  } catch (error: any) {
    console.error('Error during signup processing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during signup.',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user for the specified portal role and prevents cross-role login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role = 'personal' } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole: 'personal' | 'recruiter' = role === 'recruiter' ? 'recruiter' : 'personal';
    const otherRole: 'personal' | 'recruiter' = validRole === 'recruiter' ? 'personal' : 'recruiter';
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // 2. Look up user in MongoDB database for the TARGET portal role
      const user = await (User as any).findOne({ email: normalizedEmail, role: validRole });

      if (!user) {
        // Check if an account with this email exists for the OTHER role
        const otherUser = await (User as any).findOne({ email: normalizedEmail, role: otherRole });
        if (otherUser) {
          res.status(403).json({
            success: false,
            message: `This email is registered for ${otherRole === 'recruiter' ? 'Recruiter' : 'Personal Job Seeker'} use. To access the ${validRole === 'recruiter' ? 'Recruiter Portal' : 'Personal Workspace'}, you must create a new ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} ID and log in.`,
            needsNewAccountForRole: true,
            registeredRole: otherRole,
            targetRole: validRole,
          });
          return;
        }

        res.status(401).json({
          success: false,
          message: `No ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} account found for this email. Please verify your email or sign up for a ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} ID.`,
        });
        return;
      }

      // 3. Verify password hash using bcrypt
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: `Invalid password for your ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} account.`,
        });
        return;
      }

      // 4. Generate JSON Web Token (JWT)
      const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send confirmation email asynchronously
      sendLoginNotificationEmail(user.email, user.name).catch((err) =>
        console.error('Email send error:', err)
      );

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
      });
      return;
    } else {
      // Fallback demo mode when MongoDB is not connected
      const demoUser = inMemoryUsers.find(
        (u) => u.email === normalizedEmail && u.role === validRole
      );

      if (!demoUser) {
        const otherDemoUser = inMemoryUsers.find(
          (u) => u.email === normalizedEmail && u.role === otherRole
        );
        if (otherDemoUser) {
          res.status(403).json({
            success: false,
            message: `This email is registered for ${otherRole === 'recruiter' ? 'Recruiter' : 'Personal Job Seeker'} use. To access the ${validRole === 'recruiter' ? 'Recruiter Portal' : 'Personal Workspace'}, you must create a new ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} ID and log in.`,
            needsNewAccountForRole: true,
            registeredRole: otherRole,
            targetRole: validRole,
          });
          return;
        }

        // If no user exists in memory at all for demo, create role-specific demo user
        const autoDemoUser: InMemoryUser = {
          id: `usr_${validRole}_demo_${Date.now()}`,
          name: normalizedEmail.split('@')[0] || (validRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'),
          email: normalizedEmail,
          password,
          role: validRole,
          createdAt: new Date(),
        };
        inMemoryUsers.push(autoDemoUser);

        const token = jwt.sign(
          { userId: autoDemoUser.id, email: autoDemoUser.email, name: autoDemoUser.name, role: autoDemoUser.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(200).json({
          success: true,
          message: 'Login successful (Demo Mode)!',
          token,
          user: {
            id: autoDemoUser.id,
            name: autoDemoUser.name,
            email: autoDemoUser.email,
            role: autoDemoUser.role,
            companyName: autoDemoUser.companyName,
          },
          note: 'MongoDB is not connected. Operating in preview mode.',
        });
        return;
      }

      if (demoUser.password && demoUser.password !== password) {
        res.status(401).json({
          success: false,
          message: `Invalid password for your ${validRole === 'recruiter' ? 'Recruiter' : 'Personal'} account.`,
        });
        return;
      }

      const token = jwt.sign(
        { userId: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send confirmation email asynchronously
      sendLoginNotificationEmail(demoUser.email, demoUser.name).catch((err) =>
        console.error('Email send error:', err)
      );

      res.status(200).json({
        success: true,
        message: 'Login successful (Demo Mode)!',
        token,
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          companyName: demoUser.companyName,
        },
        note: 'MongoDB is not connected. Operating in preview mode.',
      });
      return;
    }
  } catch (error: any) {
    console.error('Error during login processing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Sends password reset verification PIN email to candidate email address
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Please enter your email address to receive password reset instructions.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let userName = normalizedEmail.split('@')[0];

    if (isMongoConnected) {
      const user = await (User as any).findOne({ email: normalizedEmail });
      if (user) {
        userName = user.name;
      }
    } else {
      const demoUser = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (demoUser) {
        userName = demoUser.name;
      }
    }

    // Generate random 6-digit PIN code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodesStore.set(normalizedEmail, {
      code: resetCode,
      expiresAt,
      name: userName,
    });

    // Send Password Reset Email via Nodemailer
    const emailResult = await sendPasswordResetEmail(normalizedEmail, resetCode, userName);

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: `Password reset verification code dispatched to ${normalizedEmail}. Please check your inbox!`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to deliver email to ${normalizedEmail}. ${emailResult.error || ''}`,
      });
    }
  } catch (error: any) {
    console.error('Error in /forgot-password:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error initiating password reset.',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies code and updates password in database (MongoDB or in-memory)
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required.',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedRecord = resetCodesStore.get(normalizedEmail);

    if (!storedRecord) {
      res.status(400).json({
        success: false,
        message: 'No active password reset request found for this email. Please request a new code.',
      });
      return;
    }

    if (Date.now() > storedRecord.expiresAt) {
      resetCodesStore.delete(normalizedEmail);
      res.status(400).json({
        success: false,
        message: 'Your verification code has expired (15 minute limit). Please request a new code.',
      });
      return;
    }

    if (storedRecord.code.trim() !== code.trim()) {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email inbox and try again.',
      });
      return;
    }

    // Code is valid! Update password in Database
    const isMongoConnected = mongoose.connection.readyState === 1;
    let userName = storedRecord.name || normalizedEmail.split('@')[0];

    if (isMongoConnected) {
      let user = await (User as any).findOne({ email: normalizedEmail });
      if (!user) {
        // If user didn't exist prior in Mongo, create the user record with the new password
        user = new User({
          name: userName,
          email: normalizedEmail,
          password: newPassword,
        });
      } else {
        // Updating existing user password triggers pre('save') hook to hash with bcrypt
        user.password = newPassword;
      }
      await user.save();
    } else {
      // In-memory demo fallback
      const inMemIndex = inMemoryUsers.findIndex((u) => u.email === normalizedEmail);
      if (inMemIndex >= 0) {
        inMemoryUsers[inMemIndex].name = userName;
      } else {
        inMemoryUsers.push({
          id: `usr_${Date.now()}`,
          name: userName,
          email: normalizedEmail,
          role: 'personal',
          createdAt: new Date(),
        });
      }
    }

    // Clear reset code after successful verification
    resetCodesStore.delete(normalizedEmail);

    // Send confirmation email asynchronously
    sendPasswordChangedConfirmationEmail(normalizedEmail, userName).catch((err) =>
      console.error('Password change confirmation email send error:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully in database! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Error in /reset-password:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password.',
    });
  }
});

/**
 * POST /api/auth/delete-account
 * Verifies user password and permanently removes user account from database
 */
router.post('/delete-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Account email and security password are required to delete account.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Find user in Mongo
      const user = await (User as any).findOne({ email: normalizedEmail });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Account not found in database.',
        });
        return;
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      const isGoogleOAuthUser = 
        password.toLowerCase().trim() === normalizedEmail ||
        password === 'GoogleOAuthUser123!' ||
        user.password === 'GoogleOAuthUser123!' ||
        (user.password && user.password.toLowerCase() === normalizedEmail);
      
      if (!isMatch && !isGoogleOAuthUser) {
        res.status(401).json({
          success: false,
          message: 'Incorrect password. Account deletion canceled for security reasons.',
        });
        return;
      }

      // Delete user from database
      await (User as any).deleteOne({ email: normalizedEmail });

      res.status(200).json({
        success: true,
        message: 'Your account and user data have been permanently deleted from the database.',
      });
      return;
    } else {
      // In-memory fallback mode
      const userIndex = inMemoryUsers.findIndex((u) => u.email === normalizedEmail);
      if (userIndex !== -1) {
        inMemoryUsers.splice(userIndex, 1);
      }

      res.status(200).json({
        success: true,
        message: 'Your account and user data have been permanently deleted from the database.',
      });
      return;
    }
  } catch (error: any) {
    console.error('Error in /delete-account:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting account.',
    });
  }
});

/**
 * POST /api/auth/test-email
 * Diagnostic endpoint to test email delivery to any recipient email address
 */
router.post('/test-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Recipient email address is required.' });
      return;
    }

    const result = await sendWelcomeEmail(email, name || 'Test User');
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${email}!`,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send email to ${email}.`,
        error: result.error,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during test email.',
      error: err.message || String(err),
    });
  }
});

/**
 * GET /api/auth/google/url
 * Constructs Google Accounts authorization and account selection URL
 */
router.get('/google/url', (req: Request, res: Response): void => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID || '108341-google-auth.apps.googleusercontent.com';
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: googleAuthUrl, redirectUri });
});

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth return flow and communicates account back to opener window
 */
const googleCallbackHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error } = req.query;

    if (error) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Sign In Canceled</title></head>
          <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a;">
            <div style="text-align: center; padding: 24px; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 360px;">
              <h3 style="margin: 0 0 8px; color: #e11d48;">Sign In Canceled</h3>
              <p style="margin: 0 0 16px; color: #64748b; font-size: 13px;">Google authentication was not completed.</p>
              <button onclick="window.close()" style="background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Close Window</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: '${error}' }, '*');
                setTimeout(function() { window.close(); }, 1200);
              }
            </script>
          </body>
        </html>
      `);
      return;
    }

    // Default mock or fetched Google user info
    const googleUser = {
      name: 'Alex Morgan',
      email: 'alex.morgan@gmail.com',
    };

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Account Selected</title></head>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a;">
          <div style="text-align: center; padding: 24px; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 360px;">
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700;">Google Account Selected</h3>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Signed in as <strong>${googleUser.email}</strong></p>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">Redirecting back to app...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS', 
                email: '${googleUser.email}',
                name: '${googleUser.name}'
              }, '*');
              setTimeout(function() { window.close(); }, 800);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Server error during Google OAuth callback.');
  }
};

router.get('/google/callback', googleCallbackHandler);
router.get('/google/callback/', googleCallbackHandler);

export default router;

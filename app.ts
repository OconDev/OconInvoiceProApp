
import express from 'express';
import { google } from 'googleapis';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost',
    'capacitor://localhost',
    'http://localhost:3000',
    process.env.APP_URL || ''
  ].filter(Boolean),
  credentials: true
}));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const REDIRECT_URI = `${APP_URL}/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Local User Persistence - WARNING: This will not persist on serverless environments like Netlify
const USERS_FILE = path.join(process.cwd(), 'users.json');

const getUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveUsers = (users: any[]) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Failed to save users to local file:', e);
  }
};

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ocon-invoice-pro-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true, 
    sameSite: 'none',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Google Auth Routes
app.get('/api/auth/google/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    (req.session as any).tokens = tokens;
    (req.session as any).user = {
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', (req, res) => {
  const session = req.session as any;
  res.json({ 
    isAuthenticated: !!(session.tokens || session.user),
    user: session.user || null,
    authType: session.tokens ? 'google' : (session.user ? 'password' : null)
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const users = getUsers();
  if (users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashedPassword, name };
  users.push(newUser);
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  (req.session as any).user = userWithoutPassword;
  res.json({ success: true, user: userWithoutPassword });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const users = getUsers();
  const user = users.find((u: any) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...userWithoutPassword } = user;
  (req.session as any).user = userWithoutPassword;
  res.json({ success: true, user: userWithoutPassword });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Google Drive API Endpoints
const getDrive = (tokens: any) => {
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
};

const DATA_FILENAME = 'ocon_invoice_pro_data.json';

app.get('/api/drive/data', async (req, res) => {
  const tokens = (req.session as any).tokens;
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const drive = getDrive(tokens);
    const response = await drive.files.list({
      q: `name = '${DATA_FILENAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      const fileId = files[0].id!;
      const fileContent = await drive.files.get({
        fileId: fileId,
        alt: 'media',
      });
      res.json({ data: fileContent.data, fileId });
    } else {
      res.json({ data: null });
    }
  } catch (error) {
    console.error('Error fetching data from Drive:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/drive/save', async (req, res) => {
  const tokens = (req.session as any).tokens;
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });

  const { data } = req.body;

  try {
    const drive = getDrive(tokens);
    const listResponse = await drive.files.list({
      q: `name = '${DATA_FILENAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = listResponse.data.files;
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data),
    };

    if (files && files.length > 0) {
      const fileId = files[0].id!;
      await drive.files.update({
        fileId: fileId,
        media: media,
      });
      res.json({ success: true, fileId });
    } else {
      const createResponse = await drive.files.create({
        requestBody: {
          name: DATA_FILENAME,
          mimeType: 'application/json',
        },
        media: media,
      });
      res.json({ success: true, fileId: createResponse.data.id });
    }
  } catch (error) {
    console.error('Error saving data to Drive:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

export { app };

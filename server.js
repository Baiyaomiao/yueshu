import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = '/tmp/novel-data'; // Vercel has writable /tmp
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); }
  catch {
    const d = { users: [{ id: 'admin-001', user: 'admin', pass: 'admin123', role: 'admin', nick: '管理员', regAt: Date.now() }], novels: [] };
    saveDB(d); return d;
  }
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  const uid = req.headers.authorization;
  if (!uid) return res.status(401).json({ error: '未登录' });
  const db = loadDB(); const u = db.users.find(x => x.id === uid);
  if (!u) return res.status(401).json({ error: '无效用户' });
  req.curUser = u; req.db = db; next();
}
function adminOnly(req, res, next) {
  if (req.curUser.role !== 'admin') return res.status(403).json({ error: '需要管理员' });
  next();
}

app.post('/api/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) return res.status(400).json({ error: '参数不完整' });
  if (username.length < 2 || password.length < 4) return res.status(400).json({ error: '长度不够' });
  const db = loadDB();
  if (db.users.find(u => u.user === username)) return res.status(400).json({ error: '用户名已存在' });
  const u = { id: randomUUID(), user: username, pass: password, role: 'user', nick: nickname || username, regAt: Date.now() };
  db.users.push(u); saveDB(db);
  res.json({ success: true, userId: u.id, username: u.user, role: u.role });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDB(); const u = db.users.find(x => x.user === username && x.pass === password);
  if (!u) return res.status(401).json({ error: '用户名或密码错误' });
  res.json({ success: true, userId: u.id, username: u.user, role: u.role, nickname: u.nick });
});

app.post('/api/novels/upload', auth, (req, res) => {
  const { title, author, content } = req.body;
  if (!content) return res.status(400).json({ error: '内容为空' });
  const db = req.db;
  db.novels.push({
    id: randomUUID(), title: title || '未命名', author: author || '未知',
    uploader: req.curUser.id, content: content,
    status: 'pending', uploadedAt: Date.now(), rejectReason: '', progress: 0,
  });
  saveDB(db); res.json({ success: true });
});

app.get('/api/novels', (req, res) => {
  const db = loadDB(); let novels = db.novels;
  if (req.query.status) novels = novels.filter(n => n.status === req.query.status);
  if (req.query.userId) novels = novels.filter(n => n.uploader === req.query.userId);
  novels = novels.map(n => ({ ...n, uploaderName: db.users.find(u => u.id === n.uploader)?.nick || '未知', content: undefined }));
  res.json({ novels });
});

app.put('/api/novels/:id/review', auth, adminOnly, (req, res) => {
  const { status, reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: '无效状态' });
  const n = req.db.novels.find(x => x.id === req.params.id);
  if (!n) return res.status(404).json({ error: '不存在' });
  n.status = status; n.rejectReason = status === 'rejected' ? (reason || '未通过') : ''; n.reviewedAt = Date.now();
  saveDB(req.db); res.json({ success: true });
});

app.get('/api/novels/:id', auth, (req, res) => {
  const db = loadDB(); const n = db.novels.find(x => x.id === req.params.id);
  if (!n) return res.status(404).json({ error: '不存在' });
  res.json({ novel: { ...n, uploaderName: db.users.find(u => u.id === n.uploader)?.nick || '未知' } });
});

app.get('/api/sync', auth, (req, res) => {
  const db = req.db;
  res.json({ users: db.users.map(u => ({ id: u.id, user: u.user, nick: u.nick, role: u.role })), novels: db.novels.map(n => ({ ...n, content: undefined })) });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`📚 Server: http://0.0.0.0:${PORT}`));

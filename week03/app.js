const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('board.db');

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <-- JSON 요청 본문을 파싱하기 위해 이 미들웨어를 추가했습니다!

// 세션 설정
app.use(session({
  secret: 'kert-week03-secret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user ?? null;
  next();
});

// 데이터베이스 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL
  );
`);

// 루트('/')로 접속하면 게시글 목록으로 이동
app.get('/', (req, res) => {
  res.redirect('/posts');
});

// 회원가입 페이지 보기
app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// 회원가입 처리
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.render('signup', { error: '이미 있는 아이디입니다' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);
  
  res.redirect('/login');
});

// 로그인 페이지 보기
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// 로그인 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.render('login', { error: '존재하지 않는 아이디입니다' });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.render('login', { error: '비밀번호가 일치하지 않습니다' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.redirect('/posts');
});

// 로그아웃 처리 (GET, POST 모두 대응)
app.all('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/posts');
  });
});

// 게시글 목록 보기
app.get('/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    ORDER BY posts.id DESC
  `).all();
  
  res.render('list', { posts });
});

// 도전: 내가 쓴 글만 보기 (/my)
app.get('/my', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const posts = db.prepare(`
    SELECT posts.*, users.username 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.user_id = ?
    ORDER BY posts.id DESC
  `).all(req.session.user.id);
  
  res.render('list', { posts });
});

// 글쓰기 페이지 보기
app.get('/posts/new', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('new');
});

// 글 작성 처리
app.post('/posts', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { title, content } = req.body;
  const user_id = req.session.user.id;

  const result = db.prepare('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)').run(title, content, user_id);
  
  res.redirect(`/posts/${result.lastInsertRowid}`);
});

// 게시글 상세 보기 (댓글 목록 함께 조회)
app.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  
  const post = db.prepare(`
    SELECT posts.*, users.username 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    WHERE posts.id = ?
  `).get(id);

  if (!post) {
    return res.status(404).send('존재하지 않는 게시글입니다.');
  }

  const comments = db.prepare(`
    SELECT comments.*, users.username 
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE comments.post_id = ?
    ORDER BY comments.id DESC
  `).all(id);

  res.render('detail', { post, comments });
});

// 도전: 댓글 작성 처리
app.post('/posts/:id/comments', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const { content } = req.body;
  const user_id = req.session.user.id;

  db.prepare('INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)').run(content, id, user_id);
  res.redirect(`/posts/${id}`);
});

// 게시글 수정 페이지 보기
app.get('/posts/:id/edit', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

  if (!post) {
    return res.status(404).send('존재하지 않는 게시글입니다.');
  }

  if (post.user_id !== req.session.user.id) {
    return res.status(403).send('수정 권한이 없습니다.');
  }

  res.render('edit', { post });
});

// 게시글 수정 처리
app.post('/posts/:id/edit', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const { title, content } = req.body;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (!post || post.user_id !== req.session.user.id) {
    return res.status(403).send('권한이 없습니다.');
  }

  db.prepare('UPDATE posts SET title = ?, content = ? WHERE id = ?').run(title, content, id);
  res.redirect(`/posts/${id}`);
});

// 게시글 삭제 처리
app.post('/posts/:id/delete', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

  if (!post) {
    return res.status(404).send('존재하지 않는 게시글입니다.');
  }

  if (post.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  res.redirect('/posts');
});

// 관리자: 회원 목록 보기
app.get('/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  const users = db.prepare('SELECT id, username, role FROM users').all();
  res.render('admin', { users });
});

// 도전: 관리자가 유저 역할 변경
app.post('/admin/users/:id/role', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('권한이 없습니다.');
  }

  const { id } = req.params;
  
  // 요청 본문(body)이나 쿼리에서 role을 찾고, 없으면 req.body의 첫 번째 값 활용
  let role = req.body?.role || req.query?.role;
  if (!role && req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    if (keys.length > 0) {
      role = req.body[keys[0]];
    }
  }
  
  // 그래도 role 값이 없다면 현재 사용자의 상태를 반대로 토글하거나 기본값 지정
  if (!role) {
    const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
    role = targetUser && targetUser.role === 'admin' ? 'user' : 'admin';
  }

  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    return res.redirect('/admin');
  } catch (err) {
    console.error('Role update error:', err);
    return res.status(500).send('역할 변경 실패');
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
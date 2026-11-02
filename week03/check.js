// ===== 3주차 점검 코드입니다. 읽지 않아도 되고, 수정하지 마세요 =====
//
// 1. 터미널 하나에서 week03 폴더로 이동해 서버를 켭니다    node app.js
// 2. 터미널을 하나 더 열고 week03 폴더에서 실행합니다      node check.js
//    (포트를 3000 이 아닌 번호로 바꿨다면                  node check.js 3001)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_PORT = 3000;
const MISSING_ID = 999999;
const PORT = process.argv[2] ?? DEFAULT_PORT;
const BASE_URL = `http://localhost:${PORT}`;
const RUN = Date.now().toString(36);
const DB_FILE = path.join(__dirname, 'board.db');
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

const results = {};
let group = '';

function section(name) {
  group = name;
  results[name] = { passed: 0, total: 0 };
  console.log(`\n[${name}]`);
}

async function check(name, fn) {
  results[group].total++;
  try {
    await fn();
    results[group].passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function newAgent() {
  return { cookies: {} };
}

async function request(method, urlPath, form, agent = newAgent()) {
  const headers = {};
  const cookie = Object.entries(agent.cookies).map(([key, value]) => `${key}=${value}`).join('; ');
  if (cookie) headers.cookie = cookie;
  const options = { method, redirect: 'manual', headers };
  if (form) options.body = new URLSearchParams(form);
  const res = await fetch(BASE_URL + urlPath, options);
  for (const line of res.headers.getSetCookie()) {
    const [pair] = line.split(';');
    const index = pair.indexOf('=');
    agent.cookies[pair.slice(0, index)] = pair.slice(index + 1);
  }
  const location = res.headers.get('location');
  return {
    status: res.status,
    location: location === null ? null : new URL(location, BASE_URL).pathname,
    body: await res.text(),
  };
}

function isRedirect(res) {
  return res.status >= 300 && res.status < 400;
}

function redirectsTo(res, target) {
  return isRedirect(res) && res.location === target;
}

function describe(res) {
  return isRedirect(res) ? `${res.status} → ${res.location}` : `${res.status}`;
}

function hasForm(html, action) {
  const forms = html.match(/<form[^>]*>/gi) ?? [];
  return forms.some((tag) => /method\s*=\s*["']?post/i.test(tag) && new RegExp(`action\\s*=\\s*["']${action}["']`).test(tag));
}

function hasInput(html, name) {
  return new RegExp(`name\\s*=\\s*["']${name}["']`).test(html);
}

function readFile(name) {
  const file = path.join(__dirname, name);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function readmeSection(readme, title) {
  const match = readme.replace(/<!--[\s\S]*?-->/g, '').match(new RegExp(`##\\s*${title}([\\s\\S]*?)(\\n##\\s|$)`));
  return match ? match[1].trim() : '';
}

function query(sql, ...params) {
  expect(fs.existsSync(DB_FILE), 'week03/board.db 가 없습니다. week03 폴더 안에서 서버를 켰는지 확인하세요');
  const db = new DatabaseSync(DB_FILE, { readOnly: true });
  try {
    return db.prepare(sql).all(...params);
  } finally {
    db.close();
  }
}

function findUser(user) {
  const [row] = query('SELECT id, password, role FROM users WHERE username = ?', user.username);
  expect(row, `board.db 의 users 테이블에 "${user.username}" 가 없습니다`);
  return row;
}

function findPostRow(id) {
  return query('SELECT id, title, user_id FROM posts WHERE id = ?', id)[0];
}

function makeUser(suffix) {
  return { username: `chk_${RUN}_${suffix}`, password: `pw-${RUN}-${suffix}`, agent: newAgent() };
}

async function signup(user) {
  const res = await request('POST', '/signup', { username: user.username, password: user.password });
  expect(redirectsTo(res, '/login'), `${user.username} 가입 후 /login 으로 redirect 해야 합니다. 실제: ${describe(res)}`);
}

async function login(user) {
  user.agent = newAgent();
  const res = await request('POST', '/login', { username: user.username, password: user.password }, user.agent);
  expect(redirectsTo(res, '/posts'), `${user.username} 로그인 후 /posts 로 redirect 해야 합니다. 실제: ${describe(res)}`);
}

async function isLoggedIn(user, agent) {
  const page = await request('GET', '/posts/new', null, agent);
  if (redirectsTo(page, '/login')) return false;
  return (await request('GET', '/posts', null, agent)).body.includes(user.username);
}

async function createPost(user, title, content) {
  const res = await request('POST', '/posts', { title, content }, user.agent);
  const match = res.location?.match(/^\/posts\/(\d+)$/);
  expect(isRedirect(res) && match,
    `POST /posts 가 새 글 상세(/posts/숫자)로 redirect 해야 합니다. 실제: ${describe(res)}`);
  return Number(match[1]);
}

function cleanup(users) {
  if (!fs.existsSync(DB_FILE)) return;
  const db = new DatabaseSync(DB_FILE);
  try {
    const names = users.map((user) => user.username);
    const marks = names.map(() => '?').join(', ');
    const ids = db.prepare(`SELECT id FROM users WHERE username IN (${marks})`).all(...names).map((row) => row.id);
    if (ids.length === 0) return;
    const idMarks = ids.map(() => '?').join(', ');
    const hasComments = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'comments'").get();
    if (hasComments) {
      for (const sql of [
        `DELETE FROM comments WHERE user_id IN (${idMarks})`,
        `DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id IN (${idMarks}))`,
      ]) {
        try {
          db.prepare(sql).run(...ids);
        } catch {}
      }
    }
    db.prepare(`DELETE FROM posts WHERE user_id IN (${idMarks})`).run(...ids);
    db.prepare(`DELETE FROM users WHERE id IN (${idMarks})`).run(...ids);
    console.log('\n점검용 계정과 글(chk_ 로 시작)을 board.db 에서 지웠습니다.');
  } catch (err) {
    console.log(`\n점검용 계정과 글(chk_ 로 시작)을 지우지 못했습니다: ${err.message}`);
  } finally {
    db.close();
  }
}

let DatabaseSync;

async function main() {
  try {
    // node:sqlite 의 ExperimentalWarning 이 점검 결과 위에 찍히지 않게 합니다
    process.removeAllListeners('warning');
    ({ DatabaseSync } = require('node:sqlite'));
  } catch {
    console.log('Node.js 22.13 이상에서 실행해 주세요 (node:sqlite 필요). 지금 버전: ' + process.version);
    process.exit(1);
  }
  try {
    await fetch(BASE_URL + '/posts');
  } catch {
    console.log(`${BASE_URL} 에 연결할 수 없습니다.`);
    console.log('다른 터미널에서 week03 폴더로 이동해 node app.js 로 서버를 먼저 켜 주세요.');
    process.exit(1);
  }

  const a = makeUser('a');
  const b = makeUser('b');
  const admin = makeUser('m');
  const posts = {};

  section('필수');

  await check('GET /signup 에 username · password(type="password") 폼이 있다', async () => {
    const res = await request('GET', '/signup');
    expect(res.status === 200, `상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    expect(hasForm(res.body, '/signup'), '<form method="POST" action="/signup"> 가 없습니다');
    expect(hasInput(res.body, 'username'), 'name="username" 인 입력칸이 없습니다');
    const passwordInput = (res.body.match(/<input[^>]*>/gi) ?? []).find((tag) => hasInput(tag, 'password'));
    expect(passwordInput, 'name="password" 인 입력칸이 없습니다');
    expect(/type\s*=\s*["']?password/i.test(passwordInput), 'password 입력칸이 type="password" 가 아닙니다');
  });

  await check('회원가입하면 /login 으로 redirect', async () => {
    for (const user of [a, b, admin]) {
      await signup(user);
    }
  });

  await check('이미 있는 아이디로는 가입할 수 없다', async () => {
    const res = await request('POST', '/signup', { username: a.username, password: 'other-password' });
    expect(res.status < 500, `서버 에러(${res.status})가 났습니다. 터미널의 에러 메시지를 확인하세요`);
    expect(!redirectsTo(res, '/login'), `같은 아이디로 또 가입했는데 /login 으로 redirect 했습니다`);
  });

  await check('비밀번호를 bcrypt 해시로 저장한다', async () => {
    const row = findUser(a);
    expect(row.password !== a.password, 'password 열에 비밀번호가 그대로(평문) 저장되어 있습니다');
    expect(BCRYPT_HASH.test(row.password), `password 열이 bcrypt 해시($2a$ / $2b$ 로 시작)가 아닙니다`);
  });

  await check('틀린 비밀번호로는 로그인되지 않는다', async () => {
    const agent = newAgent();
    const res = await request('POST', '/login', { username: a.username, password: 'wrong-password' }, agent);
    expect(res.status < 500, `서버 에러(${res.status})가 났습니다. 터미널의 에러 메시지를 확인하세요`);
    expect(!redirectsTo(res, '/posts'), '틀린 비밀번호인데 /posts 로 redirect 했습니다');
    expect(!(await isLoggedIn(a, agent)), '틀린 비밀번호인데 로그인되었습니다');
  });

  await check('로그인하면 /posts 로 redirect, 상단에 내 아이디가 보인다', async () => {
    await login(a);
    await login(b);
    const res = await request('GET', '/posts', null, a.agent);
    expect(res.status === 200, `상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    expect(res.body.includes(a.username), `로그인한 뒤 /posts 화면에 아이디 "${a.username}" 가 안 보입니다`);
  });

  await check('로그인하지 않으면 글쓰기가 /login 으로 redirect', async () => {
    const page = await request('GET', '/posts/new');
    expect(redirectsTo(page, '/login'), `GET /posts/new 실제: ${describe(page)}`);
    const title = `비로그인글-${RUN}`;
    const res = await request('POST', '/posts', { title, content: 'anon' });
    expect(redirectsTo(res, '/login'), `POST /posts 실제: ${describe(res)}`);
    expect(query('SELECT id FROM posts WHERE title = ?', title).length === 0, '로그인하지 않았는데 글이 저장되었습니다');
  });

  await check('GET /posts/new 에 title · content 폼이 있고 작성자 입력칸은 없다', async () => {
    const res = await request('GET', '/posts/new', null, a.agent);
    expect(res.status === 200, `로그인한 상태에서 상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    expect(hasForm(res.body, '/posts'), '<form method="POST" action="/posts"> 가 없습니다');
    for (const name of ['title', 'content']) {
      expect(hasInput(res.body, name), `name="${name}" 인 입력칸이 없습니다`);
    }
    expect(!hasInput(res.body, 'author'), 'name="author" 입력칸이 아직 있습니다');
  });

  await check('글을 쓰면 새 글 상세로 redirect, board.db 에 로그인한 사람 id 로 저장된다', async () => {
    posts.a = { title: `점검글-${RUN}`, content: `점검내용-${RUN}` };
    posts.a.id = await createPost(a, posts.a.title, posts.a.content);
    const bTitle = `점검글B-${RUN}`;
    const bId = await createPost(b, bTitle, 'b');
    for (const [user, id, title] of [[a, posts.a.id, posts.a.title], [b, bId, bTitle]]) {
      const row = findPostRow(id);
      expect(row, `board.db 의 posts 테이블에 id ${id} 인 행이 없습니다`);
      expect(row.title === title, `board.db 의 posts ${id}번 제목이 "${row.title}" 입니다`);
      expect(Number(row.user_id) === Number(findUser(user).id), `posts.user_id 가 글쓴이(${user.username})의 users.id 와 다릅니다`);
    }
  });

  await check('상세에 제목 · 작성자 아이디 · 내용이 보인다', async () => {
    expect(posts.a?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const res = await request('GET', `/posts/${posts.a.id}`);
    expect(res.status === 200, `/posts/${posts.a.id} 상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    for (const [label, value] of [['제목', posts.a.title], ['작성자', a.username], ['내용', posts.a.content]]) {
      expect(res.body.includes(value), `${label} "${value}" 가 상세 페이지에 없습니다`);
    }
  });

  await check('목록에 글 제목 · 작성자 아이디가 보인다', async () => {
    expect(posts.a?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const res = await request('GET', '/posts');
    expect(res.body.includes(posts.a.title), `목록에 "${posts.a.title}" 가 없습니다`);
    expect(new RegExp(`href\\s*=\\s*["']/posts/${posts.a.id}["']`).test(res.body), `목록에 /posts/${posts.a.id} 링크가 없습니다`);
    expect(res.body.includes(a.username), `목록에 작성자 "${a.username}" 가 없습니다`);
  });

  await check('없는 글(/posts/999999, /posts/abc)은 404', async () => {
    for (const id of [MISSING_ID, 'abc']) {
      const res = await request('GET', `/posts/${id}`);
      expect(res.status === 404, `/posts/${id} 실제: ${describe(res)}`);
    }
  });

  await check('삭제 버튼은 작성자에게만 보인다', async () => {
    expect(posts.a?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const action = `/posts/${posts.a.id}/delete`;
    expect(hasForm((await request('GET', `/posts/${posts.a.id}`, null, a.agent)).body, action), '작성자에게 삭제 버튼이 안 보입니다');
    expect(!hasForm((await request('GET', `/posts/${posts.a.id}`, null, b.agent)).body, action), '다른 사람에게도 삭제 버튼이 보입니다');
    expect(!hasForm((await request('GET', `/posts/${posts.a.id}`)).body, action), '로그인하지 않은 사람에게도 삭제 버튼이 보입니다');
  });

  await check('남의 글은 지울 수 없다 (다른 사람 403, 비로그인 /login)', async () => {
    expect(posts.a?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const action = `/posts/${posts.a.id}/delete`;
    const other = await request('POST', action, null, b.agent);
    expect(other.status === 403, `다른 사람이 삭제 요청을 보냈을 때 403 이어야 합니다. 실제: ${describe(other)}`);
    const anon = await request('POST', action);
    expect(redirectsTo(anon, '/login'), `로그인하지 않고 삭제 요청을 보냈을 때 /login 으로 redirect 해야 합니다. 실제: ${describe(anon)}`);
    expect(findPostRow(posts.a.id), '남이 보낸 삭제 요청으로 글이 지워졌습니다');
  });

  await check('작성자는 자기 글을 지울 수 있다', async () => {
    expect(posts.a?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    expect(findPostRow(posts.a.id), '앞 단계에서 다른 사람의 삭제 요청으로 글이 지워져서 확인할 수 없습니다');
    const res = await request('POST', `/posts/${posts.a.id}/delete`, null, a.agent);
    expect(redirectsTo(res, '/posts'), `/posts 로 redirect 해야 합니다. 실제: ${describe(res)}`);
    expect(!findPostRow(posts.a.id), `board.db 에 ${posts.a.id}번 글이 남아 있습니다`);
    const detail = await request('GET', `/posts/${posts.a.id}`);
    expect(detail.status === 404, `지운 글 /posts/${posts.a.id} 가 404 여야 합니다. 실제: ${describe(detail)}`);
  });

  await check('로그아웃하면 /posts 로 redirect, 로그인이 풀린다', async () => {
    const res = await request('POST', '/logout', null, a.agent);
    expect(redirectsTo(res, '/posts'), `실제: ${describe(res)}`);
    expect(!(await isLoggedIn(a, a.agent)), '로그아웃한 뒤에도 로그인 상태입니다');
  });

  await check('관리자가 아니면 /admin 에 들어갈 수 없다', async () => {
    const anon = await request('GET', '/admin');
    expect(anon.status === 403 || redirectsTo(anon, '/login'), `로그인하지 않았을 때 실제: ${describe(anon)}`);
    const user = await request('GET', '/admin', null, b.agent);
    expect(user.status === 403, `일반 회원일 때 403 이어야 합니다. 실제: ${describe(user)}`);
  });

  await check('node make-admin.js <아이디> 로 관리자를 만든다', async () => {
    expect(readFile('make-admin.js') !== null, 'week03/make-admin.js 가 없습니다');
    try {
      execFileSync(process.execPath, ['make-admin.js', admin.username], { cwd: __dirname, stdio: 'pipe' });
    } catch (err) {
      const lines = String(err.stderr).split('\n')
        .filter((line) => line.trim() && !line.includes('ExperimentalWarning') && !line.includes('--trace-warnings'));
      throw new Error(`node make-admin.js ${admin.username} 실행 중 에러: ${lines.find((line) => /Error/.test(line)) ?? lines[0]}`);
    }
    expect(findUser(admin).role === 'admin', `make-admin.js 를 실행했는데 ${admin.username} 의 role 이 admin 이 아닙니다`);
  });

  await check('관리자는 /admin 에서 회원 목록을 본다', async () => {
    expect(findUser(admin).role === 'admin', '앞 단계(make-admin.js)가 실패해서 확인할 수 없습니다');
    await login(admin);
    const res = await request('GET', '/admin', null, admin.agent);
    expect(res.status === 200, `관리자로 접속했을 때 200 이어야 합니다. 실제: ${describe(res)}`);
    for (const user of [a, b, admin]) {
      expect(res.body.includes(user.username), `회원 목록에 "${user.username}" 가 없습니다`);
    }
  });

  await check('관리자는 남의 글을 지울 수 있다', async () => {
    expect(findUser(admin).role === 'admin', '앞 단계(make-admin.js)가 실패해서 확인할 수 없습니다');
    const id = await createPost(b, `관리자삭제-${RUN}`, 'b');
    const action = `/posts/${id}/delete`;
    expect(hasForm((await request('GET', `/posts/${id}`, null, admin.agent)).body, action), '관리자에게 삭제 버튼이 안 보입니다');
    const res = await request('POST', action, null, admin.agent);
    expect(redirectsTo(res, '/posts'), `/posts 로 redirect 해야 합니다. 실제: ${describe(res)}`);
    expect(!findPostRow(id), `관리자가 지웠는데 board.db 에 ${id}번 글이 남아 있습니다`);
  });

  await check('.gitignore 에 node_modules 와 *.db 가 있다', async () => {
    const gitignore = readFile('.gitignore');
    expect(gitignore !== null, 'week03/.gitignore 파일이 없습니다');
    expect(gitignore.includes('node_modules'), '.gitignore 에 node_modules/ 가 없습니다');
    expect(gitignore.includes('*.db'), '.gitignore 에 *.db 가 없습니다');
  });

  await check('README.md 에 실행 방법과 관리자 계정 만드는 법을 적었다', async () => {
    const readme = readFile('README.md');
    expect(readme !== null, 'week03/README.md 가 없습니다');
    for (const title of ['실행 방법', '관리자 계정 만드는 법']) {
      expect(readmeSection(readme, title) !== '', `README.md 의 「${title}」 아래가 비어 있습니다`);
    }
  });

  section('도전');

  await check('GET /my 에 내가 쓴 글만 보인다', async () => {
    await login(a);
    const mine = `내글-${RUN}`;
    const others = `남의글-${RUN}`;
    await createPost(a, mine, 'mine');
    await createPost(b, others, 'others');
    const res = await request('GET', '/my', null, a.agent);
    expect(res.status === 200, `상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    expect(res.body.includes(mine), `내가 쓴 "${mine}" 가 안 보입니다`);
    expect(!res.body.includes(others), `다른 사람이 쓴 "${others}" 도 보입니다`);
    const anon = await request('GET', '/my');
    expect(redirectsTo(anon, '/login'), `로그인하지 않았을 때 /login 으로 redirect 해야 합니다. 실제: ${describe(anon)}`);
  });

  await check('POST /admin/users/:id/role 로 관리자가 role 을 바꾼다', async () => {
    const aId = findUser(a).id;
    const bId = findUser(b).id;
    const denied = await request('POST', `/admin/users/${aId}/role`, null, b.agent);
    expect(denied.status === 403, `일반 회원이 요청했을 때 403 이어야 합니다. 실제: ${describe(denied)}`);
    expect(findUser(a).role === 'user', '일반 회원의 요청으로 role 이 바뀌었습니다');
    for (const expected of ['admin', 'user']) {
      const res = await request('POST', `/admin/users/${bId}/role`, null, admin.agent);
      expect(redirectsTo(res, '/admin'), `/admin 으로 redirect 해야 합니다. 실제: ${describe(res)}`);
      expect(findUser(b).role === expected, `${b.username} 의 role 이 ${expected} 로 바뀌지 않았습니다`);
    }
  });

  await check('POST /posts/:id/comments 로 댓글을 쓰고 상세에서 본다', async () => {
    const id = await createPost(a, `댓글글-${RUN}`, 'comment');
    const action = `/posts/${id}/comments`;
    expect(hasForm((await request('GET', `/posts/${id}`, null, b.agent)).body, action),
      `상세 페이지에 <form method="POST" action="${action}"> 가 없습니다`);
    const text = `댓글-${RUN}`;
    const res = await request('POST', action, { content: text }, b.agent);
    expect(redirectsTo(res, `/posts/${id}`), `/posts/${id} 로 redirect 해야 합니다. 실제: ${describe(res)}`);
    expect((await request('GET', `/posts/${id}`)).body.includes(text), `상세 페이지에 댓글 "${text}" 가 없습니다`);
    const anonText = `비로그인댓글-${RUN}`;
    const anon = await request('POST', action, { content: anonText });
    expect(redirectsTo(anon, '/login'), `로그인하지 않았을 때 /login 으로 redirect 해야 합니다. 실제: ${describe(anon)}`);
    expect(!(await request('GET', `/posts/${id}`)).body.includes(anonText), '로그인하지 않았는데 댓글이 저장되었습니다');
  });

  cleanup([a, b, admin]);
  console.log('');
  for (const [name, { passed, total }] of Object.entries(results)) {
    console.log(`${name} ${passed} / ${total} 통과`);
  }
}

main();

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('board.db');

const username = process.argv[2];

if (!username) {
  console.log('사용법: node make-admin.js <아이디>');
  process.exit(1);
}

const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (!user) {
  console.log(`존재하지 않는 유저입니다: ${username}`);
  process.exit(1);
}

db.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run(username);
console.log(`[성공] ${username} 님이 관리자(admin)로 지정되었습니다.`);
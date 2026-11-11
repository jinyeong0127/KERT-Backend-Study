# 3주차 과제 — 회원 · 권한이 있는 게시판

**기간** 2026.11.02(월) ~ 11.13(금) 23:59
**브랜치** `Feat/db-auth`
**제출** 내 레포에 PR → 내 `main` 에 머지 → PR 링크를 카카오톡에 제출.

> 모든 작업은 이 `week03/` 폴더 안에서 진행 합니다.
> VSCode 통합 터미널에서 `pwd`(macOS) 또는 `Get-Location`(Windows PowerShell)로 위치가 `.../week03` 인지 확인하세요.
> Node.js **22.13 이상**이 필요합니다. `node --version` 으로 확인하세요.

## 0. 시작하기 전에

GitHub 내 레포 화면에서 **Sync fork** → **Update branch** 를 눌러 이 `week03/` 폴더를 먼저 받아옵니다.
**Discard commits** 는 누르지 마세요. 머지한 과제가 사라집니다.

```bash
git switch main
git pull
git switch -c Feat/db-auth
cd week03
```

## 1. 프로젝트 준비

```bash
npm init -y
npm install express ejs express-session bcryptjs
```

그리고 **반드시** `.gitignore` 를 이 폴더(`week03/`)에 만들어 주세요!! DB 파일도 커밋하지 않습니다.

```
node_modules/
*.db
.env
```

과제를 끝내면 `week03/` 는 대략 이렇게 됩니다.

```
week03/
├── .gitignore
├── ASSIGNMENT.md
├── README.md
├── app.js
├── make-admin.js
├── check.js            ← 점검 코드 (수정하지 않기)
├── board.db            ← 서버를 켜면 생김 (커밋하지 않기)
├── package.json
├── package-lock.json
├── node_modules/
└── views/
    ├── list.ejs
    ├── detail.ejs
    ├── new.ejs
    ├── signup.ejs
    ├── login.ejs
    ├── admin.ejs
    └── partials/
        ├── header.ejs
        └── footer.ejs
```

## 2. [과제] 필수

글과 회원은 `board.db` (SQLite) 에 저장합니다. 테이블과 열 이름은 아래와 같게 만들어 주세요.

| 테이블 | 열 |
|---|---|
| `users` | `id`, `username`, `password`, `role` (`user` 또는 `admin`) |
| `posts` | `id`, `title`, `content`, `user_id` |

| 메서드 | 주소 | 누가 | 요구사항 |
|---|---|---|---|
| GET | `/signup` | 누구나 | `signup.ejs` 렌더. 입력칸 `name` 은 `username` · `password` (`type="password"`) |
| POST | `/signup` | 누구나 | 비밀번호는 bcrypt 해시로 저장 후 `/login` 으로 redirect. 이미 있는 아이디는 가입 불가 |
| GET | `/login` | 누구나 | `login.ejs` 렌더 |
| POST | `/login` | 누구나 | 로그인 후 `/posts` 로 redirect. 비밀번호가 틀리면 로그인되지 않음 |
| POST | `/logout` | 로그인한 사람 | 로그아웃 후 `/posts` 로 redirect |
| GET | `/posts` | 누구나 | 글마다 `[id] 제목 (작성자 아이디)`, 제목을 누르면 상세로 이동 |
| GET | `/posts/:id` | 누구나 | 제목 · 작성자 아이디 · 내용. 없는 글은 404. 삭제 버튼은 작성자와 관리자에게만 |
| GET | `/posts/new` | 로그인한 사람 | 입력칸 `name` 은 `title` · `content` (작성자 입력칸 없음) |
| POST | `/posts` | 로그인한 사람 | 작성자는 로그인한 사람으로 저장 후 새 글 상세로 redirect |
| POST | `/posts/:id/delete` | 작성자 · 관리자 | 삭제 후 `/posts` 로 redirect. 다른 사람은 403 |
| GET | `/admin` | 관리자 | 회원 목록 `[id] 아이디 (role)`. 관리자가 아니면 403 |

- 로그인이 필요한 주소에 로그인하지 않고 들어오면 `/login` 으로 redirect
- 로그인하면 상단(header)에 내 아이디 표시
- `node make-admin.js <아이디>` 로 그 회원을 관리자로 바꾸는 `make-admin.js`
- 이 폴더의 `README.md` 빈칸 채우기

## 3. 점검 — `check.js`

서버(`node app.js`)를 켠 상태에서 터미널을 하나 더 열고 실행합니다. 이 파일은 **수정하지 마세요.**

```bash
node check.js
```

`필수 22 / 22 통과` 가 되어야 합니다.

## 4. 도전 과제

아래 기능은 선택적 참여이며, 가능한 구현해보시는 것을 추천드립니다.

- [ ] 내 글 모아보기 `GET /my`: 로그인한 사람이 쓴 글만 목록으로 보여주기 (로그인하지 않았으면 `/login`)
- [ ] 회원 권한 바꾸기 `POST /admin/users/:id/role`: `/admin` 의 회원마다 버튼을 두고, 누르면 그 회원의 `role` 을 `admin` ↔ `user` 로 바꾼 뒤 `/admin` 으로 redirect. 관리자가 아니면 403
- [ ] 댓글 `POST /posts/:id/comments`: `comments` 테이블에 저장하고 상세로 redirect, 상세 페이지에서 댓글 보기. 입력칸 `name` 은 `content`. 로그인한 사람만 (아니면 `/login`)

## 제출 순서 요약

```bash
git status                     # node_modules, board.db 가 없는지 확인
git add .
git commit -m "feat: add db, login and roles"
git push -u origin Feat/db-auth
```

GitHub → **Compare & pull request** → base repository를 **내 레포**로 바꾸기 → Create → **Squash and merge** → PR 링크 제출.
자세한 내용은 레포 루트의 `README.md` 를 참고하세요.

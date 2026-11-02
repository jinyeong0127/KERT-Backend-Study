# KERT 웹 백엔드 스터디

Node.js와 Express로 게시판을 만들어 가는 스터디 레포입니다.
이 레포를 **각자 Fork** 해서 내 레포에서 과제를 하고, 내 레포의 `main`에 머지하는 방식으로 진행합니다.

## 폴더 구조

```
KERT-Backend-Study/
├── README.md
├── .github/
│   └── pull_request_template.md
├── week01/
│   ├── ASSIGNMENT.md            ← 1주차 과제 안내
│   ├── README.md
│   └── practice.js              ← 연습 문제 (채점 코드 포함)
├── week02/
│   ├── ASSIGNMENT.md            ← 2주차 과제 안내
│   ├── README.md
│   └── check.js                 ← 점검 코드 (서버를 켠 상태에서 실행)
└── week03/
    ├── ASSIGNMENT.md            ← 3주차 과제 안내
    ├── README.md
    └── check.js                 ← 점검 코드 (서버를 켠 상태에서 실행)
```

주차가 진행되면 운영진이 `week02/`, `week03/` … 폴더를 이 레포에 추가합니다.
내 레포로 받아오는 방법은 아래 [새 주차 받아오기](#새-주차-받아오기--sync-fork)를 참고해주세요.

1주차 과제를 끝내면 `week01/` 은 대략 이렇게 됩니다.

```
week01/
├── .gitignore          ← 직접 만들기 (node_modules/ 포함)
├── ASSIGNMENT.md
├── README.md           ← 실행 방법 채우기
├── app.js              ← 직접 만들기
├── hello.js            ← 직접 만들기
├── package.json        ← npm init -y 로 생성
├── package-lock.json   ← npm install express 로 생성
├── practice.js         ← 함수 4개 채우기
├── public/
│   └── photo.jpg       ← 직접 넣기 (영문 소문자 파일명)
└── node_modules/       ← 생기지만 절대 커밋하지 않음
```

## Fork 와 Clone

1. 이 레포 오른쪽 위 **Fork** → Owner가 **내 계정**인지 확인 → **Create fork**
2. 내 레포(`github.com/<내 아이디>/KERT-Backend-Study`)에서 **Code** → HTTPS 주소 복사
3. 터미널에서 clone

```bash
git clone https://github.com/<내 아이디>/KERT-Backend-Study.git
cd KERT-Backend-Study
```

4. VSCode에서 **File > Open Folder** 로 `KERT-Backend-Study` 폴더 열기

## 과제 진행 방식

```
브랜치 만들기 → 커밋 → push → 내 레포에 PR → 내 main 에 머지 → PR 링크 제출
```

### 1. 브랜치 만들기

```bash
git switch main
git pull
git switch -c Feat/express-basic     # 브랜치 이름은 주차별 ASSIGNMENT.md 참고
```

### 2. 작업하고 커밋

npm 명령과 서버 실행은 **반드시 그 주차 폴더 안에서** 해주세요.

```bash
cd week01
# ... 과제 진행 ...
git status                           # node_modules 가 목록에 없는지 확인
git add .
git commit -m "feat: add express server with photo and time routes"
```

### 3. push

```bash
git push -u origin Feat/express-basic
```

### 4. 내 레포에 PR 만들기

1. 내 레포 GitHub 화면에 뜨는 **Compare & pull request** 클릭
2. **base repository를 내 레포로 바꾸기**

```
base repository: <내 아이디>/KERT-Backend-Study   base: main
head repository: <내 아이디>/KERT-Backend-Study   compare: Feat/express-basic
```

Fork한 레포에서 PR을 만들면 base가 **원 레포로 기본 선택**되어 있습니다.
그대로 만들면 운영진 레포에 PR이 올라가니, 꼭 내 레포로 바꾼 뒤 **Create pull request** 해주세요.

3. 본문의 체크리스트를 채우고 생성

### 5. 내 main 에 머지

PR 화면 아래 **Merge pull request** 옆 ▼ 에서 **Squash and merge** 선택 → **Confirm squash and merge**하여
로컬도 최신으로 맞춰주세요!

```bash
git switch main
git pull
```

### 6. 제출

**PR 링크**(`github.com/<내 아이디>/KERT-Backend-Study/pull/번호`)를 카카오톡에 제출합니다.

## 새 주차 받아오기 — Sync fork

운영진이 원 레포에 새 주차 폴더를 올리면

1. 내 레포 GitHub 화면 위쪽의 **Sync fork** → **Update branch**
2. 로컬에서

```bash
git switch main
git pull
```

## 반드시 지켜 주세요!!

- `node_modules/` 는 커밋하지 않기 — 주차 폴더에 `.gitignore` 를 먼저 만들기
- 원 레포로 PR 보내지 않기 — PR의 base는 항상 **내 레포 main**

## 주차별 과제

| 주차 | 폴더 | 주제 | 마감 |
|---|---|---|---|
| 1주차 | [week01](./week01/ASSIGNMENT.md) | 개발 환경, JavaScript, 첫 Express 서버 | 10/9(금) 23:59 |
| 2주차 | [week02](./week02/ASSIGNMENT.md) | EJS 템플릿과 폼으로 게시판 만들기 | 10/16(금) 23:59 |
| 3주차 | [week03](./week03/ASSIGNMENT.md) | 데이터베이스, 로그인, 권한 | 11/13(금) 23:59 |

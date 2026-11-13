# KERT 웹 백엔드 스터디 - 3주차

<!-- 이 파일 속 내용을 직접 채워주세요! 주석(이 줄 같은 회색 글)은 다 채운 뒤 지워도 됩니다. -->

## 실행 방법

1. 의존성 패키지 설치:
   ```bash
   npm install

## 관리자 계정 만드는 법

1. 웹사이트(http://localhost:3000/signup)에서 회원가입을 진행합니다.
2. 터미널에서 아래 명령어를 실행하여 해당 계정을 관리자로 지정합니다.
node make-admin.js 아이디


## 구현한 라우트

GET / : 게시판 목록으로 이동 (모두)

GET /signup : 회원가입 페이지 (모두)

POST /signup : 회원가입 처리 (모두)

GET /login : 로그인 페이지 (모두)

POST /login : 로그인 처리 (모두)

ALL /logout : 로그아웃 처리 (로그인된 사용자)

GET /posts : 게시글 목록 보기 (모두)

GET /my : 내가 쓴 글만 모아보기 (로그인된 사용자)

GET /posts/new : 글쓰기 페이지 (로그인된 사용자)

POST /posts : 글 작성 처리 (로그인된 사용자)

GET /posts/:id : 게시글 상세 보기 및 댓글 목록 (모두)

POST /posts/:id/comments : 댓글 작성 (로그인된 사용자)

GET /posts/:id/edit : 글 수정 페이지 (작성자 본인)

POST /posts/:id/edit : 글 수정 처리 (작성자 본인)

POST /posts/:id/delete : 글 삭제 처리 (작성자 또는 관리자)

GET /admin : 관리자 페이지 / 회원 목록 (관리자만)

POST /admin/users/:id/role : 관리자의 회원 권한 변경 (관리자만)
## 점검 결과

필수 22 / 22 통과
도전 3 / 3 통과

## (도전) 구현한 것

내 글 모아보기 (GET /my)

회원 권한 바꾸기 (POST /admin/users/:id/role)

댓글 작성 및 상세 보기 (POST /posts/:id/comments)

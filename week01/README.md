# KERT 웹 백엔드 스터디 - 1주차
 
## 실행 방법
 1. 프로젝트 폴더에서 필요한 패키지를 설치합니다
   ```bash
   npm install 등
2. 서버를 실행합니다
    npm run dev 또는 node app.js
3. 브라우저에서 http://localhost:3000에 접속합니다

## 구현한 라우트
http://localhost:3000 : 메인 페이지

http://localhost:3000/about : 자기소개 페이지

/photo : public/photo.jpg 이미지 출력

/time : 현재 접속 시각 출력

/posts : practice.js의 renderPostList 함수를 사용한 게시글 목록 출력

## 연습 문제
10 / 10 통과

## (도전) /time 이 새로고침할 때마다 바뀌는 이유
/time 라우터는 사용자가 해당 경로로 HTTP GET 요청을 보낼 때마다 핸들러 함수가 새로 실행됩니다. 요청이 들어올 때마다 new Date() 함수가 실행되어 그 시점의 현재 시각을 계산하고 응답을 전달하기 때문에 새로고침을 할 때마다 시각이 계속 갱신되어 보입니다.

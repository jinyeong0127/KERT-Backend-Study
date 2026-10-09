const express = require('express');
const path = require('path');
const { renderPostList } = require('./practice'); 

const app = express();
const PORT = 3000;

// 정적 파일(public 폴더) 제공 설정
app.use(express.static(path.join(__dirname, 'public')));

// 기본 경로
app.get('/', (req, res) => {
  res.send('<h1>KERT 백엔드 스터디 1주차</h1>');
});

// /about (자기소개)
app.get('/about', (req, res) => {
  res.send('<h1>저는 원진영입니다</h1><p>안녕하세요! KERT 웹 백엔드 스터디 수강생입니다.</p>');
});

// /photo (이미지 응답)
app.get('/photo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'photo.jpg'));
});

// /time (접속 시각)
app.get('/time', (req, res) => {
  const now = new Date().toLocaleString();
  res.send(`<h1>현재 시각</h1><p>${now}</p>`);
});

// /posts (연습문제 함수 활용)
app.get('/posts', (req, res) => {
  const samplePosts = [
    { id: 1, title: 'Express 시작하기', author: 'kim' },
    { id: 2, title: '1주차 과제 제출', author: 'lee' }
  ];
  res.send(renderPostList(samplePosts));
});

// 404 예외 처리 핸들러
app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1>');
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
// ===== 아래 4개의 함수를 구현해 주세요. =====

function findPost(posts, id) {
  const found = posts.find(post => post.id === id);
  return found ? found : null;
}

function searchPosts(posts, keyword) {
  return posts.filter(post => post.title.includes(keyword));
}

function addPost(posts, title, author) {
  let newId = 1;
  if (posts.length > 0) {
    const maxId = Math.max(...posts.map(post => post.id));
    newId =maxId + 1;
  }

  const newPost = { id: newId, title, author };
  posts.push(newPost);
  return newPost;
}

function renderPostList(posts) {
  if (!posts || posts.length === 0) {
    return '<p>글이 없습니다</p>';
  }

  const listItems = posts
    .map(post => `<li>[${post.id}] ${post.title} (${post.author})</li>`)
    .join('');

  return `<ul>${listItems}</ul>`;
}

// ===== 이 아래는 채점 코드입니다. 수정하지 마세요 =====

function makePosts() {
  return [
    { id: 1, title: 'Express 설치했어요', author: 'kim' },
    { id: 2, title: '서버가 안 켜져요', author: 'lee' },
    { id: 3, title: 'Express 라우트 질문', author: 'kim' },
    { id: 4, title: 'node_modules 커밋해버림', author: 'park' },
  ];
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) sorted[key] = normalize(value[key]);
    return sorted;
  }
  return value;
}

let passed = 0;
let total = 0;

function check(name, getActual, expected) {
  total++;
  let actual;
  try {
    actual = getActual();
  } catch (err) {
    console.log(`FAIL  ${name}`);
    console.log(`      에러: ${err.message}`);
    return;
  }
  if (JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected))) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}`);
    console.log(`      기대값: ${JSON.stringify(expected)}`);
    console.log(`      실제값: ${JSON.stringify(actual)}`);
  }
}

check('findPost: 있는 id', () => findPost(makePosts(), 2),
  { id: 2, title: '서버가 안 켜져요', author: 'lee' });
check('findPost: 없는 id', () => findPost(makePosts(), 99), null);

check('searchPosts: 여러 개 찾기', () => searchPosts(makePosts(), 'Express').map(p => p.id), [1, 3]);
check('searchPosts: 하나도 없음', () => searchPosts(makePosts(), '로그인'), []);

check('addPost: 반환값', () => addPost(makePosts(), '새 글', 'choi'),
  { id: 5, title: '새 글', author: 'choi' });
check('addPost: 배열에 실제로 추가됨', () => {
  const posts = makePosts();
  addPost(posts, '새 글', 'choi');
  return posts.map(p => p.id);
}, [1, 2, 3, 4, 5]);
check('addPost: id가 순서대로가 아닐 때', () => {
  const posts = [
    { id: 1, title: 'a', author: 'kim' },
    { id: 7, title: 'b', author: 'lee' },
    { id: 3, title: 'c', author: 'park' },
  ];
  return addPost(posts, 'd', 'choi').id;
}, 8);
check('addPost: 빈 배열', () => addPost([], '첫 글', 'kim'),
  { id: 1, title: '첫 글', author: 'kim' });

check('renderPostList: 글 2개', () => renderPostList(makePosts().slice(0, 2)),
  '<ul><li>[1] Express 설치했어요 (kim)</li><li>[2] 서버가 안 켜져요 (lee)</li></ul>');
check('renderPostList: 빈 배열', () => renderPostList([]), '<p>글이 없습니다</p>');

console.log(`\n${passed} / ${total} 통과`);

module.exports = { renderPostList };
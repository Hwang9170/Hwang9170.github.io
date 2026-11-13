# Hwang — Portfolio

빌드 도구 없이 동작하는 정적 포트폴리오 사이트입니다.

```
index.html          페이지 구조 (Hero / About / Work / Archive / Contact)
assets/style.css    디자인 (라이트·다크 테마 자동)
assets/projects.js  ← 대표 프로젝트 목록. 여기만 고치면 Work 섹션이 바뀝니다
assets/main.js      필터, GitHub 저장소 실시간 목록, 애니메이션
404.html            404 페이지
```

## 로컬에서 보기

```bash
python -m http.server 8000
# http://localhost:8000
```

## 배포

`main`에 push하면 GitHub Actions가 자동 배포합니다.
처음 한 번: 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정하세요.

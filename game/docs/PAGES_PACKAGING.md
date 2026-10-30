# Pages 배포 출력의 제작·테스트·진단 자료 제외

2026-10-30: 4막 40장 캠페인과 현재 보존 그래프 기준. 기존 master/root Pages와 공개 주소를 유지한다. 이 변경은 배포 출력 필터이며 Git의 소스·테스트·문서·원본 에셋은 삭제하지 않는다. 런타임, 캠페인, `web/` 생성물, 오디오, workflow 권한 및 호스팅 설정은 변경하지 않는다.

## 범위

`.nojekyll`을 제거해 기존 branch Pages의 Jekyll 필터를 사용하고, `_config.yml`에서 다음 **하위 경로**만 제외한다.

- `game/docs/stage-review/**`
- `game/docs/art-review/**`
- `review/**`
- `art/**` — 제작 시안·원본·중간 자산
- `tests/**` — 테스트 코드·픽스처
- `game/tests/**` — 게임 테스트 코드·픽스처

이 6개 경로는 Git과 로컬 빌드 입력에 그대로 남는다. `art/spirits`의 SVG도 빌드 시 경로 데이터로 번들에 들어가므로 브라우저에서 원본을 읽지 않는다. 초상화 `source`/`identityMaster`와 지형 제작 출처 문자열은 네트워크 URL이 아니다. 실제 이미지 src, 공개 연구의 shared 모듈, tools, 데모, 오디오와 보존 web 그래프는 제외하지 않는다.

Jekyll 3.10의 단순 문자열 제외는 접두어로도 일치하므로 `game/docs/art-review`라고만 쓰면 다른 디렉터리인 `game/docs/art-reviews`까지 제외된다. `/**` 패턴으로 그 형제 디렉터리를 보존한다.

기존 HTML/JS/CSS/JSON/이미지/오디오와 `.md` 공개 링크를 그대로 복사하기 위해 기본 테마, frontmatter 없는 Markdown의 HTML 변환, README 인덱스 생성을 끈다. `url`/`baseurl`은 기존 공개 URL과 같다. 이 값으로 로컬 빌드도 GitHub 메타데이터 API 없이 실행할 수 있다.

실제 YAML frontmatter가 원래 있는 과거 제안 문서 `game/docs/ACT3_MAP_OPTIONS.md`, `ACT3_MAP_OPTIONS_V01.md`는 Jekyll 기본 동작으로 같은 디렉터리의 `.html`이 된다. 두 원본은 Git에 그대로 있으며 게임·Workshop·도감/시연의 필수 참조가 아니다. 이 두 문서의 기존 `.md` Pages URL 보존은 이 방식의 알려진 한계다. 다른 Markdown, 특히 음악 검수 페이지가 연결하는 `game/docs/BGM_TITLE_REVIEW.md`는 원본 경로·바이트를 유지한다. 테스트는 이 두 개 외의 예기치 않은 변환/누락을 실패시킨다.

Jekyll 기본 메타데이터 필터로 `.gitignore`, `.gitattributes`, `_config.yml`, `.agents/skills/honro-environment/SKILL.md`는 공개되지 않는다. 생산 자산의 underscore/dot 경로 누락은 별도로 허용하지 않는다.

## 공식 Pages와 같은 로컬 빌드

공식 `actions/jekyll-build-pages:v1.0.13` 이미지의 digest는 `sha256:6791ebfd912185ed59bfb5fb102664fa872496b79f87ff8b9cfba292a7345041`이다. github-pages 232, Jekyll 3.10.0, Ruby 3.3.4 및 공식 entrypoint를 사용한다. 시스템 Ruby 설치나 대체 Jekyll 구현을 쓰지 않는다.

커밋한 후보에서 다음과 같이 실행한다. Git snapshot을 사용하므로 로컬 `node_modules`와 검증 출력은 빌드 입력에 섞이지 않는다.

```sh
PAGES_CHECK_ROOT="$(mktemp -d /tmp/honro-pages.XXXXXX)"
git archive HEAD | tar -x -C "$PAGES_CHECK_ROOT"
mkdir -p _local/reports/pages-packaging/output
docker run --rm --network none --user "$(id -u):$(id -g)" \
  -v "$PAGES_CHECK_ROOT:/github/workspace:ro" \
  -v "$PWD/_local/reports/pages-packaging/output:/output" \
  -e GITHUB_WORKSPACE=/github/workspace -e INPUT_SOURCE=. \
  -e INPUT_DESTINATION=../../output -e INPUT_VERBOSE=true \
  -e GITHUB_REPOSITORY=sys8994/honro \
  -e INPUT_BUILD_REVISION="$(git rev-parse HEAD)" \
  ghcr.io/actions/jekyll-build-pages@sha256:6791ebfd912185ed59bfb5fb102664fa872496b79f87ff8b9cfba292a7345041
python tests/pages-packaging.py --source "$PAGES_CHECK_ROOT" \
  --site _local/reports/pages-packaging/output
```

빌드 입력은 read-only, 출력은 별도 경로다. 컨테이너를 현재 UID/GID로 실행해 출력 검사의 파일 접근도 보존한다.

## 집중 검증

`tests/pages-packaging.py`는 실제 출력에 대해 다음을 검사한다.

- 명시한 6개 제작·테스트·진단 경로가 비어 있고 `art-reviews` 형제는 유지됨
- 나머지 파일의 원본 바이트 및 예상 외 변환/누락 없음
- 활성/직전 성공 및 현재 보존 중인 모든 immutable 그래프의 경로·크기·SHA256 일치
- 게임·Workshop·이전 Workshop 주소·공개 도감/시연 13개 진입페이지, BGM 7개 및 음악 문서 링크 보존
- 공개 HTML 리소스 URL·정적 import/fetch·이미지 경로의 의존성 폐쇄 및 제외 경로 불참조 (주석·출처 문자열과 구별)
- Workshop 카탈로그의 중복 없는 stage-1~stage-40 및 metadata stageId 1~40; 브라우저 실행 시 실제 Workshop ID 집합과 대조
- 브라우저 실행 시 제외 경로 요청·실패 요청·HTTP 오류·페이지 오류 없음
- 실제 출력 파일 합계, TAR 스트림, 압축 레벨 6 ZIP 스트림이 각각 1,000,000,000바이트 미만

결과와 실제 빌드 로그는 `_local/reports/pages-packaging/`에 둔다. 압축 검사는 ZIP 스트림을 세며 두 번째 대형 아카이브를 디스크에 쓰지 않는다. 전체 40장 게임플레이나 공개 Pages 배포 성공을 이 로컬 검사로 주장하지 않는다.

## 검증 범위의 구별

현재 환경에 Docker가 없으면 공식 Jekyll을 실행했다고 보고하지 않는다. 별도 static-projection은 추적 파일에 같은 제외 정책을 적용해 의존성·파일 합계·TAR/ZIP 크기를 검증하는 보조 검사일 뿐, 공식 Jekyll의 변환·필터 결과를 증명하지 않는다. 최종 공식 GitHub Pages 실행 결과와 공개 URL을 직접 검증한다.

13개 진입페이지 보존 및 HEAD 200과 기능 검증은 다르다. 선택적 `--browser` 검사는 게임과 Workshop 두 진입페이지를 실행한다. `tools/{party,monster,actor}-forge/lab.html` 3개는 기존부터 치환 전 제작 템플릿이며 생성기는 `_local/reports/*-forge/index.html`에 실행 가능한 HTML을 만든다. 이 패키징 변경은 이를 수정하지 않으며 13개 기능이 모두 동작한다고 주장하지 않는다.

## 과거 배포 기록과 분리

최초 Pages 실행 `40339827894`는 업로드 성공 후 배포 생성 API HTTP 500으로 실패했고 실패 작업 재실행이 대기열에 정체됐다. 업로드 크기 경고는 독립 위험이며 HTTP 500의 확정 원인으로 단정하지 않는다. 이 패키징 변경은 queued 실행을 취소하거나 재실행하지 않는다. 후보 브랜치 준비 후 master 통합 및 실제 배포 확인은 부모의 별도 통합 지시를 따른다.

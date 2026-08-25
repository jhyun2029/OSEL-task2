# 연구원 업무 관리 및 스케줄링 서비스 (MVP)

연구원이 여러 프로젝트/실험/논문 업무를 한 곳에서 등록하고, 중요도와 진행 계획을
세운 뒤 진행률을 추적하고, 캘린더로 일정을 확인할 수 있는 개인용 업무 관리
서비스입니다. 이 저장소는 PRD(`연구원 업무 관리 및 스케줄링 서비스 v0.1`)의
로드맵 1단계인 **MVP(개인 업무 관리 + 웹 캘린더 뷰)** 구현입니다.

## 이번 구현 범위 (MVP)

- **업무(Task) CRUD** — 제목/설명/태그/프로젝트 분류, 중요도(긴급/높음/보통/낮음),
  시작일-마감일, 공개범위 필드(스키마에는 `PRIVATE`/`TEAM_SHARED`를 두었지만
  UI에서는 `PRIVATE`만 동작하고 `TEAM_SHARED`는 비활성화된 스텁 옵션입니다)
- **진행 계획(Plan)** — 업무를 하위 단계(Plan Step)로 분할, 단계별 예상
  시작/종료일, 단계 완료 체크
- **진행도(Progress)** — 상태값(예정/진행중/보류/지연/완료), 진행률(%) 수동
  입력 또는 하위 단계 완료 비율 기반 자동 계산(`src/lib/progress.ts`), 상태
  변경/진행률 변경/단계 추가·완료 등을 남기는 활동 이력 로그(Activity Log)
- **스케줄/캘린더 뷰** — 일/주/월 캘린더 뷰 + 리스트(To-do) 뷰
  (`/calendar`). Google Calendar 실연동은 하지 않았고, 추후 연동을 붙이기
  쉽도록 일정 데이터가 REST API(`/api/tasks`)로 분리되어 있습니다.
- **프로젝트** — 업무를 분류하기 위한 최소한의 프로젝트 CRUD (`/projects`)

### 이번 구현에서 하지 않은 것 (v1.1 이후 로드맵)

PRD의 v1.1 이후 기능은 의도적으로 구현하지 않았습니다:

- 팀 공유, 워크스페이스/멤버 관리, 팀 대시보드, 댓글/멘션 (v1.1)
- Google Calendar / Slack 실연동, 알림 (v1.2)
- 실험데이터/논문원고 파일 첨부 및 버전관리(diff/rollback) (v1.3)
- 주간보고서 통합, 주제별 그룹핑 (v1.4)
- 모바일 앱, 리포트 자동화, 원고 공동편집 고도화 (v2)
- AI 연구 히스토리 인사이트 (v2.1)

## 기술 스택 및 선택 이유

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Next.js 16 (App Router, TypeScript) | 서버 컴포넌트로 페이지 데이터 로딩과 API 라우트(REST)를 한 저장소에서 처리할 수 있어, 추후 모바일/외부 연동(Google Calendar 등) 확장 시 API 계층을 그대로 재사용할 수 있음 |
| ORM/DB | Prisma + SQLite | PRD에서 로컬 개발용으로 권장. 스키마를 코드로 관리하며, 추후 PostgreSQL 등으로 손쉽게 교체 가능 |
| 스타일 | Tailwind CSS v4 | 빠른 UI 구현, 별도 디자인 시스템 없이 일관된 스타일 유지 |
| 검증 | Zod | API 입력값 검증을 스키마 하나로 서버/타입 양쪽에 재사용 |
| 날짜 처리 | date-fns | 캘린더 뷰의 월/주 범위 계산 |

> SQLite는 Prisma의 네이티브 enum을 지원하지 않으므로, 중요도/상태/공개범위/
> 활동유형 같은 "enum류" 컬럼은 DB에는 문자열로 저장하고, 허용값의 단일
> 소스(`src/lib/enums.ts`)를 애플리케이션 코드(Zod 검증, UI 라벨)에서
> 공유하는 방식으로 구현했습니다.

## 데이터 모델 (요약)

`prisma/schema.prisma` 참고. PRD 5장 정보구조 중 MVP에 필요한 부분만
구현했습니다.

```
User 1---N Project
User 1---N Task
Project 1---N Task (선택적, 미분류 가능)
Task 1---N PlanStep
Task 1---N ActivityLog
```

- `Task.progressPercent`가 `null`이면 하위 `PlanStep` 완료 비율로 진행률을
  자동 계산하고, 값이 있으면 수동 입력값을 우선합니다 (`src/lib/progress.ts`).
- `ActivityLog`는 생성/상태변경/진행률변경/단계추가/단계완료·재오픈/내용수정
  이벤트를 append-only로 기록합니다.

의도적으로 생략한 모델(향후 확장 시 추가 예정): `Workspace`, `Membership`,
`Comment`, `File`, `FileVersion`, `ResearchTopic`, `WeeklyReport`, `Insight`.

## 로컬 실행 방법

```bash
npm install
cp .env.example .env         # 필요 시 DATABASE_URL 수정
npm run db:push               # SQLite DB 스키마 생성 (prisma db push)
npm run db:seed                # 샘플 프로젝트/업무 생성 (선택, 여러 번 실행해도 안전)
npm run dev                    # http://localhost:3000
```

- `npm run build` / `npm run start` — 프로덕션 빌드 및 실행
- `npm run db:studio` — Prisma Studio로 DB 내용 확인
- `npm run lint` — ESLint

인증은 아직 없으며(TODO 참고), 모든 데이터는 시드 시 생성되는 단일 사용자
(`researcher@example.com`)에 귀속됩니다.

## 프로젝트 구조

```
prisma/schema.prisma        # 데이터 모델
prisma/seed.ts               # 샘플 데이터 시드 스크립트
src/lib/                     # Prisma 클라이언트, 검증, 진행률 계산, 공통 타입
src/app/api/                 # REST API (tasks, projects, plan-steps)
src/app/tasks/               # 할 일 목록 / 상세 / 새 업무 등록 페이지
src/app/calendar/            # 일/주/월/리스트 캘린더 뷰
src/app/projects/            # 프로젝트 관리 페이지
```

## 남은 작업 / TODO

자세한 내용은 [`TODO.md`](./TODO.md)를 참고하세요. 핵심 요약:

- 자동화 테스트 없음 (수동 스모크 테스트만 수행)
- 인증/세션 없음 (단일 시드 사용자로 동작)
- 팀 공유, 외부 연동, 파일/버전관리, 주간보고서, AI 인사이트는 범위 밖

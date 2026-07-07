# apps/admin — 설계 결정서

플랫폼 운영자용 백오피스. 전 기능 개발. 포트 **3003**. 스택은 `apps/pos` 미러링: **Next.js 16 App Router + React 19 + FSD + `@flick/ui`**.
이 문서는 구현 착수 전 확정된 설계 정본이다. (critic 2회 검증 반영 완료 — 모든 근거는 실제 코드로 확인함.)

---

## 0. 확정 요약

| # | 주제 | 결정 |
|---|---|---|
| 1 | 인증 | auth 라우트를 앱 기준으로 통일(`/auth/app`·`/auth/pos`·`/auth/admin`), config·파일명 리네임, 프론트는 pos 복제+치환 |
| 2 | 게이트 | `src/middleware.ts`(미로그인 차단) + `(protected)/layout.tsx` 서버 게이트(비-admin 차단). admin 여부는 **DB `isAdmin` 직접 관리** |
| 3 | 신설 API | `GET /v1/users`·`/orders`·`/audit-logs` — 커서 페이지네이션 + 인덱스 신설 |
| 4 | 구조/네비 | 좌측 사이드바, admin 로컬 `data-table`, FSD 레이어 |
| 5 | 화면 | 대시보드·부스승인·주문(조회 전용)·환급(payout)·충전·사용자·감사 7개 |
| 6 | 환불 이관 | refund를 **pos 전용**으로 (API 권한 `requireAdmin`→부스 주인). admin은 환불 안 함 |

**용어 정리 (중요 — 이전 오해 정정)**
- **환급(payout)**: 학생이 축제 끝나고 **자기 잔액에서 기본금(1000원) 뺀 나머지를 실제 은행 계좌로** 돌려받는 것. 학생이 계좌 입력해 요청 → admin이 승인/지급/거절. (`payouts.ts:86` `ledgerBalance - BASE_GRANT_AMOUNT`) **"부스 정산" 개념은 이 시스템에 없음.**
- **환불(refund)**: paid된 **개별 주문 1건**을 취소해 그 금액을 **학생 앱 내 잔액으로 복원**(order→`refunded`). 현장 오결제(중복결제·품절·오작동) 대응. → **부스가 현장에서 처리(pos), admin 아님.**
- 돈 흐름(확인): 결제 시 학생 잔액만 차감(`orders.ts:559`), **부스 주인에겐 적립 없음**. 부스 매출은 `purchase` 합계로 집계만 됨. 그래서 환불해도 부스가 잃는 돈 없음(악용 유인 없음).

**사람 손 작업(코드 밖)**
- admin DAuth 클라이언트: id `dodam_4b045dcbe9b7` / secret 저장 완료(`apps/api/.env`). redirect URI `http://localhost:3003/api/auth/callback`(+운영 도메인)를 DAuth 콘솔에 등록.
- admin 지정: `users.isAdmin`을 **DB에서 직접 true로** 설정(env 허용목록 제거됨).

---

## 1. 인증 아키텍처

### 배경
DAuth(도담 OAuth)는 앱마다 클라이언트를 따로 발급 → API가 클라이언트별 config를 env로 보유. 현재는 **인증 방식 이름**으로 라우트가 붙어 앱 매핑이 헷갈리고(`/dodam`=app, `/dauth`=pos), `exchangeAuthorizationCode`가 `getDodamPosConfig()`를 하드코딩(`dauth.ts:149`)해 admin redirect URI를 넣으면 `invalid redirect uri`로 튕긴다.

### 결정: 앱 기준으로 라우트·config 통일 + admin 추가

**라우트** (`apps/api/src/routes/auth.ts`):
| 기존 | 신규 | 방식 |
|---|---|---|
| `POST /v1/auth/dodam` | `POST /v1/auth/app` | 토큰 |
| `POST /v1/auth/dauth` | `POST /v1/auth/pos` | PKCE |
| (신설) | `POST /v1/auth/admin` | PKCE |

**config 함수** (`apps/api/src/config.ts`):
| 기존 | 신규 | env |
|---|---|---|
| `getDodamConfig` | `getAppDauthConfig` | `DAUTH_CLIENT_ID/SECRET/REDIRECT_URI` |
| `getDodamPosConfig` | `getPosDauthConfig` | `DAUTH_POS_CLIENT_ID/SECRET/REDIRECT_URI` |
| (신설) | `getAdminDauthConfig` | `DAUTH_ADMIN_CLIENT_ID/SECRET/REDIRECT_URI` |

**파일명**: `apps/api/src/auth/dodam.ts` → `auth/dauth.ts` (DAUTH_* env·라우트와 일관).

**교환 함수 시그니처(확정)**: `exchangeAuthorizationCode(params, config)` — config를 인자로 받음. pos 라우트는 `getPosDauthConfig()`, admin은 `getAdminDauthConfig()`를 넘김. redirect-uri 검증은 넘어온 config 기준 유지 → **pos 동작 불변 보장**(공유 보안 경계라 "구현 시 결정"으로 미루지 않고 지금 확정).

### 리네이밍 영향 범위 (함께 수정)
- 경로 문자열: `apps/app/src/entities/session/api/session-api.ts:5`(`"auth/dodam"`→`"auth/app"`), `apps/app/src/mocks/handlers.ts:22`(`"/v1/auth/dodam"`→`"/v1/auth/app"`), `apps/pos/src/shared/auth/server.ts:19`(`.../auth/dauth`→`.../auth/pos`).
- config/함수 참조: `config.ts:18,26` 정의부, `auth/dauth.ts`(구 dodam.ts) import·`getDodamConfig()`×3(app authorize/consent 포함)·`getDodamPosConfig()`×1, `routes/auth.ts`.

### 프론트 auth (pos 복제 + 상수 치환)
- 쿠키명 `flick_pos_*` → `flick_admin_*`. **localhost는 포트로 쿠키를 구분 안 하므로 prefix 분리 필수**(pos 3002와 로컬 동시 개발 충돌 방지).
- ⚠️ **verifier/state 리터럴은 `cookies.ts`가 아니라 `login/route.ts`·`callback/route.ts`에 인라인 하드코딩**(`const VERIFIER_COOKIE="flick_pos_verifier"` 등). access/refresh만 바꾸면 안 되고 이 인라인 리터럴도 `flick_admin_*`로 직접 치환해야 함.
- env: `DAUTH_REDIRECT_URI=http://localhost:3003/api/auth/callback`, `BASE_URL=http://localhost:3003`.
- `server.ts` 교환 호출: `${API_INTERNAL_BASE_URL}/auth/admin`. 라우트가 앱별로 갈리므로 body에 `client` 필드 불필요.
- 복제 대상: `src/app/api/auth/{login,callback,logout,session}/route.ts`, `src/app/api/proxy/[...path]/route.ts`, `src/shared/auth/{server,cookies,pkce,index}.ts`, `src/shared/config/{env,index}.ts`, `src/shared/api/{client,request,errors,index}.ts`.

---

## 2. admin 게이트 (isAdmin 검증)

### 사실관계
- DAuth 로그인은 도담 계정이면 누구나 성공. `isAdmin`은 **DB에서 직접 관리**(운영자가 `users.isAdmin`을 true로 설정). 로그인 시 서버는 `isAdmin`을 건드리지 않음(기존 값 보존).
- `GET /v1/users/me`(`meSchema`)의 `isAdmin: boolean`으로 확인. `meSchema = {id, username, name, profileImageUrl(nullable), roles[], isAdmin, studentNumber(nullable), balance}`.
- admin 데이터 API는 이미 `requireAdmin`(403) → **프론트 게이트는 보안이 아니라 UX/이중방어**. 보안 최종 책임은 API.

### API 변경: env 허용목록 제거
- **삭제**: `getBootstrapAdminPublicIds()`(`config.ts`), `isBootstrapAdmin()`(`auth/users.ts:12`), `.env`/`.env.example`의 `DAUTH_ADMIN_PUBLIC_IDS`.
- `upsertByDauthId`(`auth/users.ts:16`): insert 시 `isAdmin` 기본값 `false`(스키마 default 그대로), onConflict 시 `isAdmin` **미변경**(현재 `admin ? true : sql\`${users.isAdmin}\`` → `isAdmin` set 자체를 제거해 기존 DB 값 보존).
- `requireAdmin`은 이미 `user.isAdmin`만 봄(`middleware.ts:41`) → **변경 없이 그대로 동작.**
- `roles`(도담 role 복사본)는 권한에 사용 안 함. 권한 신호는 `isAdmin` 단일. admin/일반 2단계.

### 결정: 미들웨어 + 서버 레이아웃 게이트 (깜빡임 0)
- **미로그인 차단 = `src/middleware.ts`**: 세션 쿠키 없으면 렌더 진입 전 `/login`.
  - ⚠️ 위치는 반드시 **`src/middleware.ts`**(프로젝트 src 루트). `src/app/` 안에 두면 실행 안 됨(죽은 코드).
  - ⚠️ **matcher 필수**: `/login`·`/api/*`(특히 `/api/auth/*`·`/api/proxy/*`)·static 제외. 안 하면 로그인/프록시 라우트를 가로채 로그인 자체가 깨짐.
- **비-admin 차단 = `(protected)/layout.tsx`**(서버 컴포넌트): 쿠키로 `/me` 서버 호출 → `isAdmin=false`면 `redirect('/login?error=forbidden')`. 클라 auth-gate(pos 방식)는 마운트 후 판정=깜빡임이라 불채택.

### 라우트 구조
```
src/
  middleware.ts               # 세션 쿠키 없으면 /login (matcher로 login/api/static 제외)
  app/
    login/page.tsx            # 공개 (?error=forbidden 처리)
    (protected)/
      layout.tsx              # 서버 /me → !isAdmin이면 redirect(forbidden)
      page.tsx                # 대시보드
      booths/ orders/ payouts/ money/ users/ audit/
```

### 신규 배관 (pos에 없음)
- `shared/auth/server.ts`에 `getCurrentUser(cookieStore)`: `ensureAccessToken` → internal `GET /users/me` fetch → `meSchema` 파싱.
- ⚠️ **스테일 토큰 무한루프 방지**: access 쿠키는 있는데 서버 토큰이 revoke/invalid면 `/me`가 401 → getCurrentUser가 refuse해도 쿠키가 남아 middleware가 통과시켜 루프. proxy route처럼 **401 시 refresh 시도 → 실패면 `clearSession`(쿠키 삭제)** 후 `/login`. (forbidden 로그아웃 링크는 `error=forbidden`만 커버하므로 이 case는 clearSession으로 별도 처리.)

### 엣지
- `/login?error=forbidden`이면 "관리자 권한 없음" 안내 + **로그아웃(쿠키 삭제) 링크** → 같은 계정 재로그인 forbidden 루프 방지.
- `/me` 이중 호출(서버 레이아웃 + 클라 React Query)은 내부 도구라 의식적 허용.

---

## 3. 신설 API 3종

전부 `requireAdmin`. 응답 공통 규약 `{ items: T[], nextCursor: string | null }`.

### 페이지네이션: 커서(keyset)
- `ORDER BY created_at DESC, id DESC`, `WHERE (created_at, id) < :cursor`, `LIMIT :limit`. limit 기본 50 / 최대 100(z clamp).
- **커서 = epoch 마이크로초 정수 + uuid**, 비교는 `(timestamptz, uuid)` 타입 바인딩. (timestamptz는 μs, JS Date는 ms → ms 직렬화하면 동일 밀리초 row가 경계에서 누락/중복.) 경계 테스트: 동일 createdAt로 limit+1개 삽입 후 페이징, 누락/중복 0 확인.
- **커서는 필터셋 종속**: q/status/boothId 바뀌면 커서 무효 → 프론트는 필터 변경 시 첫 페이지로 리셋.
- 기존 무페이지네이션(payouts, booths 등 소규모)은 유지 — orders/audit는 고volume이라 커서. 스타일 공존은 규모 차이 근거(나중에 "일관성"으로 되돌리지 말 것).

### 인덱스 신설 (이번 작업 포함 — 커서의 성능 전제. 없으면 seq scan+sort로 offset보다 느림)
- `orders`: `(status, created_at, id)`, `(booth_id, created_at, id)`
- `audit_logs`: `(created_at, id)` + 필터용 (현재 인덱스 0개)
- `users`: `(created_at, id)`
- Drizzle 스키마 index로 표현 가능한 건 스키마에, 아니면 커스텀 SQL 마이그레이션.

### ① `GET /v1/users?q=&limit=&cursor=`
- 검색: `name`, `studentNumber`만 `ILIKE '%q%'` OR (username 제외 — 도담 로그인 아이디라 사람 찾기 키 아님).
- **q는 `normalize("NFC")`** (macOS/iOS NFD 입력이 ILIKE에 안 걸리는 문제 방지). 데이터는 도담발 NFC 가정.
- 와일드카드 `%`/`_`/escape문자 escape + `ESCAPE` 명시. q 없음/공백(trim) → 전체 브라우징. studentNumber null 유저는 학번검색 미매치(이름으론 매치).
- 응답 item: meSchema 재사용. 민감 계좌정보 없음.

### ② `GET /v1/orders?status=&boothId=&limit=&cursor=`
- 필터 status/boothId는 **SQL에서**(JS filter 안 함).
- 조인: `booths` **inner**(boothId notNull) → `boothName`; `users` **left**(buyerId nullable — pending/canceled 키오스크 주문 누락 방지) → `buyerName: string | null`.
- **필요한 컬럼만 select**(users row spread 금지 → balance/roles/dauthPublicId 누출 방지). 명시적 Zod 응답 스키마.
- 목록은 요약(시간·금액·상태·부스명·구매자명). items 미포함 — 상세는 기존 `GET /v1/orders/{id}`(items+booths 조인) 재사용.

### ③ `GET /v1/audit-logs?action=&actorId=&targetType=&limit=&cursor=`
- 필터 SQL. `users` 조인 → `actorName`(컬럼만 select, spread 금지).
- item: `{id, actorId, actorName, action, targetType, targetId, metadata, createdAt}`.
- metadata(jsonb) **그대로 노출**: insert 지점 전수 확인 결과 `{amount:number}` **또는 null**(charge/refund/payout.pay=amount; approve/reject/view_account=null). 계좌·개인정보 없음. admin이 "얼마짜리 액션"을 봐야 하므로 노출이 맞음, 마스킹 과함.

---

## 4. FSD 구조 & 네비게이션

### 네비게이션: 좌측 사이드바 (모바일 하단탭 제거)
데스크톱 백오피스라 pos 사이드바 패턴 채택, pos의 `lg:hidden` 하단탭은 제거. pos `TABS` `section` 모델 재사용, `isTabLocked`(부스 상태 잠금) 제거.
```
현황     · 대시보드      /
운영     · 부스 승인     /booths
         · 주문          /orders     (조회 전용 — 환불은 pos)
환급·돈  · 환급          /payouts
         · 충전          /money
         · 사용자        /users
감사     · 감사 로그     /audit
```

### 테이블 UI: admin 로컬 `widgets/data-table` (선언형 컬럼)
- 근거: 표가 필요한 앱은 admin뿐(app/kiosk/pos는 카드/리스트). 지금 `@flick/ui`에 공용 table 넣으면 실사용자 0인데 공용 API 추측 설계=과설계. `list-row` 조합은 다열/헤더/정렬에 표현력 부족.
- 처음부터 **`@flick/ui` 토큰+기존 컴포넌트(badge/money/loader/empty-state)로만 조립** → 다른 앱이 표 필요해지면 `@flick/ui`로 승격.
- 선언형 `columns`(헤더·셀 렌더러·정렬키). 페이지네이션(커서)·로딩(skeleton)·빈상태(empty-state)·에러를 테이블이 공통 처리.
- `@flick/ui` 가용(확인): badge, button, card, empty-state, icon, input, list-row, loader, money, rolling-number, section-header, select, skeleton, stat, textarea, sheet. **table 없음**이 출발점.

### FSD 레이어 (import 방향 shared→entities→features→widgets→app)
- **entities**: `stats, booth, payout, transaction, user, order, audit, session(me)`
- **features**: `auth-gate`(서버 게이트=layout, 클라 표시=여기), `booth-moderation`(approve/reject), `payout-actions`(pay/reject/account), `charge`(resolve+charge). **refund 없음 — pos로 이관.**
- **widgets**: `app-shell`, `data-table`, `dashboard, booth-queue, order-monitor(조회 전용), payout-board, charge-panel, user-directory, audit-trail`.
- **shared**: `api, auth, config, lib(cn), ui(@flick/ui 재수출)`
- 규칙 승계: 주석 금지, alias `@/*`, 상대 import `.ts/.tsx` 확장자 유지, `@flick/ui` 시맨틱 토큰만(zinc/hex 금지), `transpilePackages:["@flick/ui"]`, `reactCompiler:true`.

---

## 5. 화면별 상세

### ① 대시보드 `/`
- `GET /v1/stats` → `totals[{type,amount}]`, `boothSales[{boothId,name,amount}]`.
- **지원금 vs 실충전 분리 표시**: `BASE_GRANT_AMOUNT=1000`이 최초 로그인 시 `type:"grant"`로 자동 지급(유저당 1회). grant는 학교가 뿌린 돈=실제 현금유입 아님. → totals를 의미별 그룹:
  - 유입: **지원금(grant)** vs **실충전(charge)** 분리
  - 사용: 구매(purchase)
  - 유출/조정: 환불(refund), 환급(payout), 조정(adjustment)
- UI: `stat`/`card`/`money`/`rolling-number` KPI + 부스 매출 랭킹.
- **한계**: `boothSales`는 `type='purchase'`만 합산 → 환불 미차감. 화면에 "환불 반영 전" 라벨 명시. stats API 변경은 이번 범위 밖.

### ② 부스 승인 `/booths`
- `GET /v1/booths`(admin=전체). status 필터 API 없음 → **클라 탭 필터**(pending/approved/rejected/전체), 기본 pending. (booth 수 소규모 가정 — 커지면 status 필터 API 추가.)
- `POST /booths/{id}/approve`·`/reject`(body 없음). 처리 후 pending 탭에서 사라짐. 재클릭 방지(상태 확인). 감사 자동 기록.

### ③ 주문 모니터링 `/orders` (조회 전용)
- 신설 `GET /v1/orders`. `data-table`(시간·부스·구매자·금액·상태 badge). buyerName null → "—". 행→상세 `GET /orders/{id}`.
- **환불 액션 없음** — refund는 pos(부스 운영자)로 이관(주제 6). admin은 전체 주문을 **보기만** 함.

### ④ 환급 `/payouts`
- payout = 학생이 자기 잔액(−기본금)을 계좌로 환급받는 것. `GET /v1/payouts?status=`(마스킹 계좌). `GET /payouts/{id}/account`(평문—**감사 기록**, "계좌 보기" 명시적 클릭+안내). `POST .../pay`·`.../reject`(requested만, 아니면 409 안내). 처리 후 status 전이 → 갱신.

### ⑤ 충전 `/money` (충전 전용)
- **QR 스캔 흐름**: 유저 QR(유저코드) 제시 → 카메라 스캔 → 코드 → `POST /v1/user-codes/resolve` → 유저 확인(name/balance) → 금액 → `POST /v1/charges`.
- **QR 스캐너 `@zxing/browser`**: 웹이라 브라우저 미정 → 전 브라우저 동작이 곧 깔끔(BarcodeDetector는 Safari 미지원 분기, html5-qrcode는 과함). `getUserMedia` 스트림 디코딩.
- **fallback**: 코드적 fallback 금지(`env||'123'` 류 없음). 제품적 fallback=코드 수동 입력(같은 resolve API로 실제 유저 검증, 우회 아님).
- **사용자 목록 직접 충전 불채택**: 항상 유저코드→resolve 경유(코드 제시=본인확인, 깨면 오충전 위험).
- **idempotencyKey**: 프론트가 resolve~charge 1세션당 1회 생성. 연타 시 서버가 기존 트랜잭션 반환(멱등).
- 엣지: 코드 만료/폐기 404 안내. 성공 시 새 balance 표시.

### ⑥ 사용자 `/users`
- 신설 `GET /v1/users?q=`. `data-table`(이름·학번·잔액·admin여부)+검색창. 조회 위주. 무결과 empty-state. q 변경 시 커서 리셋.

### ⑦ 감사 로그 `/audit`
- 신설 `GET /v1/audit-logs`. `data-table`(시간·actor·action·target·metadata amount). metadata null인 action → "—".

---

## 6. 환불(refund) pos 이관 (admin과 함께 진행)

### 배경
`POST /v1/refunds`가 `requireAdmin`이라 부스 운영자가 현장 오결제를 못 고침. 돈 흐름상 결제는 학생 잔액만 차감하고 부스엔 적립이 없어(`orders.ts:559`) **환불해도 부스가 잃는 돈이 없음** → 부스에 환불을 열어도 악용 유인 없음. 현장 문제는 현장(pos)에서 해결하는 게 옳음.

### 결정: refund를 부스 운영자(pos) 전용으로
- **API 권한 변경** (`money.ts:164`): `requireAdmin` → `requireAuth` + **주문의 부스 주인만** 통과. `booths.ts:52`의 `requireBoothOwnerOrAdmin` 패턴 재사용: order로 boothId 조회 → `owns` 아니면 403.
  - ⚠️ 단, **admin은 환불하지 않기로 결정** → 권한을 `owns`만으로 좁힘(admin이라도 자기 부스 아니면 불가). `isAdmin` 우회 넣지 않음.
- `refunds.adminId`/`transactions.adminId`/`auditLogs.actorId`에는 **환불 실행자(부스 주인) id**를 넣음(컬럼명은 그대로, 의미만 "실행자").
- refundBodySchema(`{orderId, reason}`) 유지. paid+buyerId 검증, refunded 전이 로직 그대로.

### 화면 (pos)
- pos 주문 화면(`apps/pos` — 이미 `orders` 페이지 있음)에 paid 주문 환불 액션 추가. 자기 부스 주문만 보이므로 권한 자연 충족.
- **admin `/orders`는 조회 전용**(환불 UI 없음).

### 영향
- admin 쪽 `features/refund` 없음, 대시보드 `refund` 집계는 그대로 표시(환불은 여전히 발생하는 트랜잭션).

---

## 7. 실경로 참조 (구현 시 혼동 방지)
- 인증: `POST /v1/auth/app`·`/pos`·`/admin`, `/refresh`, `/logout`
- 충전: `POST /v1/user-codes/resolve`, `POST /v1/charges` (money prefix 없음 — `v1.route("/", moneyRoutes)`)
- 환불(→pos): `POST /v1/refunds` (권한 `requireAdmin`→부스 주인으로 변경)
- 부스: `GET /v1/booths`, `POST /v1/booths/{id}/approve`·`/reject`, `GET /v1/booths/{id}/orders`
- 환급(payout): `GET /v1/payouts`, `GET /v1/payouts/{id}/account`, `POST /v1/payouts/{id}/pay`·`/reject`
- 통계: `GET /v1/stats`
- 신설: `GET /v1/users`, `GET /v1/orders`, `GET /v1/audit-logs`
- 사용자: `GET /v1/users/me`

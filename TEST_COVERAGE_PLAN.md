# Test Coverage Plan — Radikari LMS Backend

## Overview

Comprehensive analysis of untested code paths across services, controllers, and validations. Test files exist for most modules, but specific methods/functions are not covered.

---

## Layer 1: Services (`src/services/`)

### 1.1 — `KnowledgeService.ts` ⛔ Critical

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ❌ NOT TESTED | Parent versioning logic untested |
| `getAll` | ✅ Tested | |
| `getAllArchived` | ❌ NOT TESTED | |
| `getSummary` | ❌ NOT TESTED | |
| `getById` | ✅ Tested | |
| `getAllVersionsById` | ✅ Tested | |
| `update` | ❌ NOT TESTED | Status reset REJECTED→PENDING, REVISION→PENDING untested |
| `deleteById` | ❌ NOT TESTED | PubSub fire-and-forget untested |
| `approveById` | ⚠️ Partial | Only pubsub sequential failure and approval action tested; already-in-status edge case untested |
| `sendKnowledgeApprovalNotification` | ⚠️ Partial | Only basic notification tested; EMAIL/PROD email extraction untested |
| `bulkCreate` | ⚠️ Partial | Only skips/no-files tested; file type parsing untested |
| `bulkCreateTypeCase` | ⚠️ Partial | Excel parsing tested; tenant creation/lookup edge cases untested |
| `archiveOrUnarchiveKnowledge` | ✅ Tested | |
| `shareKnowledge` | ✅ Tested | |
| `getShareHistory` | ✅ Tested | |

### 1.2 — `TenantService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getAll` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `update` | ❌ NOT TESTED | |
| `deleteById` | ✅ Tested | |
| `getAllByUserId` | ❌ NOT TESTED | Mock exists but no describe block |
| `addMember` | ✅ Tested | |
| `getUserPoints` | ✅ Tested | |
| `upsertSetting` | ✅ Tested | |
| `getSettings` | ✅ Tested | |

### 1.3 — `TenanUserService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ❌ NOT TESTED | |
| `assignUserTenantByTenantId` | ❌ NOT TESTED | |
| `getByTenantId` | ❌ NOT TESTED | |
| `getAll` | ❌ NOT TESTED | |

### 1.4 — `AuthService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `logIn` | ⚠️ Partial | 2 tests pass, 2 skipped (valid credentials, wrong password) |
| `verifyToken` | ✅ Tested | |
| `changePassword` | ⚠️ Partial | 1 test pass, 1 skipped (success case skipped) |
| `googleCallback` | ❌ NOT TESTED | Service-level untested (only controller tested) |
| `googleLogin` | ❌ NOT TESTED | Service-level untested (only controller tested) |

### 1.5 — `AnnouncementService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ❌ NOT TESTED | |
| `getAll` | ❌ NOT TESTED | |
| `getById` | ❌ NOT TESTED | |
| `update` | ❌ NOT TESTED | |
| `deleteById` | ❌ NOT TESTED | |

### 1.6 — `NotificationService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `createMany` | ✅ Tested | |
| `notifyTenantUsers` | ✅ Tested | |
| `notifyTenantRoleUsers` | ✅ Tested | |
| `notifySpecificUsers` | ✅ Tested | |
| `getByUserId` | ❌ NOT TESTED | |
| `getUnreadCount` | ❌ NOT TESTED | |
| `markAsRead` | ❌ NOT TESTED | |
| `markAllAsRead` | ❌ NOT TESTED | |
| `deleteById` | ❌ NOT TESTED | |

### 1.7 — `ForumService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `update` | ✅ Tested | |
| `deleteById` | ✅ Tested | |
| `likeForum` | ✅ Tested | |
| `commentForum` | ✅ Tested | |
| `deleteForumComment` | ✅ Tested | |
| `pinOrUnpinForum` | ✅ Tested | |
| `likeOrUnlikeForumComment` | ✅ Tested | |
| `getAll` | ❌ NOT TESTED | |
| `getForumComments` | ❌ NOT TESTED | |
| `getForumCommentReplies` | ❌ NOT TESTED | |

### 1.8 — `AiPromptService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getByTenantId` | ✅ Tested | |
| `upsertByTenantId` | ❌ NOT TESTED | |

### 1.9 — `AssignmentService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getAll` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `update` | ✅ Tested | |
| `deleteById` | ✅ Tested | |
| `approveById` | ✅ Tested | |
| `getSummaryByUserIdAndTenantId` | ✅ Tested | |
| `getSummaryByTenantId` | ✅ Tested | |
| `getUserListWithAssignmentSummaryByTenantId` | ✅ Tested | |
| `getAssginmentWithUserSummaryByTenantId` | ✅ Tested | |
| `getUserAssignmentList` | ✅ Tested | |
| `getDetailUserAssignmentByUserIdAndTenantId` | ✅ Tested | |
| `getStatistics` | ✅ Tested | |
| `sendAssignmentAssignedNotification` | ❌ NOT TESTED | |

### 1.10 — `UserActivityLogService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getAll` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `create` | ❌ NOT TESTED | |

### 1.11 — `UserKnowledgeReadLogService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getAllByTenant` | ✅ Tested | |
| `getStatusInTenant` | ✅ Tested | |
| `markViewedInTenant` | ✅ Tested | |

### 1.12 — `TenantLimitService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `checkTokenLimit` | ✅ Tested | |

### 1.13 — `TenantRoleService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getAll` | ✅ Tested | |

### 1.14 — `AccessListControlListService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `createRole` | ✅ Tested | |
| `updateRoleAccess` | ✅ Tested | |
| `getAllFeatures` | ✅ Tested | |
| `getAllRoles` | ✅ Tested | |
| `getEnabledFeaturesByRoleId` | ✅ Tested | |
| `checkAccess` | ✅ Tested | |

### 1.15 — `AnalyticsService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getAnalytics` | ✅ Tested | |

### 1.16 — `BroadcastService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getByTenantId` | ✅ Tested | |
| `upsertByTenantId` | ✅ Tested | |

### 1.17 — `ExampleBufferService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `getPDF` | ✅ Tested | |
| `getXLSX` | ✅ Tested | |

### 1.18 — `AiEssayScoringService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `scoreEssayAnswer` | ✅ Tested | |
| `evaluateEssayAnswers` | ✅ Tested | |

### 1.19 — `AssignmentAiService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `streamQuestions` | ✅ Tested | |

### 1.20 — `AssignmentAttemptService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getCurrentUserAssignmentAttemptByUserId` | ✅ Tested | |
| `updateAnswer` | ✅ Tested | |
| `submitAssignment` | ✅ Tested | |
| `calculateAssignmentScore` | ✅ Tested | |
| `getAllQuestionsAndAnswers` | ✅ Tested | |
| `getAssignmentsByExpiredDate` | ✅ Tested | |
| `getHistoryUserAssignmentAttempts` | ✅ Tested | |
| `getTimeStatus` | ✅ Tested | |
| `getAssignmentExportData` | ✅ Tested | |

### 1.21 — `HybridChatService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `streamHybridChat` | ✅ Tested | |

### 1.22 — `HybridChatCore.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `executeHybridChatCore` | ✅ Tested | |

### 1.23 — `EphemeralChatService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `createThread` | ✅ Tested | |
| `sendMessage` | ✅ Tested | |
| `getMetrics` | ✅ Tested | |
| `deleteAllThreadsForTenant` | ✅ Tested | |

### 1.24 — `EphemeralThreadStore.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `createThread` | ✅ Tested | |
| `getThread` | ✅ Tested | |
| `addMessage` | ✅ Tested | |
| `deleteExpiredThreads` | ✅ Tested | |
| `getMetrics` | ✅ Tested | |
| `deleteAllThreadsForTenant` | ✅ Tested | |
| `clear` | ✅ Tested | |

### 1.25 — `EphemeralRagRunner.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `runEphemeralRag` | ✅ Tested | |
| `validateNoIdentityParameters` | ✅ Tested | |

### 1.26 — `UserService.ts`

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getAll` | ✅ Tested | |
| `getInvitableForTenant` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `update` | ✅ Tested | |
| `deleteById` | ✅ Tested | |
| `restoreById` | ✅ Tested | |
| `getMe` | ✅ Tested | |

### 1.27 — MasterKnowledge Services

All three MasterKnowledge services (Case, Category, SubCategory) have identical CRUD coverage:

| Method | Test Status | Notes |
|--------|-------------|-------|
| `create` | ✅ Tested | |
| `getAll` | ✅ Tested | |
| `getById` | ✅ Tested | |
| `update` | ✅ Tested | |
| `deleteById` | ✅ Tested | |

---

## Layer 2: Controllers (`src/controllers/rest/`)

### 2.1 — Controllers with NO test file
None — all 22 REST controllers have test files.

### 2.2 — Controllers with missing method tests

#### `TenantController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `create` | ❌ NOT TESTED |
| `update` | ❌ NOT TESTED |
| `deleteById` | ❌ NOT TESTED |
| `getInvitableUsers` | ❌ NOT TESTED |
| `getUserInTenant` | ❌ NOT TESTED |
| `getAllTenantUsers` | ❌ NOT TESTED |
| `assignUserToTenant` | ❌ NOT TESTED |
| `getAllByUser` | ❌ NOT TESTED |
| `getAllRoles` | ❌ NOT TESTED |
| `createTenantUser` | ❌ NOT TESTED |
| `addMember` | ❌ NOT TESTED |
| `upsertSetting` | ❌ NOT TESTED |
| `getSettings` | ❌ NOT TESTED |
| `getUserPoints` | ❌ NOT TESTED |
| `getById` | ✅ Tested |
| `getAll` | ✅ Tested |

#### `TenantUserManagementController.ts` — untested methods:
| Method | Test Status | Notes |
|--------|-------------|-------|
| `createAndAssignToTenant` | ⏭️ Skipped | Uses `Bun.password.hash` |
| `updateUserInTenant` | ⏭️ Skipped | Uses `Bun.password.hash` |
| `getAllByTenant` | ✅ Tested |
| `getByUserIdInTenant` | ✅ Tested |
| `removeUserFromTenant` | ✅ Tested |

#### `EphemeralChatController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `sendMessage` | ❌ NOT TESTED |

#### `KnowledgeController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `create` | ❌ NOT TESTED |
| `getAll` | ❌ NOT TESTED |
| `getAllArchived` | ❌ NOT TESTED |
| `getSummary` | ❌ NOT TESTED |
| `getById` | ❌ NOT TESTED |
| `getAllVersionsById` | ❌ NOT TESTED |
| `update` | ❌ NOT TESTED |
| `deleteById` | ❌ NOT TESTED |
| `approveById` | ❌ NOT TESTED |
| `bulkCreate` | ❌ NOT TESTED |
| `bulkCreateTypeCase` | ❌ NOT TESTED |
| `archiveOrUnarchiveKnowledge` | ❌ NOT TESTED |
| `shareKnowledge` | ❌ NOT TESTED |
| `getShareHistory` | ❌ NOT TESTED |

#### `AnnouncementController.ts` — ALL methods untested:
| Method | Test Status |
|--------|-------------|
| `create` | ❌ NOT TESTED |
| `getAll` | ❌ NOT TESTED |
| `getById` | ❌ NOT TESTED |
| `update` | ❌ NOT TESTED |
| `deleteById` | ❌ NOT TESTED |

#### `MasterKnowledgeCase/Category/SubCategoryController.ts` — all 5 CRUD methods untested:
| Method | Test Status |
|--------|-------------|
| `create` | ❌ NOT TESTED |
| `getAll` | ❌ NOT TESTED |
| `getById` | ❌ NOT TESTED |
| `update` | ❌ NOT TESTED |
| `deleteById` | ❌ NOT TESTED |

#### `NotificationController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `getAll` | ❌ NOT TESTED |
| `getUnreadCount` | ❌ NOT TESTED |
| `markAsRead` | ❌ NOT TESTED |
| `markAllAsRead` | ❌ NOT TESTED |
| `deleteById` | ❌ NOT TESTED |

#### `BroadcastController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `getByTenantId` | ❌ NOT TESTED |
| `createOrUpdateByTenantId` | ❌ NOT TESTED |

#### `AiPromptController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `getByTenantId` | ❌ NOT TESTED |
| `createOrUpdateByTenantId` | ❌ NOT TESTED |

#### `AnalyticsController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `getAnalytics` | ❌ NOT TESTED |

#### `ExampleBufferController.ts` — untested methods:
| Method | Test Status |
|--------|-------------|
| `getPDF` | ❌ NOT TESTED |
| `getXLSX` | ❌ NOT TESTED |

### 2.3 — Controllers with complete coverage
| Controller | Status |
|------------|--------|
| `AccessControlListController` | ✅ All methods tested |
| `AiChatController` | ✅ All methods tested |
| `AssignmentController` | ✅ All methods tested |
| `AssignmentAttemptController` | ✅ All methods tested |
| `AuthController` | ✅ All methods tested |
| `ForumController` | ✅ All methods tested |
| `UserController` | ✅ All methods tested |
| `UserActivityLogController` | ✅ All methods tested |
| `UserKnowledgeReadLogController` | ✅ All methods tested |

---

## Layer 3: Validations (`src/validations/`)

All validation schemas have test coverage:
- ✅ `AccessControlListValidation`
- ✅ `AiChatValidation`
- ✅ `AiPromptValidation`
- ✅ `AnnouncementValidation`
- ✅ `AssignmentValidation`
- ✅ `AuthValidation`
- ✅ `BroadcastValidation`
- ✅ `ForumValidation`
- ✅ `KnowledgeValidation`
- ✅ `MasterKnowledgeCaseValidation`
- ✅ `MasterKnowledgeCategoryValidation`
- ✅ `MasterKnowledgeSubCategoryValidation`
- ✅ `TenantValidation`
- ✅ `TenantUserManagementValidation`
- ✅ `UserValidation`

---

## Layer 4: Utils & Packages (`src/utils/`, `src/pkg/`)

### Utils — complete coverage:
- ✅ `aiClient.utils`
- ✅ `ascii_art.utils`
- ✅ `knowledgeOverdue.utils`
- ✅ `r2-upload`
- ✅ `response.utils`
- ✅ `strings.utils`
- ✅ `user.utils`

### Packages — partial coverage:
- ✅ `pkg/cache`
- ✅ `pkg/graceful`
- ✅ `pkg/logger`
- ✅ `pkg/oauth`
- ⚠️ `pkg/prisma` — basic connection test only
- ⚠️ `pkg/pubsub` — basic send/receive only
- ⚠️ `pkg/qdrant` — basic search only

---

## Priority Ranking

### 🔴 Critical (High Impact — Core Business Logic)
1. **KnowledgeService**: `create`, `update`, `deleteById`, `getAllArchived`, `getSummary`, `approveById` (already-in-status)
2. **TenantController**: All untested methods (CRUD + member management)
3. **AnnouncementController**: All methods (no test file at all)

### 🟡 High (Important — Common Operations)
4. **TenantService**: `update`, `getAllByUserId`
5. **NotificationService**: `getByUserId`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteById`
6. **ForumService**: `getAll`, `getForumComments`, `getForumCommentReplies`
7. **EphemeralChatController**: `sendMessage`
8. **KnowledgeController**: All untested methods
9. **MasterKnowledgeCase/Category/SubCategoryController**: All CRUD methods
10. **TenanUserService**: All methods

### 🟢 Medium (Nice to Have)
11. **AiPromptService**: `upsertByTenantId`
12. **BroadcastController**: All methods
13. **NotificationController`**: All methods
14. **AnalyticsController**: `getAnalytics`
15. **ExampleBufferController`: All methods
16. **TenantUserManagementController**: `createAndAssignToTenant`, `updateUserInTenant` (skipped — needs `Bun.password.hash` mock)
17. **AssignmentService**: `sendAssignmentAssignedNotification`
18. **UserActivityLogService`: `create`
19. **AuthService**: `googleLogin`, `googleCallback` (service-level)
20. **pkg/prisma`**: Extended connection pool tests
21. **pkg/pubsub`**: Reconnection logic, message acknowledgment
22. **pkg/qdrant`**: Collection management, retry logic

---

## Summary Stats

| Category | Total | Tested | Untested | Skipped |
|----------|-------|--------|----------|---------|
| Service methods | ~120 | ~80 | ~35 | ~5 |
| Controller methods | ~130 | ~60 | ~65 | ~5 |
| Validation schemas | 15 | 15 | 0 | 0 |
| Utils | 7 | 7 | 0 | 0 |
| Packages | 5 | 5 | 0 | 0 |

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

let mockSendToQueue = jest.fn<any>()

jest.mock("$repositories/Assignment", () => {
	const mockCreate = jest.fn<any>()
	const mockGetAll = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockUpdate = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	const mockApproveById = jest.fn<any>()
	const mockGetTotalAssignmentByTenantId = jest.fn<any>()
	const mockGetTotalCompletedAssignmentByTenantId = jest.fn<any>()
	const mockGetTotalAssignmentByStatus = jest.fn<any>()
	const mockGetTotalAssignedUsers = jest.fn<any>()
	const mockGetQuestionAnalytics = jest.fn<any>()
	const mockGetUserListWithAssignmentSummaryByTenantId = jest.fn<any>()
	const mockGetAssginmentWithUserSummaryByTenantId = jest.fn<any>()
	const mockGetAssignmentListByUserIdAndTenantIdAndTenantRoleId = jest.fn<any>()
	const mockGetDetailUserAssignmentByUserIdAndTenantId = jest.fn<any>()
	const mockCountAvailableAssignmentByUserIdAndTenantId = jest.fn<any>()
	const mockCountSubmittedAssignmentByUserIdAndTenantId = jest.fn<any>()
	return {
		create: mockCreate,
		getAll: mockGetAll,
		getById: mockGetById,
		update: mockUpdate,
		deleteById: mockDeleteById,
		approveById: mockApproveById,
		getTotalAssignmentByTenantId: mockGetTotalAssignmentByTenantId,
		getTotalCompletedAssignmentByTenantId: mockGetTotalCompletedAssignmentByTenantId,
		getTotalAssignmentByStatus: mockGetTotalAssignmentByStatus,
		getTotalAssignedUsers: mockGetTotalAssignedUsers,
		getQuestionAnalytics: mockGetQuestionAnalytics,
		getUserListWithAssignmentSummaryByTenantId: mockGetUserListWithAssignmentSummaryByTenantId,
		getAssginmentWithUserSummaryByTenantId: mockGetAssginmentWithUserSummaryByTenantId,
		getAssignmentListByUserIdAndTenantIdAndTenantRoleId: mockGetAssignmentListByUserIdAndTenantIdAndTenantRoleId,
		getDetailUserAssignmentByUserIdAndTenantId: mockGetDetailUserAssignmentByUserIdAndTenantId,
		countAvailableAssignmentByUserIdAndTenantId: mockCountAvailableAssignmentByUserIdAndTenantId,
		countSubmittedAssignmentByUserIdAndTenantId: mockCountSubmittedAssignmentByUserIdAndTenantId,
	}
})

jest.mock("$repositories/Assignment/AssignmentAttemptRepository", () => ({
	getUserTotalPointAssignment: jest.fn<any>(),
	getSubmittedAttemptsByAssignmentId: jest.fn<any>(),
}))

jest.mock("$repositories/TenantRoleRepository", () => ({
	getByUserId: jest.fn<any>(),
}))

jest.mock("$repositories/TenantUserRepository", () => ({
	getByTenantIdAndUserId: jest.fn<any>(),
}))

jest.mock("$services/UserActivityLogService", () => ({
	create: jest.fn<any>(),
}))

jest.mock("$services/NotificationService", () => ({
	notifyTenantRoleUsers: jest.fn<any>(),
	notifySpecificUsers: jest.fn<any>(),
}))

jest.mock("$pkg/pubsub", () => ({
	__esModule: true,
	default: { sendToQueue: mockSendToQueue },
	PUBSUB_TOPICS: {
		ASSIGNMENT_ASSIGNED_NOTIFICATION: "ASSIGNMENT_ASSIGNED_NOTIFICATION",
		ASSIGNMENT_REGRADE_ATTEMPT: "ASSIGNMENT_REGRADE_ATTEMPT",
	},
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

import {
	create,
	getAll,
	getById,
	update,
	deleteById,
	approveById,
	getSummaryByUserIdAndTenantId,
	getSummaryByTenantId,
	getUserListWithAssignmentSummaryByTenantId,
	getAssginmentWithUserSummaryByTenantId,
	getUserAssignmentList,
	getDetailUserAssignmentByUserIdAndTenantId,
	getStatistics,
	sendAssignmentAssignedNotification,
} from "$services/AssignmentService"

describe("AssignmentService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockSendToQueue.mockResolvedValue(undefined)
		const mocks = jest.requireMock("$repositories/Assignment") as any
		mocks.create.mockResolvedValue({
			id: "assign-123",
			title: "Test Assignment",
			status: "DRAFT",
		})
		mocks.getAll.mockResolvedValue({ data: [], total: 0 })
		mocks.getById.mockResolvedValue(null)
		mocks.update.mockResolvedValue({ id: "assign-123", title: "Updated" })
		mocks.deleteById.mockResolvedValue(undefined)
		mocks.approveById.mockResolvedValue(null)
		mocks.getTotalAssignmentByTenantId.mockResolvedValue(0)
		mocks.getTotalCompletedAssignmentByTenantId.mockResolvedValue(0)
		mocks.getTotalAssignmentByStatus.mockResolvedValue(0)
		mocks.getTotalAssignedUsers.mockResolvedValue(0)
		mocks.getQuestionAnalytics.mockResolvedValue([])
		mocks.getUserListWithAssignmentSummaryByTenantId.mockResolvedValue([])
		mocks.getAssginmentWithUserSummaryByTenantId.mockResolvedValue([])
		mocks.getAssignmentListByUserIdAndTenantIdAndTenantRoleId.mockResolvedValue([])
		mocks.getDetailUserAssignmentByUserIdAndTenantId.mockResolvedValue(null)
		mocks.countAvailableAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 0 }])
		mocks.countSubmittedAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 0 }])
	})

	describe("create", () => {
		it("should create assignment successfully", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any

			const result = await create(
				{ title: "Test Assignment" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(true)
			expect(mocks.create).toHaveBeenCalled()
			expect(mockSendToQueue).toHaveBeenCalled()
		})

		it("should still succeed when pubsub fails", async () => {
			mockSendToQueue.mockRejectedValue(new Error("Queue error"))

			const result = await create(
				{ title: "Test Assignment" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(true)
		})
	})

	describe("getAll", () => {
		it("should return paginated assignments", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getAll.mockResolvedValue({ data: [{ id: "assign-1" }], total: 1 })

			const result = await getAll(
				{} as any,
				{ id: "user-123" } as any,
				"tenant-123",
			)

			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("should return assignment when found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
			})

			const result = await getById("assign-123", "tenant-123")

			expect(result.status).toBe(true)
		})

		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue(null)

			const result = await getById("nonexistent", "tenant-123")

			expect(result.status).toBe(false)
		})
	})

	describe("deleteById", () => {
		it("should delete assignment successfully", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue({ id: "assign-123", title: "Test" })
			mocks.deleteById.mockResolvedValue(undefined)

			const result = await deleteById("assign-123", "tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.deleteById).toHaveBeenCalled()
		})

		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue(null)

			const result = await deleteById("nonexistent", "tenant-123", "user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("approveById", () => {
		it("should approve assignment successfully", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
			})
			mocks.approveById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				status: "APPROVED",
			})

			const result = await approveById("assign-123", "tenant-123", "user-123", {
				action: "APPROVE",
				comment: "Looks good",
			})

			expect(result.status).toBe(true)
		})

		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue(null)

			const result = await approveById("nonexistent", "tenant-123", "user-123", {
				action: "APPROVE",
			})

			expect(result.status).toBe(false)
		})
	})

	describe("getSummaryByTenantId", () => {
		it("should return assignment summary", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getTotalAssignmentByTenantId.mockResolvedValue(10)
			mocks.getTotalCompletedAssignmentByTenantId.mockResolvedValue(5)
			mocks.getTotalAssignmentByStatus.mockResolvedValue(2)

			const result = await getSummaryByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("totalAssignment")
			expect(result.data).toHaveProperty("pending")
		})
	})

	describe("getStatistics", () => {
		it("should return statistics for assignment", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				tenantId: "tenant-123",
				status: "PUBLISHED",
				showQuestion: true,
				showAnswer: true,
			})
			attemptRepo.getSubmittedAttemptsByAssignmentId.mockResolvedValue([
				{
					id: "attempt-1",
					percentageScore: 80,
					createdAt: new Date(),
					submittedAt: new Date(),
				},
			])
			mocks.getTotalAssignedUsers.mockResolvedValue(5)
			mocks.getQuestionAnalytics.mockResolvedValue([])

			const result = await getStatistics("assign-123", "tenant-123")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("stats")
			expect(result.data).toHaveProperty("questions")
		})

		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue(null)

			const result = await getStatistics("nonexistent", "tenant-123")

			expect(result.status).toBe(false)
		})
	})

	describe("sendAssignmentAssignedNotification", () => {
		it("should send notifications for TENANT_ROLE access", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const notifyMocks = jest.requireMock("$services/NotificationService") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				access: "TENANT_ROLE",
				assignmentTenantRoleAccesses: [{ tenantRoleId: "role-1" }],
				assignmentUserAccesses: [],
			})
			notifyMocks.notifyTenantRoleUsers.mockResolvedValue({ status: true })

			await sendAssignmentAssignedNotification("assign-123", "tenant-123")

			expect(notifyMocks.notifyTenantRoleUsers).toHaveBeenCalled()
		})

		it("should send notifications for USER access", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const notifyMocks = jest.requireMock("$services/NotificationService") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				access: "USER",
				assignmentTenantRoleAccesses: [],
				assignmentUserAccesses: [{ userId: "user-1" }],
			})
			notifyMocks.notifySpecificUsers.mockResolvedValue({ status: true })

			await sendAssignmentAssignedNotification("assign-123", "tenant-123")

			expect(notifyMocks.notifySpecificUsers).toHaveBeenCalled()
		})

		it("should do nothing when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const notifyMocks = jest.requireMock("$services/NotificationService") as any
			mocks.getById.mockResolvedValue(null)

			await sendAssignmentAssignedNotification("nonexistent", "tenant-123")

			expect(notifyMocks.notifyTenantRoleUsers).not.toHaveBeenCalled()
			expect(notifyMocks.notifySpecificUsers).not.toHaveBeenCalled()
		})
	})

	describe("update", () => {
		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getById.mockResolvedValue(null)

			const result = await update("nonexistent", {} as any, "tenant-123", "user-123")

			expect(result.status).toBe(false)
		})

		it("should update assignment and publish regrade events", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getById
				.mockResolvedValueOnce({ id: "assign-123", title: "Original" })
				.mockResolvedValueOnce({ id: "assign-123", title: "Original" })
			mocks.update.mockResolvedValue({ id: "assign-123", title: "Updated Assignment" })
			attemptRepo.getSubmittedAttemptsByAssignmentId.mockResolvedValue([
				{ id: "attempt-1" },
				{ id: "attempt-2" },
			])

			const result = await update("assign-123", { title: "Updated Assignment" } as any, "tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.update).toHaveBeenCalled()
			expect(mockSendToQueue).toHaveBeenCalledTimes(2) // Two regrade events
		})

		it("should continue even when regrade queue fails", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getById
				.mockResolvedValueOnce({ id: "assign-123", title: "Original" })
				.mockResolvedValueOnce({ id: "assign-123", title: "Original" })
			mocks.update.mockResolvedValue({ id: "assign-123", title: "Updated" })
			attemptRepo.getSubmittedAttemptsByAssignmentId.mockResolvedValue([{ id: "attempt-1" }])
			mockSendToQueue.mockRejectedValue(new Error("Queue error"))

			const result = await update("assign-123", { title: "Updated" } as any, "tenant-123", "user-123")

			// Should still succeed despite queue failure
			expect(result.status).toBe(true)
		})
	})

	describe("getSummaryByUserIdAndTenantId", () => {
		it("should return summary with calculated totals", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any
			tenantRoleRepo.getByUserId.mockResolvedValue([{ id: "role-1" }])
			mocks.countAvailableAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 10 }])
			mocks.countSubmittedAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 7 }])
			attemptRepo.getUserTotalPointAssignment.mockResolvedValue([{ sum: 850 }])

			const result = await getSummaryByUserIdAndTenantId("user-123", "tenant-123")

			expect(result.status).toBe(true)
			expect(result.data as any).toEqual({
				totalAvailableAssignment: 10,
				totalSubmittedAssignment: 7,
				totalUnsubmittedAssignment: 3,
				totalPointAssignment: 850,
			})
		})

		it("should handle zero assignments", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any
			tenantRoleRepo.getByUserId.mockResolvedValue([])
			mocks.countAvailableAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 0 }])
			mocks.countSubmittedAssignmentByUserIdAndTenantId.mockResolvedValue([{ count: 0 }])
			attemptRepo.getUserTotalPointAssignment.mockResolvedValue([{ sum: null }])

			const result = await getSummaryByUserIdAndTenantId("user-123", "tenant-123")

			expect(result.status).toBe(true)
			expect((result.data as any).totalUnsubmittedAssignment).toBe(0)
			expect((result.data as any).totalPointAssignment).toBe(0)
		})
	})

	describe("getUserListWithAssignmentSummaryByTenantId", () => {
		it("should calculate progress percentage", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getUserListWithAssignmentSummaryByTenantId.mockResolvedValue([
				{
					id: "user-1",
					fullName: "Alice",
					email: "alice@test.com",
					phoneNumber: "123",
					profilePicture: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					role: "USER",
					type: "INTERNAL",
					totalAssignment: 10,
					totalSubmittedAssignment: 7,
				},
			])

			const result = await getUserListWithAssignmentSummaryByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data[0].progressPercentage).toBe(70)
		})

		it("should return 0 progress when no assignments", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getUserListWithAssignmentSummaryByTenantId.mockResolvedValue([
				{
					id: "user-1",
					fullName: "Bob",
					email: "bob@test.com",
					phoneNumber: "456",
					profilePicture: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					role: "USER",
					type: "INTERNAL",
					totalAssignment: 0,
					totalSubmittedAssignment: 0,
				},
			])

			const result = await getUserListWithAssignmentSummaryByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data[0].progressPercentage).toBe(0)
		})
	})

	describe("getAssginmentWithUserSummaryByTenantId", () => {
		it("should calculate assignment progress percentage", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment") as any
			repoMocks.getAssginmentWithUserSummaryByTenantId.mockResolvedValue([
				{
					id: "assign-1",
					title: "Assignment 1",
					durationInMinutes: 60,
					status: "PUBLISHED",
					access: "TENANT",
					expiredDate: new Date(),
					totalUser: 20,
					totalUserSubmitted: 15,
				},
			])

			const result = await getAssginmentWithUserSummaryByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data[0].progressPercentage).toBe(75)
		})

		it("should return 0 progress when no users", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getAssginmentWithUserSummaryByTenantId.mockResolvedValue([
				{
					id: "assign-1",
					title: "Empty Assignment",
					durationInMinutes: 30,
					status: "PUBLISHED",
					access: "TENANT",
					expiredDate: new Date(),
					totalUser: 0,
					totalUserSubmitted: 0,
				},
			])

			const result = await getAssginmentWithUserSummaryByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data[0].progressPercentage).toBe(0)
		})
	})

	describe("getUserAssignmentList", () => {
		it("should return error when user not found in tenant", async () => {
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantIdAndUserId.mockResolvedValue(null)

			const result = await getUserAssignmentList("user-123", "tenant-123")

			expect(result.status).toBe(false)
		})

		it("should return assignment list for valid user", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantIdAndUserId.mockResolvedValue({ tenantRoleId: "role-1" })
			mocks.getAssignmentListByUserIdAndTenantIdAndTenantRoleId.mockResolvedValue([
				{ id: "assign-1", title: "Task 1" },
			])

			const result = await getUserAssignmentList("user-123", "tenant-123")

			expect(result.status).toBe(true)
		})
	})

	describe("getDetailUserAssignmentByUserIdAndTenantId", () => {
		it("should return error when assignment not found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getDetailUserAssignmentByUserIdAndTenantId.mockResolvedValue(null)

			const result = await getDetailUserAssignmentByUserIdAndTenantId("user-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("should return assignment data when user has not submitted", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getDetailUserAssignmentByUserIdAndTenantId.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				durationInMinutes: 60,
				status: "PUBLISHED",
				access: "TENANT",
				expiredDate: new Date(),
				tenantId: "tenant-123",
				createdAt: new Date(),
				updatedAt: new Date(),
				createdByUserId: "creator-1",
				isSubmitted: false,
				assignmentUserAttempts: [],
				assignmentQuestions: [
					{
						id: "q1",
						order: 1,
						content: "What is 2+2?",
						type: "MULTIPLE_CHOICE",
						assignmentQuestionOptions: [
							{ id: "opt-1", content: "3" },
							{ id: "opt-2", content: "4" },
						],
					},
				],
			})

			const result = await getDetailUserAssignmentByUserIdAndTenantId("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect((result.data as any).assignment.isSubmitted).toBe(false)
			expect((result.data as any).assignmentAttempt).toBeNull()
		})

		it("should return assignment with attempt data when user has submitted", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.getDetailUserAssignmentByUserIdAndTenantId.mockResolvedValue({
				id: "assign-123",
				title: "Submitted Assignment",
				durationInMinutes: 60,
				status: "PUBLISHED",
				access: "TENANT",
				expiredDate: new Date(),
				tenantId: "tenant-123",
				createdAt: new Date(),
				updatedAt: new Date(),
				createdByUserId: "creator-1",
				showAnswer: true,
				showQuestion: true,
				assignmentUserAttempts: [
					{
						id: "attempt-123",
						score: 80,
						percentageScore: 80,
						isSubmitted: true,
						submittedAt: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
						assignmentUserAttemptQuestionAnswers: [],
					},
				],
				assignmentQuestions: [
					{
						id: "q1",
						order: 1,
						content: "What is 2+2?",
						type: "MULTIPLE_CHOICE",
						assignmentQuestionOptions: [
							{ id: "opt-1", content: "3", isCorrectAnswer: false },
							{ id: "opt-2", content: "4", isCorrectAnswer: true },
						],
					},
					{
						id: "q2",
						order: 2,
						content: "What is photosynthesis?",
						type: "ESSAY",
						assignmentQuestionEssayReferenceAnswer: { content: "Process of converting sunlight" },
					},
					{
						id: "q3",
						order: 3,
						content: "True or false: water is H2O",
						type: "TRUE_FALSE",
						assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
					},
				],
			})

			const result = await getDetailUserAssignmentByUserIdAndTenantId("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect((result.data as any).assignment.isSubmitted).toBe(true)
			expect((result.data as any).assignmentAttempt.score).toBe(80)
		})
	})
})

// =========================================================
// Deep Edge Cases — untested paths from coverage analysis
// =========================================================
describe("AssignmentService — deep edge cases", () => {
	describe("create — repo error", () => {
		it("returns 500 when repository throws", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			mocks.create.mockRejectedValueOnce(new Error("DB connection lost"))

			const result = await create(
				{ title: "Test" } as any,
				"tenant-123",
				"user-123",
			)

			expect(result.status).toBe(false)
		})
	})

	describe("approveById — action variants", () => {
		it("logs REVISION action correctly", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const activityMocks = jest.requireMock("$services/UserActivityLogService") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
			})
			mocks.approveById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				status: "REVISION",
			})

			const result = await approveById("assign-123", "tenant-123", "user-123", {
				action: "REVISION",
				comment: "Needs improvement",
			})

			expect(result.status).toBe(true)
			expect(activityMocks.create).toHaveBeenCalledWith(
				"user-123",
				"Meminta revisi tugas",
				"tenant-123",
				expect.stringContaining("Test Assignment"),
			)
		})

		it("logs REJECT action correctly", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const activityMocks = jest.requireMock("$services/UserActivityLogService") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Rejected Assignment",
			})
			mocks.approveById.mockResolvedValue({
				id: "assign-123",
				title: "Rejected Assignment",
				status: "REJECTED",
			})

			const result = await approveById("assign-123", "tenant-123", "user-123", {
				action: "REJECT",
				comment: "Inappropriate content",
			})

			expect(result.status).toBe(true)
			expect(activityMocks.create).toHaveBeenCalledWith(
				"user-123",
				"Menolak (Freeze) tugas",
				"tenant-123",
				expect.stringContaining("Rejected Assignment"),
			)
		})
	})

	describe("getStatistics — zero submission edge cases", () => {
		it("returns zero averages when no submissions", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Unsubmitted Assignment",
				tenantId: "tenant-123",
				status: "PUBLISHED",
				showQuestion: true,
				showAnswer: true,
			})
			attemptRepo.getSubmittedAttemptsByAssignmentId.mockResolvedValue([])
			mocks.getTotalAssignedUsers.mockResolvedValue(5)
			mocks.getQuestionAnalytics.mockResolvedValue([])

			const result = await getStatistics("assign-123", "tenant-123")

			expect(result.status).toBe(true)
			const stats = (result.data as any).stats
			expect(stats.totalSubmittedUsers).toBe(0)
			expect(stats.averageScore).toBe(0)
			expect(stats.averageTimeInMinutes).toBe(0)
			expect(stats.completionRate).toBe(0)
		})

		it("returns zero completion rate when no assigned users", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const attemptRepo = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test",
				tenantId: "tenant-123",
				status: "PUBLISHED",
				showQuestion: true,
				showAnswer: true,
			})
			attemptRepo.getSubmittedAttemptsByAssignmentId.mockResolvedValue([])
			mocks.getTotalAssignedUsers.mockResolvedValue(0)
			mocks.getQuestionAnalytics.mockResolvedValue([])

			const result = await getStatistics("assign-123", "tenant-123")

			expect(result.status).toBe(true)
			expect((result.data as any).stats.completionRate).toBe(0)
		})
	})

	describe("sendAssignmentAssignedNotification — default access branch", () => {
		it("does nothing for unknown access type (default branch)", async () => {
			const mocks = jest.requireMock("$repositories/Assignment") as any
			const notifyMocks = jest.requireMock("$services/NotificationService") as any
			// @ts-ignore — casting to a non-standard access type
			mocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Test Assignment",
				access: "TENANT", // not TENANT_ROLE or USER
				assignmentTenantRoleAccesses: [],
				assignmentUserAccesses: [],
			})

			await sendAssignmentAssignedNotification("assign-123", "tenant-123")

			expect(notifyMocks.notifyTenantRoleUsers).not.toHaveBeenCalled()
			expect(notifyMocks.notifySpecificUsers).not.toHaveBeenCalled()
		})
	})
})

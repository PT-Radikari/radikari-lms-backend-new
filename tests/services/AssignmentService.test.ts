/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

let mockSendToQueue = jest.fn<any>()

jest.mock("$repositories/Assignment", () => {
	const mockCreate = jest.fn<any>()
	const mockGetAll = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	const mockApproveById = jest.fn<any>()
	const mockGetTotalAssignmentByTenantId = jest.fn<any>()
	const mockGetTotalCompletedAssignmentByTenantId = jest.fn<any>()
	const mockGetTotalAssignmentByStatus = jest.fn<any>()
	const mockGetTotalAssignedUsers = jest.fn<any>()
	const mockGetQuestionAnalytics = jest.fn<any>()
	return {
		create: mockCreate,
		getAll: mockGetAll,
		getById: mockGetById,
		deleteById: mockDeleteById,
		approveById: mockApproveById,
		getTotalAssignmentByTenantId: mockGetTotalAssignmentByTenantId,
		getTotalCompletedAssignmentByTenantId: mockGetTotalCompletedAssignmentByTenantId,
		getTotalAssignmentByStatus: mockGetTotalAssignmentByStatus,
		getTotalAssignedUsers: mockGetTotalAssignedUsers,
		getQuestionAnalytics: mockGetQuestionAnalytics,
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
	deleteById,
	approveById,
	getSummaryByTenantId,
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
		mocks.deleteById.mockResolvedValue(undefined)
		mocks.approveById.mockResolvedValue(null)
		mocks.getTotalAssignmentByTenantId.mockResolvedValue(0)
		mocks.getTotalCompletedAssignmentByTenantId.mockResolvedValue(0)
		mocks.getTotalAssignmentByStatus.mockResolvedValue(0)
		mocks.getTotalAssignedUsers.mockResolvedValue(0)
		mocks.getQuestionAnalytics.mockResolvedValue([])
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
})

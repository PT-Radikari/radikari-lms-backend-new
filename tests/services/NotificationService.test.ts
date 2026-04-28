/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	createMany,
	notifyTenantUsers,
	notifyTenantRoleUsers,
	notifySpecificUsers,
	getByUserId,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteById,
} from "$services/NotificationService"
import { NotificationType } from "$generated/prisma/client"

jest.mock("$repositories/NotificationRepository", () => {
	const mockNotificationCreate = jest.fn<any>()
	const mockNotificationCreateMany = jest.fn<any>()
	const mockNotificationGetByUserId = jest.fn<any>()
	const mockNotificationGetById = jest.fn<any>()
	const mockNotificationGetUnreadCount = jest.fn<any>()
	const mockNotificationMarkAsRead = jest.fn<any>()
	const mockNotificationMarkAllAsRead = jest.fn<any>()
	const mockNotificationDeleteById = jest.fn<any>()
	return {
		create: mockNotificationCreate,
		createMany: mockNotificationCreateMany,
		getByUserId: mockNotificationGetByUserId,
		getById: mockNotificationGetById,
		getUnreadCount: mockNotificationGetUnreadCount,
		markAsRead: mockNotificationMarkAsRead,
		markAllAsRead: mockNotificationMarkAllAsRead,
		deleteById: mockNotificationDeleteById,
	}
})

jest.mock("$repositories/TenantUserRepository", () => ({
	getByTenantId: jest.fn<any>(),
	getByTenantRoleId: jest.fn<any>(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

describe("NotificationService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("create", () => {
		it("should create notification successfully", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.create.mockResolvedValue({
				id: "notif-123",
				title: "Test Notification",
			})

			const result = await create({
				userId: "user-123",
				tenantId: "tenant-123",
				type: NotificationType.SYSTEM,
				title: "Test Notification",
				message: "Test message",
			} as any)

			expect(result.status).toBe(true)
			expect(mocks.create).toHaveBeenCalled()
		})
	})

	describe("createMany", () => {
		it("should create many notifications successfully", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.createMany.mockResolvedValue(undefined)

			const result = await createMany({
				userIds: ["user-1", "user-2"],
				tenantId: "tenant-123",
				type: NotificationType.SYSTEM,
				title: "Bulk Notification",
				message: "Sent to many",
			} as any)

			expect(result.status).toBe(true)
			expect(mocks.createMany).toHaveBeenCalled()
		})
	})

	describe("notifyTenantUsers", () => {
		it("should notify all tenant users successfully", async () => {
			const notifyMocks = jest.requireMock("$repositories/NotificationRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantId.mockResolvedValue([
				{ userId: "user-1" },
				{ userId: "user-2" },
			])
			notifyMocks.createMany.mockResolvedValue(undefined)

			const result = await notifyTenantUsers(
				"tenant-123",
				NotificationType.SYSTEM,
				"Tenant Announcement",
				"Announcement content",
			)

			expect(result.status).toBe(true)
			expect(notifyMocks.createMany).toHaveBeenCalled()
		})

		it("should exclude specific user when excludeUserId provided", async () => {
			const notifyMocks = jest.requireMock("$repositories/NotificationRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantId.mockResolvedValue([
				{ userId: "user-1" },
				{ userId: "user-2" },
				{ userId: "user-3" },
			])
			notifyMocks.createMany.mockResolvedValue(undefined)

			await notifyTenantUsers(
				"tenant-123",
				NotificationType.SYSTEM,
				"Announcement",
				"Content",
				undefined,
				"user-2",
			)

			const createManyCall = notifyMocks.createMany.mock.calls[0][0]
			expect(createManyCall.userIds).not.toContain("user-2")
		})

		it("should return success when no users in tenant", async () => {
			const notifyMocks = jest.requireMock("$repositories/NotificationRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantId.mockResolvedValue([])

			const result = await notifyTenantUsers(
				"tenant-123",
				NotificationType.SYSTEM,
				"Announcement",
				"Content",
			)

			expect(result.status).toBe(true)
			expect(notifyMocks.createMany).not.toHaveBeenCalled()
		})
	})

	describe("notifyTenantRoleUsers", () => {
		it("should notify users with specific tenant role", async () => {
			const notifyMocks = jest.requireMock("$repositories/NotificationRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantRoleId.mockResolvedValue([
				{ userId: "user-1" },
				{ userId: "user-2" },
			])
			notifyMocks.createMany.mockResolvedValue(undefined)

			const result = await notifyTenantRoleUsers(
				"tenant-123",
				"role-123",
				NotificationType.SYSTEM,
				"Role Announcement",
				"Content",
			)

			expect(result.status).toBe(true)
			expect(notifyMocks.createMany).toHaveBeenCalled()
		})

		it("should return error when no users found with role", async () => {
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByTenantRoleId.mockResolvedValue([])

			const result = await notifyTenantRoleUsers(
				"tenant-123",
				"nonexistent-role",
				NotificationType.SYSTEM,
				"Announcement",
				"Content",
			)

			expect(result.status).toBe(false)
		})
	})

	describe("notifySpecificUsers", () => {
		it("should notify specific users successfully", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.createMany.mockResolvedValue(undefined)

			const result = await notifySpecificUsers(
				["user-1", "user-2"],
				"tenant-123",
				NotificationType.SYSTEM,
				"Specific Notification",
				"Content",
			)

			expect(result.status).toBe(true)
			expect(mocks.createMany).toHaveBeenCalled()
		})

		it("should return success when userIds array is empty", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			const result = await notifySpecificUsers(
				[],
				"tenant-123",
				NotificationType.SYSTEM,
				"Notification",
				"Content",
			)

			expect(result.status).toBe(true)
			expect(mocks.createMany).not.toHaveBeenCalled()
		})
	})

	describe("getByUserId", () => {
		it("should return paginated notifications", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			const mockData = {
				data: [{ id: "notif-1" }, { id: "notif-2" }],
				total: 2,
			}
			mocks.getByUserId.mockResolvedValue(mockData)

			const result = await getByUserId("user-123", {} as any)

			expect(result.status).toBe(true)
		})
	})

	describe("getUnreadCount", () => {
		it("should return unread count", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getUnreadCount.mockResolvedValue(5)

			const result = await getUnreadCount("user-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual({ count: 5 })
		})
	})

	describe("markAsRead", () => {
		it("should mark notification as read successfully", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getById.mockResolvedValue({
				id: "notif-123",
				userId: "user-123",
			})
			mocks.markAsRead.mockResolvedValue(undefined)

			const result = await markAsRead("notif-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.markAsRead).toHaveBeenCalled()
		})

		it("should return error when notification not found", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await markAsRead("nonexistent", "user-123")

			expect(result.status).toBe(false)
		})

		it("should return error when unauthorized", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getById.mockResolvedValue({
				id: "notif-123",
				userId: "other-user",
			})

			const result = await markAsRead("notif-123", "user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("markAllAsRead", () => {
		it("should mark all notifications as read", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.markAllAsRead.mockResolvedValue(undefined)

			const result = await markAllAsRead("user-123")

			expect(result.status).toBe(true)
			expect(mocks.markAllAsRead).toHaveBeenCalled()
		})
	})

	describe("deleteById", () => {
		it("should delete notification successfully", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getById.mockResolvedValue({
				id: "notif-123",
				userId: "user-123",
			})
			mocks.deleteById.mockResolvedValue(undefined)

			const result = await deleteById("notif-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.deleteById).toHaveBeenCalled()
		})

		it("should return error when notification not found", async () => {
			const mocks = jest.requireMock("$repositories/NotificationRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await deleteById("nonexistent", "user-123")

			expect(result.status).toBe(false)
		})
	})
})

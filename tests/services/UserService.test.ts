/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	getAll,
	getById,
	update,
	deleteById,
	getInvitableForTenant,
	getMe,
	restoreById,
} from "$services/UserService"
import { Roles } from "$generated/prisma/client"

jest.mock("$repositories/UserRepository", () => {
	const mockCreate = jest.fn<any>()
	const mockGetAll = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockUpdate = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	const mockRestoreById = jest.fn<any>()
	const mockGetInvitableForTenant = jest.fn<any>()
	const mockGetMe = jest.fn<any>()
	return {
		create: mockCreate,
		getAll: mockGetAll,
		getById: mockGetById,
		update: mockUpdate,
		deleteById: mockDeleteById,
		restoreById: mockRestoreById,
		getInvitableForTenant: mockGetInvitableForTenant,
		getMe: mockGetMe,
	}
})

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

describe("UserService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("create", () => {
		it("should create user successfully", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.create.mockResolvedValue({
				id: "user-123",
				email: "test@example.com",
				fullName: "Test User",
			})

			const result = await create({
				email: "test@example.com",
				fullName: "Test User",
				password: "password123",
				phoneNumber: "123456",
				role: Roles.USER,
			} as any)

			expect(result.status).toBe(true)
			expect(mocks.create).toHaveBeenCalled()
		})
	})

	describe("getAll", () => {
		it("should return paginated users for admin", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockData = { data: [{ id: "user-1" }], total: 1 }
			mocks.getAll.mockResolvedValue(mockData)

			const result = await getAll({} as any, { id: "admin-1", role: Roles.ADMIN } as any)

			expect(result.status).toBe(true)
		})

		it("should scope results to tenant for non-admin", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockData = { data: [{ id: "user-1" }], total: 1 }
			mocks.getAll.mockResolvedValue(mockData)
			mocks.getMe.mockResolvedValue({
				id: "user-1",
				tenantUser: [{ tenantId: "tenant-123" }],
			})

			const result = await getAll({} as any, { id: "user-1", role: Roles.USER } as any)

			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("should return user when found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue({
				id: "user-123",
				email: "test@example.com",
				password: "hashed",
			})

			const result = await getById("user-123")

			expect(result.status).toBe(true)
			expect(result.data).not.toHaveProperty("password")
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await getById("nonexistent")

			expect(result.status).toBe(false)
		})
	})

	describe("update", () => {
		it("should update user successfully", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue({ id: "user-123" })
			mocks.update.mockResolvedValue({ id: "user-123", fullName: "Updated Name" })

			const result = await update("user-123", { fullName: "Updated Name" } as any)

			expect(result.status).toBe(true)
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await update("nonexistent", { fullName: "Name" } as any)

			expect(result.status).toBe(false)
		})
	})

	describe("deleteById", () => {
		it("should delete user successfully", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.deleteById.mockResolvedValue(undefined)

			const result = await deleteById("user-123")

			expect(result.status).toBe(true)
			expect(mocks.deleteById).toHaveBeenCalled()
		})
	})

	describe("restoreById", () => {
		it("should restore user successfully", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.restoreById.mockResolvedValue(undefined)

			const result = await restoreById("user-123")

			expect(result.status).toBe(true)
			expect(mocks.restoreById).toHaveBeenCalled()
		})
	})

	describe("getInvitableForTenant", () => {
		it("should return invitable users for tenant", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockData = { data: [{ id: "user-1" }, { id: "user-2" }], total: 2 }
			mocks.getInvitableForTenant.mockResolvedValue(mockData)

			const result = await getInvitableForTenant("tenant-123", {} as any)

			expect(result.status).toBe(true)
		})
	})

	describe("getMe", () => {
		it("should return user profile with tenant info", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getMe.mockResolvedValue({
				id: "user-123",
				email: "test@example.com",
				fullName: "Test User",
				role: Roles.USER,
				type: "INTERNAL",
				password: "hashed",
				tenantUser: [
					{ id: "tu-1", tenantId: "tenant-123", tenantRoleId: "role-123" },
				],
			})

			const result = await getMe("user-123")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("tenantUserCount", 1)
			expect(result.data).not.toHaveProperty("password")
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getMe.mockResolvedValue(null)

			const result = await getMe("nonexistent")

			expect(result.status).toBe(false)
		})
	})
})

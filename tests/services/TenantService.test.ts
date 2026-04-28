/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/TenantRepository", () => {
	const mockCreate = jest.fn<any>()
	const mockGetAll = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockDeleteById = jest.fn<any>()
	const mockAddTenantUser = jest.fn<any>()
	const mockGetAllByUserId = jest.fn<any>()
	const mockUpsertSetting = jest.fn<any>()
	const mockGetAllSettings = jest.fn<any>()
	return {
		create: mockCreate,
		getAll: mockGetAll,
		getById: mockGetById,
		deleteById: mockDeleteById,
		addTenantUser: mockAddTenantUser,
		getAllByUserId: mockGetAllByUserId,
		upsertSetting: mockUpsertSetting,
		getAllSettings: mockGetAllSettings,
	}
})

jest.mock("$repositories/OperationRepository", () => {
	const mockFindByName = jest.fn<any>()
	const mockCreate = jest.fn<any>()
	return { findByName: mockFindByName, create: mockCreate }
})

jest.mock("$repositories/Assignment/AssignmentAttemptRepository", () => ({
	getUserTotalPointAssignment: jest.fn<any>(),
}))

jest.mock("$services/UserActivityLogService", () => ({ create: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

import {
	create,
	getAll,
	getById,
	deleteById,
	addMember,
	getUserPoints,
	upsertSetting,
	getSettings,
} from "$services/TenantService"

describe("TenantService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("create", () => {
		it("should create tenant successfully", async () => {
			const tenantMocks = jest.requireMock("$repositories/TenantRepository") as any
			const opMocks = jest.requireMock("$repositories/OperationRepository") as any
			opMocks.findByName.mockResolvedValue({ id: "existing-op" })
			tenantMocks.create.mockResolvedValue({ id: "tenant-123", name: "Test Tenant" })

			const result = await create({ name: "Test Tenant" } as any, "user-123")

			expect(result.status).toBe(true)
			expect(tenantMocks.create).toHaveBeenCalled()
		})

		it("should create mock operation when operationId not provided and no existing operation", async () => {
			const tenantMocks = jest.requireMock("$repositories/TenantRepository") as any
			const opMocks = jest.requireMock("$repositories/OperationRepository") as any
			opMocks.findByName.mockResolvedValue(null)
			opMocks.create.mockResolvedValue({ id: "new-op", name: "Mock Operation" })
			tenantMocks.create.mockResolvedValue({ id: "tenant-123", name: "Test Tenant" })

			const result = await create({ name: "Test Tenant" } as any, "user-123")

			expect(result.status).toBe(true)
			expect(opMocks.create).toHaveBeenCalled()
		})
	})

	describe("getAll", () => {
		it("should return paginated tenants", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getAll.mockResolvedValue({ data: [{ id: "tenant-1" }], total: 1 })

			const result = await getAll({} as any)

			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("should return tenant when found", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue({ id: "tenant-123", name: "Test Tenant" })

			const result = await getById("tenant-123")

			expect(result.status).toBe(true)
		})

		it("should return error when tenant not found", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await getById("nonexistent")

			expect(result.status).toBe(false)
		})
	})

	describe("deleteById", () => {
		it("should delete tenant successfully", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue({ id: "tenant-123", name: "Test Tenant" })
			mocks.deleteById.mockResolvedValue(undefined)

			const result = await deleteById("tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.deleteById).toHaveBeenCalled()
		})

		it("should return error when tenant not found", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await deleteById("nonexistent", "user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("addMember", () => {
		it("should add member successfully", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue({ id: "tenant-123" })
			mocks.addTenantUser.mockResolvedValue(undefined)

			const result = await addMember("tenant-123", "user-123", "role-123")

			expect(result.status).toBe(true)
			expect(mocks.addTenantUser).toHaveBeenCalledWith("tenant-123", "user-123", "role-123")
		})

		it("should return error when tenant not found", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await addMember("nonexistent", "user-123", "role-123")

			expect(result.status).toBe(false)
		})

		it("should return error on unique constraint violation", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue({ id: "tenant-123" })
			const error = new Error("Unique constraint")
			;(error as any).code = "P2002"
			mocks.addTenantUser.mockRejectedValue(error)

			const result = await addMember("tenant-123", "user-123", "role-123")

			expect(result.status).toBe(false)
		})
	})

	describe("getUserPoints", () => {
		it("should return user points successfully", async () => {
			const mocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getUserTotalPointAssignment.mockResolvedValue([{ sum: 150 }])

			const result = await getUserPoints("tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual({ totalPoints: 150 })
		})

		it("should return 0 when no points found", async () => {
			const mocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			mocks.getUserTotalPointAssignment.mockResolvedValue([])

			const result = await getUserPoints("tenant-123", "user-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual({ totalPoints: 0 })
		})
	})

	describe("upsertSetting", () => {
		it("should upsert setting successfully", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.upsertSetting.mockResolvedValue({ key: "theme", value: "dark" })

			const result = await upsertSetting("tenant-123", "theme", "dark", "user-123")

			expect(result.status).toBe(true)
			expect(mocks.upsertSetting).toHaveBeenCalledWith("tenant-123", "theme", "dark")
		})
	})

	describe("getSettings", () => {
		it("should return all settings", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getAllSettings.mockResolvedValue([
				{ key: "theme", value: "dark" },
				{ key: "language", value: "en" },
			])

			const result = await getSettings("tenant-123")

			expect(result.status).toBe(true)
		})
	})
})

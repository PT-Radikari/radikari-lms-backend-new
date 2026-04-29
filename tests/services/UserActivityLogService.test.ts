/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/UserActivityLogRepository", () => ({
	getAll: jest.fn<any>(),
	getById: jest.fn<any>(),
	create: jest.fn<any>(),
}))

jest.mock("$repositories/TenantRepository", () => ({ getById: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({ info: jest.fn<any>(), error: jest.fn<any>() }))

import { getAll, getById, create } from "$services/UserActivityLogService"

describe("UserActivityLogService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("getAll", () => {
		it("should return paginated logs", async () => {
			const mocks = jest.requireMock("$repositories/UserActivityLogRepository") as any
			mocks.getAll.mockResolvedValue({ data: [], total: 0 })
			const result = await getAll({} as any)
			expect(result.status).toBe(true)
		})
	})

	describe("getById", () => {
		it("should return log when found", async () => {
			const mocks = jest.requireMock("$repositories/UserActivityLogRepository") as any
			mocks.getById.mockResolvedValue({ id: "log-123", action: "Test" })
			const result = await getById("log-123")
			expect(result.status).toBe(true)
		})

		it("should return error when not found", async () => {
			const mocks = jest.requireMock("$repositories/UserActivityLogRepository") as any
			mocks.getById.mockResolvedValue(null)
			const result = await getById("nonexistent")
			expect(result.status).toBe(false)
		})
	})

	describe("create", () => {
		it("should append tenant name to action when tenant exists", async () => {
			const logMock = jest.requireMock("$repositories/UserActivityLogRepository") as any
			const tenantMock = jest.requireMock("$repositories/TenantRepository") as any
			tenantMock.getById.mockResolvedValue({ id: "t-1", name: "ACME Corp" })
			logMock.create.mockResolvedValue(undefined)
			await create("user-1", "Membuat posting", "t-1")
			expect(logMock.create).toHaveBeenCalledWith("user-1", "Membuat posting di tenant ACME Corp")
		})

		it("should append additionalInformation to action", async () => {
			const logMock = jest.requireMock("$repositories/UserActivityLogRepository") as any
			const tenantMock = jest.requireMock("$repositories/TenantRepository") as any
			tenantMock.getById.mockResolvedValue({ id: "t-1", name: "ACME" })
			logMock.create.mockResolvedValue(undefined)
			await create("user-1", "Membuat posting", "t-1", "di halaman forum")
			expect(logMock.create).toHaveBeenCalledWith("user-1", "Membuat posting di tenant ACME di halaman forum")
		})

		it("should not throw when repo throws (swallows error)", async () => {
			const logMock = jest.requireMock("$repositories/UserActivityLogRepository") as any
			const tenantMock = jest.requireMock("$repositories/TenantRepository") as any
			tenantMock.getById.mockResolvedValue(null)
			logMock.create.mockRejectedValue(new Error("DB error"))
			await expect(create("user-1", "Test action", "nonexistent")).resolves.toBeUndefined()
		})

		it("calls getById with undefined when tenantId is undefined (service still calls repo)", async () => {
			const logMock = jest.requireMock("$repositories/UserActivityLogRepository") as any
			const tenantMock = jest.requireMock("$repositories/TenantRepository") as any
			tenantMock.getById.mockResolvedValue(null)
			logMock.create.mockResolvedValue(undefined)
			await create("user-1", "Test action", undefined as any)
			expect(tenantMock.getById).toHaveBeenCalledWith(undefined)
			expect(logMock.create).toHaveBeenCalledWith("user-1", "Test action")
		})
	})
})

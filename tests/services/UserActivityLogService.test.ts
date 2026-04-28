/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/UserActivityLogRepository", () => ({
	getAll: jest.fn<any>(),
	getById: jest.fn<any>(),
	create: jest.fn<any>(),
}))

jest.mock("$repositories/TenantRepository", () => ({ getById: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({ info: jest.fn<any>(), error: jest.fn<any>() }))

import { getAll, getById } from "$services/UserActivityLogService"

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
})

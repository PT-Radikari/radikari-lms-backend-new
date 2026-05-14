/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/TenantRoleRepository", () => ({ getAll: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({ info: jest.fn<any>(), error: jest.fn<any>() }))

import { getAll } from "$services/TenantRoleService"

describe("TenantRoleService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("getAll", () => {
		it("should return all tenant roles for a specific tenant", async () => {
			const mocks = jest.requireMock("$repositories/TenantRoleRepository") as any
			const mockRoles = [
				{ id: "role-1", name: "Admin", tenantId: "tenant-123" },
				{ id: "role-2", name: "User", tenantId: "tenant-123" },
			] as any
			mocks.getAll.mockResolvedValue({ data: mockRoles, total: 2 })
			const result = await getAll({} as any)
			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("data")
		})

		it("should return error on exception", async () => {
			const mocks = jest.requireMock("$repositories/TenantRoleRepository") as any
			mocks.getAll.mockRejectedValue(new Error("DB error"))
			const result = await getAll({} as any)
			expect(result.status).toBe(false)
		})
	})
})

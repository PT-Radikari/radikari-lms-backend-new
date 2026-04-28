/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	create,
	assignUserTenantByTenantId,
	getByTenantId,
	getAll,
} from "$services/TenanUserService"

const mockCreateTenantUser = jest.fn<any>()
const mockGetByTenantId = jest.fn<any>()
const mockUpdateTenantUser = jest.fn<any>()
const mockGetAll = jest.fn<any>()
const mockTenantGetById = jest.fn<any>()
const mockUserGetById = jest.fn<any>()
const mockTenantRoleGetById = jest.fn<any>()

jest.mock("$repositories/TenantUserRepository", () => ({
	createTenantUser: (...args: any[]) => mockCreateTenantUser(...args),
	getByTenantId: (...args: any[]) => mockGetByTenantId(...args),
	updateTenantUser: (...args: any[]) => mockUpdateTenantUser(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
}))

jest.mock("$repositories/TenantRepository", () => ({
	getById: (...args: any[]) => mockTenantGetById(...args),
}))

jest.mock("$repositories/UserRepository", () => ({
	getById: (...args: any[]) => mockUserGetById(...args),
}))

jest.mock("$repositories/TenantRoleRepository", () => ({
	getById: (...args: any[]) => mockTenantRoleGetById(...args),
}))

jest.mock("$pkg/logger", () => {
	return {
		__esModule: true,
		default: {
			info: jest.fn(),
			error: jest.fn(),
		},
	}
})

describe("TenanUserService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should create tenant user successfully", async () => {
			const mockTenantUser = {
				id: "tu-123",
				tenantId: "tenant-123",
				userId: "user-123",
				tenantRoleId: "role-123",
			}
			mockCreateTenantUser.mockResolvedValue(mockTenantUser)

			const result = await create("tenant-123", {
				userId: "user-123",
				tenantRoleId: "role-123",
			} as any)

			expect(result.status).toBe(true)
			expect(mockCreateTenantUser).toHaveBeenCalled()
		})

		it("should handle errors and return 500", async () => {
			mockCreateTenantUser.mockRejectedValue(new Error("DB error"))

			const result = await create("tenant-123", {
				userId: "user-123",
				tenantRoleId: "role-123",
			} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("assignUserTenantByTenantId", () => {
		it("should assign users to tenant successfully", async () => {
			const mockTenant = { id: "tenant-123", name: "Test Tenant" }
			const mockUser = { id: "user-123", fullName: "John" }
			const mockRole = { id: "role-123", name: "Admin" }

			mockTenantGetById.mockResolvedValue(mockTenant)
			mockUserGetById.mockResolvedValue(mockUser)
			mockTenantRoleGetById.mockResolvedValue(mockRole)
			mockUpdateTenantUser.mockResolvedValue([])

			const result = await assignUserTenantByTenantId("tenant-123", [
				{ userId: "user-123", tenantRoleId: "role-123" },
			] as any)

			expect(result.status).toBe(true)
			expect(mockUpdateTenantUser).toHaveBeenCalled()
		})

		it("should return 404 when tenant not found", async () => {
			mockTenantGetById.mockResolvedValue(null)

			const result = await assignUserTenantByTenantId("invalid-tenant", [
				{ userId: "user-123", tenantRoleId: "role-123" },
			] as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should handle errors and return 500", async () => {
			mockTenantGetById.mockRejectedValue(new Error("DB error"))

			const result = await assignUserTenantByTenantId("tenant-123", [
				{ userId: "user-123", tenantRoleId: "role-123" },
			] as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("getByTenantId", () => {
		it("should return tenant users successfully", async () => {
			const mockTenant = { id: "tenant-123" }
			const mockTenantUsers = [
				{
					id: "tu-1",
					userId: "user-1",
					tenantRole: { id: "role-1", name: "Admin" },
				},
			]
			mockTenantGetById.mockResolvedValue(mockTenant)
			mockGetByTenantId.mockResolvedValue(mockTenantUsers)

			const result = await getByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockTenantUsers)
		})

		it("should return 404 when tenant not found", async () => {
			mockTenantGetById.mockResolvedValue(null)

			const result = await getByTenantId("invalid-tenant")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})
	})

	describe("getAll", () => {
		it("should return paginated tenant users", async () => {
			const mockData = {
				entries: [
					{ id: "tu-1", userId: "user-1" },
				],
				count: 1,
			}
			mockGetAll.mockResolvedValue(mockData)

			const result = await getAll({ page: 1, rows: 10 } as any)

			expect(result.status).toBe(true)
			expect((result as any).data.entries).toEqual(mockData.entries)
			expect((result as any).data.totalData).toBe(1)
		})

		it("should handle errors and return 500", async () => {
			mockGetAll.mockRejectedValue(new Error("DB error"))

			const result = await getAll({} as any)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})
})

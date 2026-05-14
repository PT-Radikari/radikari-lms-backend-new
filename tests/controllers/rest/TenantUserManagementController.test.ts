/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { Roles } from "$generated/prisma/client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTenantUserFindMany = jest.fn<any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTenantUserFindUnique = jest.fn<any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTenantUserDelete = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		tenantUser: {
			findMany: (...args: any[]) => mockTenantUserFindMany(...args),
			findUnique: (...args: any[]) => mockTenantUserFindUnique(...args),
			delete: (...args: any[]) => mockTenantUserDelete(...args),
		},
	},
}))

import * as TenantUserManagementController from "$controllers/rest/TenantUserManagementController"

const mockUserJWTAdmin = {
	id: "admin-test-123",
	email: "admin@example.com",
	fullName: "Test Admin",
	role: Roles.ADMIN,
	phoneNumber: "08123456789",
	tenantId: "tenant-test-123",
} as any

describe("TenantUserManagementController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getAllByTenant", () => {
		it("should return 200 with user list on success", async () => {
			const mockRows = [
				{
					id: "tu-123",
					user: { id: "user-123", fullName: "Test User", email: "test@example.com" },
					tenantRole: { id: "role-123", name: "Member" },
				},
			]
			mockTenantUserFindMany.mockResolvedValue(mockRows)

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await TenantUserManagementController.getAllByTenant(mock)

			expect(mockTenantUserFindMany).toHaveBeenCalledWith({
				where: { tenantId: "tenant-test-123" },
				include: {
					user: { select: expect.any(Object) },
					tenantRole: true,
				},
				orderBy: { user: { fullName: "asc" } },
			})
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockRows,
				message: "OK",
			})
		})

		it("should return 400 when tenantId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: {},
			})

			await TenantUserManagementController.getAllByTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("should return 500 on database error", async () => {
			mockTenantUserFindMany.mockRejectedValue(new Error("DB error"))

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await TenantUserManagementController.getAllByTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	describe("getByUserIdInTenant", () => {
		it("should return 200 with user membership on success", async () => {
			const mockRow = {
				id: "tu-123",
				user: { id: "user-123", fullName: "Test User", email: "test@example.com" },
				tenantRole: { id: "role-123", name: "Member" },
			}
			mockTenantUserFindUnique.mockResolvedValue(mockRow)

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "user-123" },
			})

			await TenantUserManagementController.getByUserIdInTenant(mock)

			expect(mockTenantUserFindUnique).toHaveBeenCalledWith({
				where: { userId_tenantId: { userId: "user-123", tenantId: "tenant-test-123" } },
				include: { user: { select: expect.any(Object) }, tenantRole: true },
			})
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockRow,
				message: "OK",
			})
		})

		it("should return 400 when tenantId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { userId: "user-123" },
			})

			await TenantUserManagementController.getByUserIdInTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("should return 400 when userId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await TenantUserManagementController.getByUserIdInTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("should return 404 when membership not found", async () => {
			mockTenantUserFindUnique.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "user-123" },
			})

			await TenantUserManagementController.getByUserIdInTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// NOTE: createAndAssignToTenant is skipped because it uses Bun.password.hash
	// NOTE: updateUserInTenant is skipped because it uses Bun.password.hash

	describe("removeUserFromTenant", () => {
		it("should return 200 on successful removal", async () => {
			mockTenantUserFindUnique.mockResolvedValue({
				user: { id: "user-123", role: Roles.USER },
			})
			mockTenantUserDelete.mockResolvedValue({})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "user-123" },
				jwtPayload: mockUserJWTAdmin,
			})

			await TenantUserManagementController.removeUserFromTenant(mock)

			expect(mockTenantUserDelete).toHaveBeenCalledWith({
				where: { userId_tenantId: { userId: "user-123", tenantId: "tenant-test-123" } },
			})
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: null,
				message: "User removed from tenant",
			})
		})

		it("should return 400 when trying to remove self", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "admin-test-123" },
				jwtPayload: mockUserJWTAdmin,
			})

			await TenantUserManagementController.removeUserFromTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "You cannot remove yourself",
			})
		})

		it("should return 403 when non-admin tries to remove ADMIN user", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockTenantUserFindUnique.mockResolvedValue({
				user: { id: "admin-123", role: Roles.ADMIN },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "admin-123" },
				jwtPayload: nonAdminUser,
			})

			await TenantUserManagementController.removeUserFromTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "You cannot remove ADMIN user",
			})
		})

		it("should return 404 when membership not found", async () => {
			mockTenantUserFindUnique.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "user-123" },
				jwtPayload: mockUserJWTAdmin,
			})

			await TenantUserManagementController.removeUserFromTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})

		it("should return 500 on database error", async () => {
			mockTenantUserFindUnique.mockRejectedValue(new Error("DB error"))

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123", userId: "user-123" },
				jwtPayload: mockUserJWTAdmin,
			})

			await TenantUserManagementController.removeUserFromTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})
})

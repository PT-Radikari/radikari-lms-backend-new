/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUser, mockUserAdmin } from "$factories/user"
import { mockTenant } from "$factories/tenant"
import { Roles } from "$generated/prisma/client"

let mockCreate = jest.fn<any>()
let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()
let mockGetAllByUserId = jest.fn<any>()
let mockAddMember = jest.fn<any>()
let mockUpsertSetting = jest.fn<any>()
let mockGetSettings = jest.fn<any>()
let mockGetUserPoints = jest.fn<any>()

let mockGetInvitableForTenant = jest.fn<any>()

let mockGetByTenantId = jest.fn<any>()
let mockGetAllTenant = jest.fn<any>()
let mockAssignUserTenantByTenantId = jest.fn<any>()
let mockCreateTenantUser = jest.fn<any>()

let mockGetAllRoles = jest.fn<any>()

const mockPrismaTenantUserFindFirst = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/TenantService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
	getAllByUserId: (...args: any[]) => mockGetAllByUserId(...args),
	addMember: (...args: any[]) => mockAddMember(...args),
	upsertSetting: (...args: any[]) => mockUpsertSetting(...args),
	getSettings: (...args: any[]) => mockGetSettings(...args),
	getUserPoints: (...args: any[]) => mockGetUserPoints(...args),
}))

jest.mock("$services/UserService", () => ({
	getInvitableForTenant: (...args: any[]) => mockGetInvitableForTenant(...args),
}))

jest.mock("$services/TenanUserService", () => ({
	getByTenantId: (...args: any[]) => mockGetByTenantId(...args),
	getAll: (...args: any[]) => mockGetAllTenant(...args),
	assignUserTenantByTenantId: (...args: any[]) => mockAssignUserTenantByTenantId(...args),
	create: (...args: any[]) => mockCreateTenantUser(...args),
}))

jest.mock("$services/TenantRoleService", () => ({
	getAll: (...args: any[]) => mockGetAllRoles(...args),
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		tenantUser: {
			findFirst: (...args: any[]) => mockPrismaTenantUserFindFirst(...args),
		},
	},
}))

import * as TenantController from "$controllers/rest/TenantController"

describe("TenantController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("create", () => {
		it("should return 201 on successful tenant creation", async () => {
			mockCreate.mockResolvedValue({
				status: true,
				data: mockTenant,
			})

			const { mock, spy } = createMockContext({
				body: { name: "Test Tenant", domain: "test.example.com" },
				jwtPayload: mockUser,
			})

			await TenantController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockTenant,
				message: "Successfully created new Tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockCreate.mockResolvedValue({
				status: false,
				err: { message: "Domain already exists", code: 400 },
			})

			const { mock, spy } = createMockContext({
				body: { name: "Test Tenant", domain: "test.example.com" },
				jwtPayload: mockUser,
			})

			await TenantController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Domain already exists",
			})
		})
	})

	describe("getAll", () => {
		it("should return 200 with tenant list for admin", async () => {
			const paginatedData = { data: [mockTenant], page: 1, limit: 10, total: 1 }
			mockGetAll.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				query: { page: "1" },
				jwtPayload: mockUserAdmin,
			})

			await TenantController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all Tenant!",
			})
		})

		it("should return 200 with tenant list for non-admin", async () => {
			const paginatedData = { data: [mockTenant], page: 1, limit: 10, total: 1 }
			mockGetAllByUserId.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				query: { page: "1" },
				jwtPayload: mockUser,
			})

			await TenantController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all Tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { message: "Unauthorized", code: 401 },
			})

			const { mock, spy } = createMockContext({
				query: {},
				jwtPayload: { ...mockUserAdmin, role: Roles.ADMIN },
			})

			await TenantController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(401)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Unauthorized",
			})
		})
	})

	describe("getById", () => {
		it("should return 200 with tenant data", async () => {
			mockGetById.mockResolvedValue({
				status: true,
				data: mockTenant,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
			})

			await TenantController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockTenant,
				message: "Successfully fetched Tenant by id!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { message: "Tenant not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await TenantController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Tenant not found",
			})
		})
	})

	describe("update", () => {
		it("should return 200 on successful update", async () => {
			const updatedTenant = { ...mockTenant, name: "Updated Tenant" }
			mockUpdate.mockResolvedValue({
				status: true,
				data: updatedTenant,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { name: "Updated Tenant" },
				jwtPayload: mockUser,
			})

			await TenantController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: updatedTenant,
				message: "Successfully updated Tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { message: "Update failed", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { name: "Updated" },
				jwtPayload: mockUser,
			})

			await TenantController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Update failed",
			})
		})
	})

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				jwtPayload: mockUser,
			})

			await TenantController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully deleted Tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { message: "Tenant not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
				jwtPayload: mockUser,
			})

			await TenantController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Tenant not found",
			})
		})
	})

	describe("getInvitableUsers", () => {
		it("should return 200 with invitable users list", async () => {
			const paginatedData = { data: [mockUser], page: 1, limit: 10, total: 1 }
			mockGetInvitableForTenant.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				query: { page: "1" },
			})

			await TenantController.getInvitableUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched invitable users for tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetInvitableForTenant.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				query: {},
			})

			await TenantController.getInvitableUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("getUserInTenant", () => {
		it("should return 200 with users in tenant", async () => {
			const usersData = [mockUser]
			mockGetByTenantId.mockResolvedValue({
				status: true,
				data: usersData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
			})

			await TenantController.getUserInTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: usersData,
				message: "Successfully fetched users in tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetByTenantId.mockResolvedValue({
				status: false,
				err: { message: "Tenant not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await TenantController.getUserInTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Tenant not found",
			})
		})
	})

	describe("getAllTenantUsers", () => {
		it("should return 200 with all tenant users for admin", async () => {
			const paginatedData = { data: [mockUser], page: 1, limit: 10, total: 1 }
			mockGetAllTenant.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				query: {
					page: "1",
					filters: JSON.stringify([{ key: "tenantId", value: "tenant-test-123" }]),
				},
				jwtPayload: { ...mockUserAdmin, role: Roles.ADMIN },
			})

			await TenantController.getAllTenantUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all tenant users!",
			})
		})

		it("should return 403 for non-admin without tenantId filter", async () => {
			const { mock, spy } = createMockContext({
				query: {},
				jwtPayload: mockUser,
			})

			await TenantController.getAllTenantUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Tenant ID filter is required for non-admins!",
			})
		})

		it("should return 403 for non-admin not in tenant", async () => {
			mockPrismaTenantUserFindFirst.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				query: {
					filters: JSON.stringify([{ key: "tenantId", value: "other-tenant" }]),
				},
				jwtPayload: mockUser,
			})

			await TenantController.getAllTenantUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "You are not authorized to view users in this tenant!",
			})
		})

		it("should return 200 for non-admin with membership", async () => {
			mockPrismaTenantUserFindFirst.mockResolvedValue({
				userId: mockUser.id,
				tenantId: "tenant-test-123",
			})
			mockGetAllTenant.mockResolvedValue({
				status: true,
				data: { data: [mockUser], page: 1, limit: 10, total: 1 },
			})

			const { mock, spy } = createMockContext({
				query: {
					filters: JSON.stringify([{ key: "tenantId", value: "tenant-test-123" }]),
				},
				jwtPayload: mockUser,
			})

			await TenantController.getAllTenantUsers(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all tenant users!",
			})
		})
	})

	describe("assignUserToTenant", () => {
		it("should return 200 on successful assignment", async () => {
			mockAssignUserTenantByTenantId.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: [{ userId: "user-1", tenantRoleId: "role-1" }],
			})

			await TenantController.assignUserToTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully assigned user to tenant!",
			})
		})

		it("should return error response on service failure", async () => {
			mockAssignUserTenantByTenantId.mockResolvedValue({
				status: false,
				err: { message: "Assignment failed", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: [{ userId: "user-1", tenantRoleId: "role-1" }],
			})

			await TenantController.assignUserToTenant(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Assignment failed",
			})
		})
	})

	describe("getAllByUser", () => {
		it("should return 200 with tenants by user id", async () => {
			const paginatedData = { data: [mockTenant], page: 1, limit: 10, total: 1 }
			mockGetAllByUserId.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				query: { page: "1" },
				jwtPayload: mockUser,
			})

			await TenantController.getAllByUser(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all tenants by user id!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAllByUserId.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				query: {},
				jwtPayload: mockUser,
			})

			await TenantController.getAllByUser(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("getAllRoles", () => {
		it("should return 200 with roles list", async () => {
			const rolesData = [
				{ id: "role-1", name: "Admin" },
				{ id: "role-2", name: "Member" },
			]
			mockGetAllRoles.mockResolvedValue({
				status: true,
				data: rolesData,
			})

			const { mock, spy } = createMockContext({
				query: { tenantId: "tenant-test-123" },
			})

			await TenantController.getAllRoles(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: rolesData,
				message: "Successfully fetched all roles!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAllRoles.mockResolvedValue({
				status: false,
				err: { message: "Roles not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				query: { tenantId: "tenant-test-123" },
			})

			await TenantController.getAllRoles(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Roles not found",
			})
		})
	})

	describe("createTenantUser", () => {
		it("should return 200 on successful tenant user creation", async () => {
			const tenantUserData = {
				id: "tu-1",
				userId: "user-1",
				tenantId: "tenant-test-123",
			}
			mockCreateTenantUser.mockResolvedValue({
				status: true,
				data: tenantUserData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { userId: "user-1", tenantRoleId: "role-1" },
			})

			await TenantController.createTenantUser(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: tenantUserData,
				message: "Successfully created tenant user!",
			})
		})

		it("should return error response on service failure", async () => {
			mockCreateTenantUser.mockResolvedValue({
				status: false,
				err: { message: "User already in tenant", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { userId: "user-1", tenantRoleId: "role-1" },
			})

			await TenantController.createTenantUser(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "User already in tenant",
			})
		})
	})

	describe("addMember", () => {
		it("should return 200 on successful member addition", async () => {
			mockAddMember.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { userId: "user-1", tenantRoleId: "role-1" },
			})

			await TenantController.addMember(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Member successfully added!",
			})
		})

		it("should return 400 when userId or tenantRoleId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { userId: "user-1" },
			})

			await TenantController.addMember(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "userId and tenantRoleId are required",
			})
		})

		it("should return error response on service failure", async () => {
			mockAddMember.mockResolvedValue({
				status: false,
				err: { message: "Failed to add member", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { userId: "user-1", tenantRoleId: "role-1" },
			})

			await TenantController.addMember(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Failed to add member",
			})
		})
	})

	describe("upsertSetting", () => {
		it("should return 200 on successful setting upsert", async () => {
			mockUpsertSetting.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { key: "theme", value: "dark" },
				jwtPayload: mockUser,
			})

			await TenantController.upsertSetting(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully updated tenant setting!",
			})
		})

		it("should return 400 when key or value is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { key: "theme" },
				jwtPayload: mockUser,
			})

			await TenantController.upsertSetting(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "key and value are required",
			})
		})

		it("should return error response on service failure", async () => {
			mockUpsertSetting.mockResolvedValue({
				status: false,
				err: { message: "Setting update failed", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				body: { key: "theme", value: "dark" },
				jwtPayload: mockUser,
			})

			await TenantController.upsertSetting(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Setting update failed",
			})
		})
	})

	describe("getSettings", () => {
		it("should return 200 with tenant settings", async () => {
			const settingsData = [{ key: "theme", value: "dark" }]
			mockGetSettings.mockResolvedValue({
				status: true,
				data: settingsData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
			})

			await TenantController.getSettings(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: settingsData,
				message: "Successfully fetched tenant settings!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetSettings.mockResolvedValue({
				status: false,
				err: { message: "Settings not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await TenantController.getSettings(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Settings not found",
			})
		})
	})

	describe("getUserPoints", () => {
		it("should return 200 with user points", async () => {
			const pointsData = { userId: "user-1", points: 150 }
			mockGetUserPoints.mockResolvedValue({
				status: true,
				data: pointsData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123", userId: "user-1" },
			})

			await TenantController.getUserPoints(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: pointsData,
				message: "Successfully fetched user points!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetUserPoints.mockResolvedValue({
				status: false,
				err: { message: "User not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123", userId: "nonexistent-user" },
			})

			await TenantController.getUserPoints(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "User not found",
			})
		})
	})
})

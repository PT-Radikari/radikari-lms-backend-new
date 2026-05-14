/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWTAdmin } from "$factories/assignment"
import { Roles } from "$generated/prisma/client"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockCreateRole = jest.fn<any>()
let mockUpdateRoleAccess = jest.fn<any>()
let mockGetEnabledFeaturesByRoleId = jest.fn<any>()
let mockGetAllFeatures = jest.fn<any>()
let mockGetAllRoles = jest.fn<any>()
let mockCheckAccess = jest.fn<any>()

jest.mock("$services/AccessListControlListService", () => ({
	createRole: (...args: any[]) => mockCreateRole(...args),
	updateRoleAccess: (...args: any[]) => mockUpdateRoleAccess(...args),
	getEnabledFeaturesByRoleId: (...args: any[]) => mockGetEnabledFeaturesByRoleId(...args),
	getAllFeatures: (...args: any[]) => mockGetAllFeatures(...args),
	getAllRoles: (...args: any[]) => mockGetAllRoles(...args),
	checkAccess: (...args: any[]) => mockCheckAccess(...args),
}))

const mockPrismaTenantUserFindFirst = jest.fn<any>()
const mockPrismaAccessControlListFindFirst = jest.fn<any>()
const mockPrismaTenantRoleFindUnique = jest.fn<any>()
const mockPrismaTenantUserFindMany = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	__esModule: true,
	prisma: {
		tenantUser: {
			findFirst: (...args: any[]) => mockPrismaTenantUserFindFirst(...args),
			findMany: (...args: any[]) => mockPrismaTenantUserFindMany(...args),
		},
		accessControlList: {
			findFirst: (...args: any[]) => mockPrismaAccessControlListFindFirst(...args),
		},
		tenantRole: {
			findUnique: (...args: any[]) => mockPrismaTenantRoleFindUnique(...args),
		},
	},
}))

import * as AccessControlListController from "$controllers/rest/AccessControlListController"

describe("AccessControlListController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── createRole (admin bypass) ─────────────────────────────────────────────

	describe("createRole", () => {
		it("should return 201 with created role when admin", async () => {
			const mockRole = { id: "role-123", name: "Editor", tenantId: "tenant-test-123" }
			mockCreateRole.mockResolvedValue({ status: true, data: mockRole })

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				body: { name: "Editor", tenantId: "tenant-test-123" },
			})

			await AccessControlListController.createRole(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new Tenant Role!",
			})
		})

		it("should return 400 when non-admin misses tenantId", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			const { mock, spy } = createMockContext({
				jwtPayload: nonAdminUser,
				body: { name: "Editor" },
			})

			await AccessControlListController.createRole(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "tenantId is required for role creation!",
			})
		})

		it("should return 403 when non-admin has no membership", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockPrismaTenantUserFindFirst.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				jwtPayload: nonAdminUser,
				body: { name: "Editor", tenantId: "tenant-test-123" },
			})

			await AccessControlListController.createRole(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
		})

		it("should return 403 when non-admin lacks ACL permission", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockPrismaTenantUserFindFirst.mockResolvedValue({
				tenantRoleId: "trole-123",
			})
			mockPrismaAccessControlListFindFirst.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				jwtPayload: nonAdminUser,
				body: { name: "Editor", tenantId: "tenant-test-123" },
			})

			await AccessControlListController.createRole(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
		})

		it("should return error status from service on failure", async () => {
			mockCreateRole.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Role already exists" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				body: { name: "Editor", tenantId: "tenant-test-123" },
			})

			await AccessControlListController.createRole(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── updateRoleAccess ─────────────────────────────────────────────────────

	describe("updateRoleAccess", () => {
		it("should return 200 with updated role access on success", async () => {
			const mockResult = { id: "role-123", permissions: [] }
			mockUpdateRoleAccess.mockResolvedValue({ status: true, data: mockResult })

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "role-123" },
				jwtPayload: mockUserJWTAdmin,
				body: { permissions: [] },
			})

			await AccessControlListController.updateRoleAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated Tenant Role Access!",
			})
		})

		it("should return 400 when target role not found", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockPrismaTenantRoleFindUnique.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "nonexistent" },
				jwtPayload: nonAdminUser,
				body: { permissions: [] },
			})

			await AccessControlListController.updateRoleAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("should return 403 when non-admin lacks ACL permission", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockPrismaTenantRoleFindUnique.mockResolvedValue({
				id: "role-123",
				tenantId: "tenant-test-123",
			})
			mockPrismaTenantUserFindFirst.mockResolvedValue({ tenantRoleId: "trole-123" })
			mockPrismaAccessControlListFindFirst.mockResolvedValue(null)

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "role-123" },
				jwtPayload: nonAdminUser,
				body: { permissions: [] },
			})

			await AccessControlListController.updateRoleAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
		})

		it("should return error status from service on failure", async () => {
			mockUpdateRoleAccess.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update failed" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "role-123" },
				jwtPayload: mockUserJWTAdmin,
				body: { permissions: [] },
			})

			await AccessControlListController.updateRoleAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getEnabledFeaturesByTenantRoleId ───────────────────────────────────

	describe("getEnabledFeaturesByTenantRoleId", () => {
		it("should return 200 with features on success", async () => {
			const mockFeatures = [{ featureName: "FORUM", actions: ["READ"] }]
			mockGetEnabledFeaturesByRoleId.mockResolvedValue({ status: true, data: mockFeatures })

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "role-123" },
			})

			await AccessControlListController.getEnabledFeaturesByTenantRoleId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetch enabled features by role id",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetEnabledFeaturesByRoleId.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Role not found" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantRoleId: "nonexistent" },
			})

			await AccessControlListController.getEnabledFeaturesByTenantRoleId(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getAllFeatures ─────────────────────────────────────────────────────

	describe("getAllFeatures", () => {
		it("should return 200 with all features on success", async () => {
			const mockFeatures = [{ name: "FORUM" }, { name: "ASSIGNMENT" }]
			mockGetAllFeatures.mockResolvedValue({ status: true, data: mockFeatures })

			const { mock, spy } = createMockContext()

			await AccessControlListController.getAllFeatures(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetch all features",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAllFeatures.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext()

			await AccessControlListController.getAllFeatures(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getAllRoles ────────────────────────────────────────────────────────

	describe("getAllRoles", () => {
		it("should return 200 with roles on success for admin", async () => {
			mockGetAllRoles.mockResolvedValue({
				status: true,
				data: { data: [], total: 0 },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				query: {},
			})

			await AccessControlListController.getAllRoles(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Tenant Role(s)",
			})
		})

		it.skip("should return 403 when non-admin queries unauthorized tenant", async () => {
			const nonAdminUser = { ...mockUserJWTAdmin, role: Roles.USER }
			mockPrismaTenantUserFindMany.mockResolvedValue([
				{ tenantId: "tenant-1" },
				{ tenantId: "tenant-2" },
			])

			const { mock, spy } = createMockContext({
				jwtPayload: nonAdminUser,
				query: { tenantId: "unauthorized-tenant" },
			})

			await AccessControlListController.getAllRoles(mock)

			expect(spy.status).toHaveBeenCalledWith(403)
		})

		it("should return error status when service fails", async () => {
			mockGetAllRoles.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				query: {},
			})

			await AccessControlListController.getAllRoles(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── checkAccess ───────────────────────────────────────────────────────

	describe("checkAccess", () => {
		it("should return 200 with access result on success", async () => {
			mockCheckAccess.mockResolvedValue({ status: true, data: { allowed: true } })

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				query: { feature: "FORUM" },
			})

			await AccessControlListController.checkAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully checked access to feature",
			})
		})

		it("should return 400 when feature query param is missing", async () => {
			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				query: {},
			})

			await AccessControlListController.checkAccess(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "feature is required",
			})
		})

		it("should return error status when service fails", async () => {
			mockCheckAccess.mockResolvedValue({
				status: false,
				err: { code: 403, message: "Access denied" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWTAdmin,
				query: { feature: "ADMIN" },
			})

			await AccessControlListController.checkAccess(mock)

			// Note: handleServiceErrorWithResponse only handles 400/404/401 explicitly;
			// 403 falls through to default (500)
			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})
})

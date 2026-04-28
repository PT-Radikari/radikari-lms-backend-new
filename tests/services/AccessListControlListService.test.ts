/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/AccessControlListRepository", () => {
	const mockCreateRole = jest.fn<any>()
	const mockUpdateRoleAccess = jest.fn<any>()
	const mockFindAllFeatures = jest.fn<any>()
	const mockFindAllRoles = jest.fn<any>()
	const mockFindRoleWithFeatures = jest.fn<any>()
	const mockFindActionsByFeatureName = jest.fn<any>()
	const mockFindActionsByFeatureNameAndRoleId = jest.fn<any>()
	const mockFindActionByFeatureAndName = jest.fn<any>()
	const mockFindAccessMapping = jest.fn<any>()
	return {
		createRole: mockCreateRole,
		updateRoleAccess: mockUpdateRoleAccess,
		findAllFeatures: mockFindAllFeatures,
		findAllRoles: mockFindAllRoles,
		findRoleWithFeatures: mockFindRoleWithFeatures,
		findActionsByFeatureName: mockFindActionsByFeatureName,
		findActionsByFeatureNameAndRoleId: mockFindActionsByFeatureNameAndRoleId,
		findActionByFeatureAndName: mockFindActionByFeatureAndName,
		findAccessMapping: mockFindAccessMapping,
	}
})

jest.mock("$repositories/TenantUserRepository", () => ({
	getByUserId: jest.fn<any>(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

import {
	createRole,
	updateRoleAccess,
	getAllFeatures,
	getAllRoles,
	getEnabledFeaturesByRoleId,
	checkAccess,
} from "$services/AccessListControlListService"

describe("AccessListControlListService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("createRole", () => {
		it("should create role successfully", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.createRole.mockResolvedValue({ id: "role-123", name: "Admin" })

			const result = await createRole({ name: "Admin" } as any)

			expect(result.status).toBe(true)
			expect(mocks.createRole).toHaveBeenCalled()
		})
	})

	describe("updateRoleAccess", () => {
		it("should enable new feature access", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.findActionByFeatureAndName.mockResolvedValue(true)
			mocks.findAccessMapping.mockResolvedValue(null)

			const result = await updateRoleAccess(
				"role-123",
				{ enabledFeatures: { "knowledge.read": true } } as any,
				"user-123",
			)

			expect(result.status).toBe(true)
			expect(mocks.updateRoleAccess).toHaveBeenCalled()
		})

		it("should disable existing feature access", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.findActionByFeatureAndName.mockResolvedValue(true)
			mocks.findAccessMapping.mockResolvedValue({ id: "mapping-1" })

			const result = await updateRoleAccess(
				"role-123",
				{ enabledFeatures: { "knowledge.read": false } } as any,
				"user-123",
			)

			expect(result.status).toBe(true)
		})
	})

	describe("getAllFeatures", () => {
		it("should return all features", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.findAllFeatures.mockResolvedValue([
				{ name: "knowledge", actions: ["read", "write"] },
			])

			const result = await getAllFeatures()

			expect(result.status).toBe(true)
			expect(result.data).toBeInstanceOf(Array)
		})
	})

	describe("getAllRoles", () => {
		it("should return paginated roles", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			const mockData = { data: [{ id: "role-1" }], total: 1 }
			mocks.findAllRoles.mockResolvedValue(mockData)

			const result = await getAllRoles({} as any)

			expect(result.status).toBe(true)
		})
	})

	describe("getEnabledFeaturesByRoleId", () => {
		it("should return role with enabled features", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.findRoleWithFeatures.mockResolvedValue([
				{ id: "role-123", name: "Admin" },
				[
					{ featureName: "knowledge", actionName: "read" },
					{ featureName: "knowledge", actionName: "write" },
				],
			])

			const result = await getEnabledFeaturesByRoleId("role-123")

			expect(result.status).toBe(true)
			expect((result.data as any)).toHaveProperty("enabledFeatures")
			expect((result.data as any).enabledFeatures["knowledge.read"]).toBe(true)
			expect((result.data as any).enabledFeatures["knowledge.write"]).toBe(true)
		})
	})

	describe("checkAccess", () => {
		it("should return actions for admin user", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			mocks.findActionsByFeatureName.mockResolvedValue(["read", "write", "delete"])

			const result = await checkAccess(
				{ id: "admin-1", role: "ADMIN" } as any,
				"knowledge",
			)

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("actions")
		})

		it("should return actions for non-admin user with tenant role", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByUserId.mockResolvedValue([
				{ tenantRoleId: "role-123" },
			])
			mocks.findActionsByFeatureNameAndRoleId.mockResolvedValue(["read"])

			const result = await checkAccess(
				{ id: "user-1", role: "USER" } as any,
				"knowledge",
			)

			expect(result.status).toBe(true)
		})

		it("should return error when no actions found", async () => {
			const mocks = jest.requireMock("$repositories/AccessControlListRepository") as any
			const tenantUserMocks = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantUserMocks.getByUserId.mockResolvedValue([
				{ tenantRoleId: "role-123" },
			])
			mocks.findActionsByFeatureNameAndRoleId.mockResolvedValue(null)

			const result = await checkAccess(
				{ id: "user-1", role: "USER" } as any,
				"forbidden_feature",
			)

			expect(result.status).toBe(false)
		})
	})
})

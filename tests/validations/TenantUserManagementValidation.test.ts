/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { TenantUserUpdateSchema } from "$validations/schema/TenantUserSchema"

describe("TenantUserUpdateSchema", () => {
	it("should pass with tenantRoleId and userId", () => {
		const result = TenantUserUpdateSchema.safeParse({
			tenantRoleId: "role-123",
			userId: "user-456",
		})
		expect(result.success).toBe(true)
	})

	it("should pass with optional hierarchy fields", () => {
		const result = TenantUserUpdateSchema.safeParse({
			tenantRoleId: "role-123",
			userId: "user-456",
			headOfOperationUserId: "user-789",
			teamLeaderUserId: "user-111",
			supervisorUserId: "user-222",
			managerUserId: "user-333",
		})
		expect(result.success).toBe(true)
	})

	it("should fail when tenantRoleId is missing", () => {
		const result = TenantUserUpdateSchema.safeParse({
			userId: "user-456",
		})
		expect(result.success).toBe(false)
	})

	it("should fail when userId is missing", () => {
		const result = TenantUserUpdateSchema.safeParse({
			tenantRoleId: "role-123",
		})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = TenantUserUpdateSchema.safeParse({
			tenantRoleId: "role-123",
			userId: "user-456",
			isActive: true,
		})
		expect(result.success).toBe(false)
	})
})

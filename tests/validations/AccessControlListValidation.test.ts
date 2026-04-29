/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import {
	AccessControlListUpdateAccessSchema,
	AccessControlListCreateRoleSchema,
} from "$validations/schema/AccessControlListSchema"

describe("AccessControlList schemas", () => {
	describe("AccessControlListUpdateAccessSchema", () => {
		it("should pass with valid feature toggles", () => {
			const result = AccessControlListUpdateAccessSchema.safeParse({
				enabledFeatures: {
					KNOWLEDGE_CREATE: true,
					KNOWLEDGE_READ: true,
					ASSIGNMENT_DELETE: false,
				},
			})
			expect(result.success).toBe(true)
		})

		it("should fail when enabledFeatures is missing", () => {
			const result = AccessControlListUpdateAccessSchema.safeParse({})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = AccessControlListUpdateAccessSchema.safeParse({
				enabledFeatures: { FEATURE_A: true },
				roleId: "Not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("AccessControlListCreateRoleSchema", () => {
		it("should pass with valid role data", () => {
			const result = AccessControlListCreateRoleSchema.safeParse({
				name: "Teacher",
				description: "Can manage assignments",
				level: 2,
				identifier: "TEACHER",
				tenantId: "tenant-123",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when name is missing", () => {
			const result = AccessControlListCreateRoleSchema.safeParse({
				description: "Desc",
				level: 1,
				identifier: "ROLE",
				tenantId: "tenant-1",
			})
			expect(result.success).toBe(false)
		})

		it("should fail when level is missing", () => {
			const result = AccessControlListCreateRoleSchema.safeParse({
				name: "Role",
				description: "Desc",
				identifier: "ROLE",
				tenantId: "tenant-1",
			})
			expect(result.success).toBe(false)
		})
	})
})

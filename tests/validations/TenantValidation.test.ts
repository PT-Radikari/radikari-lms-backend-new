/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { TenantSchema } from "$validations/schema/TenantSchema"

describe("TenantSchema", () => {
	it("should pass with valid name and description", () => {
		const result = TenantSchema.safeParse({
			name: "PT Radikari",
			description: "Learning Management System",
		})
		expect(result.success).toBe(true)
	})

	it("should pass with optional fields", () => {
		const result = TenantSchema.safeParse({
			name: "PT Radikari",
			description: "LMS",
			operationId: "op-123",
			headOfTenantUserId: "user-456",
			tokenLimit: 1000,
		})
		expect(result.success).toBe(true)
	})

	it("should fail when name is missing", () => {
		const result = TenantSchema.safeParse({ description: "LMS" })
		expect(result.success).toBe(false)
	})

	it("should fail when description is missing", () => {
		const result = TenantSchema.safeParse({ name: "PT Radikari" })
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = TenantSchema.safeParse({
			name: "PT Radikari",
			description: "LMS",
			extraField: "not allowed",
		})
		expect(result.success).toBe(false)
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { MasterKnowledgeCaseSchema } from "$validations/schema/MasterKnowledgeCaseSchema"

describe("MasterKnowledgeCaseSchema", () => {
	it("should pass with valid case", () => {
		const result = MasterKnowledgeCaseSchema.safeParse({
			name: "Payment Issue Case",
			subCategoryId: "subcat-123",
		})
		expect(result.success).toBe(true)
	})

	it("should pass with optional id", () => {
		const result = MasterKnowledgeCaseSchema.safeParse({
			id: "case-123",
			name: "Payment Issue",
			subCategoryId: "subcat-123",
		})
		expect(result.success).toBe(true)
	})

	it("should fail when name is missing", () => {
		const result = MasterKnowledgeCaseSchema.safeParse({
			subCategoryId: "subcat-123",
		})
		expect(result.success).toBe(false)
	})

	it("should fail when subCategoryId is missing", () => {
		const result = MasterKnowledgeCaseSchema.safeParse({
			name: "Payment Issue",
		})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = MasterKnowledgeCaseSchema.safeParse({
			name: "Payment Issue",
			subCategoryId: "subcat-123",
			description: "Not allowed",
		})
		expect(result.success).toBe(false)
	})
})

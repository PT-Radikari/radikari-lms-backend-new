/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { MasterKnowledgeCategorySchema } from "$validations/schema/MasterKnowledgeCategory"

describe("MasterKnowledgeCategorySchema", () => {
	it("should pass with valid category", () => {
		const result = MasterKnowledgeCategorySchema.safeParse({ name: "Technology" })
		expect(result.success).toBe(true)
	})

	it("should fail when name is missing", () => {
		const result = MasterKnowledgeCategorySchema.safeParse({})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = MasterKnowledgeCategorySchema.safeParse({
			name: "Tech",
			description: "Not allowed",
		})
		expect(result.success).toBe(false)
	})
})

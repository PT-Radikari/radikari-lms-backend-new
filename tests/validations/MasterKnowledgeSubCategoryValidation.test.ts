/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { MasterKnowledgeSubCategorySchema } from "$validations/schema/MasterKnowledgeSubCategory"

describe("MasterKnowledgeSubCategorySchema", () => {
	it("should pass with valid subcategory", () => {
		const result = MasterKnowledgeSubCategorySchema.safeParse({
			name: "JavaScript",
			categoryId: "cat-123",
		})
		expect(result.success).toBe(true)
	})

	it("should pass with optional id", () => {
		const result = MasterKnowledgeSubCategorySchema.safeParse({
			id: "subcat-123",
			name: "JavaScript",
			categoryId: "cat-123",
		})
		expect(result.success).toBe(true)
	})

	it("should fail when name is missing", () => {
		const result = MasterKnowledgeSubCategorySchema.safeParse({
			categoryId: "cat-123",
		})
		expect(result.success).toBe(false)
	})

	it("should fail when categoryId is missing", () => {
		const result = MasterKnowledgeSubCategorySchema.safeParse({
			name: "JavaScript",
		})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = MasterKnowledgeSubCategorySchema.safeParse({
			name: "JavaScript",
			categoryId: "cat-123",
			description: "Not allowed",
		})
		expect(result.success).toBe(false)
	})
})

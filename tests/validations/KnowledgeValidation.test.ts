/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { KnowlegeSchema, KnowledgeApprovalSchema, KnowledgeBulkCreateSchema } from "$validations/schema/KnowlegeSchema"
import { KnowledgeActivityLogAction } from "$generated/prisma/client"

describe("Knowledge schemas", () => {
	describe("KnowlegeSchema", () => {
		it("should pass with valid article data", () => {
			const result = KnowlegeSchema.safeParse({
				category: "Technology",
				subCategory: "Programming",
				type: "ARTICLE",
				access: "TENANT",
				case: "JavaScript Basics",
				headline: "Introduction to JavaScript",
				contents: [
					{
						title: "Chapter 1",
						description: "Getting started",
						order: 1,
					},
				],
			})
			expect(result.success).toBe(true)
		})

		it("should pass with optional attachments and emails", () => {
			const result = KnowlegeSchema.safeParse({
				category: "Technology",
				subCategory: "Programming",
				type: "ARTICLE",
				access: "EMAIL",
				case: "JS Basics",
				headline: "Intro to JS",
				contents: [
					{
						title: "Chapter 1",
						description: "Getting started",
						order: 1,
					},
				],
				emails: ["user@example.com"],
				attachments: [{ attachmentUrl: "https://example.com/file.pdf" }],
			})
			expect(result.success).toBe(true)
		})

		it("should fail when headline is missing", () => {
			const result = KnowlegeSchema.safeParse({
				category: "Tech",
				subCategory: "Prog",
				type: "ARTICLE",
				access: "TENANT",
				case: "JS",
				contents: [{ title: "Ch1", description: "Desc", order: 1 }],
			})
			expect(result.success).toBe(false)
		})

		it("should fail with invalid type", () => {
			const result = KnowlegeSchema.safeParse({
				category: "Tech",
				subCategory: "Prog",
				type: "INVALID",
				access: "TENANT",
				case: "JS",
				headline: "Intro",
				contents: [{ title: "Ch1", description: "Desc", order: 1 }],
			})
			expect(result.success).toBe(false)
		})
	})

	describe("KnowledgeApprovalSchema", () => {
		it("should pass with APPROVE action", () => {
			const result = KnowledgeApprovalSchema.safeParse({
				action: KnowledgeActivityLogAction.APPROVE,
			})
			expect(result.success).toBe(true)
		})

		it("should pass with REJECT action", () => {
			const result = KnowledgeApprovalSchema.safeParse({
				action: KnowledgeActivityLogAction.REJECT,
				comment: "Not relevant",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with REVISION action", () => {
			const result = KnowledgeApprovalSchema.safeParse({
				action: KnowledgeActivityLogAction.REVISION,
				comment: "Please revise section 3",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when action is missing", () => {
			const result = KnowledgeApprovalSchema.safeParse({})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = KnowledgeApprovalSchema.safeParse({
				action: KnowledgeActivityLogAction.APPROVE,
				extra: "not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("KnowledgeBulkCreateSchema", () => {
		it("should pass with valid spreadsheet files", () => {
			const result = KnowledgeBulkCreateSchema.safeParse({
				access: "TENANT",
				type: "CASE",
				fileUrls: ["https://example.com/data.xlsx"],
			})
			expect(result.success).toBe(true)
		})

		it("should fail when fileUrls is empty", () => {
			const result = KnowledgeBulkCreateSchema.safeParse({
				access: "TENANT",
				type: "CASE",
				fileUrls: [],
			})
			expect(result.success).toBe(false)
		})

		it("should fail when access is missing", () => {
			const result = KnowledgeBulkCreateSchema.safeParse({
				type: "ARTICLE",
				fileUrls: ["https://example.com/file.pdf"],
			})
			expect(result.success).toBe(false)
		})
	})
})

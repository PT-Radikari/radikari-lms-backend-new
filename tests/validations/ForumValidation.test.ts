/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { ForumSchema, ForumCommentSchema } from "$validations/schema/ForumSchema"

describe("Forum schemas", () => {
	describe("ForumSchema", () => {
		it("should pass with valid forum post", () => {
			const result = ForumSchema.safeParse({
				title: "How to learn TypeScript?",
				content: "I'm a beginner, where should I start?",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with attachmentUrls", () => {
			const result = ForumSchema.safeParse({
				title: "Question with file",
				content: "Please see the attached file.",
				attachmentUrls: ["https://example.com/screenshot.png"],
			})
			expect(result.success).toBe(true)
		})

		it("should fail when title is missing", () => {
			const result = ForumSchema.safeParse({
				content: "Content only",
			})
			expect(result.success).toBe(false)
		})

		it("should fail when content is missing", () => {
			const result = ForumSchema.safeParse({
				title: "Title only",
			})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = ForumSchema.safeParse({
				title: "Title",
				content: "Content",
				author: "Not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("ForumCommentSchema", () => {
		it("should pass with valid comment", () => {
			const result = ForumCommentSchema.safeParse({
				content: "Great question!",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with replyToCommentId", () => {
			const result = ForumCommentSchema.safeParse({
				content: "I agree with this reply.",
				replyToCommentId: "comment-123",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when content is missing", () => {
			const result = ForumCommentSchema.safeParse({})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = ForumCommentSchema.safeParse({
				content: "Comment content",
				author: "Not allowed",
			})
			expect(result.success).toBe(false)
		})
	})
})

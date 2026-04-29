/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { AiChatRoomSchema, AiChatRoomMessageSchema } from "$validations/schema/AiChatRoomSchema"

describe("AiChat schemas", () => {
	describe("AiChatRoomSchema", () => {
		it("should pass with valid room data", () => {
			const result = AiChatRoomSchema.safeParse({ title: "General Chat" })
			expect(result.success).toBe(true)
		})

		it("should fail when title is missing", () => {
			const result = AiChatRoomSchema.safeParse({})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = AiChatRoomSchema.safeParse({
				title: "Chat Room",
				description: "Not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("AiChatRoomMessageSchema", () => {
		it("should pass with valid message", () => {
			const result = AiChatRoomMessageSchema.safeParse({
				question: "What is the capital of France?",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when question is missing", () => {
			const result = AiChatRoomMessageSchema.safeParse({})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = AiChatRoomMessageSchema.safeParse({
				question: "What is the capital?",
				context: "Not allowed",
			})
			expect(result.success).toBe(false)
		})
	})
})

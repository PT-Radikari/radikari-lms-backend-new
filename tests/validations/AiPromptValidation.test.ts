/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { AiPromptSchema } from "$validations/schema/AiPromptSchema"

describe("AiPromptSchema", () => {
	it("should pass with valid prompt", () => {
		const result = AiPromptSchema.safeParse({
			prompt: "You are a helpful AI assistant.",
		})
		expect(result.success).toBe(true)
	})

	it("should fail when prompt is missing", () => {
		const result = AiPromptSchema.safeParse({})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = AiPromptSchema.safeParse({
			prompt: "Valid prompt",
			model: "Not allowed",
		})
		expect(result.success).toBe(false)
	})
})

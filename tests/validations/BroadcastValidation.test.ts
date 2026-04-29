/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { BroadcastSchema } from "$validations/schema/BroadcastSchema"

describe("BroadcastSchema", () => {
	it("should pass with valid broadcast data", () => {
		const result = BroadcastSchema.safeParse({
			content: "This is a broadcast message to all users.",
		})
		expect(result.success).toBe(true)
	})

	it("should fail when content is missing", () => {
		const result = BroadcastSchema.safeParse({})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = BroadcastSchema.safeParse({
			content: "Broadcast message",
			title: "Not allowed",
		})
		expect(result.success).toBe(false)
	})
})

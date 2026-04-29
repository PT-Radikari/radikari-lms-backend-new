/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { getAiClient, aiClient } from "$utils/aiClient.utils"

describe("aiClient.utils", () => {
	describe("getAiClient", () => {
		it("should create an axios client instance", () => {
			const client = getAiClient()
			expect(client).toBeDefined()
			expect(typeof client.get).toBe("function")
			expect(typeof client.post).toBe("function")
		})

		it("should create a new instance on each call", () => {
			const client1 = getAiClient()
			const client2 = getAiClient()
			expect(client1).not.toBe(client2)
		})
	})

	describe("aiClient singleton", () => {
		it("should export a client instance", () => {
			expect(aiClient).toBeDefined()
			expect(typeof aiClient.get).toBe("function")
		})
	})
})

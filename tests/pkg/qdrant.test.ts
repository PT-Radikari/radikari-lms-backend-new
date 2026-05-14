/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

describe("pkg/qdrant", () => {
	it("should export qdrantClient", async () => {
		const { qdrantClient } = await import("$pkg/qdrant")
		expect(qdrantClient).toBeDefined()
		expect(typeof qdrantClient).toBe("object")
	})

	it("should have qdrant client methods available", async () => {
		const { qdrantClient } = await import("$pkg/qdrant")
		expect(typeof qdrantClient.search).toBe("function")
	})
})

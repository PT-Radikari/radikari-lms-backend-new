/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

describe("app/rest", () => {
	it("should export startRestApp function", async () => {
		// Verify the module is importable without throwing
		// Note: Actual Bun.serve call is skipped because Bun runtime is not available in Jest
		const { startRestApp } = await import("$app/rest")
		expect(typeof startRestApp).toBe("function")
	})
})

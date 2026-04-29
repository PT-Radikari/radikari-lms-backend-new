/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

describe("app/cron", () => {
	it("should export startCronApp function", async () => {
		// Verify the module is importable
		// Note: Testing the actual registration requires mocking complex singleton patterns
		const { startCronApp } = await import("$app/cron")
		expect(typeof startCronApp).toBe("function")
	})
})

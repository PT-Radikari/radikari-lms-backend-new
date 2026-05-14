/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

describe("pkg/logger", () => {
	it("should export default Logger instance", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(Logger).toBeDefined()
	})

	it("should have info method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.info).toBe("function")
	})

	it("should have error method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.error).toBe("function")
	})

	it("should have warning method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.warning).toBe("function")
	})

	it("should have debug method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.debug).toBe("function")
	})

	it("should have http method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.http).toBe("function")
	})

	it("should have child method", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(typeof Logger.child).toBe("function")
	})

	it("should handle error extraction for Error instance", async () => {
		const Logger = (await import("$pkg/logger")).default
		const testError = new Error("Test error message")
		// Should not throw
		expect(() => Logger.error("test", { error: testError })).not.toThrow()
	})

	it("should handle error extraction for string error", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(() => Logger.error("test", { error: "String error" })).not.toThrow()
	})

	it("should handle error extraction for null/undefined error", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(() => Logger.error("test", { error: null })).not.toThrow()
		expect(() => Logger.error("test", { error: undefined })).not.toThrow()
	})

	it("should handle info logging with metadata", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(() =>
			Logger.info("test message", { key: "value", count: 42 }),
		).not.toThrow()
	})

	it("should handle debug logging with metadata", async () => {
		const Logger = (await import("$pkg/logger")).default
		expect(() =>
			Logger.debug("debug message", { data: { nested: true } }),
		).not.toThrow()
	})
})

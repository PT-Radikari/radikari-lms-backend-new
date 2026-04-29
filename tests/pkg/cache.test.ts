/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

jest.mock("ioredis", () => {
	return jest.fn().mockImplementation(() => ({
		get: jest.fn(),
		set: jest.fn(),
		del: jest.fn(),
		quit: jest.fn(),
		on: jest.fn(),
	}))
})

jest.mock("$pkg/graceful", () => ({
	registerProcessForShutdown: jest.fn(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn(),
	error: jest.fn(),
	warning: jest.fn(),
}))

describe("pkg/cache", () => {
	it("should export CacheInstance class", async () => {
		const cache = await import("$pkg/cache")
		expect(cache.CacheInstance).toBeDefined()
	})

	it("should export Method namespace", async () => {
		const cache = await import("$pkg/cache")
		expect(cache.Method).toBeDefined()
	})
})

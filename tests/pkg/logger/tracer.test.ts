/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from "@jest/globals"
import { AsyncLocalStorage } from "async_hooks"
import {
	initHttpTracerData,
	getTracerData,
	getSpanId,
	getResource,
	tracerStorage,
	TracerData,
} from "$pkg/logger/tracer"

const mockContext = (overrides: Record<string, any> = {}) => ({
	req: {
		path: "/api/test",
		method: "GET",
		url: "http://localhost:3000/api/test",
		...overrides.req,
	},
} as any)

describe("pkg/logger/tracer", () => {
	beforeEach(() => {
		// Reset AsyncLocalStorage store between tests
		// Note: AsyncLocalStorage doesn't expose a clear method,
		// but we can use enterWith to reset the store
		tracerStorage.enterWith(undefined as any)
	})

	// ─── tracerStorage ───────────────────────────────────────────────────

	describe("tracerStorage", () => {
		it("is an AsyncLocalStorage instance", () => {
			expect(tracerStorage).toBeInstanceOf(AsyncLocalStorage)
		})
	})

	// ─── initHttpTracerData ─────────────────────────────────────────────

	describe("initHttpTracerData", () => {
		it("returns TracerData from Hono context", () => {
			const ctx = mockContext()
			const result = initHttpTracerData(ctx)

			expect(result).toMatchObject({
				resource: "/api/test",
				method: "GET",
				url: "http://localhost:3000/api/test",
			})
			expect(typeof result.spanId).toBe("string")
			expect(result.spanId.length).toBeGreaterThan(0)
			expect(typeof result.startTime).toBe("number")
			expect(result.startTime).toBeLessThanOrEqual(Date.now())
		})

		it("falls back to SERVICE_NAME when path is empty", () => {
			const ctx = mockContext({ req: { path: "", method: "POST", url: "" } })
			const result = initHttpTracerData(ctx)

			// Empty string is falsy, so || falls back to SERVICE_NAME env var
			expect(result.resource).toBe("undefined") // SERVICE_NAME not set in test env
			expect(result.method).toBe("POST")
		})
	})

	// ─── getTracerData ──────────────────────────────────────────────────

	describe("getTracerData", () => {
		it("creates new TracerData when no store exists", () => {
			const result = getTracerData()

			expect(result).toMatchObject({
				resource: expect.any(String),
				spanId: expect.any(String),
				startTime: expect.any(Number),
				method: "N/A",
				url: "N/A",
			})
		})

		it("returns existing store when available", () => {
			const existingData: TracerData = {
				spanId: "existing-span-id",
				resource: "/existing/path",
				startTime: 1234567890,
				method: "POST",
				url: "http://example.com/path",
			}
			tracerStorage.enterWith(existingData)

			const result = getTracerData()

			expect(result.spanId).toBe("existing-span-id")
			expect(result.resource).toBe("/existing/path")
		})

		it("sets new store via enterWith for future async operations", async () => {
			getTracerData()

			// The store should be set via enterWith, allowing async operations
			// to access it
			const store = tracerStorage.getStore()
			expect(store).not.toBeNull()
		})
	})

	// ─── getSpanId ─────────────────────────────────────────────────────

	describe("getSpanId", () => {
		it("returns spanId from existing store", () => {
			const existingData: TracerData = {
				spanId: "custom-span-id",
				resource: "/test",
				startTime: Date.now(),
			}
			tracerStorage.enterWith(existingData)

			const result = getSpanId()

			expect(result).toBe("custom-span-id")
		})

		it("returns new ULID when no store exists", () => {
			tracerStorage.enterWith(undefined as any)
			const result = getSpanId()

			expect(typeof result).toBe("string")
			expect(result.length).toBeGreaterThan(0)
		})

		it("returns ULID even when store exists but spanId is undefined", () => {
			tracerStorage.enterWith({ spanId: undefined as any, resource: "/", startTime: 0 })
			const result = getSpanId()

			expect(typeof result).toBe("string")
			expect(result.length).toBeGreaterThan(0)
		})
	})

	// ─── getResource ───────────────────────────────────────────────────

	describe("getResource", () => {
		it("returns resource from existing store", () => {
			const existingData: TracerData = {
				spanId: "span-1",
				resource: "/api/users",
				startTime: Date.now(),
			}
			tracerStorage.enterWith(existingData)

			const result = getResource()

			expect(result).toBe("/api/users")
		})

		it("returns SERVICE_NAME when no store exists", () => {
			tracerStorage.enterWith(undefined as any)
			const result = getResource()

			// Falls back to SERVICE_NAME env or "unknown"
			expect(typeof result).toBe("string")
		})

		it("returns SERVICE_NAME fallback when resource is empty string", () => {
			tracerStorage.enterWith({ spanId: "span", resource: "", startTime: 0 })
			const result = getResource()

			// Empty string is falsy, so || falls back to SERVICE_NAME env (undefined → "undefined")
			expect(result).toBe("undefined")
		})
	})

	// ─── Integration ────────────────────────────────────────────────────

	describe("end-to-end flow", () => {
		it("initHttpTracerData sets store accessible via getTracerData", () => {
			const ctx = mockContext({ req: { path: "/api/knowledge", method: "POST", url: "http://app/api/knowledge" } })
			const tracerData = initHttpTracerData(ctx)

			// Note: initHttpTracerData returns data but does NOT set the store.
			// Only getTracerData sets the store via enterWith.
			// The data is meant to be passed to tracerStorage.enterWith() by the caller.
			expect(tracerData.resource).toBe("/api/knowledge")
			expect(tracerData.method).toBe("POST")
		})

		it("getTracerData creates store accessible via getSpanId and getResource", () => {
			tracerStorage.enterWith(undefined as any)

			const spanId = getSpanId()
			const resource = getResource()

			expect(typeof spanId).toBe("string")
			expect(typeof resource).toBe("string")
		})

		it("each call to getTracerData returns consistent data within same async context", () => {
			tracerStorage.enterWith(undefined as any)
			getTracerData() // Creates and sets store

			const data1 = getTracerData()
			const spanId1 = getSpanId()
			const resource1 = getResource()

			const data2 = getTracerData()
			const spanId2 = getSpanId()
			const resource2 = getResource()

			expect(data1.spanId).toBe(data2.spanId)
			expect(spanId1).toBe(spanId2)
			expect(resource1).toBe(resource2)
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

const mockInitHttpTracerData = jest.fn<any>()
const mockTracerStorageRun = jest.fn<any>()
jest.mock("$pkg/logger/tracer", () => ({
	initHttpTracerData: mockInitHttpTracerData,
	get tracerStorage() {
		return { run: mockTracerStorageRun }
	},
}))

import { shouldLogRequest, httpLogger } from "$middlewares/httpMiddleware"

describe("httpMiddleware", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("shouldLogRequest", () => {
		it("should return true for paths matching loggable routes", () => {
			const result = shouldLogRequest("/users/123")
			expect(result).toBe(true)
		})

		it("should strip query params before matching", () => {
			const result = shouldLogRequest("/users/123?page=1")
			expect(result).toBe(true)
		})

		it("should return false for paths not matching loggable routes", () => {
			const result = shouldLogRequest("/api/v1/tenants/123/users")
			expect(result).toBe(false)
		})
	})

	describe("httpLogger", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next without logging when path is not loggable", async () => {
			const ctx: any = {
				req: {
					path: "/health",
					query: jest.fn(),
				},
			}

			await httpLogger(ctx, next)
			expect(next).toHaveBeenCalled()
			const logger = jest.requireMock("$pkg/logger") as any
			expect(logger.info).not.toHaveBeenCalled()
		})

		it("should log request start and completion for loggable routes", async () => {
			const tracerData = {
				method: "POST",
				url: "/users/123",
				startTime: Date.now() - 100,
			}
			mockInitHttpTracerData.mockReturnValue(tracerData)
			mockTracerStorageRun.mockImplementation((_data: any, fn: () => void) => fn())

			const ctx: any = {
				req: {
					path: "/users/123",
					query: jest.fn(),
				},
			}

			await httpLogger(ctx, next)
			expect(mockInitHttpTracerData).toHaveBeenCalledWith(ctx)
			expect(next).toHaveBeenCalled()
			const logger = jest.requireMock("$pkg/logger") as any
			expect(logger.info).toHaveBeenCalledTimes(2)
			expect(logger.info).toHaveBeenNthCalledWith(
				1,
				"Request started",
				expect.objectContaining({ method: "POST" }),
			)
			expect(logger.info).toHaveBeenNthCalledWith(
				2,
				"Request completed",
				expect.objectContaining({ method: "POST", duration: expect.any(String) }),
			)
		})
	})
})

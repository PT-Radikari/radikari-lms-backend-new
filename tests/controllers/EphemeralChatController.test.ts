/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import type { Context } from "hono"

const mockCreateThread = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/TenantService", () => ({
	getSettings: jest.fn<any>().mockResolvedValue({ status: true, data: null }),
}))

jest.mock("$services/Ephemeral/EphemeralChatService", () => {
	return {
		__esModule: true,
		default: { createThread: mockCreateThread },
		EphemeralChatService: { getInstance: () => ({ createThread: mockCreateThread }) },
	}
})

import { createThread } from "$controllers/rest/EphemeralChatController"

describe("EphemeralChatController Origin Validation", () => {
	const originalEnv = process.env

	beforeEach(() => {
		process.env = { ...originalEnv }
		jest.clearAllMocks()
		mockCreateThread.mockReturnValue({
			threadId: "ephem_test-thread-id",
			tenantId: "test-tenant-id",
			expiresAt: new Date(Date.now() + 3600000),
		})
	})

	afterEach(() => {
		process.env = originalEnv
	})

	describe("Simple string format", () => {
		it("should allow origin when it matches", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = "http://localhost:5173"

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: jest.fn<any>(),
				json: jest.fn<any>(),
			} as unknown as Context

			await createThread(mockContext)

			expect(mockContext.status).toHaveBeenCalledWith(201)
			expect(mockCreateThread).toHaveBeenCalled()
		})

		it("should deny origin when it does not match", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = "http://localhost:5173"

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://malicious-site.com" : undefined,
				},
				status: jest.fn<any>(),
				json: jest.fn<any>(),
			} as unknown as Context

			await createThread(mockContext)

			expect(mockContext.status).toHaveBeenCalledWith(403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})
	})

	describe("JSON object format", () => {
		it("should allow origin when tenant is in JSON allowlist", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = JSON.stringify({
				"tenant-1": ["http://localhost:5173", "https://app.example.com"],
				"tenant-2": ["https://app.example.com"],
			})

			const mockContext = {
				req: {
					param: () => "tenant-1",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: jest.fn<any>(),
				json: jest.fn<any>(),
			} as unknown as Context

			await createThread(mockContext)

			expect(mockContext.status).toHaveBeenCalledWith(201)
			expect(mockCreateThread).toHaveBeenCalled()
		})

		it("should deny origin when tenant is not in JSON allowlist", async () => {
			process.env.TENANT_ORIGIN_ALLOWLIST = JSON.stringify({
				"tenant-1": ["http://localhost:5173"],
			})

			const mockContext = {
				req: {
					param: () => "tenant-2",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: jest.fn<any>(),
				json: jest.fn<any>(),
			} as unknown as Context

			await createThread(mockContext)

			expect(mockContext.status).toHaveBeenCalledWith(403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})

		it("should deny when no allowlist is configured", async () => {
			delete process.env.TENANT_ORIGIN_ALLOWLIST

			const mockContext = {
				req: {
					param: () => "test-tenant-id",
					header: (name: string) =>
						name === "origin" ? "http://localhost:5173" : undefined,
				},
				status: jest.fn<any>(),
				json: jest.fn<any>(),
			} as unknown as Context

			await createThread(mockContext)

			expect(mockContext.status).toHaveBeenCalledWith(403)
			expect(mockCreateThread).not.toHaveBeenCalled()
		})
	})
})

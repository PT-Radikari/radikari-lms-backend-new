/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"

// Declare vars BEFORE jest.mock — they must be initialized before hoisting
var mockSendMessage: ReturnType<typeof jest.fn<any>>
var mockGetSettings: ReturnType<typeof jest.fn<any>>
mockSendMessage = jest.fn<any>()
mockGetSettings = jest.fn<any>()

// Mock BEFORE importing the controller — controller calls getInstance() at module level
jest.mock("$services/Ephemeral/EphemeralChatService", () => ({
	EphemeralChatService: {
		getInstance: jest.fn<any>().mockReturnValue({
			sendMessage: (...args: any[]) => mockSendMessage(...args),
		}),
	},
}))

jest.mock("$services/TenantService", () => ({
	getSettings: (...args: any[]) => mockGetSettings(...args),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

import * as EphemeralChatController from "$controllers/rest/EphemeralChatController"

const originalEnv = process.env

describe("EphemeralChatController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		process.env = { ...originalEnv, TENANT_ORIGIN_ALLOWLIST: "http://localhost:3000" }
	})

	afterEach(() => {
		process.env = originalEnv
	})

	describe("sendMessage", () => {
		it("returns 400 when tenantId or threadId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "", threadId: "" },
				body: { messages: [{ role: "user", content: "hello" }] },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("returns 403 when origin is invalid and tenant settings have no whitelist", async () => {
			mockGetSettings.mockResolvedValue({ status: true, data: [] })
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-1", threadId: "thread-1" },
				body: { messages: [{ role: "user", content: "hello" }] },
				headers: { origin: "https://evil.com" },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(spy.status).toHaveBeenCalledWith(403)
		})

		it("returns 400 when body fails Zod validation (empty messages array)", async () => {
			mockGetSettings.mockResolvedValue({ status: true, data: [] })
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-1", threadId: "thread-1" },
				body: { messages: [] },
				headers: { origin: "http://localhost:3000" },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("returns 400 when body fails Zod validation (missing messages)", async () => {
			mockGetSettings.mockResolvedValue({ status: true, data: [] })
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-1", threadId: "thread-1" },
				body: {},
				headers: { origin: "http://localhost:3000" },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("calls service sendMessage with converted messages on valid request", async () => {
			mockGetSettings.mockResolvedValue({ status: true, data: [] })
			const mockStreamResponse = new Response("streaming data", { status: 200 })
			mockSendMessage.mockResolvedValue(mockStreamResponse)
			const { mock } = createMockContext({
				params: { tenantId: "tenant-1", threadId: "thread-1" },
				body: { messages: [{ role: "user", content: "hello" }] },
				headers: { origin: "http://localhost:3000" },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(mockSendMessage).toHaveBeenCalledWith(
				"tenant-1",
				"thread-1",
				expect.arrayContaining([
					expect.objectContaining({ role: "user", content: "hello" }),
				]),
			)
		})

		it("returns 500 on service error", async () => {
			mockGetSettings.mockResolvedValue({ status: true, data: [] })
			mockSendMessage.mockRejectedValue(new Error("Service error"))
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-1", threadId: "thread-1" },
				body: { messages: [{ role: "user", content: "hello" }] },
				headers: { origin: "http://localhost:3000" },
			})
			await EphemeralChatController.sendMessage(mock)
			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})
})

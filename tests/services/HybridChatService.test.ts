/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { streamHybridChat } from "$services/AiChat/HybridChatService"

const mockExecuteHybridChatCore = jest.fn<any>()
const mockAiChatRoomMessageCreate = jest.fn<any>().mockResolvedValue({})
const mockAiUsageLogCreate = jest.fn<any>().mockResolvedValue({})
const mockLoggerInfo = jest.fn<any>()
const mockLoggerError = jest.fn<any>()

jest.mock("$services/AiChat/HybridChatCore", () => ({
	executeHybridChatCore: (...args: any[]) => mockExecuteHybridChatCore(...args),
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		aiChatRoomMessage: {
			create: (...args: any[]) => mockAiChatRoomMessageCreate(...args),
		},
		aiUsageLog: {
			create: (...args: any[]) => mockAiUsageLogCreate(...args),
		},
	},
}))

jest.mock("$pkg/logger", () => ({
	__esModule: true,
	default: {
		info: (...args: any[]) => mockLoggerInfo(...args),
		error: (...args: any[]) => mockLoggerError(...args),
	},
}))

describe("HybridChatService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockExecuteHybridChatCore.mockResolvedValue(new Response())
		mockAiChatRoomMessageCreate.mockResolvedValue({ id: "msg-123" })
		mockAiUsageLogCreate.mockResolvedValue({ id: "log-123" })
	})

	describe("streamHybridChat", () => {
		it("should execute HybridChatCore with correct parameters", async () => {
			const messages = [{ role: "user" as const, content: "Hello AI" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			expect(mockExecuteHybridChatCore).toHaveBeenCalledWith(
				expect.objectContaining({
					messages,
					tenantId: "tenant-123",
					onFinish: expect.any(Function),
				}),
			)
		})

		it("should save user message to DB on finish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages = [{ role: "user" as const, content: "My question" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			// Trigger the onFinish callback
			await onFinishCallback({ text: "AI response here", usage: null })

			expect(mockAiChatRoomMessageCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					aiChatRoomId: "room-123",
					sender: "USER",
					message: "My question",
				}),
			})
		})

		it("should save assistant response to DB on finish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages = [{ role: "user" as const, content: "Hello" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-456",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			await onFinishCallback({ text: "Assistant's answer", usage: null })

			const assistantCalls = mockAiChatRoomMessageCreate.mock.calls.filter(
				(call: any[]) => call[0]?.data?.sender === "ASSISTANT",
			)
			expect(assistantCalls.length).toBeGreaterThan(0)
			const callData = assistantCalls[0][0] as any
			expect(callData?.data?.message).toBe("Assistant's answer")
		})

		it("should log token usage to aiUsageLog on finish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages = [{ role: "user" as const, content: "Hello" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-abc",
				userId: "user-xyz",
			})

			await onFinishCallback({
				text: "Response",
				usage: {
					inputTokens: 100,
					outputTokens: 50,
					totalTokens: 150,
				},
			})

			expect(mockAiUsageLogCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					tenantId: "tenant-abc",
					userId: "user-xyz",
					action: "CHAT",
					model: "gpt-4.1-mini",
					promptTokens: 100,
					completionTokens: 50,
					totalTokens: 150,
				}),
			})
		})

		it("should handle DB errors gracefully without crashing onFinish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})
			mockAiChatRoomMessageCreate.mockRejectedValue(new Error("DB connection failed"))

			const messages = [{ role: "user" as const, content: "Hello" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			// Should not throw despite DB error
			await expect(
				onFinishCallback({ text: "Response", usage: null }),
			).resolves.not.toThrow()

			expect(mockLoggerError).toHaveBeenCalledWith(
				"HybridChatService.streamHybridChat.onFinish",
				expect.objectContaining({
					error: "Failed to save messages to database",
				}),
			)
		})

		it("should handle missing lastMessage gracefully on finish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages: any[] = [] // Empty messages

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			// Should not throw when lastMessage is missing
			await expect(
				onFinishCallback({ text: "Response", usage: null }),
			).resolves.not.toThrow()
		})

		it("should handle missing usage data on finish", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages = [{ role: "user" as const, content: "Hello" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			// Should not throw when usage is null/undefined
			await expect(
				onFinishCallback({ text: "Response", usage: null }),
			).resolves.not.toThrow()

			// Usage log should not be called when usage is null
			const usageLogCalls = mockAiUsageLogCreate.mock.calls
			expect(usageLogCalls.length).toBe(0)
		})

		it("should log info on successful save", async () => {
			let onFinishCallback: any = null
			mockExecuteHybridChatCore.mockImplementation((args: any) => {
				onFinishCallback = args.onFinish
				return Promise.resolve(new Response())
			})

			const messages = [{ role: "user" as const, content: "Hello" }]

			await streamHybridChat({
				messages,
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: "user-123",
			})

			await onFinishCallback({ text: "Response", usage: null })

			expect(mockLoggerInfo).toHaveBeenCalledWith(
				"HybridChatService.streamHybridChat.onFinish",
				expect.objectContaining({
					message: "Successfully saved messages to database.",
				}),
			)
		})
	})
})

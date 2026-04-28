/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { runEphemeralRag } from "$services/Ephemeral/EphemeralRagRunner"
import { ModelMessage } from "ai"

jest.mock("$services/AiChat/HybridChatCore", () => {
	const executeHybridChatCore = jest.fn<any>()
	return { executeHybridChatCore, __mocks: { executeHybridChatCore } }
})

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/Ephemeral/EphemeralThreadStore", () => {
	const mockGetThread = jest.fn<any>()
	const mockAddMessage = jest.fn<any>()
	return {
		EphemeralThreadStore: {
			getInstance: jest.fn(() => ({
				getThread: mockGetThread,
				addMessage: mockAddMessage,
			})),
		},
		__mocks: { mockGetThread, mockAddMessage },
	}
})

const setupDefaultMocks = () => {
	const storeMocks = (jest.requireMock("$services/Ephemeral/EphemeralThreadStore") as any).__mocks
	storeMocks.mockGetThread.mockImplementation(() => ({
		threadId: "ephem_test123",
		tenantId: "test-tenant",
		messages: [],
		createdAt: new Date(),
		lastAccessed: new Date(),
		expiresAt: new Date(Date.now() + 86400000),
	}))
	storeMocks.mockAddMessage.mockResolvedValue(undefined)
}

describe("EphemeralRagRunner", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupDefaultMocks()
	})

	describe("runEphemeralRag", () => {
		it("should execute RAG without identity parameters", async () => {
			const hybridMocks = (jest.requireMock("$services/AiChat/HybridChatCore") as any).__mocks
			hybridMocks.executeHybridChatCore.mockResolvedValue(new Response())

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			const response = await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should throw error if thread not found", async () => {
			const storeMocks = (jest.requireMock("$services/Ephemeral/EphemeralThreadStore") as any).__mocks
			storeMocks.mockGetThread.mockImplementation(() => null)

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await expect(
				runEphemeralRag({
					messages,
					tenantId: "test-tenant",
					threadId: "non-existent",
				}),
			).rejects.toThrow("Thread not found or expired")
		})

		it("should add user message to thread", async () => {
			const hybridMocks = (jest.requireMock("$services/AiChat/HybridChatCore") as any).__mocks
			const storeMocks = (jest.requireMock("$services/Ephemeral/EphemeralThreadStore") as any).__mocks
			hybridMocks.executeHybridChatCore.mockResolvedValue(new Response())
			storeMocks.mockAddMessage.mockResolvedValue(undefined)

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(storeMocks.mockAddMessage).toHaveBeenCalled()
		})

		it("should call HybridChatCore with correct parameters", async () => {
			const hybridMocks = (jest.requireMock("$services/AiChat/HybridChatCore") as any).__mocks
			const storeMocks = (jest.requireMock("$services/Ephemeral/EphemeralThreadStore") as any).__mocks
			hybridMocks.executeHybridChatCore.mockResolvedValue(new Response())
			storeMocks.mockAddMessage.mockResolvedValue(undefined)

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(hybridMocks.executeHybridChatCore).toHaveBeenCalledWith(
				expect.objectContaining({
					messages,
					tenantId: "test-tenant",
					onFinish: expect.any(Function),
				}),
			)
		})

		it("should not pass userId to HybridChatCore", async () => {
			const hybridMocks = (jest.requireMock("$services/AiChat/HybridChatCore") as any).__mocks
			const storeMocks = (jest.requireMock("$services/Ephemeral/EphemeralThreadStore") as any).__mocks
			let capturedArgs: any = null
			hybridMocks.executeHybridChatCore.mockImplementation((args: any) => {
				capturedArgs = args
				return Promise.resolve(new Response())
			})
			storeMocks.mockAddMessage.mockResolvedValue(undefined)

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await runEphemeralRag({
				messages,
				tenantId: "test-tenant",
				threadId: "ephem_test123",
			})

			expect(capturedArgs).not.toBeNull()
			expect(capturedArgs).not.toHaveProperty("userId")
			expect(capturedArgs.tenantId).toBe("test-tenant")
			expect(capturedArgs.messages).toEqual(messages)
		})
	})
})

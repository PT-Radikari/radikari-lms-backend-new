/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals"
import { EphemeralChatService } from "$services/Ephemeral/EphemeralChatService"
import { EphemeralThreadStore } from "$services/Ephemeral/EphemeralThreadStore"
import { ModelMessage } from "ai"

process.env.EPHEMERAL_THREAD_TTL = "3600"
process.env.TENANT_ORIGIN_ALLOWLIST = '{"test-tenant":["http://localhost:3000"]}'

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/AiChat/HybridChatCore", () => ({
	executeHybridChatCore: jest.fn<any>(() =>
		Promise.resolve(new Response(new ReadableStream())),
	),
}))

describe("Ephemeral Integration Tests", () => {
	let service: EphemeralChatService
	let store: EphemeralThreadStore

	beforeAll(() => {
		service = EphemeralChatService.getInstance()
		store = EphemeralThreadStore.getInstance()
	})

	beforeEach(() => {
		jest.clearAllMocks()
		store.clear()
	})

	afterAll(() => {
		store.deleteAllThreadsForTenant("test-tenant")
	})

	describe("Foundation", () => {
		it("should create thread with ephem_ prefix", () => {
			const result = service.createThread("test-tenant")

			expect(result.threadId).toMatch(/^ephem_/)
			expect(result.tenantId).toBe("test-tenant")
			expect(result.expiresAt).toBeInstanceOf(Date)
		})

		it("should retrieve thread by ID", () => {
			const created = service.createThread("test-tenant")
			const retrieved = store.getThread("test-tenant", created.threadId)

			expect(retrieved).not.toBeNull()
			expect(retrieved!.threadId).toBe(created.threadId)
		})
	})

	describe("Ephemeral Core", () => {
		it("should remove expired threads", () => {
			const threadId = "ephem_expired"
			const tenantId = "test-tenant"
			// @ts-ignore
			store.threads.set(`ephemeral:${tenantId}:${threadId}`, {
				threadId,
				tenantId,
				messages: [],
				createdAt: new Date(Date.now() - 10000),
				lastAccessed: new Date(Date.now() - 10000),
				expiresAt: new Date(Date.now() - 5000),
			})

			const result = store.getThread(tenantId, threadId)
			expect(result).toBeNull()
		})

		it("should show correct metrics", () => {
			service.createThread("test-tenant")
			service.createThread("test-tenant")

			const metrics = store.getMetrics()

			expect(metrics.totalThreads).toBe(2)
			expect(metrics.activeThreads).toBe(2)
			expect(metrics.expiredThreads).toBe(0)
		})
	})

	describe("Ephemeral Rag Runner", () => {
		it("should call HybridChatCore successfully", async () => {
			const hybridMock = jest.requireMock("$services/AiChat/HybridChatCore") as any
			hybridMock.executeHybridChatCore.mockResolvedValue(new Response(new ReadableStream()))

			const thread = service.createThread("test-tenant")
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			const response = await service.sendMessage(
				"test-tenant",
				thread.threadId,
				messages,
			)

			expect(response).toBeInstanceOf(Response)
			expect(hybridMock.executeHybridChatCore).toHaveBeenCalled()
		})

		it("should update thread messages in memory", async () => {
			const hybridMock = jest.requireMock("$services/AiChat/HybridChatCore") as any
			hybridMock.executeHybridChatCore.mockResolvedValue(new Response(new ReadableStream()))

			const thread = service.createThread("test-tenant")
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await service.sendMessage("test-tenant", thread.threadId, messages)

			const updatedThread = store.getThread("test-tenant", thread.threadId)
			expect(updatedThread?.messages.length).toBe(1)
		})

		it("should return error if thread not found", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			await expect(
				service.sendMessage("test-tenant", "non-existent-thread", messages),
			).rejects.toThrow("Thread not found or expired")
		})
	})

	describe("Service", () => {
		it("should enforce tenant isolation", () => {
			service.createThread("tenant-1")
			const thread2 = service.createThread("tenant-2")

			const result = store.getThread("tenant-1", thread2.threadId)
			expect(result).toBeNull()

			const result2 = store.getThread("tenant-2", thread2.threadId)
			expect(result2).not.toBeNull()
		})
	})
})

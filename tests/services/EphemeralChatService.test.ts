/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { EphemeralChatService } from "$services/Ephemeral/EphemeralChatService"

const mockCreateThread = jest.fn<any>()
const mockGetThread = jest.fn<any>()
const mockDeleteAllThreadsForTenant = jest.fn<any>()
const mockGetMetrics = jest.fn<any>()
const mockRunEphemeralRag = jest.fn<any>()

jest.mock("$services/Ephemeral/EphemeralThreadStore", () => ({
	EphemeralThreadStore: {
		getInstance: jest.fn<any>().mockReturnValue({
			createThread: (...args: any[]) => mockCreateThread(...args),
			getThread: (...args: any[]) => mockGetThread(...args),
			deleteAllThreadsForTenant: (...args: any[]) => mockDeleteAllThreadsForTenant(...args),
			getMetrics: (...args: any[]) => mockGetMetrics(...args),
		}),
	},
}))

jest.mock("$services/Ephemeral/EphemeralRagRunner", () => ({
	runEphemeralRag: (...args: any[]) => mockRunEphemeralRag(...args),
}))

jest.mock("$pkg/logger", () => {
	return {
		__esModule: true,
		default: {
			info: jest.fn(),
			error: jest.fn(),
		},
	}
})

describe("EphemeralChatService", () => {
	let service: EphemeralChatService

	beforeEach(() => {
		jest.clearAllMocks()
		service = new (EphemeralChatService as any)()
	})

	describe("createThread", () => {
		it("should create a new thread for valid tenantId", () => {
			const mockThread = {
				threadId: "thread-123",
				tenantId: "tenant-123",
				expiresAt: new Date(),
			}
			mockCreateThread.mockReturnValue(mockThread)

			const result = service.createThread("tenant-123")

			expect(result.threadId).toBe("thread-123")
			expect(result.tenantId).toBe("tenant-123")
			expect(result.expiresAt).toBeDefined()
		})

		it("should throw error for empty tenantId", () => {
			expect(() => service.createThread("")).toThrow("Invalid tenantId")
		})

		it("should throw error for null tenantId", () => {
			expect(() => service.createThread(null as any)).toThrow("Invalid tenantId")
		})

	})

	describe("sendMessage", () => {
		it("should send message to valid thread", async () => {
			const mockThread = {
				threadId: "thread-123",
				tenantId: "tenant-123",
				expiresAt: new Date(),
			}
			const mockResponse = new Response("AI response")
			mockGetThread.mockReturnValue(mockThread)
			mockRunEphemeralRag.mockResolvedValue(mockResponse)

			const messages = [{ role: "user", content: "Hello" }] as any
			const result = await service.sendMessage("tenant-123", "thread-123", messages)

			expect(result).toBe(mockResponse)
			expect(mockRunEphemeralRag).toHaveBeenCalledWith({
				messages,
				tenantId: "tenant-123",
				threadId: "thread-123",
			})
		})

		it("should throw error when thread not found", async () => {
			mockGetThread.mockReturnValue(null)

			const messages = [{ role: "user", content: "Hello" }] as any

			await expect(
				service.sendMessage("tenant-123", "thread-123", messages),
			).rejects.toThrow("Thread not found or expired")
		})

		it("should throw error when tenant ID mismatch", async () => {
			const mockThread = {
				threadId: "thread-123",
				tenantId: "tenant-456",
				expiresAt: new Date(),
			}
			mockGetThread.mockReturnValue(mockThread)

			const messages = [{ role: "user", content: "Hello" }] as any

			await expect(
				service.sendMessage("tenant-123", "thread-123", messages),
			).rejects.toThrow("Tenant ID mismatch")
		})
	})

	describe("getMetrics", () => {
		it("should return store metrics", () => {
			const mockMetrics = {
				totalThreads: 5,
				expiredThreads: 1,
			}
			mockGetMetrics.mockReturnValue(mockMetrics)

			const result = service.getMetrics()

			expect(result).toEqual(mockMetrics)
		})
	})

	describe("deleteAllThreadsForTenant", () => {
		it("should delete all threads for tenant and return count", () => {
			mockDeleteAllThreadsForTenant.mockReturnValue(3)

			const result = service.deleteAllThreadsForTenant("tenant-123")

			expect(result).toBe(3)
			expect(mockDeleteAllThreadsForTenant).toHaveBeenCalledWith("tenant-123")
		})
	})
})

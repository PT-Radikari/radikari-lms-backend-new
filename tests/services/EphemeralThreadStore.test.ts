/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { EphemeralThreadStore } from "$services/Ephemeral/EphemeralThreadStore"
import { ModelMessage } from "ai"

jest.mock("$pkg/logger", () => ({
	info: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
	warn: jest.fn(),
}))

describe("EphemeralThreadStore", () => {
	let store: EphemeralThreadStore

	beforeEach(() => {
		store = EphemeralThreadStore.getInstance()
		store.clear()
		process.env.EPHEMERAL_THREAD_TTL = "1"
	})

	describe("createThread", () => {
		it("should create thread with ephem_ prefix", () => {
			const thread = store.createThread("test-tenant")

			expect(thread.threadId).toMatch(/^ephem_/)
			expect(thread.tenantId).toBe("test-tenant")
			expect(thread.messages).toEqual([])
			expect(thread.createdAt).toBeInstanceOf(Date)
			expect(thread.expiresAt).toBeInstanceOf(Date)
		})

		it("should set correct TTL", () => {
			const thread = store.createThread("test-tenant")
			const now = new Date()

			const expectedExpiry = new Date(now.getTime() + 1000)
			expect(thread.expiresAt.getTime()).toBeCloseTo(
				expectedExpiry.getTime(),
				-2,
			)
		})
	})

	describe("getThread", () => {
		it("should retrieve existing thread", () => {
			const created = store.createThread("test-tenant")
			const retrieved = store.getThread("test-tenant", created.threadId)

			expect(retrieved).not.toBeNull()
			expect(retrieved?.threadId).toBe(created.threadId)
		})

		it("should return null for non-existent thread", () => {
			const result = store.getThread("test-tenant", "non-existent")
			expect(result).toBeNull()
		})

		it("should return null and delete expired thread", async () => {
			const thread = store.createThread("test-tenant")
			await new Promise((resolve) => setTimeout(resolve, 1100))

			const result = store.getThread("test-tenant", thread.threadId)
			expect(result).toBeNull()
		})

		it("should update lastAccessed on retrieval", async () => {
			const thread = store.createThread("test-tenant")
			const firstAccessed = thread.lastAccessed

			await new Promise((resolve) => setTimeout(resolve, 10))

			const retrieved = store.getThread("test-tenant", thread.threadId)
			expect(retrieved?.lastAccessed.getTime()).toBeGreaterThan(
				firstAccessed.getTime(),
			)
		})
	})

	describe("addMessage", () => {
		it("should add message to thread", () => {
			const thread = store.createThread("test-tenant")
			const message: ModelMessage = { role: "user", content: "Hello" }

			const result = store.addMessage("test-tenant", thread.threadId, message)

			expect(result).toBe(true)

			const updatedThread = store.getThread("test-tenant", thread.threadId)
			expect(updatedThread?.messages).toHaveLength(1)
			expect(updatedThread?.messages[0]).toEqual(message)
		})

		it("should return false for non-existent thread", () => {
			const message: ModelMessage = { role: "user", content: "Hello" }
			const result = store.addMessage("test-tenant", "non-existent", message)

			expect(result).toBe(false)
		})
	})

	describe("deleteExpiredThreads", () => {
		it("should delete expired threads", async () => {
			store.createThread("test-tenant")
			store.createThread("test-tenant")
			await new Promise((resolve) => setTimeout(resolve, 1100))
			store.createThread("test-tenant")

			const deletedCount = store.deleteExpiredThreads()

			expect(deletedCount).toBe(2)
		})
	})

	describe("getMetrics", () => {
		it("should return correct metrics", () => {
			store.createThread("test-tenant")
			store.createThread("test-tenant")

			const metrics = store.getMetrics()

			expect(metrics.totalThreads).toBe(2)
			expect(metrics.activeThreads).toBe(2)
			expect(metrics.expiredThreads).toBe(0)
		})
	})

	describe("deleteAllThreadsForTenant", () => {
		it("should delete all threads for tenant", () => {
			store.createThread("tenant-1")
			store.createThread("tenant-1")
			store.createThread("tenant-2")

			const deletedCount = store.deleteAllThreadsForTenant("tenant-1")

			expect(deletedCount).toBe(2)
		})
	})

	describe("tenant isolation", () => {
		it("should isolate threads by tenant", () => {
			store.createThread("tenant-1")
			const thread2 = store.createThread("tenant-2")

			const result = store.getThread("tenant-1", thread2.threadId)
			expect(result).toBeNull()

			const result2 = store.getThread("tenant-2", thread2.threadId)
			expect(result2).not.toBeNull()
		})
	})
})

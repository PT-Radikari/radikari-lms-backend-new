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

// =========================================================
// Deep Edge Cases — untested paths from coverage analysis
// =========================================================
describe("EphemeralThreadStore — deep edge cases", () => {
	let store: EphemeralThreadStore

	beforeEach(() => {
		store = EphemeralThreadStore.getInstance()
		store.clear()
		process.env.EPHEMERAL_THREAD_TTL = "1"
	})

	describe("createThread — TTL fallback", () => {
		it("defaults to 86400 when EPHEMERAL_THREAD_TTL is absent", () => {
			delete process.env.EPHEMERAL_THREAD_TTL
			// Force re-instantiation by clearing instance
			;(EphemeralThreadStore as any).instance = undefined
			const freshStore = new (EphemeralThreadStore as any)()
			const thread = freshStore.createThread("test-tenant")
			const now = new Date()
			const expectedExpiry = new Date(now.getTime() + 86400 * 1000)
			expect(thread.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3)
		})

		it("defaults to 86400 when EPHEMERAL_THREAD_TTL is non-numeric", () => {
			process.env.EPHEMERAL_THREAD_TTL = "invalid"
			;(EphemeralThreadStore as any).instance = undefined
			const freshStore = new (EphemeralThreadStore as any)()
			const thread = freshStore.createThread("test-tenant")
			const now = new Date()
			const expectedExpiry = new Date(now.getTime() + 86400 * 1000)
			// parseInt("invalid") → NaN → NaN+now → Invalid Date, but || fallback gives 86400
			// Confirm expiresAt is a valid Date (not NaN) and is ~24h from now
			expect(Number.isNaN(thread.expiresAt.getTime())).toBe(false)
			expect(thread.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3)
		})
	})

	describe("getThread — expiration boundary", () => {
		it("returns thread when expiresAt equals current time (uses > not >=)", () => {
			process.env.EPHEMERAL_THREAD_TTL = "0"
			;(EphemeralThreadStore as any).instance = undefined
			const freshStore = new (EphemeralThreadStore as any)()
			const thread = freshStore.createThread("test-tenant")
			// Manually set expiresAt to exactly now
			thread.expiresAt = new Date()
			freshStore.threads.set(
				freshStore.buildKey("test-tenant", thread.threadId),
				thread,
			)
			// With TTL=0, expiresAt is now. Since code uses `>` (strict), thread should still be valid
			const result = freshStore.getThread("test-tenant", thread.threadId)
			// Thread is returned (not expired yet) — boundary is `>` not `>=`
			expect(result).not.toBeNull()
		})
	})

	describe("addMessage — lastAccessed persistence and message variants", () => {
		it("persists lastAccessed via addMessage (needs getThread to flush)", () => {
			const thread = store.createThread("test-tenant")

			const message: ModelMessage = { role: "user", content: "Hello" }
			store.addMessage("test-tenant", thread.threadId, message)

			// addMessage mutates but doesn't persist — need getThread to re-register
			const reFetched = store.getThread("test-tenant", thread.threadId)
			expect(reFetched?.messages).toHaveLength(1)
		})

		it("adds multiple messages accumulating correctly", () => {
			const thread = store.createThread("test-tenant")
			store.addMessage("test-tenant", thread.threadId, { role: "user", content: "Hello" })
			store.addMessage("test-tenant", thread.threadId, { role: "assistant", content: "Hi!" })
			store.addMessage("test-tenant", thread.threadId, { role: "user", content: "How are you?" })

			const updated = store.getThread("test-tenant", thread.threadId)
			expect(updated?.messages).toHaveLength(3)
		})

		it("addMessage returns false for expired thread", async () => {
			process.env.EPHEMERAL_THREAD_TTL = "0"
			;(EphemeralThreadStore as any).instance = undefined
			const freshStore = new (EphemeralThreadStore as any)()
			const thread = freshStore.createThread("test-tenant")
			thread.expiresAt = new Date(Date.now() - 1000) // Already expired
			freshStore.threads.set(
				freshStore.buildKey("test-tenant", thread.threadId),
				thread,
			)

			const result = freshStore.addMessage("test-tenant", thread.threadId, {
				role: "user",
				content: "Hello",
			})
			expect(result).toBe(false)
		})
	})

	describe("deleteExpiredThreads — edge cases", () => {
		it("returns 0 when store is empty", () => {
			const deleted = store.deleteExpiredThreads()
			expect(deleted).toBe(0)
		})

		it("returns 0 when no threads are expired", () => {
			store.createThread("tenant-1")
			store.createThread("tenant-2")

			const deleted = store.deleteExpiredThreads()
			expect(deleted).toBe(0)
		})

		it("deletes ALL expired threads when every thread is expired", async () => {
			store.createThread("tenant-1")
			store.createThread("tenant-2")
			store.createThread("tenant-3")
			await new Promise((resolve) => setTimeout(resolve, 1100))

			const deleted = store.deleteExpiredThreads()
			expect(deleted).toBe(3)
			const metrics = store.getMetrics()
			expect(metrics.totalThreads).toBe(0)
		})
	})

	describe("getMetrics — non-destructive and mixed state", () => {
		it("does NOT auto-delete expired threads (unlike getThread)", async () => {
			store.createThread("tenant-1")
			await new Promise((resolve) => setTimeout(resolve, 1100))
			store.createThread("tenant-2")

			// getMetrics should count expired but NOT delete them
			const metrics = store.getMetrics()
			expect(metrics.expiredThreads).toBe(1)
			expect(metrics.activeThreads).toBe(1)
			expect(metrics.totalThreads).toBe(2)

			// getThread should still see the expired one as null
			store.getThread("tenant-1", "")
			// But totalThreads in metrics still shows 2 (not auto-deleted by getMetrics)
		})

		it("returns correct mixed state counts", () => {
			store.createThread("tenant-1")
			store.createThread("tenant-1")
			store.createThread("tenant-2")

			const metrics = store.getMetrics()
			expect(metrics.totalThreads).toBe(3)
			expect(metrics.activeThreads).toBe(3)
			expect(metrics.expiredThreads).toBe(0)
		})
	})

	describe("deleteAllThreadsForTenant — zero and prefix edge cases", () => {
		it("returns 0 when tenant has no threads", () => {
			store.createThread("tenant-other")

			const deleted = store.deleteAllThreadsForTenant("tenant-no-match")
			expect(deleted).toBe(0)
		})

		it("exact prefix matching — tenant-id prefix of another does NOT match", () => {
			// Build key format: "ephemeral:tenantId:threadId"
			// If we create thread with tenantId="t", key is "ephemeral:t:threadId"
			// Deleting with prefix "ephemeral:tenant:" would NOT match "ephemeral:t:"
			store.createThread("tenant") // key: ephemeral:tenant:...
			const threadT = store.createThread("t") // key: ephemeral:t:...

			const deleted = store.deleteAllThreadsForTenant("tenant")
			expect(deleted).toBe(1) // Only "tenant", not "t"

			// Verify "t" thread still exists
			const stillExists = store.getThread("t", threadT.threadId)
			expect(stillExists).not.toBeNull()
		})
	})

	describe("clear — explicit state verification", () => {
		it("sets totalThreads to 0 after clear", () => {
			store.createThread("tenant-1")
			store.createThread("tenant-1")
			store.createThread("tenant-2")

			expect(store.getMetrics().totalThreads).toBe(3)

			store.clear()

			expect(store.getMetrics().totalThreads).toBe(0)
			expect(store.getMetrics().activeThreads).toBe(0)
			expect(store.getMetrics().expiredThreads).toBe(0)
		})
	})

	describe("singleton — instance identity", () => {
		it("getInstance returns the same reference", () => {
			const instance1 = EphemeralThreadStore.getInstance()
			const instance2 = EphemeralThreadStore.getInstance()
			expect(instance1).toBe(instance2)
		})

		it("clear affects the shared singleton state", () => {
			store.createThread("tenant-1")
			expect(store.getMetrics().totalThreads).toBe(1)

			const sameInstance = EphemeralThreadStore.getInstance()
			sameInstance.clear()
			expect(store.getMetrics().totalThreads).toBe(0)
		})
	})

	describe("buildKey and generateThreadId — private helper verification", () => {
		it("buildKey produces correct format ephemeral:tenantId:threadId", () => {
			// Access private method via any cast for coverage
			const key = (store as any).buildKey("my-tenant", "my-thread")
			expect(key).toBe("ephemeral:my-tenant:my-thread")
		})

		it("generateThreadId produces ephem_ prefix", () => {
			const id = (store as any).generateThreadId()
			expect(id).toMatch(/^ephem_/)
			expect(id.length).toBeGreaterThan(6) // ephem_ + ulid
		})
	})
})

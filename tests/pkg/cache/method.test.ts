/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach,jest } from "@jest/globals"

var mockRedisGet = jest.fn<any>()
var mockRedisSet = jest.fn<any>()
var mockRedisSetex = jest.fn<any>()
var mockRedisDel = jest.fn<any>()
var mockRedisScan = jest.fn<any>()
var mockRedisExpire = jest.fn<any>()
var mockRedisFlushall = jest.fn<any>()
var mockRedisPing = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

jest.mock("$pkg/cache", () => ({
	CacheInstance: {
		getInstance: () => ({
			client: {
				get: (...args: any[]) => mockRedisGet(...args),
				set: (...args: any[]) => mockRedisSet(...args),
				setex: (...args: any[]) => mockRedisSetex(...args),
				del: (...args: any[]) => mockRedisDel(...args),
				scan: (...args: any[]) => mockRedisScan(...args),
				expire: (...args: any[]) => mockRedisExpire(...args),
				flushall: (...args: any[]) => mockRedisFlushall(...args),
				ping: (...args: any[]) => mockRedisPing(...args),
			},
		}),
	},
}))

import * as Method from "$pkg/cache/method"

describe("pkg/cache/method", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockRedisGet.mockReset()
		mockRedisSet.mockReset()
		mockRedisSetex.mockReset()
		mockRedisDel.mockReset()
		mockRedisScan.mockReset()
		mockRedisExpire.mockReset()
		mockRedisFlushall.mockReset()
		mockRedisPing.mockReset()
	})

	// ─── get ───────────────────────────────────────────────────────────────

	describe("get", () => {
		it("returns null when key does not exist", async () => {
			mockRedisGet.mockResolvedValue(null)
			const result = await Method.get("nonexistent")
			expect(result).toBeNull()
			expect(mockRedisGet).toHaveBeenCalledWith("nonexistent")
		})

		it("parses JSON value and returns it", async () => {
			mockRedisGet.mockResolvedValue('{"name":"test","count":42}')
			const result = await Method.get<{ name: string; count: number }>("key")
			expect(result).toEqual({ name: "test", count: 42 })
		})

		it("returns raw string when JSON parse fails", async () => {
			mockRedisGet.mockResolvedValue("plain-text-value")
			const result = await Method.get<string>("key")
			expect(result).toBe("plain-text-value")
		})

		it("throws on Redis error", async () => {
			mockRedisGet.mockRejectedValue(new Error("Redis down"))
			await expect(Method.get("key")).rejects.toThrow("Redis cache get error:")
		})
	})

	// ─── set ──────────────────────────────────────────────────────────────

	describe("set", () => {
		it("uses set without TTL by default", async () => {
			mockRedisSet.mockResolvedValue("OK")
			await Method.set("key", { data: "value" })
			expect(mockRedisSet).toHaveBeenCalledWith("key", '{"data":"value"}')
			expect(mockRedisSetex).not.toHaveBeenCalled()
		})

		it("uses setex with TTL when options provided", async () => {
			mockRedisSetex.mockResolvedValue("OK")
			await Method.set("key", { data: "value" }, { ttl: 3600 })
			expect(mockRedisSetex).toHaveBeenCalledWith("key", 3600, '{"data":"value"}')
			expect(mockRedisSet).not.toHaveBeenCalled()
		})

		it("throws on Redis error", async () => {
			mockRedisSet.mockRejectedValue(new Error("Redis down"))
			await expect(Method.set("key", "value")).rejects.toThrow("Redis cache set error:")
		})
	})

	// ─── removeCache ───────────────────────────────────────────────────────

	describe("removeCache", () => {
		it("deletes single key", async () => {
			mockRedisDel.mockResolvedValue(1)
			await Method.removeCache("key")
			expect(mockRedisDel).toHaveBeenCalledWith("key")
		})

		it("throws on Redis error", async () => {
			mockRedisDel.mockRejectedValue(new Error("Redis down"))
			await expect(Method.removeCache("key")).rejects.toThrow("Redis cache remove error:")
		})
	})

	// ─── removeCacheByPattern ──────────────────────────────────────────────

	describe("removeCacheByPattern", () => {
		it("deletes all keys matching pattern", async () => {
			mockRedisScan
				.mockResolvedValueOnce(["5", ["user:1", "user:2"]])
				.mockResolvedValueOnce(["0", ["user:3"]])
			mockRedisDel.mockResolvedValue(3)

			await Method.removeCacheByPattern("user:*")

			expect(mockRedisScan).toHaveBeenCalledTimes(2)
			expect(mockRedisDel).toHaveBeenCalledWith("user:1", "user:2", "user:3")
		})

		it("logs and exits when no keys match", async () => {
			mockRedisScan.mockResolvedValue(["0", []])

			await Method.removeCacheByPattern("nonexistent:*")

			expect(mockRedisDel).not.toHaveBeenCalled()
		})

		it("handles single-page scan result", async () => {
			mockRedisScan.mockResolvedValue(["0", ["key:a", "key:b"]])
			mockRedisDel.mockResolvedValue(2)

			await Method.removeCacheByPattern("key:*")

			expect(mockRedisScan).toHaveBeenCalledTimes(1)
			expect(mockRedisDel).toHaveBeenCalledWith("key:a", "key:b")
		})

		it("throws on Redis scan error", async () => {
			mockRedisScan.mockRejectedValue(new Error("Redis down"))
			await expect(Method.removeCacheByPattern("key:*")).rejects.toThrow(
				'Redis cache remove error for pattern "key:*"',
			)
		})
	})

	// ─── extendTTL ─────────────────────────────────────────────────────────

	describe("extendTTL", () => {
		it("returns true when TTL was set", async () => {
			mockRedisExpire.mockResolvedValue(1)
			const result = await Method.extendTTL("key", 3600)
			expect(result).toBe(true)
			expect(mockRedisExpire).toHaveBeenCalledWith("key", 3600)
		})

		it("returns false when key does not exist", async () => {
			mockRedisExpire.mockResolvedValue(0)
			const result = await Method.extendTTL("nonexistent", 3600)
			expect(result).toBe(false)
		})

		it("throws on Redis error", async () => {
			mockRedisExpire.mockRejectedValue(new Error("Redis down"))
			await expect(Method.extendTTL("key", 3600)).rejects.toThrow(
				"Redis cache extend TTL error",
			)
		})
	})

	// ─── purgeCache ────────────────────────────────────────────────────────

	describe("purgeCache", () => {
		it("flushes all keys", async () => {
			mockRedisFlushall.mockResolvedValue("OK")
			await Method.purgeCache()
			expect(mockRedisFlushall).toHaveBeenCalled()
		})

		it("throws on Redis error", async () => {
			mockRedisFlushall.mockRejectedValue(new Error("Redis down"))
			await expect(Method.purgeCache()).rejects.toThrow("Redis cache flushAll error:")
		})
	})

	// ─── ping ──────────────────────────────────────────────────────────────

	describe("ping", () => {
		it("returns true on PONG", async () => {
			mockRedisPing.mockResolvedValue("PONG")
			const result = await Method.ping()
			expect(result).toBe(true)
		})

		it("returns false on error (does not throw)", async () => {
			mockRedisPing.mockRejectedValue(new Error("Redis down"))
			const result = await Method.ping()
			expect(result).toBe(false)
		})
	})

	// ─── wrapWithCache ─────────────────────────────────────────────────────

	describe("wrapWithCache", () => {
		it("returns cached value on cache hit", async () => {
			mockRedisGet.mockResolvedValue('{"cached":true}')
			const fn = jest.fn<any>()
			const result = await Method.wrapWithCache("key", fn)
			expect(result).toEqual({ cached: true })
			expect(fn).not.toHaveBeenCalled()
		})

		it("calls fn and caches result on cache miss", async () => {
			mockRedisGet.mockResolvedValue(null)
			mockRedisSet.mockResolvedValue("OK")
			const fn = jest.fn<any>().mockResolvedValue({ computed: true })

			const result = await Method.wrapWithCache("key", fn)

			expect(result).toEqual({ computed: true })
			expect(fn).toHaveBeenCalled()
			expect(mockRedisSet).toHaveBeenCalledWith("key", '{"computed":true}')
		})

		it("does not cache null result", async () => {
			mockRedisGet.mockResolvedValue(null)
			const fn = jest.fn<any>().mockResolvedValue(null)

			const result = await Method.wrapWithCache("key", fn)

			expect(result).toBeNull()
			expect(mockRedisSet).not.toHaveBeenCalled()
			expect(mockRedisSetex).not.toHaveBeenCalled()
		})

		it("caches with TTL when options provided", async () => {
			mockRedisGet.mockResolvedValue(null)
			mockRedisSetex.mockResolvedValue("OK")
			const fn = jest.fn<any>().mockResolvedValue({ data: "x" })

			await Method.wrapWithCache("key", fn, { ttl: 1800 })

			expect(mockRedisSetex).toHaveBeenCalledWith("key", 1800, '{"data":"x"}')
			expect(mockRedisSet).not.toHaveBeenCalled()
		})

		it("throws when fn throws", async () => {
			mockRedisGet.mockResolvedValue(null)
			const fn = jest.fn<any>().mockRejectedValue(new Error("Compute failed"))

			await expect(Method.wrapWithCache("key", fn)).rejects.toThrow("Compute failed")
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

jest.mock("$repositories/BroadcastRepository", () => {
	const mockGetByTenantId = jest.fn<any>()
	const mockUpsertByTenantId = jest.fn<any>()
	return { getByTenantId: mockGetByTenantId, upsertByTenantId: mockUpsertByTenantId }
})

jest.mock("$repositories/TenantRepository", () => ({ getById: jest.fn<any>() }))

jest.mock("$pkg/logger", () => ({ info: jest.fn<any>(), error: jest.fn<any>() }))

import { getByTenantId, upsertByTenantId } from "$services/BroadcastService"

describe("BroadcastService", () => {
	beforeEach(() => { jest.clearAllMocks() })

	describe("getByTenantId", () => {
		it("should return broadcast when found", async () => {
			const mocks = jest.requireMock("$repositories/BroadcastRepository") as any
			mocks.getByTenantId.mockResolvedValue({ id: "broadcast-123", content: "Test content" })
			const result = await getByTenantId("tenant-123")
			expect(result.status).toBe(true)
		})

		it("should return empty data when broadcast not found", async () => {
			const mocks = jest.requireMock("$repositories/BroadcastRepository") as any
			mocks.getByTenantId.mockResolvedValue(null)
			const result = await getByTenantId("tenant-123")
			expect(result.status).toBe(true)
			expect(result.data).toEqual({})
		})
	})

	describe("upsertByTenantId", () => {
		it("should create broadcast when not found", async () => {
			const broadcastMocks = jest.requireMock("$repositories/BroadcastRepository") as any
			const tenantMocks = jest.requireMock("$repositories/TenantRepository") as any
			broadcastMocks.getByTenantId.mockResolvedValue(null)
			tenantMocks.getById.mockResolvedValue({ id: "tenant-123" })
			broadcastMocks.upsertByTenantId.mockResolvedValue({ id: "broadcast-123", content: "New Broadcast" })
			const result = await upsertByTenantId("tenant-123", { content: "New Broadcast" } as any, "user-123")
			expect(result.status).toBe(true)
		})

		it("should update broadcast when found", async () => {
			const mocks = jest.requireMock("$repositories/BroadcastRepository") as any
			mocks.upsertByTenantId.mockResolvedValue({ id: "broadcast-123", content: "Updated Broadcast" })
			const result = await upsertByTenantId("tenant-123", { content: "Updated Broadcast" } as any, "user-123")
			expect(result.status).toBe(true)
		})

		it("should return error when tenant not found", async () => {
			const mocks = jest.requireMock("$repositories/TenantRepository") as any
			mocks.getById.mockResolvedValue(null)
			const result = await upsertByTenantId("nonexistent", { content: "Broadcast" } as any, "user-123")
			expect(result.status).toBe(false)
		})
	})
})

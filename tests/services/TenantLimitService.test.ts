/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { checkTokenLimit } from "$services/Tenant/TenantLimitService"

const mockTenantFindUnique = jest.fn<any>()
const mockAggregate = jest.fn<any>()
const mockNotificationFindFirst = jest.fn<any>()
const mockNotifyTenantUsers = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	prisma: {
		tenant: {
			findUnique: (...args: any[]) => mockTenantFindUnique(...args),
		},
		aiUsageLog: {
			aggregate: (...args: any[]) => mockAggregate(...args),
		},
		notification: {
			findFirst: (...args: any[]) => mockNotificationFindFirst(...args),
		},
	},
}))

jest.mock("$services/NotificationService", () => ({
	notifyTenantUsers: (...args: any[]) => mockNotifyTenantUsers(...args),
}))

jest.mock("$pkg/logger", () => ({
	default: {
		info: jest.fn(),
		error: jest.fn(),
	},
}))

describe("TenantLimitService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("checkTokenLimit", () => {
		it("should allow when tenant has no token limit", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 0,
			})

			const result = await checkTokenLimit("tenant-123")

			expect(result.allowed).toBe(true)
			expect(result.usage).toBe(0)
			expect(result.limit).toBe(0)
		})

		it("should allow when tenant has null token limit", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: null,
			})

			const result = await checkTokenLimit("tenant-123")

			expect(result.allowed).toBe(true)
		})

		it("should allow when tenant not found", async () => {
			mockTenantFindUnique.mockResolvedValue(null)

			const result = await checkTokenLimit("non-existent")

			expect(result.allowed).toBe(true)
		})

		it("should allow when usage is below limit", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 1000000,
			})
			mockAggregate.mockResolvedValue({ _sum: { totalTokens: 500000 } })

			const result = await checkTokenLimit("tenant-123")

			expect(result.allowed).toBe(true)
			expect(result.usage).toBe(500000)
			expect(result.limit).toBe(1000000)
			expect(result.usagePercent).toBe(50)
		})

		it("should deny when usage reaches limit", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 1000000,
			})
			mockAggregate.mockResolvedValue({ _sum: { totalTokens: 1000000 } })
			mockNotificationFindFirst.mockResolvedValue(null)

			const result = await checkTokenLimit("tenant-123")

			expect(result.allowed).toBe(false)
			expect(result.usage).toBe(1000000)
			expect(result.limit).toBe(1000000)
			expect(result.usagePercent).toBe(100)
			expect(result.errorMessage).toBeDefined()
		})

		it("should send warning when usage exceeds 80%", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 1000000,
			})
			mockAggregate.mockResolvedValue({ _sum: { totalTokens: 850000 } })
			mockNotificationFindFirst.mockResolvedValue(null)

			await checkTokenLimit("tenant-123")

			expect(mockNotifyTenantUsers).toHaveBeenCalled()
		})

		it("should not send warning if already notified within 24h", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 1000000,
			})
			mockAggregate.mockResolvedValue({ _sum: { totalTokens: 850000 } })
			mockNotificationFindFirst.mockResolvedValue({ id: "existing-notif" })

			await checkTokenLimit("tenant-123")

			expect(mockNotifyTenantUsers).not.toHaveBeenCalled()
		})

		it("should handle null aggregate result", async () => {
			mockTenantFindUnique.mockResolvedValue({
				id: "tenant-123",
				name: "Test Tenant",
				tokenLimit: 1000000,
			})
			mockAggregate.mockResolvedValue({ _sum: { totalTokens: null } })

			const result = await checkTokenLimit("tenant-123")

			expect(result.allowed).toBe(true)
			expect(result.usage).toBe(0)
		})
	})
})

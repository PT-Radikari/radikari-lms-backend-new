/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { getByTenantId, upsertByTenantId } from "$services/AiPromptService"

// Define mocks at module scope BEFORE jest.mock calls so hoisting works
const mockGetByTenantId = jest.fn<any>()
const mockUpsertByTenantId = jest.fn<any>()
const mockGetById = jest.fn<any>()

jest.mock("$repositories/AiPromptRepository", () => ({
	getByTenantId: (...args: any[]) => mockGetByTenantId(...args),
	upsertByTenantId: (...args: any[]) => mockUpsertByTenantId(...args),
}))

jest.mock("$repositories/TenantRepository", () => ({
	getById: (...args: any[]) => mockGetById(...args),
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

describe("AiPromptService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getByTenantId", () => {
		it("should return existing AI prompt for tenant", async () => {
			const mockPrompt = {
				id: "prompt-123",
				tenantId: "tenant-123",
				prompt: "You are a helpful assistant",
			}
			mockGetByTenantId.mockResolvedValue(mockPrompt)

			const result = await getByTenantId("tenant-123")

			expect(result.status).toBe(true)
			expect(mockGetByTenantId).toHaveBeenCalledWith("tenant-123")
		})

		it("should return empty prompt string when no prompt exists", async () => {
			mockGetByTenantId.mockResolvedValue(null)

			const result = await getByTenantId("tenant-123")

			expect(result.status).toBe(true)
		})

		it("should handle errors and return 500", async () => {
			mockGetByTenantId.mockRejectedValue(new Error("DB error"))

			const result = await getByTenantId("tenant-123")

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})

	describe("upsertByTenantId", () => {
		const tenantId = "tenant-123"
		const userId = "user-123"
		const promptData = { prompt: "New system prompt" } as any

		it("should upsert AI prompt for valid tenant", async () => {
			const mockTenant = { id: tenantId, name: "Test Tenant" }
			const mockPrompt = {
				id: "prompt-123",
				tenantId,
				prompt: promptData.prompt,
			}
			mockGetById.mockResolvedValue(mockTenant)
			mockUpsertByTenantId.mockResolvedValue(mockPrompt)

			const result = await upsertByTenantId(tenantId, promptData, userId)

			expect(result.status).toBe(true)
			expect(mockUpsertByTenantId).toHaveBeenCalled()
		})

		it("should return error for invalid tenant", async () => {
			mockGetById.mockResolvedValue(null)

			const result = await upsertByTenantId("invalid-tenant", promptData, userId)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(404)
		})

		it("should handle errors and return 500", async () => {
			mockGetById.mockResolvedValue({ id: tenantId })
			mockUpsertByTenantId.mockRejectedValue(new Error("DB error"))

			const result = await upsertByTenantId(tenantId, promptData, userId)

			expect(result.status).toBe(false)
			expect((result as any).err.code).toBe(500)
		})
	})
})

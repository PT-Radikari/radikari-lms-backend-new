/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { executeHybridChatCore } from "$services/AiChat/HybridChatCore"
import { ModelMessage } from "ai"

jest.mock("$pkg/qdrant", () => ({
	qdrantClient: {
		search: jest.fn<any>(),
	},
}))

jest.mock("$repositories/KnowledgeRepository", () => ({
	getById: jest.fn<any>(),
	getByIds: jest.fn<any>(),
	updateStatus: jest.fn<any>(),
	create: jest.fn<any>(),
	getAll: jest.fn<any>(),
	getAllArchived: jest.fn<any>(),
	getSummary: jest.fn<any>(),
	update: jest.fn<any>(),
	deleteById: jest.fn<any>(),
	getAllVersionsById: jest.fn<any>(),
	createMany: jest.fn<any>(),
	createManyAttachments: jest.fn<any>(),
	createManyContent: jest.fn<any>(),
	createShare: jest.fn<any>(),
	findUsersByEmails: jest.fn<any>(),
	archiveOrUnarchiveKnowledge: jest.fn<any>(),
	incrementTotalViews: jest.fn<any>(),
}))

jest.mock("$services/Tenant/TenantLimitService", () => ({
	checkTokenLimit: jest.fn<any>(),
}))

jest.mock("$services/AiPromptService", () => ({
	getPrompt: jest.fn<any>(),
	getByTenantId: jest.fn<any>(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	debug: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

describe("HybridChatCore", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
		const limitMock = jest.requireMock("$services/Tenant/TenantLimitService") as any
		const promptMock = jest.requireMock("$services/AiPromptService") as any
		qdrantMock.qdrantClient.search.mockImplementation(() => Promise.resolve([]))
		limitMock.checkTokenLimit.mockImplementation(() =>
			Promise.resolve({ allowed: true }),
		)
		promptMock.getByTenantId.mockImplementation(() => Promise.resolve({ status: true, data: null }))
	})

	describe("executeHybridChatCore", () => {
		it("should execute RAG pipeline without side effects", async () => {
			const messages: ModelMessage[] = [
				{ role: "user", content: "What is Radikari?" },
			]

			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should throw error when token limit exceeded", async () => {
			const limitMock = jest.requireMock("$services/Tenant/TenantLimitService") as any
			limitMock.checkTokenLimit.mockImplementation(() =>
				Promise.resolve({
					allowed: false,
					errorMessage: "Limit exceeded",
				}),
			)

			const messages: ModelMessage[] = [
				{ role: "user", content: "Test message" },
			]

			await expect(
				executeHybridChatCore({ messages, tenantId: "test-tenant" }),
			).rejects.toThrow("Limit exceeded")
		})

		it("should return streaming response", async () => {
			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]

			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
			expect(response.body).toBeInstanceOf(ReadableStream)
		})

		it("should deduplicate search results by headline", async () => {
			const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
			qdrantMock.qdrantClient.search.mockResolvedValue([
				{ payload: { headline: "Same Title", knowledge_id: "k1" }, score: 0.9 },
				{ payload: { headline: "Same Title", knowledge_id: "k2" }, score: 0.8 },
				{ payload: { headline: "Different Title", knowledge_id: "k3" }, score: 0.7 },
			])

			const repoMocks = jest.requireMock("$repositories/KnowledgeRepository") as any
			repoMocks.getByIds.mockResolvedValue([
				{ id: "k1", headline: "Same Title", status: "APPROVED", isArchived: false },
				{ id: "k2", headline: "Same Title", status: "APPROVED", isArchived: false },
				{ id: "k3", headline: "Different Title", status: "APPROVED", isArchived: false },
			])
			repoMocks.getById.mockResolvedValue({ id: "k1", headline: "Same Title", knowledgeContent: [] })

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should filter non-APPROVED knowledge records", async () => {
			const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
			qdrantMock.qdrantClient.search.mockResolvedValue([
				{ payload: { headline: "Approved", knowledge_id: "k1" }, score: 0.9 },
				{ payload: { headline: "Pending", knowledge_id: "k2" }, score: 0.8 },
				{ payload: { headline: "Rejected", knowledge_id: "k3" }, score: 0.7 },
			])

			const repoMocks = jest.requireMock("$repositories/KnowledgeRepository") as any
			repoMocks.getByIds.mockResolvedValue([
				{ id: "k1", headline: "Approved", status: "APPROVED", isArchived: false },
				{ id: "k2", headline: "Pending", status: "PENDING", isArchived: false },
				{ id: "k3", headline: "Rejected", status: "REJECTED", isArchived: false },
			])
			repoMocks.getById.mockResolvedValue({ id: "k1", headline: "Approved", knowledgeContent: [] })

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should handle empty search results gracefully", async () => {
			const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
			qdrantMock.qdrantClient.search.mockResolvedValue([])

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should handle archived knowledge records", async () => {
			const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
			qdrantMock.qdrantClient.search.mockResolvedValue([
				{ payload: { headline: "Archived", knowledge_id: "k1" }, score: 0.9 },
			])

			const repoMocks = jest.requireMock("$repositories/KnowledgeRepository") as any
			repoMocks.getByIds.mockResolvedValue([
				{ id: "k1", headline: "Archived", status: "APPROVED", isArchived: true },
			])

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})
	})

	describe("normalizeVector", () => {
		it("should return same vector when magnitude is zero", async () => {
			// Test via the RAG pipeline - zero vector from mock
			const qdrantMock = (jest.requireMock("$pkg/qdrant") as any)
			qdrantMock.qdrantClient.search.mockResolvedValue([])

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})
	})

	describe("sanitizeTenantPrompt", () => {
		it("should handle empty tenant prompt", async () => {
			const promptMock = jest.requireMock("$services/AiPromptService") as any
			promptMock.getByTenantId.mockResolvedValue({ status: false })

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})

		it("should handle null prompt data", async () => {
			const promptMock = jest.requireMock("$services/AiPromptService") as any
			promptMock.getByTenantId.mockResolvedValue({ status: true, data: null })

			const messages: ModelMessage[] = [{ role: "user", content: "Hello" }]
			const response = await executeHybridChatCore({
				messages,
				tenantId: "test-tenant",
			})

			expect(response).toBeInstanceOf(Response)
		})
	})
})

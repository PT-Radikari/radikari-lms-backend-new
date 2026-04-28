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
}))

jest.mock("$services/Tenant/TenantLimitService", () => ({
	checkTokenLimit: jest.fn<any>(),
}))

jest.mock("$services/AiPromptService", () => ({
	getPrompt: jest.fn<any>(),
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
		qdrantMock.qdrantClient.search.mockImplementation(() => Promise.resolve([]))
		limitMock.checkTokenLimit.mockImplementation(() =>
			Promise.resolve({ allowed: true }),
		)
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
	})
})

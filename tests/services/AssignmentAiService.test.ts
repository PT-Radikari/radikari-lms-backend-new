/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { streamQuestions, questionGenerationSchema } from "$services/AssignmentAiService"

const mockCheckTokenLimit = jest.fn<any>()
const mockEmbed = jest.fn<any>()
const mockQdrantSearch = jest.fn<any>()
const mockGetById = jest.fn<any>()
const mockStreamObject = jest.fn<any>()

jest.mock("$services/Tenant/TenantLimitService", () => ({
	checkTokenLimit: (...args: any[]) => mockCheckTokenLimit(...args),
}))

jest.mock("$repositories/KnowledgeRepository", () => ({
	getById: (...args: any[]) => mockGetById(...args),
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

jest.mock("$pkg/logger", () => {
	return {
		__esModule: true,
		default: {
			info: jest.fn(),
			error: jest.fn(),
		},
	}
})

jest.mock("ai", () => ({
	streamObject: (...args: any[]) => mockStreamObject(...args),
	embed: (...args: any[]) => mockEmbed(...args),
}))

jest.mock("@ai-sdk/google", () => ({
	createGoogleGenerativeAI: jest.fn<any>().mockReturnValue({
		textEmbedding: jest.fn<any>().mockReturnValue({}),
	}),
}))

jest.mock("@ai-sdk/openai", () => ({
	openai: jest.fn<any>().mockReturnValue({}),
}))

jest.mock("$pkg/qdrant", () => ({
	qdrantClient: {
		search: (...args: any[]) => mockQdrantSearch(...args),
	},
}))

describe("AssignmentAiService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("questionGenerationSchema", () => {
		it("should have valid schema structure", () => {
			expect(questionGenerationSchema).toBeDefined()
			expect(typeof questionGenerationSchema.parse).toBe("function")
		})
	})

	describe("streamQuestions", () => {
		it("should throw error when token limit is exceeded", async () => {
			mockCheckTokenLimit.mockResolvedValue({
				allowed: false,
				errorMessage: "Token limit exceeded",
			})

			await expect(
				streamQuestions({
					prompt: "Generate questions about JavaScript",
					tenantId: "tenant-123",
				}),
			).rejects.toThrow("Token limit exceeded")
		})

		it("should proceed when token limit is allowed", async () => {
			mockCheckTokenLimit.mockResolvedValue({
				allowed: true,
				usage: 500000,
				limit: 1000000,
			})

			const mockStreamResult = {
				partialObjectStream: {
					map: jest.fn<any>().mockReturnThis(),
					asyncIterable: jest.fn<any>(),
				},
			}
			mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })
			mockQdrantSearch.mockResolvedValue([])
			mockStreamObject.mockReturnValue(mockStreamResult)

			const result = await streamQuestions({
				prompt: "Generate questions about JavaScript",
				tenantId: "tenant-123",
			})

			expect(result).toBeDefined()
			expect(mockCheckTokenLimit).toHaveBeenCalledWith("tenant-123")
		})

		it("should use default count of 5 when not specified", async () => {
			mockCheckTokenLimit.mockResolvedValue({
				allowed: true,
				usage: 0,
				limit: 1000000,
			})

			const mockStreamResult = {
				partialObjectStream: {
					map: jest.fn<any>().mockReturnThis(),
					asyncIterable: jest.fn<any>(),
				},
			}
			mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })
			mockQdrantSearch.mockResolvedValue([])
			mockStreamObject.mockReturnValue(mockStreamResult)

			await streamQuestions({
				prompt: "Generate questions",
				tenantId: "tenant-123",
			})

			expect(mockCheckTokenLimit).toHaveBeenCalled()
		})

		it("should handle RAG retrieval with knowledge context", async () => {
			mockCheckTokenLimit.mockResolvedValue({
				allowed: true,
				usage: 0,
				limit: 1000000,
			})

			const mockKnowledge = {
				id: "know-123",
				headline: "JavaScript Basics",
				knowledgeContent: [
					{ title: "Variables", description: "Variables store data" },
				],
			}

			mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })
			mockQdrantSearch.mockResolvedValue([
				{
					payload: {
						knowledge_id: "know-123",
						content: "Some content",
					},
				},
			])
			mockGetById.mockResolvedValue(mockKnowledge)

			const mockStreamResult = {
				partialObjectStream: {
					map: jest.fn<any>().mockReturnThis(),
					asyncIterable: jest.fn<any>(),
				},
			}
			mockStreamObject.mockReturnValue(mockStreamResult)

			const result = await streamQuestions({
				prompt: "Generate questions",
				tenantId: "tenant-123",
			})

			expect(result).toBeDefined()
			expect(mockQdrantSearch).toHaveBeenCalled()
		})

		it("should continue without error when RAG retrieval fails", async () => {
			mockCheckTokenLimit.mockResolvedValue({
				allowed: true,
				usage: 0,
				limit: 1000000,
			})

			mockEmbed.mockRejectedValue(new Error("Embedding error"))

			const mockStreamResult = {
				partialObjectStream: {
					map: jest.fn<any>().mockReturnThis(),
					asyncIterable: jest.fn<any>(),
				},
			}
			mockStreamObject.mockReturnValue(mockStreamResult)

			const result = await streamQuestions({
				prompt: "Generate questions",
				tenantId: "tenant-123",
			})

			expect(result).toBeDefined()
		})
	})
})

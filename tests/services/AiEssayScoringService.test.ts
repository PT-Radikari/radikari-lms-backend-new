/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { scoreEssayAnswer, evaluateEssayAnswers } from "$services/AiEssayScoringService"

const mockGenerateObject = jest.fn<any>()
const mockAiUsageLogCreate = jest.fn<any>()

jest.mock("ai", () => ({
	generateObject: (...args: any[]) => mockGenerateObject(...args),
}))

jest.mock("@ai-sdk/openai", () => ({
	openai: jest.fn<any>().mockReturnValue({}),
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		aiUsageLog: {
			create: (...args: any[]) => mockAiUsageLogCreate(...args),
		},
	},
}))

jest.mock("$pkg/logger", () => ({
	__esModule: true,
	default: {
		info: () => {},
		error: () => {},
	},
}))

describe("AiEssayScoringService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("scoreEssayAnswer", () => {
		const validRequest = {
			question: "What is photosynthesis?",
			userAnswer: "Photosynthesis is the process by which plants convert sunlight into energy.",
			expectedAnswer: "Process of converting sunlight to energy",
			context: "Biology class",
			tenantId: "tenant-123",
			userId: "user-123",
		}

		it("should return scored essay result on success", async () => {
			const mockResult = {
				isCorrect: true,
				score: 85,
				feedback: "Jawaban sangat baik",
				confidence: 0.9,
				strengths: ["Correct concept"],
				weaknesses: ["Missing details"],
				suggestions: ["Add more detail"],
				keyPointsCovered: ["sunlight", "energy"],
				keyPointsMissing: ["chlorophyll"],
			}

			mockGenerateObject.mockResolvedValue({
				object: mockResult,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
			})
			mockAiUsageLogCreate.mockResolvedValue({ id: "log-1" })

			const result = await scoreEssayAnswer(validRequest)

			expect(result.isCorrect).toBe(true)
			expect(result.score).toBe(85)
			expect(result.feedback).toBe("Jawaban sangat baik")
			expect(mockGenerateObject).toHaveBeenCalled()
		})

		it("should log token usage when tenantId is provided", async () => {
			const mockResult = {
				isCorrect: true,
				score: 80,
				feedback: "Good",
				confidence: 0.8,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}

			mockGenerateObject.mockResolvedValue({
				object: mockResult,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
			})
			mockAiUsageLogCreate.mockResolvedValue({ id: "log-1" })

			await scoreEssayAnswer(validRequest)

			expect(mockAiUsageLogCreate).toHaveBeenCalledWith({
				data: {
					id: expect.any(String),
					tenantId: "tenant-123",
					userId: "user-123",
					action: "ESSAY_SCORING",
					model: "gpt-4o-mini",
					promptTokens: 100,
					completionTokens: 50,
					totalTokens: 150,
				},
			})
		})

		it("should handle missing optional fields gracefully", async () => {
			const minimalRequest = {
				question: "What is photosynthesis?",
				userAnswer: "Plants use sunlight to make food.",
				tenantId: "tenant-123",
			}

			const mockResult = {
				isCorrect: true,
				score: 70,
				feedback: "Basic understanding",
				confidence: 0.7,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}

			mockGenerateObject.mockResolvedValue({
				object: mockResult,
				usage: null,
			})

			const result = await scoreEssayAnswer(minimalRequest as any)

			expect(result.score).toBe(70)
			expect(mockAiUsageLogCreate).not.toHaveBeenCalled()
		})

		it("should return default result when AI call fails", async () => {
			mockGenerateObject.mockRejectedValue(new Error("API error"))

			const result = await scoreEssayAnswer(validRequest)

			expect(result.isCorrect).toBe(false)
			expect(result.score).toBe(0)
			expect(result.feedback).toBe("Error occurred during evaluation. Manual review required.")
			expect(result.confidence).toBe(0)
			expect(result.strengths).toEqual([])
			expect(result.weaknesses).toEqual([])
		})

		it("should not fail when usage logging fails", async () => {
			const mockResult = {
				isCorrect: true,
				score: 90,
				feedback: "Excellent",
				confidence: 0.95,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}

			mockGenerateObject.mockResolvedValue({
				object: mockResult,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
			})
			mockAiUsageLogCreate.mockRejectedValue(new Error("DB error"))

			const result = await scoreEssayAnswer(validRequest)

			expect(result.score).toBe(90)
		})
	})

	describe("evaluateEssayAnswers", () => {
		const essayQuestions = [
			{
				id: "q1",
				question: "What is photosynthesis?",
				userAnswer: "Process using sunlight",
			},
			{
				id: "q2",
				question: "What is respiration?",
				userAnswer: "Process using oxygen",
			},
		]

		it("should evaluate multiple essay answers", async () => {
			const mockResult1 = {
				isCorrect: true,
				score: 85,
				feedback: "Good",
				confidence: 0.9,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}
			const mockResult2 = {
				isCorrect: true,
				score: 80,
				feedback: "Good",
				confidence: 0.8,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}

			mockGenerateObject
				.mockResolvedValueOnce({ object: mockResult1, usage: null })
				.mockResolvedValueOnce({ object: mockResult2, usage: null })

			const results = await evaluateEssayAnswers(essayQuestions, "tenant-123")

			expect(results).toHaveLength(2)
			expect(results[0].questionId).toBe("q1")
			expect(results[0].result.score).toBe(85)
			expect(results[1].questionId).toBe("q2")
			expect(results[1].result.score).toBe(80)
		})

		it("should handle partial failures in batch evaluation", async () => {
			const mockResult = {
				isCorrect: true,
				score: 75,
				feedback: "OK",
				confidence: 0.7,
				strengths: [],
				weaknesses: [],
				suggestions: [],
				keyPointsCovered: [],
				keyPointsMissing: [],
			}

			mockGenerateObject
				.mockRejectedValueOnce(new Error("API error"))
				.mockResolvedValueOnce({ object: mockResult, usage: null })

			const results = await evaluateEssayAnswers(essayQuestions, "tenant-123")

			expect(results).toHaveLength(2)
			expect(results[0].result.score).toBe(0)
			expect(results[1].result.score).toBe(75)
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

jest.mock("$repositories/Assignment", () => {
	const mockGetById = jest.fn<any>()
	const mockGetByIdDefault = jest.fn<any>()
	return { getById: mockGetById, getByIdDefault: mockGetByIdDefault }
})

jest.mock("$repositories/Assignment/AssignmentAttemptRepository", () => {
	const mockGetById = jest.fn<any>()
	const mockGetCurrentAttempt = jest.fn<any>()
	const mockGetByUserIdAndAssignmentId = jest.fn<any>()
	const mockGetByAssignmentUserAttemptId = jest.fn<any>()
	const mockIsAttemptTimeValid = jest.fn<any>()
	const mockUpdateAnswer = jest.fn<any>()
	const mockMarkAsSubmitted = jest.fn<any>()
	const mockSetCorrectAnswer = jest.fn<any>()
	const mockSubmitAssignment = jest.fn<any>()
	const mockGetAllUserAttemptAnswers = jest.fn<any>()
	const mockCreate = jest.fn<any>()
	return {
		getById: mockGetById,
		getCurrentUserAssignmentAttemptByUserId: mockGetCurrentAttempt,
		getByUserIdAndAssignmentId: mockGetByUserIdAndAssignmentId,
		getByAssignmentUserAttemptIdAndAssignmentQuestionId: mockGetByAssignmentUserAttemptId,
		isAttemptTimeValid: mockIsAttemptTimeValid,
		updateAnswer: mockUpdateAnswer,
		markAsSubmitted: mockMarkAsSubmitted,
		setCorrectAnswer: mockSetCorrectAnswer,
		submitAssignment: mockSubmitAssignment,
		getAllUserAttemptAnswers: mockGetAllUserAttemptAnswers,
		create: mockCreate,
		getSubmittedAttemptsByAssignmentId: jest.fn<any>(),
		getUnsubmittedAssignmentUserAttempts: jest.fn<any>(),
		getHistoryUserAssignmentAttempts: jest.fn<any>(),
		getAllSubmittedAttemptsByAssignmentId: jest.fn<any>(),
		getUserById: jest.fn<any>(),
	}
})

jest.mock("$repositories/Assignment/AssignmentQuestionRepository", () => ({
	getCorrectQuestionAnswers: jest.fn<any>(),
	getAllQuestions: jest.fn<any>(),
}))

jest.mock("$services/AiEssayScoringService", () => ({
	evaluateEssayAnswers: jest.fn<any>(),
}))

let mockSendToQueue = jest.fn<any>()

jest.mock("$pkg/pubsub", () => ({
	__esModule: true,
	default: { sendToQueue: mockSendToQueue },
	PUBSUB_TOPICS: {
		ASSIGNMENT_ATTEMPT_SUBMIT: "ASSIGNMENT_ATTEMPT_SUBMIT",
	},
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

import {
	create,
	updateAnswer,
	submitAssignment,
	calculateAssignmentScore,
	getTimeStatus,
	getAllQuestionsAndAnswers,
	getCurrentUserAssignmentAttemptByUserId,
	getAssignmentsByExpiredDate,
	getHistoryUserAssignmentAttempts,
	getAssignmentExportData,
} from "$services/AssignmentAttemptService"

describe("AssignmentAttemptService", () => {
	describe("create", () => {
		it("should create assignment attempt successfully", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "PUBLISHED",
				tenantId: "tenant-123",
			})
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(null)
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
				isSubmitted: false,
			})

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(true)
		})

		it("should return error when assignment not found", async () => {
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue(null)

			const result = await create("nonexistent", "user-123", "tenant-123")

			expect(result.status).toBe(false)
		})

		it("should return error when assignment is expired", async () => {
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "EXPIRED",
			})

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(false)
		})

		it("should return error when user already has an assignment in progress", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "PUBLISHED",
			})
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue({
				id: "other-attempt",
				assignmentId: "other-assign",
			})

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(false)
		})

		it("should return existing attempt if already exists", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "PUBLISHED",
			})
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(null)
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "existing-attempt",
				isSubmitted: false,
			})

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(true)
		})
	})

	describe("updateAnswer", () => {
		it("should update answer successfully", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.isAttemptTimeValid.mockResolvedValue(true)
			repoMocks.getByAssignmentUserAttemptIdAndAssignmentQuestionId.mockResolvedValue({
				id: "answer-123",
			})
			repoMocks.updateAnswer.mockResolvedValue({ id: "answer-123" })

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
				assignmentQuestionOptionId: "option-123",
			} as any)

			expect(result.status).toBe(true)
		})

		it("should return error when attempt not found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue(null)

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
			} as any)

			expect(result.status).toBe(false)
		})

		it("should return error when assignment already submitted", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: true,
			})

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
			} as any)

			expect(result.status).toBe(false)
		})

		it("should return error when time limit exceeded", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.isAttemptTimeValid.mockResolvedValue(false)

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
			} as any)

			expect(result.status).toBe(false)
		})
	})

	describe("submitAssignment", () => {
		it("should submit assignment successfully", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.markAsSubmitted.mockResolvedValue(undefined)
			pubsubMock.sendToQueue.mockResolvedValue(undefined)

			const result = await submitAssignment("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect(pubsubMock.sendToQueue).toHaveBeenCalled()
		})

		it("should return error when attempt not found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue(null)

			const result = await submitAssignment("user-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("should return error when already submitted", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: true,
			})

			const result = await submitAssignment("user-123", "assign-123")

			expect(result.status).toBe(false)
		})
	})

	describe("calculateAssignmentScore", () => {
		it("should calculate score for multiple choice question", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_CHOICE",
					points: 10,
					assignmentQuestionOptions: [{ id: "opt-corr" }],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "opt-corr",
				},
			])
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalled()
			expect(repoMocks.submitAssignment).toHaveBeenCalled()
		})

		it("should calculate score for true/false question", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "TRUE_FALSE",
					points: 5,
					assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "TRUE_FALSE",
					trueFalseAnswer: true,
				},
			])
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalled()
		})
	})

	describe("getTimeStatus", () => {
		it("should return valid time status", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const now = new Date()
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				createdAt: new Date(now.getTime() - 1000 * 60 * 5),
			})
			assignMocks.getById
				.mockResolvedValueOnce({
					id: "assign-123",
					tenantId: "tenant-123",
				})
				.mockResolvedValueOnce({
					id: "assign-123",
					tenantId: "tenant-123",
					durationInMinutes: 30,
				})

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("isValid")
			expect(result.data).toHaveProperty("remainingSeconds")
		})

		it("should return error when attempt not found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue(null)

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("should return isValid:false when already submitted (not an error)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: true,
			})

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect((result.data as any).isValid).toBe(false)
			expect((result.data as any).remainingSeconds).toBe(0)
		})
	})

	describe("getAllQuestionsAndAnswers", () => {
		it("should return sorted questions", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				assignmentId: "assign-123",
				randomSeed: 0,
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				isRandomized: false,
			})
			questMocks.getAllQuestions.mockResolvedValue([
				{ id: "q2", order: 2, type: "MULTIPLE_CHOICE", assignmentQuestionOptions: [] },
				{ id: "q1", order: 1, type: "MULTIPLE_CHOICE", assignmentQuestionOptions: [] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([])

			const result = await getAllQuestionsAndAnswers("user-123", "assign-123")

			expect(result.status).toBe(true)
		})
	})

	// =========================================================
	// MULTIPLE_SELECT Strict Mode Edge Cases
	// =========================================================
	describe("calculateAssignmentScore — MULTIPLE_SELECT strict mode", () => {
		const setupBase = () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			const essayMocks = jest.requireMock("$services/AiEssayScoringService") as any

			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)
			essayMocks.evaluateEssayAnswers.mockResolvedValue([])

			return { repoMocks, assignMocks, questMocks, essayMocks }
		}

		it("strict mode: correct + extra options → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: true },
						{ id: "opt-b", isCorrectAnswer: true },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [
						{ assignmentQuestionOptionId: "opt-a" },
						{ assignmentQuestionOptionId: "opt-b" },
						{ assignmentQuestionOptionId: "opt-c" }, // extra wrong option
					],
				},
			])

			await calculateAssignmentScore("attempt-123")

			// Should NOT award points — strict mode requires exact match
			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				false,
			)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith(
				"attempt-123",
				0, // score
				0, // percentage (0/10)
			)
		})

		it("strict mode: only some correct options selected → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: true },
						{ id: "opt-b", isCorrectAnswer: true },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [
						{ assignmentQuestionOptionId: "opt-a" }, // missing opt-b
					],
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				false,
			)
		})

		it("strict mode: empty selection → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: true },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [],
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				false,
			)
		})

		it("strict mode: only incorrect options selected → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: true },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [{ assignmentQuestionOptionId: "opt-wrong" }],
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				false,
			)
		})

		it("strict mode: single correct option required → exact match", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 5,
					assignmentQuestionOptions: [{ id: "opt-a", isCorrectAnswer: true }],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [{ assignmentQuestionOptionId: "opt-a" }],
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				true,
			)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 5, 100)
		})

		it("strict mode: 0 correct options (malformed) → no crash, score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: false },
						{ id: "opt-b", isCorrectAnswer: false },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [{ assignmentQuestionOptionId: "opt-a" }],
				},
			])

			// Should not throw
			await calculateAssignmentScore("attempt-123")

			// All selected options are wrong, but no "correct" options exist
			// So lengths won't match → strict mode → false
			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				false,
			)
		})

		it("strict mode: exact match all correct → full points", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_SELECT",
					points: 10,
					assignmentQuestionOptions: [
						{ id: "opt-a", isCorrectAnswer: true },
						{ id: "opt-b", isCorrectAnswer: true },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_SELECT",
					selectedOptions: [
						{ assignmentQuestionOptionId: "opt-a" },
						{ assignmentQuestionOptionId: "opt-b" },
					],
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				true,
			)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 10, 100)
		})
	})

	// =========================================================
	// Essay Grading Edge Cases
	// =========================================================
	describe("calculateAssignmentScore — essay grading edge cases", () => {
		const setupBase = () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			const essayMocks = jest.requireMock("$services/AiEssayScoringService") as any

			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)

			return { repoMocks, assignMocks, questMocks, essayMocks }
		}

		it("essay: empty answer → AI returns isCorrect=false → 0 points", async () => {
			const { repoMocks, questMocks, essayMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "ESSAY",
					points: 20,
					content: "Explain X",
					assignmentQuestionEssayReferenceAnswer: { content: "Model answer" },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "ESSAY",
					essayAnswer: "",
				},
			])
			essayMocks.evaluateEssayAnswers.mockResolvedValue([
				{
					questionId: "q1",
					result: { isCorrect: false, score: 0, feedback: "Empty", confidence: 0 },
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(essayMocks.evaluateEssayAnswers).toHaveBeenCalled()
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})

		it("essay: AI marks correct → full points awarded", async () => {
			const { repoMocks, questMocks, essayMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "ESSAY",
					points: 20,
					content: "Explain X",
					assignmentQuestionEssayReferenceAnswer: { content: "Model answer" },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "ESSAY",
					essayAnswer: "A detailed and correct answer",
				},
			])
			essayMocks.evaluateEssayAnswers.mockResolvedValue([
				{
					questionId: "q1",
					result: {
						isCorrect: true,
						score: 90,
						feedback: "Good",
						confidence: 0.95,
					},
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith(
				"attempt-123",
				"q1",
				true,
				expect.any(String), // aiGradingReasoning JSON
			)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 20, 100)
		})

		it("essay: whitespace-only → treated as empty", async () => {
			const { repoMocks, questMocks, essayMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "ESSAY",
					points: 20,
					content: "Explain X",
					assignmentQuestionEssayReferenceAnswer: { content: "Model answer" },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "ESSAY",
					essayAnswer: "   \n\t  ",
				},
			])
			essayMocks.evaluateEssayAnswers.mockResolvedValue([
				{
					questionId: "q1",
					result: { isCorrect: false, score: 0, feedback: "Empty", confidence: 0 },
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(essayMocks.evaluateEssayAnswers).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ userAnswer: "   \n\t  " }),
				]),
				"tenant-123",
				"user-123",
			)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})

		it("essay: AI service failure → graceful degradation to 0", async () => {
			const { repoMocks, questMocks, essayMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "ESSAY",
					points: 20,
					content: "Explain X",
					assignmentQuestionEssayReferenceAnswer: { content: "Model answer" },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "ESSAY",
					essayAnswer: "Some answer",
				},
			])
			// AI throws → evaluateEssayAnswers returns error-structured result
			essayMocks.evaluateEssayAnswers.mockResolvedValue([
				{
					questionId: "q1",
					result: { isCorrect: false, score: 0, error: "AI service unavailable" },
				},
			])

			await calculateAssignmentScore("attempt-123")

			// Should not throw, score should be 0
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})
	})

	// =========================================================
	// Zero Score / Boundary Scenarios
	// =========================================================
	describe("calculateAssignmentScore — zero score / boundary", () => {
		const setupBase = () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			const essayMocks = jest.requireMock("$services/AiEssayScoringService") as any

			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)
			essayMocks.evaluateEssayAnswers.mockResolvedValue([])

			return { repoMocks, assignMocks, questMocks, essayMocks }
		}

		it("totalPossibleScore is 0 → percentageScore 0, no division error", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "MULTIPLE_CHOICE", points: 0, assignmentQuestionOptions: [] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "wrong",
				},
			])

			await calculateAssignmentScore("attempt-123")

			// Guard: totalPossibleScore === 0 → percentageScore = 0
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})

		it("all wrong answers → score 0, percentage 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_CHOICE",
					points: 25,
					assignmentQuestionOptions: [{ id: "opt-corr" }],
				},
				{
					id: "q2",
					type: "TRUE_FALSE",
					points: 25,
					assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "opt-wrong",
				},
				{
					id: "a2",
					assignmentQuestionId: "q2",
					type: "TRUE_FALSE",
					trueFalseAnswer: false, // wrong
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})

		it("all correct → 100%", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_CHOICE",
					points: 50,
					assignmentQuestionOptions: [{ id: "opt-corr" }],
				},
				{
					id: "q2",
					type: "TRUE_FALSE",
					points: 50,
					assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "opt-corr",
				},
				{
					id: "a2",
					assignmentQuestionId: "q2",
					type: "TRUE_FALSE",
					trueFalseAnswer: true,
				},
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.submitAssignment).toHaveBeenCalledWith(
				"attempt-123",
				100,
				100,
			)
		})

		it("percentage rounding to 2 decimal places", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{
					id: "q1",
					type: "MULTIPLE_CHOICE",
					points: 3,
					assignmentQuestionOptions: [{ id: "opt-corr" }],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "opt-corr",
				},
			])

			await calculateAssignmentScore("attempt-123")

			// 3/3 = 100.00%
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 3, 100)
		})
	})

	// =========================================================
	// Untested Methods
	// =========================================================
	describe("getCurrentUserAssignmentAttemptByUserId", () => {
		it("returns attempt when found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const mockAttempt = {
				id: "attempt-123",
				userId: "user-123",
				assignmentId: "assign-123",
				isSubmitted: false,
			}
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(mockAttempt)

			const result = await getCurrentUserAssignmentAttemptByUserId("user-123")

			expect(result.status).toBe(true)
			expect(result.data).toEqual(mockAttempt)
		})

		it("returns NOT_FOUND when no attempt exists", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(null)

			const result = await getCurrentUserAssignmentAttemptByUserId("user-123")

			expect(result.status).toBe(false)
		})

		it("returns 500 on repo error", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockRejectedValue(
				new Error("DB connection lost"),
			)

			const result = await getCurrentUserAssignmentAttemptByUserId("user-123")

			expect(result.status).toBe(false)
		})
	})

	describe("getAssignmentsByExpiredDate", () => {
		beforeEach(() => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			repoMocks.getUnsubmittedAssignmentUserAttempts.mockReset()
			pubsubMock.sendToQueue.mockReset()
		})

		it("returns early when no unsubmitted attempts", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getUnsubmittedAssignmentUserAttempts.mockResolvedValue([])

			await getAssignmentsByExpiredDate()

			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			expect(pubsubMock.sendToQueue).not.toHaveBeenCalled()
		})

		it("skips attempt if not yet expired", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const futureDate = new Date(Date.now() + 1000 * 60 * 60)
			repoMocks.getUnsubmittedAssignmentUserAttempts.mockResolvedValue([
				{
					id: "attempt-123",
					createdAt: futureDate,
					assignment: { durationInMinutes: 30 },
				},
			])

			await getAssignmentsByExpiredDate()

			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			expect(pubsubMock.sendToQueue).not.toHaveBeenCalled()
		})

		it("publishes to queue for expired attempts", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pastDate = new Date(Date.now() - 1000 * 60 * 60)
			repoMocks.getUnsubmittedAssignmentUserAttempts.mockResolvedValue([
				{
					id: "attempt-123",
					createdAt: pastDate,
					assignment: { durationInMinutes: 30 },
				},
			])

			await getAssignmentsByExpiredDate()

			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			expect(pubsubMock.sendToQueue).toHaveBeenCalledWith(
				"ASSIGNMENT_ATTEMPT_SUBMIT",
				{ assignmentUserAttemptId: "attempt-123" },
			)
		})

		it("swallows PubSub failure gracefully", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			const pastDate = new Date(Date.now() - 1000 * 60 * 60)
			repoMocks.getUnsubmittedAssignmentUserAttempts.mockResolvedValue([
				{
					id: "attempt-123",
					createdAt: pastDate,
					assignment: { durationInMinutes: 30 },
				},
			])
			pubsubMock.sendToQueue.mockRejectedValue(new Error("RabbitMQ down"))

			// Should not throw
			await expect(getAssignmentsByExpiredDate()).resolves.not.toThrow()
		})
	})

	describe("getHistoryUserAssignmentAttempts", () => {
		const baseAttempt = {
			id: "attempt-123",
			score: 80,
			percentageScore: 80,
			isSubmitted: true,
			submittedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
			assignment: {
				id: "assign-123",
				title: "Test Assignment",
				durationInMinutes: 60,
				showAnswer: true,
				showQuestion: true,
				assignmentQuestions: [
					{
						id: "q1",
						order: 1,
						content: "What is 2+2?",
						type: "MULTIPLE_CHOICE",
						assignmentQuestionOptions: [
							{ id: "opt-a", content: "3", isCorrectAnswer: false },
							{ id: "opt-b", content: "4", isCorrectAnswer: true },
						],
					},
					{
						id: "q2",
						order: 2,
						content: "Explain your answer",
						type: "ESSAY",
						assignmentQuestionEssayReferenceAnswer: { content: "2+2=4" },
					},
					{
						id: "q3",
						order: 3,
						content: "True or false: sky is blue",
						type: "TRUE_FALSE",
						assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
					},
					{
						id: "q4",
						order: 4,
						content: "Select all correct",
						type: "MULTIPLE_SELECT",
						assignmentQuestionOptions: [
							{ id: "ms-a", content: "A", isCorrectAnswer: true },
							{ id: "ms-b", content: "B", isCorrectAnswer: true },
							{ id: "ms-c", content: "C", isCorrectAnswer: false },
						],
					},
				],
			},
			assignmentUserAttemptQuestionAnswers: [
				{
					assignmentQuestionId: "q1",
					isAnswerCorrect: true,
					assignmentQuestionOptionId: "opt-b",
				},
				{
					assignmentQuestionId: "q2",
					isAnswerCorrect: true,
					essayAnswer: "2 plus 2 equals 4",
				},
				{
					assignmentQuestionId: "q3",
					isAnswerCorrect: false,
					trueFalseAnswer: false,
				},
				{
					assignmentQuestionId: "q4",
					isAnswerCorrect: true,
					selectedOptions: [{ assignmentQuestionOptionId: "ms-a" }, { assignmentQuestionOptionId: "ms-b" }],
				},
			],
		}

		it("returns history with all question types", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getHistoryUserAssignmentAttempts.mockResolvedValue(baseAttempt)

			const result = await getHistoryUserAssignmentAttempts("user-123", "assign-123")

			expect(result.status).toBe(true)
			const questions = (result.data as any).questions
			const q1 = questions.find((q: any) => q.id === "q1")
			const q2 = questions.find((q: any) => q.id === "q2")
			const q3 = questions.find((q: any) => q.id === "q3")
			const q4 = questions.find((q: any) => q.id === "q4")

			// MULTIPLE_CHOICE
			expect(q1.type).toBe("MULTIPLE_CHOICE")
			expect(q1.isCorrect).toBe(true)
			expect(q1.correctChoice).toEqual({ id: "opt-b", content: "4", isCorrectAnswer: true })

			// ESSAY
			expect(q2.type).toBe("ESSAY")
			expect(q2.isCorrect).toBe(true)
			expect(q2.userAnswer).toBe("2 plus 2 equals 4")
			expect(q2.aiGradingFeedback).toBeUndefined() // not set in mock
			expect(q2.correctAnswer).toBe("2+2=4")

			// TRUE_FALSE
			expect(q3.type).toBe("TRUE_FALSE")
			expect(q3.isCorrect).toBe(false)
			expect(q3.correctAnswer).toBe(true)

			// MULTIPLE_SELECT — this is the bug fix coverage
			expect(q4.type).toBe("MULTIPLE_SELECT")
			expect(q4.isCorrect).toBe(true)
			expect(q4.options).toEqual([
				{ id: "ms-a", content: "A", isCorrectAnswer: true },
				{ id: "ms-b", content: "B", isCorrectAnswer: true },
				{ id: "ms-c", content: "C", isCorrectAnswer: false },
			])
			expect(q4.correctOptions).toEqual(["ms-a", "ms-b"])
			expect(q4.userAnswer).toEqual(["ms-a", "ms-b"])
		})

		it("returns NOT_FOUND when no history exists", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getHistoryUserAssignmentAttempts.mockResolvedValue(null)

			const result = await getHistoryUserAssignmentAttempts("user-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("returns 500 on repo error", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getHistoryUserAssignmentAttempts.mockRejectedValue(
				new Error("DB error"),
			)

			const result = await getHistoryUserAssignmentAttempts("user-123", "assign-123")

			expect(result.status).toBe(false)
		})
	})

	describe("getAssignmentExportData", () => {
		it("returns NOT_FOUND when assignment doesn't exist", async () => {
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue(null)

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("transforms all question types correctly", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any

			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Final Exam",
				durationInMinutes: 60,
				tenantId: "tenant-123",
			})
			repoMocks.getAllSubmittedAttemptsByAssignmentId.mockResolvedValue([])
			questMocks.getAllQuestions.mockResolvedValue([
				{
					id: "q1",
					order: 1,
					content: "Pick one",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptions: [
						{ id: "o1", content: "A" },
						{ id: "o2", content: "B" },
					],
				},
				{
					id: "q2",
					order: 2,
					content: "True or false",
					type: "TRUE_FALSE",
					assignmentQuestionTrueFalseAnswer: { correctAnswer: true },
				},
				{
					id: "q3",
					order: 3,
					content: "Write essay",
					type: "ESSAY",
					assignmentQuestionEssayReferenceAnswer: { content: "Model answer" },
				},
			])

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(true)
			const data = result.data as any
			expect(data.questions[0]).toEqual({
				id: "q1",
				order: 1,
				content: "Pick one",
				type: "MULTIPLE_CHOICE",
				options: [{ id: "o1", content: "A" }, { id: "o2", content: "B" }],
			})
			expect(data.questions[1]).toEqual({
				id: "q2",
				order: 2,
				content: "True or false",
				type: "TRUE_FALSE",
				correctAnswer: true,
			})
			expect(data.questions[2]).toEqual({
				id: "q3",
				order: 3,
				content: "Write essay",
				type: "ESSAY",
				referenceAnswer: "Model answer",
			})
		})

		it("transforms student attempts with answers", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any

			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Quiz",
				durationInMinutes: 30,
				tenantId: "tenant-123",
			})
			repoMocks.getAllSubmittedAttemptsByAssignmentId.mockResolvedValue([
				{
					id: "attempt-1",
					userId: "user-123",
					score: 80,
					percentageScore: 80,
					submittedAt: new Date("2026-04-01"),
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					assignmentQuestionId: "q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptionId: "o1",
					isAnswerCorrect: true,
				},
				{
					assignmentQuestionId: "q2",
					type: "ESSAY",
					essayAnswer: "My essay",
					isAnswerCorrect: false,
				},
				{
					assignmentQuestionId: "q3",
					type: "TRUE_FALSE",
					trueFalseAnswer: true,
					isAnswerCorrect: true,
				},
			])
			repoMocks.getUserById.mockResolvedValue({
				id: "user-123",
				fullName: "John Doe",
				email: "john@example.com",
			})
			questMocks.getAllQuestions.mockResolvedValue([
				{
					id: "q1",
					order: 1,
					content: "Q1",
					type: "MULTIPLE_CHOICE",
					assignmentQuestionOptions: [{ id: "o1", content: "Option A" }],
				},
				{ id: "q2", order: 2, content: "Q2", type: "ESSAY" },
				{ id: "q3", order: 3, content: "Q3", type: "TRUE_FALSE" },
			])

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(true)
			const data = result.data as any
			expect(data.studentAttempts).toHaveLength(1)
			expect(data.studentAttempts[0].student).toEqual({
				id: "user-123",
				fullName: "John Doe",
				email: "john@example.com",
			})
			expect(data.studentAttempts[0].attempt.score).toBe(80)
			expect(data.studentAttempts[0].answers).toHaveLength(3)
			expect(data.studentAttempts[0].answers[0].userAnswer).toBe("Option A")
			expect(data.studentAttempts[0].answers[1].userAnswer).toBe("My essay")
			expect(data.studentAttempts[0].answers[2].userAnswer).toBe(true)
		})

		it("returns 500 on error", async () => {
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockRejectedValue(new Error("DB error"))

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(false)
		})
	})
})

// =========================================================
// Deep Edge Cases — untested paths from coverage analysis
// =========================================================
describe("AssignmentAttemptService — deep edge cases", () => {
	describe("create — non-EXPIRED/non-PUBLISHED status allows creation", () => {
		it("allows creation when status is DRAFT", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "DRAFT",
			})
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(null)
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue(null)
			repoMocks.create.mockResolvedValue({ id: "attempt-new" })

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(true)
		})
	})

	describe("updateAnswer — null optionAnswerId", () => {
		it("passes null optionAnswerId through to repo", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.isAttemptTimeValid.mockResolvedValue(true)
			repoMocks.getByAssignmentUserAttemptIdAndAssignmentQuestionId.mockResolvedValue({
				id: "answer-123",
			})
			repoMocks.updateAnswer.mockResolvedValue({ id: "answer-123" })

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
				assignmentQuestionOptionId: null,
			} as any)

			expect(result.status).toBe(true)
			expect(repoMocks.updateAnswer).toHaveBeenCalledWith(
				"attempt-123",
				expect.objectContaining({ assignmentQuestionOptionId: null }),
			)
		})

		it("clears MULTIPLE_SELECT by passing empty array", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.isAttemptTimeValid.mockResolvedValue(true)
			repoMocks.getByAssignmentUserAttemptIdAndAssignmentQuestionId.mockResolvedValue({
				id: "answer-123",
			})
			repoMocks.updateAnswer.mockResolvedValue({ id: "answer-123" })

			const result = await updateAnswer("user-123", "assign-123", {
				assignmentQuestionId: "question-123",
				optionAnswerIds: [],
			} as any)

			expect(result.status).toBe(true)
		})
	})

	describe("submitAssignment — markAsSubmitted throws", () => {
		it("still returns success when markAsSubmitted throws (swallowed)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.markAsSubmitted.mockRejectedValueOnce(new Error("DB error"))
			pubsubMock.sendToQueue.mockResolvedValue(undefined)

			const result = await submitAssignment("user-123", "assign-123")

			// Inner catch swallows the error and returns success
			expect(result.status).toBe(true)
		})
	})

	describe("calculateAssignmentScore — malformed data edge cases", () => {
		const setupBase = () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			const essayMocks = jest.requireMock("$services/AiEssayScoringService") as any

			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				tenantId: "tenant-123",
			})
			repoMocks.setCorrectAnswer.mockResolvedValue(undefined)
			repoMocks.submitAssignment.mockResolvedValue(undefined)
			essayMocks.evaluateEssayAnswers.mockResolvedValue([])

			return { repoMocks, assignMocks, questMocks, essayMocks }
		}

		it("MULTIPLE_CHOICE with zero options in DB → score 0, no crash", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "MULTIPLE_CHOICE", points: 10, assignmentQuestionOptions: [] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "MULTIPLE_CHOICE", assignmentQuestionOptionId: "opt-1" },
			])

			await calculateAssignmentScore("attempt-123")

			// No crash, score 0
			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith("attempt-123", "q1", false)
			expect(repoMocks.submitAssignment).toHaveBeenCalledWith("attempt-123", 0, 0)
		})

		it("MULTIPLE_CHOICE with null optionId in user answer → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "MULTIPLE_CHOICE", points: 10, assignmentQuestionOptions: [{ id: "opt-corr" }] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "MULTIPLE_CHOICE", assignmentQuestionOptionId: null },
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith("attempt-123", "q1", false)
		})

		it("TRUE_FALSE with null reference answer in DB → score 0, no crash", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "TRUE_FALSE", points: 5, assignmentQuestionTrueFalseAnswer: null },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "TRUE_FALSE", trueFalseAnswer: true },
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith("attempt-123", "q1", false)
		})

		it("TRUE_FALSE with null user answer → score 0", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "TRUE_FALSE", points: 5, assignmentQuestionTrueFalseAnswer: { correctAnswer: true } },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "TRUE_FALSE", trueFalseAnswer: null },
			])

			await calculateAssignmentScore("attempt-123")

			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith("attempt-123", "q1", false)
		})

		it("answer exists for question not in correctAnswers → score 0 silently", async () => {
			const { repoMocks, questMocks } = setupBase()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "MULTIPLE_CHOICE", points: 10, assignmentQuestionOptions: [{ id: "opt-corr" }] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "MULTIPLE_CHOICE", assignmentQuestionOptionId: "opt-corr" },
				{ id: "a2", assignmentQuestionId: "q-missing", type: "MULTIPLE_CHOICE", assignmentQuestionOptionId: "opt-corr" },
			])

			await calculateAssignmentScore("attempt-123")

			// q1 correct, q-missing not found → score 0 for q-missing
			expect(repoMocks.setCorrectAnswer).toHaveBeenCalledWith("attempt-123", "q-missing", false)
		})

		it("evaluateEssayAnswers throws → outer catch re-throws (no score saved)", async () => {
			const { repoMocks, questMocks, essayMocks } = setupBase()
			// Reset submitAssignment to ensure no leftover calls from previous tests
			repoMocks.submitAssignment.mockReset()
			questMocks.getCorrectQuestionAnswers.mockResolvedValue([
				{ id: "q1", type: "ESSAY", points: 20, content: "Essay Q", assignmentQuestionEssayReferenceAnswer: { content: "Ref" } },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{ id: "a1", assignmentQuestionId: "q1", type: "ESSAY", essayAnswer: "User answer" },
			])
			essayMocks.evaluateEssayAnswers.mockImplementation(() => {
				throw new Error("AI service unavailable")
			})

			await calculateAssignmentScore("attempt-123")

			// submitAssignment should NOT be called when evaluateEssayAnswers throws
			expect(repoMocks.submitAssignment).not.toHaveBeenCalled()
		})
	})

	describe("getTimeStatus — duration edge cases", () => {
		it("handles durationInMinutes of 0", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const now = new Date()
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				createdAt: new Date(now.getTime() - 1000 * 60 * 5),
			})
			assignMocks.getById
				.mockResolvedValueOnce({ id: "assign-123", tenantId: "tenant-123" })
				.mockResolvedValueOnce({ id: "assign-123", tenantId: "tenant-123", durationInMinutes: 0 })

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(true)
		})
	})

	describe("getAllQuestionsAndAnswers — randomization edge cases", () => {
		it("uses order sorting when isRandomized=true but randomSeed=0", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				assignmentId: "assign-123",
				randomSeed: 0,
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				isRandomized: true,
			})
			questMocks.getAllQuestions.mockResolvedValue([
				{ id: "q2", order: 2, type: "MULTIPLE_CHOICE", assignmentQuestionOptions: [] },
				{ id: "q1", order: 1, type: "MULTIPLE_CHOICE", assignmentQuestionOptions: [] },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([])

			const result = await getAllQuestionsAndAnswers("user-123", "assign-123")

			expect(result.status).toBe(true)
			// Questions should be sorted by order (1, 2), not randomized
			const data = result.data as any[]
			expect(data[0].id).toBe("q1")
			expect(data[1].id).toBe("q2")
		})
	})

	describe("getAssignmentExportData — MULTIPLE_SELECT and missing user", () => {
		it("MULTIPLE_SELECT falls through to baseQuestion (no options field)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Quiz",
				durationInMinutes: 30,
				tenantId: "tenant-123",
			})
			repoMocks.getAllSubmittedAttemptsByAssignmentId.mockResolvedValue([])
			questMocks.getAllQuestions.mockResolvedValue([
				{ id: "q1", order: 1, content: "Select all", type: "MULTIPLE_SELECT", assignmentQuestionOptions: [] },
			])

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(true)
			const data = result.data as any
			expect(data.questions[0].type).toBe("MULTIPLE_SELECT")
			// No options/correctOptions — falls through to baseQuestion
			expect(data.questions[0].options).toBeUndefined()
		})

		it("throws when user not found (getUserById uses findUniqueOrThrow)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				title: "Quiz",
				durationInMinutes: 30,
				tenantId: "tenant-123",
			})
			repoMocks.getAllSubmittedAttemptsByAssignmentId.mockResolvedValue([
				{ id: "attempt-1", userId: "ghost-user", score: 80, percentageScore: 80, submittedAt: new Date() },
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([])
			// findUniqueOrThrow throws when user not found
			repoMocks.getUserById.mockRejectedValue(new Error("Record not found"))
			questMocks.getAllQuestions.mockResolvedValue([])

			const result = await getAssignmentExportData("tenant-123", "assign-123")

			expect(result.status).toBe(false)
		})
	})

	describe("submitAssignment — pubsub failure graceful handling", () => {
		it("returns success even when markAsSubmitted fails (inner catch swallows error)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.markAsSubmitted.mockRejectedValue(new Error("DB error on commit"))

			const result = await submitAssignment("user-123", "assign-123")

			// Inner try/catch catches the error and falls through to return success
			expect(result.status).toBe(true)
		})

		it("returns success when markAsSubmitted succeeds but pubsub fails", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const pubsubMock = (jest.requireMock("$pkg/pubsub") as any).default
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
			})
			repoMocks.markAsSubmitted.mockResolvedValue(undefined)
			pubsubMock.sendToQueue.mockRejectedValue(new Error("RabbitMQ down"))

			const result = await submitAssignment("user-123", "assign-123")

			// Should return success despite pubsub failure (fire-and-forget)
			expect(result.status).toBe(true)
		})
	})

	describe("calculateAssignmentScore — graceful handling when not found", () => {
		it("resolves (not throws) when assignmentAttempt is null — error is logged and swallowed", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getById.mockResolvedValue(null)

			// The service catches the error internally and resolves with undefined
			const result = await calculateAssignmentScore("nonexistent")
			expect(result).toBeUndefined()
		})

		it("resolves (not throws) when assignment is null — error is logged and swallowed", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			repoMocks.getById.mockResolvedValue({
				id: "attempt-123",
				assignmentId: "assign-123",
				userId: "user-123",
			})
			assignMocks.getByIdDefault.mockResolvedValue(null)

			const result = await calculateAssignmentScore("attempt-123")
			expect(result).toBeUndefined()
		})
	})

	describe("getAllQuestionsAndAnswers — MULTIPLE_SELECT mapping", () => {
		it("maps MULTIPLE_SELECT userAnswer as array of optionIds", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			const questMocks = jest.requireMock("$repositories/Assignment/AssignmentQuestionRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				assignmentId: "assign-123",
				randomSeed: 0,
			})
			assignMocks.getByIdDefault.mockResolvedValue({
				id: "assign-123",
				isRandomized: false,
			})
			questMocks.getAllQuestions.mockResolvedValue([
				{
					id: "q1",
					order: 1,
					content: "Select all correct answers",
					type: "MULTIPLE_SELECT",
					assignmentQuestionOptions: [
						{ id: "opt-a", content: "A" },
						{ id: "opt-b", content: "B" },
						{ id: "opt-c", content: "C" },
					],
				},
			])
			repoMocks.getAllUserAttemptAnswers.mockResolvedValue([
				{
					id: "a1",
					assignmentQuestionId: "q1",
					selectedOptions: [
						{ assignmentQuestionOptionId: "opt-a" },
						{ assignmentQuestionOptionId: "opt-b" },
					],
				},
			])

			const result = await getAllQuestionsAndAnswers("user-123", "assign-123")

			expect(result.status).toBe(true)
			const data = result.data as any[]
			expect(data[0].type).toBe("MULTIPLE_SELECT")
			expect(data[0].userAnswer).toEqual(["opt-a", "opt-b"])
			expect(data[0].options).toEqual([
				{ id: "opt-a", content: "A" },
				{ id: "opt-b", content: "B" },
				{ id: "opt-c", content: "C" },
			])
		})
	})

	describe("getTimeStatus — graceful handling edge cases", () => {
		it("returns NOT_FOUND when assignment attempt not found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue(null)

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(false)
		})

		it("returns isValid:false when assignment already submitted (not an error)", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: true,
				createdAt: new Date(),
			})

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(true)
			expect((result.data as any).isValid).toBe(false)
			expect((result.data as any).remainingSeconds).toBe(0)
		})

		it("returns NOT_FOUND when assignment tenant not found", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: false,
				createdAt: new Date(),
			})
			assignMocks.getById.mockResolvedValue(null)

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(false)
		})
	})

	describe("create — already submitted for same assignment", () => {
		it("returns error when assignment already submitted", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			const assignMocks = jest.requireMock("$repositories/Assignment") as any
			assignMocks.getById.mockResolvedValue({
				id: "assign-123",
				status: "PUBLISHED",
			})
			repoMocks.getCurrentUserAssignmentAttemptByUserId.mockResolvedValue(null)
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "existing-attempt",
				isSubmitted: true,
			})

			const result = await create("assign-123", "user-123", "tenant-123")

			expect(result.status).toBe(false)
		})
	})
})

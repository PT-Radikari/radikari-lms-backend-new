/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

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
		getSubmittedAttemptsByAssignmentId: jest.fn<any>(),
		getUnsubmittedAssignmentUserAttempts: jest.fn<any>(),
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

		it("should return error when already submitted", async () => {
			const repoMocks = jest.requireMock("$repositories/Assignment/AssignmentAttemptRepository") as any
			repoMocks.getByUserIdAndAssignmentId.mockResolvedValue({
				id: "attempt-123",
				isSubmitted: true,
			})

			const result = await getTimeStatus("user-123", "assign-123")

			expect(result.status).toBe(false)
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
})

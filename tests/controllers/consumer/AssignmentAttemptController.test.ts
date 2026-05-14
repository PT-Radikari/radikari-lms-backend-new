/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockCalculateAssignmentScore = jest.fn<any>()
jest.mock("$services/AssignmentAttemptService", () => ({
	calculateAssignmentScore: mockCalculateAssignmentScore,
}))

const mockLoggerInfo = jest.fn<any>()
const mockLoggerError = jest.fn<any>()
const mockLoggerWarning = jest.fn<any>()
jest.mock("$pkg/logger", () => ({
	info: mockLoggerInfo,
	error: mockLoggerError,
	warning: mockLoggerWarning,
}))

import {
	calculateAssignmentScore,
} from "$controllers/consumer/AssignmentAttemptController"

describe("AssignmentAttemptController (Consumer)", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("calculateAssignmentScore", () => {
		it("should call service and log success on valid message", async () => {
			const attemptId = "attempt-123"
			const message = JSON.stringify({ assignmentUserAttemptId: attemptId })

			mockCalculateAssignmentScore.mockResolvedValue(undefined)

			await calculateAssignmentScore(message)

			expect(mockCalculateAssignmentScore).toHaveBeenCalledWith(attemptId)
			expect(mockLoggerInfo).toHaveBeenCalledTimes(2)
			expect(mockLoggerInfo).toHaveBeenNthCalledWith(
				1,
				`AssignmentAttemptController.calculateAssignmentScore`,
				expect.objectContaining({ message: expect.stringContaining("Calculating assignment score") }),
			)
			expect(mockLoggerInfo).toHaveBeenNthCalledWith(
				2,
				`AssignmentAttemptController.calculateAssignmentScore`,
				expect.objectContaining({ message: expect.stringContaining("successfully") }),
			)
			expect(mockLoggerError).not.toHaveBeenCalled()
		})

		it("should log error when JSON parsing fails", async () => {
			const invalidMessage = "not valid json"

			await calculateAssignmentScore(invalidMessage)

			expect(mockLoggerError).toHaveBeenCalledTimes(1)
			expect(mockLoggerError).toHaveBeenCalledWith(
				`AssignmentAttemptController.calculateAssignmentScore`,
				expect.objectContaining({ error: expect.any(Error) }),
			)
			expect(mockCalculateAssignmentScore).not.toHaveBeenCalled()
		})

		it("should log error when service throws", async () => {
			const attemptId = "attempt-456"
			const message = JSON.stringify({ assignmentUserAttemptId: attemptId })

			const error = new Error("Assignment user attempt not found")
			mockCalculateAssignmentScore.mockRejectedValue(error)

			await calculateAssignmentScore(message)

			expect(mockCalculateAssignmentScore).toHaveBeenCalledWith(attemptId)
			expect(mockLoggerError).toHaveBeenCalledTimes(1)
			expect(mockLoggerError).toHaveBeenCalledWith(
				`AssignmentAttemptController.calculateAssignmentScore`,
				expect.objectContaining({ error }),
			)
		})

		it("should handle empty message string", async () => {
			const message = ""

			await calculateAssignmentScore(message)

			expect(mockLoggerError).toHaveBeenCalledTimes(1)
			expect(mockCalculateAssignmentScore).not.toHaveBeenCalled()
		})

		it("should handle message with missing assignmentUserAttemptId", async () => {
			const message = JSON.stringify({})

			await calculateAssignmentScore(message)

			expect(mockLoggerError).toHaveBeenCalledTimes(1)
			expect(mockCalculateAssignmentScore).toHaveBeenCalledWith(undefined)
		})
	})
})

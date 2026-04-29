/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT, mockAssignmentAttempt } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

let mockCreate = jest.fn<any>()
let mockGetCurrentUserAssignmentAttemptByUserId = jest.fn<any>()
let mockGetAllQuestionsAndAnswers = jest.fn<any>()
let mockUpdateAnswer = jest.fn<any>()
let mockSubmitAssignment = jest.fn<any>()
let mockGetHistoryUserAssignmentAttempts = jest.fn<any>()
let mockGetTimeStatus = jest.fn<any>()
let mockGetAssignmentExportData = jest.fn<any>()

jest.mock("$services/AssignmentAttemptService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getCurrentUserAssignmentAttemptByUserId: (...args: any[]) =>
		mockGetCurrentUserAssignmentAttemptByUserId(...args),
	getAllQuestionsAndAnswers: (...args: any[]) =>
		mockGetAllQuestionsAndAnswers(...args),
	updateAnswer: (...args: any[]) => mockUpdateAnswer(...args),
	submitAssignment: (...args: any[]) => mockSubmitAssignment(...args),
	getHistoryUserAssignmentAttempts: (...args: any[]) =>
		mockGetHistoryUserAssignmentAttempts(...args),
	getTimeStatus: (...args: any[]) => mockGetTimeStatus(...args),
	getAssignmentExportData: (...args: any[]) => mockGetAssignmentExportData(...args),
}))

import * as AssignmentAttemptController from "$controllers/rest/AssignmentAttemptController"

describe("AssignmentAttemptController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── create ───────────────────────────────────────────────────────────────

	describe("create", () => {
		it("should return 201 with created assignment attempt on success", async () => {
			mockCreate.mockResolvedValue({
				status: true,
				data: mockAssignmentAttempt,
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
				tenantId: "tenant-test-123",
			})

			await AssignmentAttemptController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new Assignment Attempt!",
				content: expect.objectContaining({ id: "attempt-test-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockCreate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Assignment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
				tenantId: "tenant-test-123",
			})

			await AssignmentAttemptController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getCurrentUserAssignmentAttempt ───────────────────────────────────────

	describe("getCurrentUserAssignmentAttempt", () => {
		it("should return 200 with current user attempt on success", async () => {
			mockGetCurrentUserAssignmentAttemptByUserId.mockResolvedValue({
				status: true,
				data: mockAssignmentAttempt,
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getCurrentUserAssignmentAttempt(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched current user assignment attempt!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetCurrentUserAssignmentAttemptByUserId.mockResolvedValue({
				status: false,
				err: { code: 404, message: "No attempt found" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getCurrentUserAssignmentAttempt(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getAllQuestionsAndAnswers ─────────────────────────────────────────────

	describe("getAllQuestionsAndAnswers", () => {
		it("should return 200 with questions and answers on success", async () => {
			mockGetAllQuestionsAndAnswers.mockResolvedValue({
				status: true,
				data: { questions: [], answers: [] },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getAllQuestionsAndAnswers(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all questions and answers!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetAllQuestionsAndAnswers.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Failed to fetch questions" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getAllQuestionsAndAnswers(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── updateAnswer ──────────────────────────────────────────────────────────

	describe("updateAnswer", () => {
		it("should return 200 with updated answer on success", async () => {
			mockUpdateAnswer.mockResolvedValue({
				status: true,
				data: { questionId: "q-1", answer: "A" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
				body: { questionId: "q-1", answer: "A" },
			})

			await AssignmentAttemptController.updateAnswer(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated answer!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockUpdateAnswer.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update answer failed" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
				body: { questionId: "q-1", answer: "A" },
			})

			await AssignmentAttemptController.updateAnswer(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── submitAssignment ─────────────────────────────────────────────────────

	describe("submitAssignment", () => {
		it("should return 200 with submitted assignment on success", async () => {
			mockSubmitAssignment.mockResolvedValue({
				status: true,
				data: { ...mockAssignmentAttempt, isSubmitted: true },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.submitAssignment(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully submitted assignment!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockSubmitAssignment.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Submit failed" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.submitAssignment(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getHistoryUserAssignmentAttempts ─────────────────────────────────────

	describe("getHistoryUserAssignmentAttempts", () => {
		it("should return 200 with history on success", async () => {
			mockGetHistoryUserAssignmentAttempts.mockResolvedValue({
				status: true,
				data: [mockAssignmentAttempt],
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getHistoryUserAssignmentAttempts(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched history user assignment attempts!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetHistoryUserAssignmentAttempts.mockResolvedValue({
				status: false,
				err: { code: 404, message: "History not found" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getHistoryUserAssignmentAttempts(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getMemberAssignmentAttemptHistory ────────────────────────────────────

	describe("getMemberAssignmentAttemptHistory", () => {
		it("should return 200 with member attempt history on success", async () => {
			mockGetHistoryUserAssignmentAttempts.mockResolvedValue({
				status: true,
				data: [mockAssignmentAttempt],
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123", userId: "user-test-123" },
			})

			await AssignmentAttemptController.getMemberAssignmentAttemptHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched member assignment attempt history!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetHistoryUserAssignmentAttempts.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Member attempt history not found" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123", userId: "user-test-123" },
			})

			await AssignmentAttemptController.getMemberAssignmentAttemptHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getTimeStatus ────────────────────────────────────────────────────────

	describe("getTimeStatus", () => {
		it("should return 200 with time status on success", async () => {
			mockGetTimeStatus.mockResolvedValue({
				status: true,
				data: { remainingSeconds: 3600, isExpired: false },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getTimeStatus(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched time status",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetTimeStatus.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Time status not found" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentAttemptController.getTimeStatus(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getAssignmentExportData ──────────────────────────────────────────────

	describe("getAssignmentExportData", () => {
		it("should return 200 with export data on success", async () => {
			mockGetAssignmentExportData.mockResolvedValue({
				status: true,
				data: { assignment: {}, attempts: [] },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				tenantId: "tenant-test-123",
			})

			await AssignmentAttemptController.getAssignmentExportData(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched assignment export data!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetAssignmentExportData.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Failed to export data" },
			})

			const { mock, spy } = createMockContext({
				params: { assignmentId: "assign-test-123" },
				tenantId: "tenant-test-123",
			})

			await AssignmentAttemptController.getAssignmentExportData(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})
})

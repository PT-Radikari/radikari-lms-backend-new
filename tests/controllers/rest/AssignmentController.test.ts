/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { mockUserJWT, mockAssignment } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

let mockCreate = jest.fn<any>()
let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()
let mockApproveById = jest.fn<any>()
let mockGetSummaryByUserIdAndTenantId = jest.fn<any>()
let mockGetSummaryByTenantId = jest.fn<any>()
let mockGetUserListWithAssignmentSummaryByTenantId = jest.fn<any>()
let mockGetAssginmentWithUserSummaryByTenantId = jest.fn<any>()
let mockGetUserAssignmentList = jest.fn<any>()
let mockGetDetailUserAssignmentByUserIdAndTenantId = jest.fn<any>()
let mockGetStatistics = jest.fn<any>()

jest.mock("$services/AssignmentService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
	approveById: (...args: any[]) => mockApproveById(...args),
	getSummaryByUserIdAndTenantId: (...args: any[]) =>
		mockGetSummaryByUserIdAndTenantId(...args),
	getSummaryByTenantId: (...args: any[]) => mockGetSummaryByTenantId(...args),
	getUserListWithAssignmentSummaryByTenantId: (...args: any[]) =>
		mockGetUserListWithAssignmentSummaryByTenantId(...args),
	getAssginmentWithUserSummaryByTenantId: (...args: any[]) =>
		mockGetAssginmentWithUserSummaryByTenantId(...args),
	getUserAssignmentList: (...args: any[]) => mockGetUserAssignmentList(...args),
	getDetailUserAssignmentByUserIdAndTenantId: (...args: any[]) =>
		mockGetDetailUserAssignmentByUserIdAndTenantId(...args),
	getStatistics: (...args: any[]) => mockGetStatistics(...args),
}))

let mockStreamQuestions = jest.fn<any>()

jest.mock("$services/AssignmentAiService", () => ({
	streamQuestions: (...args: any[]) => mockStreamQuestions(...args),
}))

import * as AssignmentController from "$controllers/rest/AssignmentController"
import { createMockContext } from "$tests/helpers/mockContext"

describe("AssignmentController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── create ───────────────────────────────────────────────────────────────

	describe("create", () => {
		it("should return 201 with created assignment on success", async () => {
			mockCreate.mockResolvedValue({ status: true, data: mockAssignment })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "New Assignment" },
			})

			await AssignmentController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new Assignment!",
				content: expect.objectContaining({ id: "assign-test-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockCreate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Validation error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "New Assignment" },
			})

			await AssignmentController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getAll ──────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with paginated data on success", async () => {
			mockGetAll.mockResolvedValue({
				status: true,
				data: { data: [mockAssignment], total: 1 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AssignmentController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all Assignment!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AssignmentController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getById ─────────────────────────────────────────────────────────────

	describe("getById", () => {
		it("should return 200 with assignment on success", async () => {
			mockGetById.mockResolvedValue({ status: true, data: mockAssignment })

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
			})

			await AssignmentController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Assignment by id!",
			})
		})

		it("should return 404 when assignment not found", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Assignment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent", tenantId: "tenant-test-123" },
			})

			await AssignmentController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── update ──────────────────────────────────────────────────────────────

	describe("update", () => {
		it("should return 200 with updated assignment on success", async () => {
			mockUpdate.mockResolvedValue({
				status: true,
				data: { ...mockAssignment, title: "Updated Title" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Updated Title" },
			})

			await AssignmentController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated Assignment!",
			})
		})

		it("should return error status when service fails", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Updated Title" },
			})

			await AssignmentController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── deleteById ──────────────────────────────────────────────────────────

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted Assignment!",
			})
		})

		it("should return 404 when assignment not found", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Assignment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── approveById ──────────────────────────────────────────────────────────

	describe("approveById", () => {
		it("should return 200 on successful approval", async () => {
			mockApproveById.mockResolvedValue({
				status: true,
				data: { ...mockAssignment, status: "APPROVED" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { action: "APPROVE" },
			})

			await AssignmentController.approveById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated assignment status!",
			})
		})

		it("should return error status when service fails", async () => {
			mockApproveById.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Approval failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { action: "APPROVE" },
			})

			await AssignmentController.approveById(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getSummaryByUserIdAndTenantId ───────────────────────────────────────

	describe("getSummaryByUserIdAndTenantId", () => {
		it("should return 200 with summary data", async () => {
			mockGetSummaryByUserIdAndTenantId.mockResolvedValue({
				status: true,
				data: { totalAssignment: 5, completed: 3 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AssignmentController.getSummaryByUserIdAndTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched summary by user id and tenant id!",
			})
		})
	})

	// ─── getSummaryByTenantId ────────────────────────────────────────────────

	describe("getSummaryByTenantId", () => {
		it("should return 200 with tenant summary", async () => {
			mockGetSummaryByTenantId.mockResolvedValue({
				status: true,
				data: { totalAssignment: 10 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await AssignmentController.getSummaryByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched summary by tenant id!",
			})
		})
	})

	// ─── getUserListWithAssignmentSummaryByTenantId ───────────────────────────

	describe("getUserListWithAssignmentSummaryByTenantId", () => {
		it("should return 200 with user list summary", async () => {
			mockGetUserListWithAssignmentSummaryByTenantId.mockResolvedValue({
				status: true,
				data: [{ userId: "user-1", total: 5 }],
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await AssignmentController.getUserListWithAssignmentSummaryByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched user list with assignment summary by tenant id!",
			})
		})
	})

	// ─── getAssginmentWithUserSummaryByTenantId ────────────────────────────────

	describe("getAssginmentWithUserSummaryByTenantId", () => {
		it("should return 200 with assignment summary by tenant", async () => {
			mockGetAssginmentWithUserSummaryByTenantId.mockResolvedValue({
				status: true,
				data: [{ assignmentId: "assign-1", total: 3 }],
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await AssignmentController.getAssginmentWithUserSummaryByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched assignment with user summary by tenant id!",
			})
		})
	})

	// ─── getUserAssignmentList ─────────────────────────────────────────────────

	describe("getUserAssignmentList", () => {
		it("should return 200 with user assignment list", async () => {
			mockGetUserAssignmentList.mockResolvedValue({
				status: true,
				data: { data: [mockAssignment], total: 1 },
			})

			const { mock, spy } = createMockContext({
				params: { userId: "user-test-123", tenantId: "tenant-test-123" },
			})

			await AssignmentController.getUserAssignmentList(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched user assignment list by user id and tenant id!",
			})
		})
	})

	// ─── getDetailUserAssignmentByUserIdAndAssignmentId ─────────────────────────

	describe("getDetailUserAssignmentByUserIdAndAssignmentId", () => {
		it("should return 200 with assignment detail", async () => {
			mockGetDetailUserAssignmentByUserIdAndTenantId.mockResolvedValue({
				status: true,
				data: { assignment: mockAssignment, attempt: null },
			})

			const { mock, spy } = createMockContext({
				params: { userId: "user-test-123", assignmentId: "assign-test-123" },
			})

			await AssignmentController.getDetailUserAssignmentByUserIdAndAssignmentId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched detail user assignment by user id and assignment id!",
			})
		})
	})

	// ─── getStatistics ────────────────────────────────────────────────────────

	describe("getStatistics", () => {
		it("should return 200 with statistics", async () => {
			mockGetStatistics.mockResolvedValue({
				status: true,
				data: { stats: { averageScore: 85 }, questions: [] },
			})

			const { mock, spy } = createMockContext({
				params: { id: "assign-test-123", tenantId: "tenant-test-123" },
			})

			await AssignmentController.getStatistics(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched assignment statistics!",
			})
		})

		it("should return 404 when assignment not found", async () => {
			mockGetStatistics.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Assignment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent", tenantId: "tenant-test-123" },
			})

			await AssignmentController.getStatistics(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── generateQuestionsStream ───────────────────────────────────────────────

	describe("generateQuestionsStream", () => {
		it("should return 400 when prompt is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { count: 5 },
			})

			await AssignmentController.generateQuestionsStream(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				error: "Prompt is required and must be a string",
			})
		})

		it("should return 400 when prompt is not a string", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { prompt: 123, count: 5 },
			})

			await AssignmentController.generateQuestionsStream(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})

		it("should return 400 when tenantId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: {},
				jwtPayload: mockUserJWT,
				body: { prompt: "Generate questions" },
			})

			await AssignmentController.generateQuestionsStream(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				error: "Tenant ID is required",
			})
		})

		it("should call streamQuestions with correct params and return streaming response", async () => {
			const mockResponse = new Response("data", { status: 200 })
			mockStreamQuestions.mockReturnValue({
				toTextStreamResponse: () => mockResponse,
			})

			const { mock } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { prompt: "Generate math questions", count: 10 },
			})

			const result = await AssignmentController.generateQuestionsStream(mock)

			expect(mockStreamQuestions).toHaveBeenCalledWith({
				prompt: "Generate math questions",
				count: 10,
				tenantId: "tenant-test-123",
			})
			expect(result).toBeInstanceOf(Response)
		})

		it("should return 500 when streamQuestions throws an error", async () => {
			mockStreamQuestions.mockRejectedValue(new Error("AI service unavailable"))

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { prompt: "Generate questions" },
			})

			await AssignmentController.generateQuestionsStream(mock)

			expect(spy.json.mock.calls[0][0]).toMatchObject({
				error: "AI service unavailable",
			})
		})
	})
})

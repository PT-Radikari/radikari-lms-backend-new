/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockCreate = jest.fn<any>()
let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()

jest.mock("$services/MasterKnowledgeCaseService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
}))

import * as MasterKnowledgeCaseController from "$controllers/rest/MasterKnowledgeCaseController"

describe("MasterKnowledgeCaseController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── create ─────────────────────────────────────────────────────────────

	describe("create", () => {
		it("should return 201 with created case on success", async () => {
			const mockCaseData = { id: "case-123", title: "Test Case", tenantId: "tenant-test-123" }
			mockCreate.mockResolvedValue({ status: true, data: mockCaseData })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Test Case" },
			})

			await MasterKnowledgeCaseController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new MasterKnowledgeCase!",
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
				body: { title: "Test Case" },
			})

			await MasterKnowledgeCaseController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getAll ─────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with paginated cases on success", async () => {
			mockGetAll.mockResolvedValue({ status: true, data: { data: [], total: 0 } })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
			})

			await MasterKnowledgeCaseController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all MasterKnowledgeCase!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				query: {},
			})

			await MasterKnowledgeCaseController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getById ───────────────────────────────────────────────────────────

	describe("getById", () => {
		it("should return 200 with case on success", async () => {
			const mockCaseData = { id: "case-123", title: "Test Case" }
			mockGetById.mockResolvedValue({ status: true, data: mockCaseData })

			const { mock, spy } = createMockContext({
				params: { id: "case-123" },
			})

			await MasterKnowledgeCaseController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched MasterKnowledgeCase by id!",
			})
		})

		it("should return 404 when case not found", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Case not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent" },
			})

			await MasterKnowledgeCaseController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── update ─────────────────────────────────────────────────────────────

	describe("update", () => {
		it("should return 200 with updated case on success", async () => {
			const mockCaseData = { id: "case-123", title: "Updated Case" }
			mockUpdate.mockResolvedValue({ status: true, data: mockCaseData })

			const { mock, spy } = createMockContext({
				params: { id: "case-123" },
				body: { title: "Updated Case" },
			})

			await MasterKnowledgeCaseController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated MasterKnowledgeCase!",
			})
		})

		it("should return error status when service fails", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "case-123" },
				body: { title: "Updated" },
			})

			await MasterKnowledgeCaseController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── deleteById ────────────────────────────────────────────────────────

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { id: "case-123" },
			})

			await MasterKnowledgeCaseController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted MasterKnowledgeCase!",
			})
		})

		it("should return 404 when case not found", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Case not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent" },
			})

			await MasterKnowledgeCaseController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockGetByTenantId = jest.fn<any>()
let mockUpsertByTenantId = jest.fn<any>()

jest.mock("$services/AiPromptService", () => ({
	getByTenantId: (...args: any[]) => mockGetByTenantId(...args),
	upsertByTenantId: (...args: any[]) => mockUpsertByTenantId(...args),
}))

import * as AiPromptController from "$controllers/rest/AiPromptController"

describe("AiPromptController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── getByTenantId ───────────────────────────────────────────────────────

	describe("getByTenantId", () => {
		it("should return 200 with ai prompt on success", async () => {
			const mockPrompt = {
				id: "prompt-123",
				tenantId: "tenant-test-123",
				prompt: "You are a helpful assistant",
			}
			mockGetByTenantId.mockResolvedValue({ status: true, data: mockPrompt })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await AiPromptController.getByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched AiPrompt by id!",
				content: expect.objectContaining({ id: "prompt-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetByTenantId.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Prompt not found" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await AiPromptController.getByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── createOrUpdateByTenantId ────────────────────────────────────────────

	describe("createOrUpdateByTenantId", () => {
		it("should return 200 with upserted prompt on success", async () => {
			const mockPrompt = {
				id: "prompt-123",
				tenantId: "tenant-test-123",
				prompt: "You are a helpful assistant",
			}
			mockUpsertByTenantId.mockResolvedValue({ status: true, data: mockPrompt })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { prompt: "You are a helpful assistant" },
			})

			await AiPromptController.createOrUpdateByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated AiPrompt!",
				content: expect.objectContaining({ id: "prompt-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockUpsertByTenantId.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Validation error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { prompt: "Test" },
			})

			await AiPromptController.createOrUpdateByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})
})

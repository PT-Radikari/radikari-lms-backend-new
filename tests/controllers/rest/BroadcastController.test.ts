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

jest.mock("$services/BroadcastService", () => ({
	getByTenantId: (...args: any[]) => mockGetByTenantId(...args),
	upsertByTenantId: (...args: any[]) => mockUpsertByTenantId(...args),
}))

import * as BroadcastController from "$controllers/rest/BroadcastController"

describe("BroadcastController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── getByTenantId ────────────────────────────────────────────────────────

	describe("getByTenantId", () => {
		it("should return 200 with broadcast data on success", async () => {
			const mockBroadcast = {
				id: "broadcast-123",
				tenantId: "tenant-test-123",
				message: "Test broadcast",
			}
			mockGetByTenantId.mockResolvedValue({ status: true, data: mockBroadcast })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await BroadcastController.getByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Broadcast by tenant!",
				content: expect.objectContaining({ id: "broadcast-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockGetByTenantId.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Broadcast not found" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
			})

			await BroadcastController.getByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── createOrUpdateByTenantId ─────────────────────────────────────────────

	describe("createOrUpdateByTenantId", () => {
		it("should return 200 with upserted broadcast on success", async () => {
			const mockBroadcast = {
				id: "broadcast-123",
				tenantId: "tenant-test-123",
				message: "Updated broadcast",
			}
			mockUpsertByTenantId.mockResolvedValue({ status: true, data: mockBroadcast })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { message: "Updated broadcast" },
			})

			await BroadcastController.createOrUpdateByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated Broadcast!",
				content: expect.objectContaining({ id: "broadcast-123" }),
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
				body: { message: "Test" },
			})

			await BroadcastController.createOrUpdateByTenantId(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})
})

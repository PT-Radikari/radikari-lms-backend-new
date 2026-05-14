/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import * as ExampleBufferService from "$services/ExampleBufferService"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

jest.mock("$utils/response.utils", () => ({
	__esModule: true,
	handleServiceErrorWithResponse: jest.fn<any>(),
	response_buffer: jest.fn<any>().mockReturnValue(new Response()),
	MIME_TYPE: {
		PDF: "application/pdf",
		XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	},
}))

const mockGetPDF = jest.spyOn(ExampleBufferService, "getPDF")
const mockGetXLSX = jest.spyOn(ExampleBufferService, "getXLSX")

import * as ExampleBufferController from "$controllers/rest/ExampleBufferController"

describe("ExampleBufferController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getPDF", () => {
		it("should return Response on success", async () => {
			mockGetPDF.mockResolvedValue({
				status: true,
				data: { buffer: Buffer.from("pdf content"), fileName: "report.pdf" },
			})

			const mock = {
				req: { json: jest.fn<any>().mockResolvedValue({}) },
				status: jest.fn<any>().mockReturnThis(),
				json: jest.fn<any>().mockReturnThis(),
				header: jest.fn<any>().mockReturnThis(),
				body: jest.fn<any>().mockReturnThis(),
				get: () => undefined,
			} as any

			const result = await ExampleBufferController.getPDF(mock)

			expect(mockGetPDF).toHaveBeenCalled()
			expect(result).toBeInstanceOf(Response)
		})

		it("should handle service failure", async () => {
			mockGetPDF.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Failed" },
			})

			const mock = {
				req: { json: jest.fn<any>().mockResolvedValue({}) },
				status: jest.fn<any>().mockReturnThis(),
				json: jest.fn<any>().mockReturnThis(),
				header: jest.fn<any>().mockReturnThis(),
				body: jest.fn<any>().mockReturnThis(),
				get: () => undefined,
			} as any

			await ExampleBufferController.getPDF(mock)

			expect(mockGetPDF).toHaveBeenCalled()
		})
	})

	describe("getXLSX", () => {
		it("should return Response on success", async () => {
			mockGetXLSX.mockResolvedValue({
				status: true,
				data: { buffer: Buffer.from("xlsx content"), fileName: "report.xlsx" },
			})

			const mock = {
				req: { json: jest.fn<any>().mockResolvedValue({}) },
				status: jest.fn<any>().mockReturnThis(),
				json: jest.fn<any>().mockReturnThis(),
				header: jest.fn<any>().mockReturnThis(),
				body: jest.fn<any>().mockReturnThis(),
				get: () => undefined,
			} as any

			const result = await ExampleBufferController.getXLSX(mock)

			expect(mockGetXLSX).toHaveBeenCalled()
			expect(result).toBeInstanceOf(Response)
		})

		it("should handle service failure", async () => {
			mockGetXLSX.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Failed" },
			})

			const mock = {
				req: { json: jest.fn<any>().mockResolvedValue({}) },
				status: jest.fn<any>().mockReturnThis(),
				json: jest.fn<any>().mockReturnThis(),
				header: jest.fn<any>().mockReturnThis(),
				body: jest.fn<any>().mockReturnThis(),
				get: () => undefined,
			} as any

			await ExampleBufferController.getXLSX(mock)

			expect(mockGetXLSX).toHaveBeenCalled()
		})
	})
})

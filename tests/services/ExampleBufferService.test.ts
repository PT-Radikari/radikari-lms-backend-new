/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { getPDF, getXLSX } from "$services/ExampleBufferService"

const mockLoggerInfo = jest.fn<any>()
const mockLoggerError = jest.fn<any>()
const mockLoggerWarning = jest.fn<any>()
const mockSetContent = jest.fn<any>()
const mockPdf = jest.fn<any>()
const mockClose = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	default: {
		info: mockLoggerInfo,
		error: mockLoggerError,
		warning: mockLoggerWarning,
	},
}))

jest.mock("puppeteer", () => ({
	launch: () => Promise.resolve({
		newPage: () => Promise.resolve({
			setContent: mockSetContent,
			pdf: mockPdf,
			close: mockClose,
		}),
		close: mockClose,
	}),
}))

describe("ExampleBufferService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockSetContent.mockResolvedValue(undefined)
		mockPdf.mockResolvedValue(Buffer.from("fake pdf"))
		mockClose.mockResolvedValue(undefined)
	})

	describe("getPDF", () => {
		it("should generate PDF buffer successfully", async () => {
			const result = await getPDF()

			expect(result.status).toBe(true)
			expect((result as any).data).toHaveProperty("buffer")
			expect((result as any).data).toHaveProperty("fileName")
			expect((result as any).data.fileName).toBe("Example")
		})
	})

	describe("getXLSX", () => {
		it("should generate XLSX buffer successfully", async () => {
			const result = await getXLSX()

			expect(result.status).toBe(true)
			expect((result as any).data).toHaveProperty("buffer")
			expect((result as any).data).toHaveProperty("fileName")
			expect((result as any).data.fileName).toBe("Example")
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

const mockFetch = jest.fn<any>()

jest.mock("aws4fetch", () => ({
	 AwsClient: jest.fn<any>().mockImplementation(() => ({
		fetch: (...args: any[]) => mockFetch(...args),
	})),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

describe("utils/r2-upload", () => {
	describe("R2Upload", () => {
		it("should export r2Upload singleton", async () => {
			const { r2Upload } = await import("$utils/r2-upload")
			expect(r2Upload).toBeDefined()
			expect(typeof r2Upload).toBe("object")
		})

		it("should have uploadImage method", async () => {
			const { r2Upload } = await import("$utils/r2-upload")
			expect(typeof r2Upload.uploadImage).toBe("function")
		})

		it("should have deleteFile method", async () => {
			const { r2Upload } = await import("$utils/r2-upload")
			expect(typeof r2Upload.deleteFile).toBe("function")
		})

		it("should have validateImageFile method", async () => {
			const { r2Upload } = await import("$utils/r2-upload")
			expect(typeof r2Upload.validateImageFile).toBe("function")
		})

		describe("validateImageFile", () => {
			it("should return valid for small file", async () => {
				const { r2Upload } = await import("$utils/r2-upload")
				const mockFile = { size: 1024 * 1024 } as File // 1MB
				const result = r2Upload.validateImageFile(mockFile)
				expect(result.isValid).toBe(true)
			})

			it("should return invalid for oversized file", async () => {
				const { r2Upload } = await import("$utils/r2-upload")
				const mockFile = { size: 10 * 1024 * 1024 } as File // 10MB
				const result = r2Upload.validateImageFile(mockFile)
				expect(result.isValid).toBe(false)
				expect(result.error).toContain("File size too large")
			})
		})
	})
})

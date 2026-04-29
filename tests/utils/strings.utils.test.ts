/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { generateRandomString } from "$utils/strings.utils"

describe("strings.utils", () => {
	describe("generateRandomString", () => {
		it("should generate string of specified length", () => {
			const result = generateRandomString(8)
			expect(result).toHaveLength(8)
		})

		it("should generate string of length 16", () => {
			const result = generateRandomString(16)
			expect(result).toHaveLength(16)
		})

		it("should generate alphanumeric string", () => {
			const result = generateRandomString(20)
			expect(result).toMatch(/^[A-Za-z0-9]+$/)
		})

		it("should generate different strings on each call", () => {
			const result1 = generateRandomString(16)
			const result2 = generateRandomString(16)
			expect(result1).not.toEqual(result2)
		})

		it("should generate empty string when length is 0", () => {
			const result = generateRandomString(0)
			expect(result).toHaveLength(0)
		})
	})
})

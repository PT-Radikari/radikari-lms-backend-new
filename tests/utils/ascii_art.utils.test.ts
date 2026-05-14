/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { REST_ASCII_ART, displayAsciiArt } from "$utils/ascii_art.utils"

describe("ascii_art.utils", () => {
	describe("REST_ASCII_ART", () => {
		it("should be a non-empty string", () => {
			expect(REST_ASCII_ART.length).toBeGreaterThan(0)
		})

		it("should contain decorative characters", () => {
			expect(REST_ASCII_ART).toContain("_")
			expect(REST_ASCII_ART).toContain("|")
		})
	})

	describe("displayAsciiArt", () => {
		it("should not throw when called", () => {
			expect(() => displayAsciiArt("test")).not.toThrow()
		})
	})
})

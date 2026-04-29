/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

jest.mock("googleapis", () => ({
	google: {
		auth: {
			OAuth2: jest.fn<any>().mockImplementation(() => ({})),
		},
	},
}))

jest.mock("google-auth-library", () => ({
	OAuth2Client: jest.fn<any>().mockImplementation(() => ({})),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

describe("pkg/oauth/google", () => {
	it("should export googleOAuthClient", async () => {
		const { googleOAuth } = await import("$pkg/oauth/google")
		expect(googleOAuth).toBeDefined()
	})

	it("should export GoogleOAuth class", async () => {
		const { GoogleOAuth } = await import("$pkg/oauth/google")
		expect(typeof GoogleOAuth).toBe("function")
	})

	it("should return singleton instance from getInstance", async () => {
		const { GoogleOAuth } = await import("$pkg/oauth/google")
		const instance1 = GoogleOAuth.getInstance()
		const instance2 = GoogleOAuth.getInstance()
		expect(instance1).toBe(instance2) // Same singleton
	})

	it("should return OAuth2Client from getOAuth2Client", async () => {
		const { GoogleOAuth } = await import("$pkg/oauth/google")
		const instance = GoogleOAuth.getInstance()
		const client = instance.getOAuth2Client()
		expect(client).toBeDefined()
	})
})

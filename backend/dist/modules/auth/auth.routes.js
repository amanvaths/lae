import { randomBytes } from "node:crypto";
import { registerSchema, loginSchema, refreshSchema } from "../../validators/schemas.js";
import { AppError } from "../../utils/helpers.js";
import { registerUser, loginUser, createSession, revokeSession, getUserProfile, verifyWalletSignature, } from "./auth.service.js";
import { createNonce } from "../../services/nonce.service.js";
import { prisma } from "../../lib/prisma.js";
function issueAccessToken(app, user) {
    return app.jwt.sign({ userId: user.id, walletAddress: user.walletAddress, isAdmin: user.isAdmin }, { expiresIn: "1h" });
}
function createRefreshToken() {
    return randomBytes(32).toString("hex");
}
export async function authRoutes(app) {
    app.get("/nonce", {
        schema: { tags: ["Auth"] },
    }, async (request) => {
        const walletAddress = request.query.walletAddress;
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return { error: "Valid walletAddress required" };
        }
        const nonce = createNonce(walletAddress);
        return { nonce, walletAddress: walletAddress.toLowerCase() };
    });
    app.post("/register", {
        schema: { tags: ["Auth"] },
    }, async (request, reply) => {
        const body = registerSchema.parse(request.body);
        if (body.signature && body.nonce) {
            verifyWalletSignature(body.walletAddress, body.signature, body.nonce);
        }
        const user = await registerUser(body.walletAddress, body.referralCode, body.username, body.email);
        const accessToken = issueAccessToken(app, user);
        const refreshToken = createRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await createSession(user.id, refreshToken, expiresAt);
        return reply.status(201).send({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                referralCode: user.referralCode,
                sponsor: user.sponsor,
            },
            token: accessToken,
            accessToken,
            refreshToken,
        });
    });
    app.post("/login", {
        schema: { tags: ["Auth"] },
    }, async (request, reply) => {
        const body = loginSchema.parse(request.body);
        if (body.signature && body.nonce) {
            verifyWalletSignature(body.walletAddress, body.signature, body.nonce);
        }
        const user = await loginUser(body.walletAddress);
        const accessToken = issueAccessToken(app, user);
        const refreshToken = createRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await createSession(user.id, refreshToken, expiresAt);
        return reply.send({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                referralCode: user.referralCode,
            },
            token: accessToken,
            accessToken,
            refreshToken,
        });
    });
    app.post("/refresh", {
        schema: { tags: ["Auth"] },
    }, async (request, reply) => {
        const body = refreshSchema.parse(request.body);
        const session = await prisma.session.findFirst({
            where: { token: body.refreshToken },
        });
        if (!session || session.expiresAt < new Date()) {
            throw new AppError(401, "Refresh session expired", "SESSION_EXPIRED");
        }
        const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
        const accessToken = issueAccessToken(app, user);
        const refreshToken = createRefreshToken();
        await prisma.session.update({
            where: { id: session.id },
            data: {
                token: refreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        return reply.send({ token: accessToken, accessToken, refreshToken });
    });
    app.post("/logout", {
        preHandler: [app.authenticate],
        schema: { tags: ["Auth"] },
    }, async (request, reply) => {
        const authHeader = request.headers.authorization;
        const token = authHeader?.replace("Bearer ", "");
        if (token)
            await revokeSession(token);
        return reply.send({ success: true });
    });
    app.get("/me", {
        preHandler: [app.authenticate],
        schema: { tags: ["Auth"] },
    }, async (request) => {
        return getUserProfile(request.userId);
    });
}
//# sourceMappingURL=auth.routes.js.map
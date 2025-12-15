import * as client from "openid-client";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

function getIssuerUrl(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return process.env.REPLIT_DEPLOYMENT_URL;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  throw new Error("Missing REPLIT_DEPLOYMENT_URL or REPLIT_DEV_DOMAIN");
}

let oidcConfig: Awaited<ReturnType<typeof client.discovery>> | null = null;

async function getOidcConfig() {
  if (!oidcConfig) {
    const issuerUrl = getIssuerUrl();
    oidcConfig = await client.discovery(
      new URL(issuerUrl),
      process.env.REPL_ID!
    );
  }
  return oidcConfig;
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.get("/api/auth/login", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback`;
      
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      const state = client.randomState();
      
      (req.session as any).codeVerifier = codeVerifier;
      (req.session as any).state = state;
      
      const authUrl = client.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
      });
      
      res.redirect(authUrl.href);
    } catch (error) {
      console.error("Login error:", error);
      res.redirect("/?error=login_failed");
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback`;
      const codeVerifier = (req.session as any).codeVerifier;
      const expectedState = (req.session as any).state;
      
      const tokens = await client.authorizationCodeGrant(config, new URL(req.url, `${req.protocol}://${req.get("host")}`), {
        pkceCodeVerifier: codeVerifier,
        expectedState,
      });
      
      const userinfo = await client.fetchUserInfo(config, tokens.access_token!, tokens.claims()!.sub);
      
      (req.session as any).user = {
        id: userinfo.sub,
        email: userinfo.email,
        firstName: userinfo.given_name || userinfo.name?.split(" ")[0],
        lastName: userinfo.family_name || userinfo.name?.split(" ").slice(1).join(" "),
        profileImageUrl: userinfo.picture,
      };
      
      delete (req.session as any).codeVerifier;
      delete (req.session as any).state;
      
      res.redirect("/home");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if ((req.session as any)?.user) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  }
}

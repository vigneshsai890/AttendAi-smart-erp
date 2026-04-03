import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic is mandatory for Better Auth in Next.js App Router
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);

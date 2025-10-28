// Thin proxy so the app can keep importing ""@/lib/auth-client""
export { useSession, signIn, signOut, getSession } from ""next-auth/react"";

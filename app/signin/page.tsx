export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="auth-shell"><section className="auth-card">
    <h1>Find work worth automating.</h1>
    <p>Sign in, add the tools where your work happens, and Heighliner will surface opportunities automatically.</p>
    {error && <p className="error">Google sign-in did not finish. Please try again.</p>}
    <a className="google-button" href="/api/auth/google"><span aria-hidden="true">G</span>Continue with Google</a>
  </section></main>;
}

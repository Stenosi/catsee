import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Endpoint disponibile SOLO in development.
// Crea una sessione Auth.js reale per l'utente DEV_USER_EMAIL senza passare
// da magic link o OAuth - utile per il loop di sviluppo veloce su desktop.
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }

  const email = process.env.DEV_USER_EMAIL;
  if (!email) {
    return NextResponse.json({ error: 'DEV_USER_EMAIL non configurata in .env' }, { status: 500 });
  }

  // Cerca o crea l'utente dev
  let user = await db.query.users.findFirst({
    where: (u) => eq(u.email, email),
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        email,
        username: 'devuser',
        nickname: 'Dev User',
        onboardingCompleted: true,
      })
      .returning();
    user = created;
  }

  // Se l'utente dev esiste ma non ha completato l'onboarding, lo forziamo
  if (!user.onboardingCompleted) {
    await db
      .update(users)
      .set({ username: 'devuser', nickname: 'Dev User', onboardingCompleted: true })
      .where(eq(users.id, user.id));
  }

  // Crea una sessione nella tabella sessions (stessa usata da Auth.js)
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 giorni

  await db.insert(sessions).values({
    sessionToken,
    userId: user.id,
    expires,
  });

  // Costruisce la URL di redirect dalla request
  const requestUrl = new URL(request.url);
  const { protocol, host } = requestUrl;
  const redirectUrl = `${protocol}//${host}/profilo`;

  const response = NextResponse.redirect(redirectUrl);

  // Auth.js usa __Secure-authjs.session-token su HTTPS, authjs.session-token su HTTP.
  // Dobbiamo usare lo stesso nome altrimenti il middleware non trova la sessione.
  const isHttps = requestUrl.protocol === 'https:';
  const cookieName = isHttps ? '__Secure-authjs.session-token' : 'authjs.session-token';

  response.cookies.set(cookieName, sessionToken, {
    expires,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isHttps,
  });

  return response;
}

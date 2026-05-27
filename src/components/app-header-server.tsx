import { getSession } from '@/lib/session';
import AppHeader from './app-header';

export default async function AppHeaderServer() {
  const session = await getSession();
  return <AppHeader username={session?.user?.username ?? null} />;
}

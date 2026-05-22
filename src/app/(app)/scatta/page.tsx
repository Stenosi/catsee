import { requireOnboardedSession } from '@/lib/session';
import ScattaWizard from './_components/scatta-wizard';

export default async function ScattaPage() {
  await requireOnboardedSession();
  return <ScattaWizard />;
}

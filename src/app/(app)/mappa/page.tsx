import { fetchMapSightings } from './actions';
import MapView from './_components/map-view';

export default async function MappaPage() {
  const result = await fetchMapSightings();
  const sightings = result.success ? result.sightings : [];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView sightings={sightings} />
    </div>
  );
}

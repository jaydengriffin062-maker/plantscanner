import { Suspense } from 'react';

import PlantDetails from './PlantDetails';

export const metadata = {
  title: 'Results · Plant Scanner',
};

export default function PlantPage() {
  // PlantDetails reads ?id= from the URL, which requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <PlantDetails />
    </Suspense>
  );
}

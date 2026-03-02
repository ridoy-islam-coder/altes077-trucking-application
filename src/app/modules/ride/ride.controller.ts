// fare.ts

// DistanceTime type define করা হলো
interface Distance {
  value: number; // meters
}

interface Duration {
  value: number; // seconds
}

interface DistanceTime {
  distance: Distance;
  duration: Duration;
}

// Fare type
interface Fare {
  auto: number;
  car: number;
  moto: number;
}

// Pickup এবং Destination type, যদি string ঠিকানা হয়
type Location = string;

// ধরছি mapService already imported and has getDistanceTime function
// import { mapService } from './mapService';

export async function getFare(pickup: Location, destination: Location): Promise<Fare> {
  if (!pickup || !destination) {
    throw new Error('Pickup and destination are required');
  }

  // const distanceTime: DistanceTime = await mapService.getDistanceTime(pickup, destination);

  const baseFare: Fare = {
    auto: 30,
    car: 50,
    moto: 20
  };

  const perKmRate: Fare = {
    auto: 10,
    car: 15,
    moto: 8
  };

  const perMinuteRate: Fare = {
    auto: 2,
    car: 3,
    moto: 1.5
  };

  const fare: Fare = {
    auto: Math.round(
      baseFare.auto +
      (distanceTime.distance.value / 1000) * perKmRate.auto +
      (distanceTime.duration.value / 60) * perMinuteRate.auto
    ),
    car: Math.round(
      baseFare.car +
      (distanceTime.distance.value / 1000) * perKmRate.car +
      (distanceTime.duration.value / 60) * perMinuteRate.car
    ),
    moto: Math.round(
      baseFare.moto +
      (distanceTime.distance.value / 1000) * perKmRate.moto +
      (distanceTime.duration.value / 60) * perMinuteRate.moto
    )
  };

  return fare;
}





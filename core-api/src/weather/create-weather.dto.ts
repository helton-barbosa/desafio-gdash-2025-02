export class CreateWeatherDto {
  city: string;
  location: { lat: string; lon: string };
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  conditionCode: number;
  isDay: number;
  timestamp: string;
}

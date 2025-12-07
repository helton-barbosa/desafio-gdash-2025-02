import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { getModelToken } from '@nestjs/mongoose';
import { WeatherLog } from './weather.schema';

describe('WeatherService', () => {
  let service: WeatherService;
  let model: any;

  const mockWeatherModel = {
    new: jest.fn().mockResolvedValue({}),
    constructor: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: getModelToken(WeatherLog.name),
          useValue: mockWeatherModel,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    model = module.get(getModelToken(WeatherLog.name));
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve gerar alerta de calor se temperatura > 32', async () => {
    const mockLogs = [
      {
        temperature: 35,
        humidity: 50,
        city: 'Teste',
        createdAt: new Date(),
      },
    ];

    mockWeatherModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockLogs),
        }),
      }),
    });

    const result = await service.generateInsights();

    expect(result.alerts).toContain(
      `🔥 Calor intenso! Hidrate-se e evite sol direto.`,
    );
  });
});

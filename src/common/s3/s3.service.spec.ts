import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3_CLIENT } from './s3.provider';

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockS3Client = {
      send: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'AWS_S3_BUCKET':
            return 'test-bucket';
          case 'AWS_REGION':
            return 'eu-north-1';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: S3_CLIENT,
          useValue: mockS3Client,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate file key correctly', () => {
    const key = service.generateFileKey('test.jpg', 'uploads');
    expect(key).toMatch(/uploads\/\d+-\w+\.jpg$/);
  });

  it('should get file URL correctly', () => {
    const url = service.getFileUrl('test/file.jpg');
    expect(url).toBe(
      'https://test-bucket.s3.eu-north-1.amazonaws.com/test/file.jpg',
    );
  });
});

# S3 Service

Этот модуль предоставляет интеграцию с AWS S3 для загрузки, удаления и управления файлами.

## Установка

Модуль уже установлен в проекте. Убедитесь, что установлены зависимости:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Настройка

Добавьте следующие переменные окружения в ваш `.env` файл:

```env
AWS_ACCESS_KEY=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-s3-bucket-name
```

## Использование

### В сервисе

```typescript
import { S3Service } from './common/s3/s3.service';

@Injectable()
export class YourService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(file: Express.Multer.File) {
    const key = this.s3Service.generateFileKey(file.originalname, 'uploads');
    
    const fileUrl = await this.s3Service.uploadFile({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    return fileUrl;
  }

  async deleteFile(key: string) {
    await this.s3Service.deleteFile({ key });
  }

  async getSignedUrl(key: string) {
    return this.s3Service.getSignedUrl({
      key,
      operation: 'get',
      expiresIn: 3600,
    });
  }
}
```

### В контроллере

```typescript
import { S3Service } from './common/s3/s3.service';

@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const key = this.s3Service.generateFileKey(file.originalname, 'uploads');
    
    const fileUrl = await this.s3Service.uploadFile({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    return { url: fileUrl, key };
  }
}
```

## API Endpoints

Модуль предоставляет следующие эндпоинты:

- `POST /s3/upload` - Загрузка файла в S3
- `DELETE /s3/:key` - Удаление файла из S3
- `GET /s3/signed-url/:key` - Получение подписанного URL
- `GET /s3/url/:key` - Получение публичного URL

## Методы S3Service

- `uploadFile(options)` - Загрузка файла
- `deleteFile(options)` - Удаление файла
- `getSignedUrl(options)` - Получение подписанного URL
- `getFileUrl(key, bucket?)` - Получение публичного URL
- `generateFileKey(originalName, folder?)` - Генерация уникального ключа файла
- `uploadMultipleFiles(files)` - Загрузка нескольких файлов
- `deleteMultipleFiles(files)` - Удаление нескольких файлов

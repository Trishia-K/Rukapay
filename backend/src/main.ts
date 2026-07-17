import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 1);
  const app = await NestFactory.create(AppModule);
  app.enableCors({

    origin: [
      'http://localhost:5173', 
      'https://rukatrack-frontend.onrender.com' 
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 4000);
}
bootstrap();

import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur inattendue de la base de données';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `La valeur pour le champ ${
          (exception.meta?.target as string[])?.join(', ') || 'spécifié'
        } est déjà utilisée. (Doublon)`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'L\'enregistrement demandé est introuvable.';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Échec de contrainte de clé étrangère : L\'entité liée n\'existe pas.';
        break;
      default:
        // Pour les autres erreurs Prisma connues
        status = HttpStatus.BAD_REQUEST;
        message = `Erreur Prisma: ${exception.message.replace(/\n/g, ' ')}`;
    }

    response.status(status).json({
      statusCode: status,
      error: 'Erreur de base de données',
      message: message,
    });
  }
}

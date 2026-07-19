import { BadRequestException, ValidationError } from '@nestjs/common';

function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce(
    (acc, err) => {
      if (err.constraints) {
        acc[err.property] = Object.values(err.constraints);
      }
      if (err.children?.length) {
        acc[err.property] = [
          ...(acc[err.property] || []),
          ...Object.values(formatErrors(err.children)).flat(),
        ];
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );
}

export const validationExceptionFactory = (errors: ValidationError[]) => {
  return new BadRequestException({
    statusCode: 400,
    message: 'Validation failed',
    errors: formatErrors(errors),
  });
};

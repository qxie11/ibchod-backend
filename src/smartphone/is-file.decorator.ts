import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export interface IsFileOptions {
  mime: ('image/jpg' | 'image/png' | 'image/jpeg')[];
}

export function IsFile(
  options: IsFileOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFile',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (Array.isArray(value)) {
            return value.every(
              (file) =>
                file?.mimetype && (options?.mime ?? []).includes(file.mimetype),
            );
          }
          if (
            value?.mimetype &&
            (options?.mime ?? []).includes(value.mimetype)
          ) {
            return true;
          }
          return false;
        },
      },
    });
  };
}

import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'CustomMatchPasswords', async: false })
export class IsDelayValid implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const delay = Number(value);

    if (isNaN(delay)) {
      return false;
    }
    if (Number(delay) < 0) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'delay is not valid';
  }
}

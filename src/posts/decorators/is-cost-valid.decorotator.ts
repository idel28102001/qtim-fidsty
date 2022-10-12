import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'CustomMatchPasswords', async: false })
export class IsCostValid implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const cost = Number(value);

    if (isNaN(cost)) {
      return false;
    }
    if (Number(cost) <= 0) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'cost is not valid';
  }
}

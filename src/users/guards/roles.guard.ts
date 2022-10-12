import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndMerge<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    Reflect.defineMetadata(
      'class_serializer:options',
      { groups: [user.role] },
      context.getClass(),
    );
    if (!roles || !roles.length) {
      return true;
    }
    return roles.indexOf(user.role) > -1;
  }
}

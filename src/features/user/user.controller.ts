import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AccessPermission, AccessRole, CommonRoles, Public } from '../common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('')
  @Public() //use it if you want to make the route public otherwise remove it
  //use role guard and permission guard
  // @AccessPermission('CREATE_USER')
  // @AccessRole(CommonRoles)
  async createCustomer(@Body() createUserDto: CreateUserDto) {
    const customer = await this.userService.createCustomer(createUserDto);
    delete customer.password;
    return { data: customer, message: 'Customer created successfully' };
  }
}

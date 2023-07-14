import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post("/admin/create")
  @Public()
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    const admin = await this.userService.createAdmin(createUserDto)
    return { data: admin, message: "Admin created successfully" }
  }

}

import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "../common/authenticated-request";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { LoginDto, UpdateProfileDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.usersService.findById(request.user.sub);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(request.user.sub, dto);
  }
}

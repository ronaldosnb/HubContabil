import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "../common/authenticated-request";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { MeiService } from "./mei.service";

@Controller("mei")
@UseGuards(JwtAuthGuard)
export class MeiController {
  constructor(private readonly meiService: MeiService) {}

  @Post("emit-das/:clientId")
  emitForClient(@Param("clientId") clientId: string, @Req() req: AuthenticatedRequest) {
    return this.meiService.emitDasForClient(clientId, req.user.sub);
  }

  @Post("emit-das")
  emitForAll(@Req() req: AuthenticatedRequest) {
    return this.meiService.emitDasForAll(req.user.sub);
  }

  @Get("das/:clientId/latest")
  getLatestDas(@Param("clientId") clientId: string) {
    return this.meiService.getLatestDas(clientId);
  }

  @Get("das/latest-all")
  getAllLatestDas() {
    return this.meiService.getAllLatestDas();
  }
}

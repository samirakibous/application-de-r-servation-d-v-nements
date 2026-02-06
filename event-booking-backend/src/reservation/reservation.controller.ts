import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Types } from 'mongoose';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(
    @Body() createReservationDto: CreateReservationDto,
    @Request() req: any,
  ) {
    return this.reservationService.create(
      createReservationDto,
      req.user._id.toString(),
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Request() req: any) {
    return this.reservationService.findAll(
      req.user._id.toString(),
      req.user.role,
    );
  }

  @Get(':id/me')
  myReservations(@Request() req: any) {
    return this.reservationService.myReservations(req.user._id.toString());
}
  @Patch(':id/cancel')
  cancelReservation(
    @Param('id') id: string,
    @Request() req: any,
  ) {
     return this.reservationService.cancelReservation(
    new Types.ObjectId(id), 
    new Types.ObjectId(req.user._id), 
    req.user.role,
  );
  }
}
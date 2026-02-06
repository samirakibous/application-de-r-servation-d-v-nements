import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import {
  Reservation,
  ReservationDocument,
  ReservationStatus,
} from './entities/reservation.entity';
import { Event, EventStatus } from '../event/entities/event.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: Types.ObjectId,
  ): Promise<Reservation> {
    const event = await this.eventModel.findById(
      createReservationDto.eventId,
    );

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Event is not available for reservation');
    }

    if (event.availableSeats < createReservationDto.numberOfSeats) {
      throw new BadRequestException('Not enough available seats');
    }

    // Vérifier si l'utilisateur a déjà une réservation pour cet événement
    const existingReservation = await this.reservationModel.findOne({
      user: userId,
      event: createReservationDto.eventId,
      status: { $ne: ReservationStatus.CANCELLED },
      deletedAt: null,
    });

    if (existingReservation) {
      throw new BadRequestException(
        'You already have a reservation for this event',
      );
    }

    const reservation = new this.reservationModel({
      user: userId,
      event: createReservationDto.eventId,
      numberOfSeats: createReservationDto.numberOfSeats,
      status: ReservationStatus.PENDING,
    });

    event.availableSeats -= createReservationDto.numberOfSeats;
    await event.save();

    return await reservation.save();
  }
}
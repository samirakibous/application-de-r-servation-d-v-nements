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
  ) { }

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
      status: { $ne: ReservationStatus.CANCELED },
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

  async findAll(userId: Types.ObjectId, userRole: Role): Promise<Reservation[]> {
    const query =
      userRole === Role.ADMIN
        ? { deletedAt: null }
        : { user: userId, deletedAt: null };

    return await this.reservationModel
      .find(query)
      .populate('user', 'email firstName lastName')
      .populate('event', 'title date time location')
      .exec();
  }

  async myReservations(userId: Types.ObjectId): Promise<Reservation[]> {

    const myReservations = await this.reservationModel
      .find({ user: userId, deletedAt: null })
      .populate('event', 'title date time location status availableSeats capacity ')
      .exec();

    if (myReservations.length === 0) {
      throw new NotFoundException('you are not the owner of any reservations');
    }
    return myReservations;
  }
 async cancelReservation(
  reservationId: Types.ObjectId,
  userId: Types.ObjectId,
  userRole: Role,
): Promise<Reservation> {
  const reservation = await this.reservationModel.findOne({
    _id: reservationId,
    deletedAt: null,
  });

  if (!reservation) {
    throw new NotFoundException('Reservation not found');
  }

  if (userRole !== Role.ADMIN && reservation.user.toString() !== userId.toString()) {
    throw new ForbiddenException('You do not have permission to cancel this reservation');
  }

  if (reservation.status !== ReservationStatus.PENDING && userRole !== Role.ADMIN) {
    throw new BadRequestException('Only pending reservations can be canceled');
  }

  const event = await this.eventModel.findById(reservation.event);
  if (event) {
    event.availableSeats += reservation.numberOfSeats;
    await event.save();
  }

  reservation.status = ReservationStatus.CANCELED;
  reservation.canceledAt = new Date();
  await reservation.save();

  return reservation;
}

}


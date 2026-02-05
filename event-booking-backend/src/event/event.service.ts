import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument, EventStatus } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const event = new this.eventModel({
      title: createEventDto.title,
      description: createEventDto.description,
      date: new Date(createEventDto.date),
      time: createEventDto.time,
      location: createEventDto.location,
      capacity: createEventDto.capacity,
      availableSeats: createEventDto.availableSeats,
      status: EventStatus.DRAFT,
    });
    return await event.save();
  }

  async findAll() {
    return await this.eventModel.find().exec();
  }

  async findOne(id: string) {
    return await this.eventModel.findById(id).exec();
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    return await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return await this.eventModel.findByIdAndDelete(id).exec();
  }
}

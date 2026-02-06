import { Injectable ,NotFoundException} from '@nestjs/common';
import { InjectModel} from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
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
      status: createEventDto.status || EventStatus.DRAFT,
    });
    return await event.save();
  }

  async findAll() {
    return await this.eventModel.find({ deletedAt: null }).exec();
  }

  async findOne(id: string) {
    return await this.eventModel.findById(id).exec();
  }

  async update(id: Types.ObjectId, updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.eventModel.findById(id);

    if (!existingEvent) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    Object.assign(existingEvent, updateEventDto);

    return await existingEvent.save();
  }

async remove(id:Types.ObjectId): Promise <{deleted:boolean,event:Event|null}> {

 return this.eventModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });

}

 async getPublishedEvents(status: EventStatus = EventStatus.PUBLISHED): Promise<Event[]> {
  try {
    const events = await this.eventModel.find({ status }).exec();
     if (!events || events.length === 0) {
      throw new NotFoundException('No published events found');
    }
    return events;
  } catch (error) {
     console.error('Error fetching published events:', error);
    throw error;
  }
}
}

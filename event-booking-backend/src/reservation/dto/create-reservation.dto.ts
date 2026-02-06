import { IsNotEmpty, IsInt, Min, IsMongoId } from 'class-validator';

export class CreateReservationDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: string;

  @IsInt()
  @Min(1)
  numberOfSeats: number;
}

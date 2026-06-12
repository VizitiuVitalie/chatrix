import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { ActivityState } from '../enums/activity-state.enum';
import { ActivityType } from '../enums/activity-type.enum';

export class ActivityClientDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(1)
  chatId: number;

  @ApiProperty({ enum: ActivityType, example: ActivityType.TYPING })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ enum: ActivityState, example: ActivityState.START })
  @IsEnum(ActivityState)
  state: ActivityState;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DeleteChatScope } from '../enums/delete-chat-scope.enum';

export class DeleteChatQueryDto {
  @ApiPropertyOptional({
    enum: DeleteChatScope,
    default: DeleteChatScope.BOTH,
    description:
      "`both` (default) hard-deletes the chat for every participant; `me` (direct chats only) stamps `chat_history_cleared_at` so the chat disappears from the caller's view until a new message arrives.",
  })
  @IsOptional()
  @IsEnum(DeleteChatScope)
  scope?: DeleteChatScope;
}

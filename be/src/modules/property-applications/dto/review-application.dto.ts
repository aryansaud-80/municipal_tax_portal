import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CORRECTION = 'request_correction',
}

export class ReviewApplicationDto {
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  reviewNotes?: string;
}

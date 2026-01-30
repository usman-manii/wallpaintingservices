import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  authorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  authorWebsite?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

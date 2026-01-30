import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Public list of categories for frontend filters/navigation
   */
  @Public()
  @Get()
  async listCategories() {
    return this.categoryService.listCategories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get(':id')
  async getCategory(@Param('id') id: string) {
    return this.categoryService.getCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post()
  async createCategory(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      color?: string;
      icon?: string;
      parentId?: string;
      order?: number;
      featured?: boolean;
    },
  ) {
    const { parentId, ...rest } = body;
    return this.categoryService.createCategory({
      ...rest,
      ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
    } as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      color?: string;
      icon?: string;
      parentId?: string | null;
      order?: number;
      featured?: boolean;
    },
  ) {
    const { parentId, ...rest } = body;
    const data: any = { ...rest };

    if (parentId !== undefined) {
      data.parent = parentId
        ? { connect: { id: parentId } }
        : { disconnect: true };
    }

    return this.categoryService.updateCategory(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}


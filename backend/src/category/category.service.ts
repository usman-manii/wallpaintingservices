import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            order: true,
            _count: {
              select: { posts: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(data: Prisma.CategoryCreateInput) {
    // Ensure slug is unique
    const existing = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({ data });
  }

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    // If slug is being changed, ensure uniqueness
    if (data.slug && typeof data.slug === 'string') {
      const existing = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Another category with this slug already exists');
      }
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException('Category not found');
    }
  }

  async deleteCategory(id: string) {
    // For now, simply delete; posts will lose this category relation.
    // In the future, we could move posts to a fallback category.
    try {
      await this.prisma.category.delete({ where: { id } });
      return { message: 'Category deleted successfully' };
    } catch {
      throw new NotFoundException('Category not found');
    }
  }
}

